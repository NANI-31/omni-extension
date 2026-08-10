// InstaGrab Background Service Worker
import { syncVpnProxy, initVpnListeners } from "./vpn/proxy.js";
import {
  recordSuccess,
  recordFailure,
  getNextProxy,
  loadHealth,
  calculateScore,
} from "./vpn/health.js";

const backgroundLogs = [];

chrome.runtime.onInstalled.addListener(() => {
  // One-time storage cleanup migration: remove legacy downloadHistory
  chrome.storage.local.remove(["downloadHistory"], () => {
    logInfo("[Storage Migration] Cleared legacy downloadHistory from chrome.storage.local");
  });

  chrome.storage.local.get(
    ["activeModules", "pinterestFolder", "ytZoneLeft", "ytZoneMiddle", "ytZoneRight", "ytZonesEnabled", "ytBrightnessSensitivity",
     "ytHistoryDeleteEnabled", "ytHistoryDeletedCount", "ytHistoryDeleteDebug"],
    (result) => {
      // Seed default YouTube scroll zone keys
      const zoneDefaults = {};
      if (result.ytZoneLeft === undefined)          zoneDefaults.ytZoneLeft = "brightness";
      if (result.ytZoneMiddle === undefined)        zoneDefaults.ytZoneMiddle = "volume";
      if (result.ytZoneRight === undefined)         zoneDefaults.ytZoneRight = "speed";
      if (result.ytZonesEnabled === undefined)      zoneDefaults.ytZonesEnabled = true;
      if (result.ytBrightnessSensitivity === undefined) zoneDefaults.ytBrightnessSensitivity = 5;
      if (result.ytSeekSensitivity === undefined)       zoneDefaults.ytSeekSensitivity = 5;
      if (result.ytSeekCtrlStep === undefined)          zoneDefaults.ytSeekCtrlStep = 30;
      // Video color filters
      if (result.ytFilterContrast === undefined)        zoneDefaults.ytFilterContrast = 100;
      if (result.ytFilterSaturation === undefined)      zoneDefaults.ytFilterSaturation = 100;
      if (result.ytFilterTemperature === undefined)     zoneDefaults.ytFilterTemperature = 0;
      if (result.ytFilterEyeProtection === undefined)   zoneDefaults.ytFilterEyeProtection = 0;
      // Tone / LUT filter controls (SVG feComponentTransfer)
      if (result.ytFilterBlacks === undefined)          zoneDefaults.ytFilterBlacks = 0;
      if (result.ytFilterWhites === undefined)          zoneDefaults.ytFilterWhites = 100;
      if (result.ytFilterShadows === undefined)         zoneDefaults.ytFilterShadows = 0;
      if (result.ytFilterHighlights === undefined)      zoneDefaults.ytFilterHighlights = 0;
      // History Quick Delete defaults
      if (result.ytHistoryDeleteEnabled === undefined)   zoneDefaults.ytHistoryDeleteEnabled = true;
      if (result.ytHistoryDeletedCount === undefined)    zoneDefaults.ytHistoryDeletedCount = 0;
      if (result.ytHistoryDeleteDebug === undefined)     zoneDefaults.ytHistoryDeleteDebug = false;
      if (Object.keys(zoneDefaults).length > 0) {
        chrome.storage.local.set(zoneDefaults);
      }

      if (!result.pinterestFolder) {
        chrome.storage.local.set({ pinterestFolder: "pinterest" });
      }
      if (!result.activeModules) {
        chrome.storage.local.set({
          activeModules: {
            instagrab: true,
            timers: true,
            youtube: true,
            vpn: true,
            pinterest: true,
          },
        });
      } else {
        const updated = { ...result.activeModules };
        if (updated.instagrab === undefined) updated.instagrab = true;
        if (updated.timers === undefined) updated.timers = true;
        if (updated.youtube === undefined) updated.youtube = true;
        if (updated.vpn === undefined) updated.vpn = true;
        if (updated.pinterest === undefined) updated.pinterest = true;
        chrome.storage.local.set({ activeModules: updated }, () => {
          syncVpnProxy();
        });
      }
    }
  );
});

