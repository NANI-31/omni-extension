// ── Preventative Hotstar AdShield Engine ───────────────────────────────
// Blocks video ads on Disney+ Hotstar (hotstar.com, jiohotstar.com, jiostar.com)
// by intercepting JSON cue-points/interventions, mocking ad beacons, and fast-forwarding ads.

export function initHotstarAdShield() {
  const isHotstar =
    window.location.hostname.includes("hotstar.com") ||
    window.location.hostname.includes("jiohotstar.com") ||
    window.location.hostname.includes("jiostar.com") ||
    window.location.hostname.includes("disneyplus.com");
  if (!isHotstar) return;

  function isAdblockActive() {
    try {
      if (sessionStorage.getItem("omni_adblock_enabled") === "false") return false;
      if (document.documentElement.getAttribute("data-omni-adblock") === "false") return false;
    } catch (_) {}
    return true; // Default enabled
  }

  // A. Recursive JSON Pruner for Hotstar Interventions & Ad Breaks
  function pruneHotstarAds(obj) {
    if (!obj || typeof obj !== "object") return obj;
    try {
      delete obj.intervention_data;
      delete obj.interventions;
      delete obj.ad_breaks;
      delete obj.adConfig;
      delete obj.adMedia;
      delete obj.adTags;
      delete obj.client_ad_tag;
      delete obj.ad_metadata;
      delete obj.vast_url;
      delete obj.vmap_url;

      if (obj.widget && typeof obj.widget === "object" && obj.widget.data) {
        delete obj.widget.data.intervention_data;
        delete obj.widget.data.interventions;
        delete obj.widget.data.ad_breaks;
      }

      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          if (obj[i] && typeof obj[i] === "object") {
            pruneHotstarAds(obj[i]);
          }
        }
      } else {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            if (val && typeof val === "object") {
              pruneHotstarAds(val);
            }
          }
        }
      }
    } catch (_) {}
    return obj;
  }

  // B. Intercept JSON.parse & Response.prototype.json for Hotstar
  try {
    const originalJSONParse = JSON.parse;
    JSON.parse = function () {
      const result = originalJSONParse.apply(this, arguments);
      if (isAdblockActive() && result && typeof result === "object") {
        pruneHotstarAds(result);
      }
      return result;
    };
    try {
      JSON.parse.toString = () => originalJSONParse.toString();
    } catch (_) {}

    const originalResponseJson = Response.prototype.json;
    Response.prototype.json = function () {
      return originalResponseJson.apply(this, arguments).then((data) => {
        if (isAdblockActive() && data && typeof data === "object") {
          pruneHotstarAds(data);
        }
        return data;
      });
    };
    try {
      Response.prototype.json.toString = () => originalResponseJson.toString();
    } catch (_) {}
  } catch (_) {}

  // C. Intercept Network Requests (fetch & XMLHttpRequest) targeting ad cue / stats endpoints
  try {
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      if (isAdblockActive()) {
        const url = typeof input === "string" ? input : (input && input.url ? input.url : "");
        if (
          url.includes("/api/v1/ad") ||
          url.includes("/ad-service/") ||
          url.includes("/v2/ads") ||
          url.includes("bifrost.hotstar.com") ||
          url.includes("doubleclick.net") ||
          url.includes("inmobi.com") ||
          url.includes("scorecardresearch.com") ||
          url.includes("pubmatic.com")
        ) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ success: true, message: "OK", data: {}, interventions: [], intervention_data: [] }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }
      }
      return originalFetch.apply(this, arguments);
    };
    try {
      window.fetch.toString = () => originalFetch.toString();
    } catch (_) {}

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this._omniUrl = url;
      return originalXHROpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      if (isAdblockActive() && typeof this._omniUrl === "string") {
        const url = this._omniUrl;
        if (
          url.includes("/api/v1/ad") ||
          url.includes("/ad-service/") ||
          url.includes("/v2/ads") ||
          url.includes("bifrost.hotstar.com") ||
          url.includes("doubleclick.net") ||
          url.includes("inmobi.com") ||
          url.includes("scorecardresearch.com") ||
          url.includes("pubmatic.com")
        ) {
          Object.defineProperty(this, "status", { value: 200, configurable: true });
          const mockBody = JSON.stringify({ success: true, message: "OK", data: {}, interventions: [], intervention_data: [] });
          Object.defineProperty(this, "responseText", { value: mockBody, configurable: true });
          Object.defineProperty(this, "response", { value: mockBody, configurable: true });
          Object.defineProperty(this, "readyState", { value: 4, configurable: true });
          setTimeout(() => {
            this.dispatchEvent(new Event("readystatechange"));
            this.dispatchEvent(new Event("load"));
            this.dispatchEvent(new Event("loadend"));
          }, 0);
          return;
        }
      }
      return originalXHRSend.apply(this, arguments);
    };
  } catch (_) {}

  // D. In-Stream Video Ad Fast-Forward & Skip Neutralization Loop
  let originalMuted = false;
  let originalRate = 1.0;
  let wasAdPlaying = false;

  function sanitizeHotstarVideoPlayback() {
    if (!isAdblockActive()) return;

    const adIndicator = document.querySelector(
      'div[data-testid^="ad-media"], [data-testid="ad-countdown"], [data-testid="ad-badge"], div[class*="ad_overlay"], div[class*="adMarker"], div[class*="adContainer"], .shaka-ad-container'
    );

    const videos = document.querySelectorAll("video");
    if (adIndicator && videos.length > 0) {
      for (const video of videos) {
        if (!wasAdPlaying) {
          originalMuted = video.muted;
          originalRate = video.playbackRate || 1.0;
          wasAdPlaying = true;
        }
        video.muted = true;
        video.playbackRate = 16.0;
        if (isFinite(video.duration) && video.duration > 0) {
          video.currentTime = video.duration - 0.1;
        }
      }

      const skipBtn = document.querySelector(
        'button[class*="skip" i], div[class*="skip" i], [data-testid*="skip"]'
      );
      if (skipBtn) {
        try { skipBtn.click(); } catch (_) {}
      }
    } else if (wasAdPlaying) {
      wasAdPlaying = false;
      for (const video of videos) {
        video.muted = originalMuted;
        video.playbackRate = originalRate;
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    }
  }
  setInterval(sanitizeHotstarVideoPlayback, 250);

  // E. Immediate CSS element hiding for Hotstar ad containers & overlays
  try {
    const styleId = "omni-hotstar-adshield-css";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        div[data-testid^="ad-media"],
        [data-testid="ad-countdown"],
        [data-testid="ad-badge"],
        div[class*="ad_overlay"],
        div[class*="adMarker"],
        div[class*="adContainer"],
        .shaka-ad-container,
        [class*="ad-container"],
        [class*="ad-banner"],
        [data-testid="ad-container"] {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          min-height: 0 !important;
          max-height: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
          overflow: hidden !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }
  } catch (_) {}
}
