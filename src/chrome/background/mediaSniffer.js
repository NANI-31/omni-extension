// ─── Stream Sniffer & Tab Media Registry (videograb) ─────────────────────────

// Match master/media playlists and direct videos; ignore chunk fragments (.ts, .m4s)
const MEDIA_EXTENSIONS = /\.(mp4|m3u8|webm|mpd)(\?.*)?$/i;

/**
 * Updates or adds media streams reported by tab content scripts.
 */
export function handleRegisterTabMedia(msg, sender, sendResponse) {
  if (!sender.tab?.id) return false;
  const tabId = sender.tab.id;
  const tabMedia = msg.data;

  chrome.storage.local.get({ detectedMediaRegistry: [] }, (res) => {
    let registry = Array.isArray(res.detectedMediaRegistry) ? [...res.detectedMediaRegistry] : [];
    let tabEntry = registry.find((t) => t.tabId === tabId);
    if (!tabEntry) {
      tabEntry = {
        tabId: tabId,
        title: sender.tab.title || msg.pageTitle || "Video Tab",
        domain: (() => {
          try {
            return new URL(sender.tab.url).hostname.replace(/^www\./, "");
          } catch (_) {
            return "video";
          }
        })(),
        favicon: sender.tab.favIconUrl || "",
        url: sender.tab.url,
        isActive: sender.tab.active || false,
        streams: [],
      };
      registry.unshift(tabEntry);
    }

    if (Array.isArray(tabMedia)) {
      tabMedia.forEach((m) => {
        const existingIdx = tabEntry.streams.findIndex((s) => s.id === m.id || s.url === m.url);
        if (existingIdx >= 0) {
          tabEntry.streams[existingIdx] = { ...tabEntry.streams[existingIdx], ...m };
        } else {
          tabEntry.streams.push(m);
        }
      });
    }

    chrome.storage.local.set({ detectedMediaRegistry: registry.slice(0, 20) });
    try {
      chrome.action.setBadgeText({ tabId, text: String(tabEntry.streams.length || "") });
      chrome.action.setBadgeBackgroundColor({ tabId, color: "#a855f7" });
    } catch (_) {}
  });

  if (sendResponse) sendResponse({ ok: true });
  return true;
}

/**
 * Initializes webRequest sniffing and tab lifecycle pruning.
 */