// Initialize VPN listeners
initVpnListeners();

function appendToBgHistory(level, msg, ...args) {
  const time = new Date().toISOString().replace("T", " ").replace(/\..+/, "");
  const prefix = `[${time}] [${level.toUpperCase()}] [Background]`;
  const message = `${msg} ${args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")}`;
  backgroundLogs.push(`${prefix} ${message}`);
  if (backgroundLogs.length > 300) {
    backgroundLogs.shift();
  }
}

function logInfo(msg, ...args) {
  appendToBgHistory("info", msg, ...args);
  chrome.storage.local.get(["logLevel"], (res) => {
    const lvl = res.logLevel || "verbose";
    if (lvl === "verbose") console.log("[BG]", msg, ...args);
  });
}

function logError(msg, ...args) {
  appendToBgHistory("error", msg, ...args);
  chrome.storage.local.get(["logLevel"], (res) => {
    const lvl = res.logLevel || "verbose";
    if (lvl === "verbose" || lvl === "errors")
      console.error("[BG]", msg, ...args);
  });
}

// ─── Offscreen document helpers ───────────────────────────────────────────────

const OFFSCREEN_URL = chrome.runtime.getURL("offscreen.html");

/**
 * Creates the offscreen document if it does not already exist.
 * Safe to call multiple times — idempotent.
 */
async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [OFFSCREEN_URL],
  });
  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ["WORKERS"],
      justification:
        "Run FFmpeg WASM to compile Instagram carousel slides into MP4 video",
    });
  }
}

// ─── Service worker keepalive via chrome.alarms ────────────────────────────
//
// MV3 service workers can be terminated by Chrome after ~30 seconds of
// inactivity regardless of setInterval. chrome.alarms is the ONLY API that
// reliably wakes the SW on a schedule. We register a repeating alarm while
// any FFmpeg compilation is in progress and clear it when done.
//
// Each alarm fires → re-registers itself (chrome.alarms.create is idempotent
// when given the same name) → SW stays alive for the next 20s.

const KEEPALIVE_ALARM = "instagrab-ffmpeg-keepalive";
let activeCompiles = 0; // count of in-flight FFmpeg compilations

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== KEEPALIVE_ALARM) return;
  if (activeCompiles > 0) {
    // Re-schedule to ensure the SW stays awake for the next cycle.
    chrome.alarms.create(KEEPALIVE_ALARM, { delayInMinutes: 1 / 3 }); // 20 seconds
    logInfo(`[BG] Keepalive tick — ${activeCompiles} compile(s) in progress`);
  }
});

function startKeepAlive() {
  activeCompiles++;
  // Create a one-shot alarm that the onAlarm handler re-schedules while needed.
  chrome.alarms.create(KEEPALIVE_ALARM, { delayInMinutes: 1 / 3 }); // fires in 20s
}

function stopKeepAlive() {
  if (activeCompiles > 0) activeCompiles--;
  if (activeCompiles === 0) {
    chrome.alarms.clear(KEEPALIVE_ALARM);
  }
}

