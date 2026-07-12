// InstaGrab Background Service Worker
import { syncVpnProxy, initVpnListeners } from "./vpn/proxy.js";
import { recordSuccess, recordFailure, getNextProxy, loadHealth, calculateScore } from "./vpn/health.js";

const backgroundLogs = [];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["activeModules"], (result) => {
    if (!result.activeModules) {
      chrome.storage.local.set({
        activeModules: {
          instagrab: true,
          timers: true,
          youtube: true,
          vpn: true
        }
      });
    } else {
      const updated = { ...result.activeModules };
      if (updated.instagrab === undefined) updated.instagrab = true;
      if (updated.timers === undefined) updated.timers = true;
      if (updated.youtube === undefined) updated.youtube = true;
      if (updated.vpn === undefined) updated.vpn = true;
      chrome.storage.local.set({ activeModules: updated }, () => {
        syncVpnProxy();
      });
    }
  });
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

// Pending FFmpeg requests: requestId → sendResponse callback
const pendingFFmpeg = new Map();

// Keepalive interval reference (prevents SW from sleeping during long encodes)
let keepAliveTimer = null;

function startKeepAlive() {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {});
  }, 10000);
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "GET_BACKGROUND_LOGS") {
    sendResponse({ logs: backgroundLogs });
    return false;
  }

  // ── Fetch real live proxies + batch geo-enrich with ip-api.com ───────────
  if (message.type === "FETCH_PROXIES") {
    const protocol = message.protocol || "http";
    (async () => {
      try {
        // 1. Fetch raw proxy list from ProxyScrape
        const proxyUrl = `https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=${protocol}&timeout=8000&country=all&anonymity=elite,anonymous`;
        const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
        if (!resp.ok) throw new Error(`ProxyScrape HTTP ${resp.status}`);
        const text = await resp.text();
        const lines = text.trim().split("\n").filter((l) => l.includes(":"));
        let proxies = lines.slice(0, 30).map((line, i) => {
          const [host, port] = line.trim().split(":");
          return {
            id: `proxy_${i}_${host}`,
            host: host?.trim(),
            port: port?.trim(),
            protocol: protocol,
          };
        }).filter((p) => p.host && p.port && /^\d+\.\d+\.\d+\.\d+$/.test(p.host));

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
            }
          );
          if (geoResp.ok) {
            const geoData = await geoResp.json();
            const geoMap = {};
            geoData.forEach((g) => { if (g.status === "success") geoMap[g.query] = g; });
            proxies = proxies.map((p) => ({
              ...p,
              country: geoMap[p.host]?.countryCode || "",
              countryName: geoMap[p.host]?.country || "Unknown",
              city: geoMap[p.host]?.city || "",
            }));
            logInfo(`[VPN] Geo-enriched ${Object.keys(geoMap).length}/${proxies.length} proxies.`);
          }
        } catch (geoErr) {
          logError("[VPN] Geo lookup failed (proxies still usable):", geoErr.message);
        }

        logInfo(`[VPN] Ready: ${proxies.length} proxies across ${new Set(proxies.map(p => p.country).filter(Boolean)).size} countries.`);
        sendResponse({ success: true, proxies });
      } catch (err) {
        logError("[VPN] Failed to fetch proxies:", err.message);
        sendResponse({ success: false, error: err.message });
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
        sendResponse({ success: true, health: withScores });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
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
      sendResponse({ ok: true });
    })();
    return true;
  }

  // ── Standard media download ──────────────────────────────────────────────
  if (message.type === "DOWNLOAD_MEDIA") {
    const { url, filename, meta } = message;

    chrome.storage.local.get(
      ["downloadSubdir", "downloadHistory"],
      (result) => {
        const subdir =
          result.downloadSubdir !== undefined
            ? result.downloadSubdir
            : "Instagram-Downloads";
        const cleanSubdir = subdir.replace(/[\\/:*?"<>|]/g, "").trim();
        const finalPath = cleanSubdir ? `${cleanSubdir}/${filename}` : filename;

        chrome.downloads.download(
          { url, filename: finalPath, conflictAction: "uniquify" },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              const errMsg = chrome.runtime.lastError.message;
              logError("Download error:", errMsg);
              sendResponse({ success: false, error: errMsg });
              return;
            }

            const historyItem = {
              id: downloadId,
              url,
              filename,
              username: meta.username || "anonymous",
              postId: meta.postId || "post",
              mediaType: meta.mediaType || "image",
              thumbnailUrl: meta.thumbnailUrl || "",
              timestamp: Date.now(),
              status: "downloading",
            };

            let history = result.downloadHistory || [];
            if (!history.some((item) => item.id === downloadId)) {
              history.unshift(historyItem);
              if (history.length > 50) history = history.slice(0, 50);
              chrome.storage.local.set({ downloadHistory: history }, () => {
                sendResponse({ success: true, downloadId });
              });
            } else {
              sendResponse({ success: true, downloadId });
            }
          },
        );
      },
    );

    return true; // async
  }

  // ── FFmpeg slideshow compile request (from content script) ──────────────
  if (message.type === "FFMPEG_COMPILE_SLIDESHOW") {
    const requestId = Math.random().toString(36).slice(2) + Date.now();
    pendingFFmpeg.set(requestId, sendResponse);
    startKeepAlive();

    ensureOffscreenDocument()
      .then(() => {
        // Forward to the offscreen encoder
        chrome.runtime.sendMessage({
          target: "offscreen-ffmpeg",
          type: "FFMPEG_COMPILE_SLIDESHOW",
          requestId,
          imageDataArray: message.imageDataArray, // base64 images, pre-fetched by content.js
          durationSecs: message.durationSecs,
          crf: message.crf,
        });
      })
      .catch((err) => {
        logError("[BG] Failed to create offscreen doc:", err);
        pendingFFmpeg.delete(requestId);
        if (pendingFFmpeg.size === 0) stopKeepAlive();
        sendResponse({ success: false, error: err.message });
      });

    return true; // async
  }

  // ── FFmpeg result (from offscreen encoder) ──────────────────────────────
  if (message.type === "FFMPEG_COMPILE_RESULT") {
    const resolve = pendingFFmpeg.get(message.requestId);
    if (resolve) {
      pendingFFmpeg.delete(message.requestId);
      if (pendingFFmpeg.size === 0) stopKeepAlive();
      resolve({
        success: message.success,
        dataUrl: message.dataUrl,
        error: message.error,
      });
    }
    // No async response back — return false / undefined
  }
});