export function initMediaSniffer() {
  if (typeof chrome === "undefined" || !chrome.webRequest?.onHeadersReceived) return;

  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      if (details.tabId < 0) return;
      if (details.url.startsWith("chrome-extension://")) return;

      // Filter out individual chunk segments so stream list isn't flooded with 50+ 2-second chunks
      const isChunk =
        /\.(ts|m4s)(\?.*)?$/i.test(details.url) ||
        /(chunk[_-]?\d+|segment[_-]?\d+|fragment[_-]?\d+|seg[_-]?\d+)/i.test(details.url);
      if (isChunk) return;

      const contentType = (
        details.responseHeaders?.find(
          (h) => h.name.toLowerCase() === "content-type"
        )?.value || ""
      ).toLowerCase();

      const isVideo =
        contentType.includes("video/") ||
        contentType.includes("application/vnd.apple.mpegurl") ||
        contentType.includes("application/x-mpegurl") ||
        contentType.includes("application/dash+xml") ||
        MEDIA_EXTENSIONS.test(details.url);

      if (!isVideo) return;

      chrome.tabs.get(details.tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) return;

        const urlObj = (() => {
          try {
            return new URL(tab.url || details.url);
          } catch (_) {
            return { hostname: "unknown", pathname: "" };
          }
        })();

        const format =
          details.url.includes(".m3u8") || contentType.includes("mpegurl")
            ? "hls"
            : details.url.includes(".webm") || contentType.includes("webm")
            ? "webm"
            : "mp4";

        const resolutionMatch = details.url.match(/(1080|720|480|360|240)p?/i);
        const resolution = resolutionMatch
          ? `${resolutionMatch[1]}p`
          : format === "hls"
          ? "Adaptive Stream"
          : "Standard Video";

        // Prefer tab title over random CDN hex hashes
        const cleanTabTitle = (tab.title || "")
          .replace(/ - YouTube$/, "")
          .replace(/\.(mp4|m3u8|webm|ts|m4s|mpd|hls)$/i, "")
          .trim();

        let defaultName = cleanTabTitle;
        if (!defaultName || /^(new tab|untitled|blank)$/i.test(defaultName)) {
          try {
            const parsed = new URL(details.url);
            const segments = parsed.pathname.split("/").filter(Boolean);
            const last = segments[segments.length - 1] || "";
            const urlName = decodeURIComponent(last).replace(/\.(mp4|m3u8|webm|ts|m4s|mpd|hls)$/i, "");
            if (urlName && !/^(master|index|playlist|video|chunk_\d+|stream)$/i.test(urlName)) {
              defaultName = urlName.replace(/[_-]+/g, " ").trim();
            }
          } catch (_) {}
        }
        defaultName = defaultName || "Video";

        const streamObj = {
          id: `stream_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          format,
          resolution,
          title: defaultName,
          customName: defaultName,
          codec: format === "hls" ? "H.264 / AAC (HLS)" : "MP4 / AAC",
          url: details.url,
          sizeEstimate: format === "hls" ? "Variable Stream" : "Direct Media",
          needsFfmpeg: format === "hls",
        };

        chrome.storage.local.get({ detectedMediaRegistry: [] }, (res) => {
          const registry = Array.isArray(res.detectedMediaRegistry)
            ? [...res.detectedMediaRegistry]
            : [];
          let tabEntry = registry.find((t) => t.tabId === details.tabId);

          if (!tabEntry) {
            tabEntry = {
              tabId: details.tabId,
              title: cleanTabTitle || urlObj.hostname,
              domain: urlObj.hostname.replace(/^www\./, ""),
              favicon: tab.favIconUrl || "",
              url: tab.url || details.url,
              isActive: tab.active || false,
              streams: [],
            };
            registry.unshift(tabEntry);
          }

          // Avoid duplicate streams or redundant sub-playlists of same HLS video
          const isDuplicateOrSubVariant = tabEntry.streams.some((s) => {
            if (s.url === streamObj.url) return true;
            if (s.format === "hls" && format === "hls") {
              try {
                const u1 = new URL(s.url);
                const u2 = new URL(streamObj.url);
                if (u1.hostname === u2.hostname) {
                  const p1 = u1.pathname.substring(0, u1.pathname.lastIndexOf("/"));
                  const p2 = u2.pathname.substring(0, u2.pathname.lastIndexOf("/"));
                  if (p1 && p2 && p1 === p2) return true;
                }
              } catch (_) {}
            }
            return false;
          });

          if (!isDuplicateOrSubVariant) {
            tabEntry.streams.push(streamObj);
            const updatedRegistry = registry.slice(0, 20);
            chrome.storage.local.set({ detectedMediaRegistry: updatedRegistry });

            // Update badge
            try {
              chrome.action.setBadgeText({
                tabId: details.tabId,
                text: String(tabEntry.streams.length),
              });
              chrome.action.setBadgeBackgroundColor({
                tabId: details.tabId,
                color: "#a855f7",
              });
            } catch (_) {}
          }
        });
      });
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
  );

  // Prune closed tabs from detected media registry
  if (chrome.tabs?.onRemoved) {
    chrome.tabs.onRemoved.addListener((tabId) => {
      chrome.storage.local.get({ detectedMediaRegistry: [] }, (res) => {
        if (!Array.isArray(res.detectedMediaRegistry)) return;
        const filtered = res.detectedMediaRegistry.filter((t) => t.tabId !== tabId);
        if (filtered.length !== res.detectedMediaRegistry.length) {
          chrome.storage.local.set({ detectedMediaRegistry: filtered });
        }
      });
    });
  }
}