// ─── Message listener ─────────────────────────────────────────────────────────
//
// safeRespond wraps sendResponse so that calling it on an already-closed
// message channel does not throw. This eliminates the DevTools warning:
// "A listener indicated an asynchronous response by returning true, but the
//  message channel closed before a response was received."
// The warning fires when the UI (popup/content script) closes or navigates
// before the background's async work finishes and sendResponse is called.
function safeRespond(sendResponse, payload) {
  try {
    sendResponse(payload);
  } catch (_) {
    // Channel already closed — caller navigated away or closed the popup.
    // Safe to ignore: the response is simply discarded.
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "GET_BACKGROUND_LOGS") {
    sendResponse({ logs: backgroundLogs });
    return false;
  }

  // ── YouTube History Quick Delete counter + log ─────────────────────────────
  if (message && message.action === "ytHistoryVideoDeleted") {
    const MAX_DELETE_LOG = 30;

    // 1. Increment the session deletion counter (local storage, persists across SW restarts)
    chrome.storage.local.get({ ytHistoryDeletedCount: 0 }, (data) => {
      const newCount = (data.ytHistoryDeletedCount || 0) + 1;
      chrome.storage.local.set({ ytHistoryDeletedCount: newCount }, () => {
        logInfo("[YT History Delete] Deleted count incremented to:", newCount);
      });
    });

    // 2. Append entry to the ephemeral delete log
    //    chrome.storage.session is the ideal store (cleared on browser restart).
    //    Gracefully fall back to chrome.storage.local if session is unavailable.
    const logStore = (chrome.storage.session) ? chrome.storage.session : chrome.storage.local;
    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: (message.title && message.title.trim()) ? message.title.trim() : null,
      timestamp: message.timestamp || Date.now(),
    };
    logStore.get({ ytHistoryDeleteLog: [] }, (data) => {
      const existing = Array.isArray(data.ytHistoryDeleteLog) ? data.ytHistoryDeleteLog : [];
      const updated = [newEntry, ...existing].slice(0, MAX_DELETE_LOG);
      logStore.set({ ytHistoryDeleteLog: updated }, () => {
        logInfo("[YT History Delete] Log updated. Entries:", updated.length);
      });
    });

    return false;
  }

  // ── Fetch real live proxies + batch geo-enrich with ip-api.com ───────────
  if (message.type === "FETCH_PROXIES") {
    const protocol = message.protocol || "http";
    (async () => {
      try {
        // 1. Fetch raw proxy list from ProxyScrape
        const proxyUrl = `https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=${protocol}&timeout=8000&country=all&anonymity=elite,anonymous`;
        const resp = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(15000),
        });
        if (!resp.ok) throw new Error(`ProxyScrape HTTP ${resp.status}`);
        const text = await resp.text();
        const lines = text
          .trim()
          .split("\n")
          .filter((l) => l.includes(":"));
        let proxies = lines
          .slice(0, 30)
          .map((line, i) => {
            const [host, port] = line.trim().split(":");
            return {
              id: `proxy_${i}_${host}`,
              host: host?.trim(),
              port: port?.trim(),
              protocol: protocol,
            };
          })
          .filter(
            (p) => p.host && p.port && /^\d+\.\d+\.\d+\.\d+$/.test(p.host),
          );

        // 2. Batch geo-locate IPs via ip-api.com (free, no key needed)
        try {
          const ips = proxies.map((p) => p.host);
          const geoResp = await fetch(
            "http://ip-api.com/batch?fields=status,country,countryCode,city,query",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(ips),
              signal: AbortSignal.timeout(10000),
            },
          );
          if (geoResp.ok) {
            const geoData = await geoResp.json();
            const geoMap = {};
            geoData.forEach((g) => {
              if (g.status === "success") geoMap[g.query] = g;
            });
            proxies = proxies.map((p) => ({
              ...p,
              country: geoMap[p.host]?.countryCode || "",
              countryName: geoMap[p.host]?.country || "Unknown",
              city: geoMap[p.host]?.city || "",
            }));
            logInfo(
              `[VPN] Geo-enriched ${Object.keys(geoMap).length}/${proxies.length} proxies.`,
            );
          }
        } catch (geoErr) {
          logError(
            "[VPN] Geo lookup failed (proxies still usable):",
            geoErr.message,
          );
        }

        logInfo(
          `[VPN] Ready: ${proxies.length} proxies across ${new Set(proxies.map((p) => p.country).filter(Boolean)).size} countries.`,
        );
        safeRespond(sendResponse, { success: true, proxies });
      } catch (err) {
        logError("[VPN] Failed to fetch proxies:", err.message);
        safeRespond(sendResponse, { success: false, error: err.message });
      }
    })();
    return true;
  }

  // ── Return all health score data ───────────────────────────────────────────
  if (message.type === "GET_PROXY_HEALTH") {
    (async () => {
      try {
        const health = await loadHealth();
        // Attach computed scores for convenience
        const withScores = {};
        Object.entries(health).forEach(([key, h]) => {
          withScores[key] = { ...h, score: calculateScore(h) };
        });
        safeRespond(sendResponse, { success: true, health: withScores });
      } catch (err) {
        safeRespond(sendResponse, { success: false, error: err.message });
      }
    })();
    return true;
  }

  // ── Report a proxy result from the UI ─────────────────────────────────────
  if (message.type === "REPORT_PROXY_STATUS") {
    const { host, port, success, reason } = message;
    (async () => {
      if (success) {
        await recordSuccess(host, port);
      } else {
        await recordFailure(host, port, reason || "manual report");
      }
      safeRespond(sendResponse, { ok: true });
    })();
    return true;
  }

  // ── Standard media download ──────────────────────────────────────────────
  if (message.type === "DOWNLOAD_MEDIA") {
    const { url, filename, meta } = message;

    chrome.storage.local.get(
      ["downloadSubdir", "pinterestFolder"],
      (result) => {
        let subdir;
        if (message.folder || meta?.folder || message.subfolder || meta?.subfolder) {
          subdir = message.folder || meta?.folder || message.subfolder || meta?.subfolder;
        } else if (meta?.username === "pinterest" || message.module === "pinterest") {
          subdir = result.pinterestFolder !== undefined ? result.pinterestFolder : "pinterest";
        } else {
          subdir =
            result.downloadSubdir !== undefined
              ? result.downloadSubdir
              : "Instagram-Downloads";
        }

        const cleanSubdir = (subdir || "").replace(/[\\/:*?"<>|]/g, "").trim();
        const finalPath = cleanSubdir ? `${cleanSubdir}/${filename}` : filename;

        chrome.downloads.download(
          { url, filename: finalPath, conflictAction: "uniquify" },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              const errMsg = chrome.runtime.lastError.message;
              logError("Download error:", errMsg);
              safeRespond(sendResponse, { success: false, error: errMsg });
              return;
            }

            safeRespond(sendResponse, { success: true, downloadId });
          },
        );
      },
    );

    return true; // async
  }

  // ── FFmpeg slideshow compile request (from content script) ──────────────
  //
  // MV3 message channels have a hard timeout (~60s) — FFmpeg encoding can
  // take several minutes. We MUST NOT keep sendResponse alive that long.
  //
  // Pattern: respond immediately with the requestId (closes the channel),
  // then push the result back to the originating tab via tabs.sendMessage
  // once encoding finishes. The content script has a matching listener.
  if (message.type === "FFMPEG_COMPILE_SLIDESHOW") {
    const tabId = sender?.tab?.id;
    const requestId = Math.random().toString(36).slice(2) + Date.now();
    startKeepAlive();

    // Acknowledge immediately — this closes the content→BG message channel cleanly
    sendResponse({ started: true, requestId });

    ensureOffscreenDocument()
      .then(() => {
        // Forward to the offscreen encoder
        chrome.runtime.sendMessage({
          target: "offscreen-ffmpeg",
          type: "FFMPEG_COMPILE_SLIDESHOW",
          requestId,
          tabId, // so we can route the result back
          mediaItems: message.mediaItems, // mixed array: [{ data, type, ext }, ...]
          imageDataArray: message.imageDataArray, // legacy fallback (image-only path)
          durationSecs: message.durationSecs,
          crf: message.crf,
        });
      })
      .catch((err) => {
        stopKeepAlive(); // compile never started — release keepalive immediately
        logError("[BG] Failed to create offscreen doc:", err);
        if (tabId) {
          chrome.tabs
            .sendMessage(tabId, {
              type: "FFMPEG_COMPILE_RESULT",
              requestId,
              success: false,
              error: err.message,
            })
            .catch(() => {});
        }
      });

    return false; // Already responded synchronously — do NOT keep channel open
  }

  // ── FFmpeg per-segment progress (offscreen → background → tab relay) ───────
  // Offscreen sends this before encoding each segment. Background relays it to
  // the originating tab so the download button can show "Encoding slide N/M…"
  if (message.type === "FFMPEG_PROGRESS") {
    const tabId = message.tabId;
    if (tabId) {
      chrome.tabs
        .sendMessage(tabId, {
          type: "FFMPEG_PROGRESS",
          requestId: message.requestId,
          segment: message.segment,
          totalSegments: message.totalSegments,
          phase: message.phase,
        })
        .catch(() => {}); // tab may have navigated away — ignore
    }
    // No sendResponse — fire-and-forget relay
  }

  // ── FFmpeg result (from offscreen encoder → push back to tab) ─────────
  if (message.type === "FFMPEG_COMPILE_RESULT") {
    stopKeepAlive(); // compile finished — release keepalive
    const tabId = message.tabId;
    if (tabId) {
      chrome.tabs
        .sendMessage(tabId, {
          type: "FFMPEG_COMPILE_RESULT",
          requestId: message.requestId,
          success: message.success,
          dataUrl: message.dataUrl,
          error: message.error,
        })
        .catch(() => {
          logError("[BG] Could not push FFmpeg result to tab", tabId);
        });
    }
    // No sendResponse needed — offscreen sent a fire-and-forget message
  }
});