// ─── Download status monitor ──────────────────────────────────────────────────

chrome.downloads.onChanged.addListener((delta) => {
  chrome.storage.local.get(["downloadHistory"], (result) => {
    let history = result.downloadHistory || [];
    let updated = false;

    history = history.map((item) => {
      if (item.id === delta.id) {
        updated = true;
        if (delta.state) {
          if (delta.state.current === "complete") item.status = "success";
          else if (delta.state.current === "interrupted")
            item.status = "failed";
        }
      }
      return item;
    });

    if (updated) chrome.storage.local.set({ downloadHistory: history });
  });
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
    window.Function = function(...args) {
      if (args.length > 0 && typeof args[args.length - 1] === "string" && args[args.length - 1].includes("debugger")) {
        return function() {};
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
          startVpnSuccessTimer(r.vpnSelectedServer.host, r.vpnSelectedServer.port);
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
      ["vpnConnected", "vpnSelectedServer", "vpnSelectedCountry", "vpnFetchedProxies"],
      async (result) => {
        if (!result.vpnConnected || !result.vpnSelectedServer) return;
        const { host, port } = result.vpnSelectedServer;
        await recordFailure(host, port, details.error);
        logError(`[VPN] Proxy error on ${host}:${port} — ${details.error}. Attempting auto-rotate.`);

        const allProxies = result.vpnFetchedProxies || [];
        const countryCode = result.vpnSelectedCountry || result.vpnSelectedServer.country || "";
        // Filter to same country if possible, otherwise use full pool
        const pool = countryCode
          ? allProxies.filter((p) => p.country === countryCode)
          : allProxies;
        const next = await getNextProxy(pool.length > 1 ? pool : allProxies, host, port);

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
          chrome.storage.local.set({ vpnConnected: false, vpnAutoRotateNotif: null });
        }
      }
    );
  },
  { urls: ["<all_urls>"] }
);