// ─── Action click listener (opens index.html in a new tab) ───────────────────
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

// ─── Timer Bypass Main World Injection (CSP Compliant) ───────────────────────
const BYPASS_DOMAINS = [
  "arolinks.com",
  "deltastudy.site",
  "fc.lc",
  "fc-lc.xyz",
  "linkjust.com",
  "4download.net",
  "flightsim.to",
  "shr2.link",
  "nitro-link.com",
  "oii.la",
  "tpi.li",
  "cookiesceo.com",
  "fastdl.zip",
  "filepress",
  "hdhub4u",
  "hubcloud",
  "vcloud.zip",
  "skrresults.com",
  "teknoasian.com",
];

function shouldBypassTimers(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BYPASS_DOMAINS.some((domain) => hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

function mainWorldBypasser() {
  // 1. Overwrite visibility APIs
  try {
    Object.defineProperty(document, "hidden", {
      get: () => false,
      configurable: true,
    });
    Object.defineProperty(document, "visibilityState", {
      get: () => "visible",
      configurable: true,
    });
    Object.defineProperty(Document.prototype, "hasFocus", {
      value: () => true,
      configurable: true,
      writable: true,
    });
  } catch (e) {}

  // 2. Neutralize dynamic Function("debugger") constructor calls
  try {
    const nativeFunction = window.Function;
    window.Function = function (...args) {
      if (
        args.length > 0 &&
        typeof args[args.length - 1] === "string" &&
        args[args.length - 1].includes("debugger")
      ) {
        return function () {};
      }
      return nativeFunction.apply(this, args);
    };
    window.Function.prototype = nativeFunction.prototype;
  } catch (e) {}

  // 3. Fast-forward and check timeouts/intervals for debuggers
  const nativeTimeout = window.setTimeout;
  const nativeInterval = window.setInterval;

  const accelerate = (delay) => {
    if (typeof delay !== "number" || delay < 400 || delay > 600000)
      return delay;
    return 0; // Instant time skipper
  };

  window.setTimeout = function (callback, delay, ...args) {
    if (typeof callback !== "function") {
      return nativeTimeout.apply(window, arguments);
    }
    // Neutralize static anti-debugging loops inside timeouts
    if (callback.toString().includes("debugger")) {
      return nativeTimeout.call(window, () => {}, delay);
    }
    return nativeTimeout.call(window, callback, accelerate(delay), ...args);
  };

  window.setInterval = function (callback, delay, ...args) {
    if (typeof callback !== "function") {
      return nativeInterval.apply(window, arguments);
    }
    // Neutralize static anti-debugging loops inside intervals
    if (callback.toString().includes("debugger")) {
      return nativeInterval.call(window, () => {}, delay);
    }
    return nativeInterval.call(window, callback, accelerate(delay), ...args);
  };
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading") return;
  const url = changeInfo.url || tab.url || tab.pendingUrl;
  if (!url || !url.startsWith("http")) return;

  chrome.storage.local.get(["activeModules", "bypassDomains"], (result) => {
    const activeModules = result.activeModules || {};
    const domains = result.bypassDomains || BYPASS_DOMAINS;

    if (activeModules.timers) {
      let isMatched = false;
      try {
        const hostname = new URL(url).hostname.toLowerCase();
        isMatched = domains.some((domain) => hostname.includes(domain));
      } catch (e) {}

      if (isMatched) {
        chrome.scripting
          .executeScript({
            target: { tabId: tabId, allFrames: true },
            world: "MAIN",
            injectImmediately: true,
            func: mainWorldBypasser,
          })
          .catch((err) => {
            // Suppress warnings for system/protected chrome pages
          });
      }
    }
  });
});

// ─── VPN: 60-second uptime → record proxy success ────────────────────────────
let vpnSuccessTimer = null;

function startVpnSuccessTimer(host, port) {
  if (vpnSuccessTimer) clearTimeout(vpnSuccessTimer);
  vpnSuccessTimer = setTimeout(async () => {
    await recordSuccess(host, port);
    logInfo(`[VPN] Auto-success recorded for ${host}:${port} (60s uptime).`);
    vpnSuccessTimer = null;
  }, 60_000);
}

function stopVpnSuccessTimer() {
  if (vpnSuccessTimer) {
    clearTimeout(vpnSuccessTimer);
    vpnSuccessTimer = null;
  }
}

// Trigger success timer when proxy is set
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.vpnConnected) {
    const connected = changes.vpnConnected.newValue;
    if (connected) {
      chrome.storage.local.get(["vpnSelectedServer"], (r) => {
        if (r.vpnSelectedServer?.host && r.vpnSelectedServer?.port) {
          startVpnSuccessTimer(
            r.vpnSelectedServer.host,
            r.vpnSelectedServer.port,
          );
        }
      });
    } else {
      stopVpnSuccessTimer();
    }
  }
  if (changes.vpnSelectedServer && changes.vpnSelectedServer.newValue) {
    // Reset timer when server changes
    const s = changes.vpnSelectedServer.newValue;
    chrome.storage.local.get(["vpnConnected"], (r) => {
      if (r.vpnConnected && s.host && s.port) {
        startVpnSuccessTimer(s.host, s.port);
      }
    });
  }
});

// ─── VPN: webRequest error → record failure + auto-rotate ────────────────────
const PROXY_ERRORS = [
  "ERR_PROXY_CONNECTION_FAILED",
  "ERR_TUNNEL_CONNECTION_FAILED",
  "ERR_SOCKS_CONNECTION_FAILED",
  "ERR_PROXY_AUTH_UNSUPPORTED",
  "ERR_NO_SUPPORTED_PROXIES",
];

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (!PROXY_ERRORS.some((e) => details.error?.includes(e))) return;
    chrome.storage.local.get(
      [
        "vpnConnected",
        "vpnSelectedServer",
        "vpnSelectedCountry",
        "vpnFetchedProxies",
      ],
      async (result) => {
        if (!result.vpnConnected || !result.vpnSelectedServer) return;
        const { host, port } = result.vpnSelectedServer;
        await recordFailure(host, port, details.error);
        logError(
          `[VPN] Proxy error on ${host}:${port} — ${details.error}. Attempting auto-rotate.`,
        );

        const allProxies = result.vpnFetchedProxies || [];
        const countryCode =
          result.vpnSelectedCountry || result.vpnSelectedServer.country || "";
        // Filter to same country if possible, otherwise use full pool
        const pool = countryCode
          ? allProxies.filter((p) => p.country === countryCode)
          : allProxies;
        const next = await getNextProxy(
          pool.length > 1 ? pool : allProxies,
          host,
          port,
        );

        if (next) {
          logInfo(`[VPN] Auto-rotating → ${next.host}:${next.port}`);
          chrome.storage.local.set({
            vpnSelectedServer: next,
            vpnAutoRotateNotif: {
              from: `${host}:${port}`,
              to: `${next.host}:${next.port}`,
              country: next.country || countryCode,
              reason: details.error,
              ts: Date.now(),
            },
          });
          // syncVpnProxy is triggered automatically via storage.onChanged in proxy.js
        } else {
          logError("[VPN] No alternate proxy available for failover.");
          chrome.storage.local.set({
            vpnConnected: false,
            vpnAutoRotateNotif: null,
          });
        }
      },
    );
  },
  { urls: ["<all_urls>"] },
);
