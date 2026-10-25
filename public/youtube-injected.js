// General Video Tools Injected Script (Main World Context)
// Auto-generated from src/chrome/youtube/injected/ modules. Do not edit directly.
(function () {

  // ── [Module: youtubeAdShield.js] ───────────────────────────────
  // ── Modern YouTube AdShield Engine ──────────────────────────────────────────
  // Fast-forwards and auto-skips video ads in 0.05s without triggering YouTube's anti-adblock canaries.
  // Automatically eradicates enforcement modals, removes dark backdrops, and restores video playback and scrolling.
  function initYouTubeAdShield() {
    const isYouTube =
      window.location.hostname.includes("youtube.com") ||
      window.location.hostname.includes("youtube-nocookie.com");
    if (!isYouTube) return;

    function isAdblockActive() {
      try {
        if (sessionStorage.getItem("omni_adblock_enabled") === "false") return false;
        if (document.documentElement.getAttribute("data-omni-adblock") === "false") return false;
      } catch (_) {}
      return true; // Default enabled
    }

    // ── 1. Enforcement Wall & Dark Backdrop Neutralizer ─────────────────────────
    function eradicateEnforcement() {
      if (!isAdblockActive()) return;

      const enforcementModal = document.querySelector("ytd-enforcement-message-view-model");
      const enforcementDialog = document.querySelector(
        "tp-yt-paper-dialog:has(ytd-enforcement-message-view-model), ytd-popup-container:has(ytd-enforcement-message-view-model)"
      );

      if (enforcementModal || enforcementDialog) {
        if (enforcementModal) enforcementModal.remove();
        if (enforcementDialog) enforcementDialog.remove();

        // Eliminate dark backdrop covering the entire webpage
        document.querySelectorAll("tp-yt-iron-overlay-backdrop").forEach((backdrop) => {
          try { backdrop.remove(); } catch (_) {}
        });

        // Restore document scrolling (undo iron-overlay-manager scroll locks)
        try {
          document.body.style.removeProperty("overflow");
          document.documentElement.style.removeProperty("overflow");
          document.body.style.removeProperty("position");
          document.documentElement.style.removeProperty("position");
        } catch (_) {}

        // Resume video playback via YouTube Player API and HTML5 video
        try {
          const moviePlayer = document.getElementById("movie_player");
          if (moviePlayer && typeof moviePlayer.playVideo === "function") {
            moviePlayer.playVideo();
          }
        } catch (_) {}

        const video = document.querySelector("video");
        if (video && video.paused) {
          video.play().catch(() => {});
        }
      }
    }

    // ── 2. Undetectable Fast-Forward & Auto-Skip Engine ─────────────────────────
    let isAdFastForwarding = false;
    let savedPlaybackRate = 1.0;
    let savedMuted = false;

    const SKIP_BUTTON_SELECTORS = [
      ".ytp-skip-ad-button",
      ".ytp-ad-skip-button-modern",
      ".ytp-ad-skip-button",
      "button.ytp-ad-skip-button-text",
      ".ytp-ad-skip-button-container button",
      ".ytp-ad-overlay-close-button",
    ];

    function processVideoAd() {
      if (!isAdblockActive()) return;

      // Check for enforcement popups on every tick
      eradicateEnforcement();

      const adContainer = document.querySelector(".ad-showing, .ad-interrupting");
      const video = document.querySelector("video");

      if (adContainer && video) {
        if (!isAdFastForwarding) {
          savedPlaybackRate = video.playbackRate || 1.0;
          savedMuted = video.muted;
          isAdFastForwarding = true;
        }

        // Mute ad and fast-forward to instantaneous finish
        video.muted = true;
        video.playbackRate = 16.0;
        if (isFinite(video.duration) && video.duration > 0) {
          video.currentTime = Math.max(0, video.duration - 0.05);
        }

        // Click all skip buttons
        for (const sel of SKIP_BUTTON_SELECTORS) {
          const btn = document.querySelector(sel);
          if (btn) {
            try { btn.click(); } catch (_) {}
          }
        }
      } else if (isAdFastForwarding && video) {
        // Ad ended — restore normal playback speed, restore volume, and ensure playing
        isAdFastForwarding = false;
        video.playbackRate = savedPlaybackRate <= 2.0 ? savedPlaybackRate : 1.0;
        video.muted = savedMuted;
        if (video.paused) {
          video.play().catch(() => {});
        }
        try {
          const moviePlayer = document.getElementById("movie_player");
          if (moviePlayer && typeof moviePlayer.playVideo === "function") {
            moviePlayer.playVideo();
          }
        } catch (_) {}
      } else {
        // Periodic sweep for stray popup ad close buttons or skip buttons
        const skipBtn = document.querySelector(
          ".ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button, button.ytp-ad-skip-button-text, .ytp-ad-overlay-close-button"
        );
        if (skipBtn) {
          try { skipBtn.click(); } catch (_) {}
        }
      }
    }

    // High-frequency tick loop
    setInterval(processVideoAd, 150);

    // MutationObserver for real-time backdrop and enforcement removal
    try {
      const observer = new MutationObserver(() => {
        eradicateEnforcement();
      });
      observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
      });
    } catch (_) {}

    // ── 3. Visual Hiding Styles & Scroll Protection ─────────────────────────────
    try {
      const styleId = "omni-yt-adshield-css";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          ytd-ad-slot-renderer,
          ytd-in-feed-ad-layout-renderer,
          ytd-player-legacy-desktop-watch-ads-renderer,
          ytd-banner-promo-renderer,
          #player-ads,
          .video-ads,
          .ytp-ad-module,
          .ytp-ad-player-overlay,
          .ytp-ad-player-overlay-layout,
          .ytp-ad-overlay-container,
          .ytp-ad-message-container,
          .ytp-ad-text,
          .ytp-ad-preview-container,
          ytd-statement-banner-renderer,
          #masthead-ad,
          ytd-rich-item-renderer:has(> ytd-ad-slot-renderer),
          ytd-promoted-video-renderer,
          ytd-display-ad-renderer,
          ytd-action-companion-ad-renderer,
          .ytp-ad-progress-list,
          ytd-enforcement-message-view-model,
          tp-yt-paper-dialog:has(ytd-enforcement-message-view-model),
          ytd-popup-container:has(ytd-enforcement-message-view-model) {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            overflow: hidden !important;
          }

          /* Eradicate dark backdrop when enforcement occurs */
          html:has(ytd-enforcement-message-view-model) tp-yt-iron-overlay-backdrop,
          body:has(ytd-enforcement-message-view-model) tp-yt-iron-overlay-backdrop {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }

          /* Ensure webpage remains fully scrollable */
          html:has(ytd-enforcement-message-view-model),
          body:has(ytd-enforcement-message-view-model) {
            overflow: auto !important;
            position: static !important;
          }
        `;
        (document.head || document.documentElement).appendChild(style);
      }
    } catch (_) {}
  }

  // ── [Module: hotstarAdShield.js] ───────────────────────────────
  // ── Preventative Hotstar AdShield Engine ───────────────────────────────
  // Blocks video ads on Disney+ Hotstar (hotstar.com, jiohotstar.com, jiostar.com)
  // by intercepting JSON cue-points/interventions, mocking ad beacons, and fast-forwarding ads.
  function initHotstarAdShield() {
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

  // ── [Module: hudStyles.js] ───────────────────────────────
  // ── Shared HUD Styles & OSD Overlay Engine ──────────────────────────────────
  // Manages volume, speed, brightness, seek, and skip-interval on-screen display badges.

  let hudTimeout = null;
  let speedBadgeTimeout = null;
  let brightnessHudTimeout = null;
  let seekHudTimeout = null;
  let seekStepHudTimeout = null;
  function createHUDStyle() {
    if (document.getElementById("yt-volume-hud-style")) return;
    const style = document.createElement("style");
    style.id = "yt-volume-hud-style";
    style.textContent = `
      /* ── Volume OSD (centre of video, fades in/out) ── */
      .yt-custom-volume-hud {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        background: rgba(15, 15, 15, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 16px 20px;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        pointer-events: none;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        width: 140px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      }
      .yt-custom-volume-hud.visible {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      .yt-hud-icon-container { font-size: 28px; line-height: 1; }
      .yt-hud-percentage {
        font-size: 14px;
        font-weight: 800;
        font-family: Roboto, Arial, sans-serif;
        letter-spacing: 0.5px;
      }
      .yt-hud-bar-track {
        width: 100%;
        height: 4px;
        background: rgba(255,255,255,0.2);
        border-radius: 2px;
        overflow: hidden;
      }
      .yt-hud-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #ff0000, #ff4b4b);
        box-shadow: 0 0 8px rgba(255,0,0,0.5);
        border-radius: 2px;
        transition: width 0.08s linear;
      }

      /* ── Brightness HUD (same shape as volume HUD, gold accent) ── */
      .yt-brightness-hud {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        background: rgba(15, 15, 15, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 220, 60, 0.25);
        border-radius: 16px;
        padding: 16px 20px;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        pointer-events: none;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        width: 140px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      }
      .yt-brightness-hud.visible {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      .yt-brightness-hud .yt-hud-icon-container { font-size: 28px; line-height: 1; }
      .yt-brightness-hud .yt-hud-percentage {
        font-size: 14px;
        font-weight: 800;
        font-family: Roboto, Arial, sans-serif;
        letter-spacing: 0.5px;
      }
      .yt-brightness-hud .yt-hud-bar-track {
        width: 100%;
        height: 4px;
        background: rgba(255,255,255,0.2);
        border-radius: 2px;
        overflow: hidden;
      }
      .yt-brightness-hud .yt-hud-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #f5a623, #ffe066);
        box-shadow: 0 0 8px rgba(245,166,35,0.5);
        border-radius: 2px;
        transition: width 0.08s linear;
      }

      /* ── Seek HUD (compact, teal accent) ── */
      .yt-seek-hud {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        background: rgba(15, 15, 15, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 16px;
        padding: 14px 22px;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        pointer-events: none;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        width: 120px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      }
      .yt-seek-hud.visible {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      .yt-seek-hud .yt-hud-icon-container { font-size: 26px; line-height: 1; }
      .yt-seek-hud .yt-hud-percentage {
        font-size: 15px;
        font-weight: 800;
        font-family: Roboto, Arial, sans-serif;
        letter-spacing: 0.5px;
        color: #38bdf8;
      }

      /* ── Seek Step (Skip Interval) Config HUD (Ctrl + wheel) ── */
      .yt-seek-step-hud {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        background: rgba(15, 15, 15, 0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(56, 189, 248, 0.35);
        border-radius: 16px;
        padding: 14px 24px;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        pointer-events: none;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        min-width: 130px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(56, 189, 248, 0.2);
      }
      .yt-seek-step-hud.visible {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      .yt-seek-step-hud .yt-hud-icon-container { font-size: 26px; line-height: 1; }
      .yt-seek-step-hud .yt-hud-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        color: #94a3b8;
      }
      .yt-seek-step-hud .yt-hud-percentage {
        font-size: 18px;
        font-weight: 800;
        font-family: Roboto, Arial, sans-serif;
        letter-spacing: 0.5px;
        color: #38bdf8;
      }

      /* ── Speed badge (top-left corner of video, persistent while speed ≠ 1x) ── */
      .yt-speed-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 20px;
        padding: 4px 10px 4px 8px;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        font-family: Roboto, Arial, sans-serif;
        letter-spacing: 0.3px;
        pointer-events: none;
        z-index: 10001;
        opacity: 0;
        transform: translateY(-4px);
        transition: opacity 0.18s ease, transform 0.18s ease;
        white-space: nowrap;
      }
      .yt-speed-badge.visible {
        opacity: 1;
        transform: translateY(0);
      }
      /* Red glow for overdrive (>8x) */
      .yt-speed-badge.overdrive {
        border-color: rgba(255, 60, 40, 0.6);
        box-shadow: 0 0 10px rgba(255, 60, 40, 0.45);
      }
      .yt-speed-badge .yt-speed-icon { font-size: 13px; }
      .yt-speed-badge .yt-speed-text { font-size: 13px; }
    `;
    document.head.appendChild(style);
  }
  function getSpeakerIcon(vol) {
    if (vol === 0) return "🔇";
    if (vol < 33) return "🔈";
    if (vol < 66) return "🔉";
    return "🔊";
  }
  function prepareHUDContainer(container, video) {
    let target = container;
    if (!target || target.tagName === "VIDEO") {
      target = (target && target.parentElement) || (video && video.parentElement) || document.body;
    }
    if (target && target !== document.body && window.getComputedStyle(target).position === "static") {
      target.style.position = "relative";
    }
    return target;
  }
  function showCustomHUD(container, volume, video) {
    const showHUDAttr = document.documentElement.getAttribute("data-yt-show-hud");
    const showHUDEnabled = showHUDAttr !== "false";
    if (!showHUDEnabled) return;

    const target = prepareHUDContainer(container, video);
    if (!target) return;

    createHUDStyle();

    let hud = target.querySelector(
      ".yt-custom-volume-hud:not(.yt-custom-speed-hud)",
    );
    if (!hud) {
      hud = document.createElement("div");
      hud.className = "yt-custom-volume-hud";

      const iconDiv = document.createElement("div");
      iconDiv.className = "yt-hud-icon-container";
      iconDiv.textContent = "🔊";

      const pctDiv = document.createElement("div");
      pctDiv.className = "yt-hud-percentage";
      pctDiv.textContent = "100%";

      const trackDiv = document.createElement("div");
      trackDiv.className = "yt-hud-bar-track";

      const fillDiv = document.createElement("div");
      fillDiv.className = "yt-hud-bar-fill";
      fillDiv.style.width = "100%";

      trackDiv.appendChild(fillDiv);
      hud.appendChild(iconDiv);
      hud.appendChild(pctDiv);
      hud.appendChild(trackDiv);

      target.appendChild(hud);
    }

    if (target === document.body && video) {
      const rect = video.getBoundingClientRect();
      hud.style.position = "fixed";
      hud.style.top = `${rect.top + rect.height / 2}px`;
      hud.style.left = `${rect.left + rect.width / 2}px`;
      hud.style.transform = "translate(-50%, -50%) scale(1)";
    }

    const iconEl = hud.querySelector(".yt-hud-icon-container");
    const textEl = hud.querySelector(".yt-hud-percentage");
    const fillEl = hud.querySelector(".yt-hud-bar-fill");

    iconEl.textContent = getSpeakerIcon(volume);
    textEl.textContent = `${volume}%`;
    fillEl.style.width = `${volume}%`;

    const speedHud = target.querySelector(".yt-custom-speed-hud");
    if (speedHud) speedHud.classList.remove("visible");

    hud.classList.remove("visible");
    void hud.offsetWidth; // Force reflow
    hud.classList.add("visible");

    if (hudTimeout) clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => {
      hud.classList.remove("visible");
    }, 1000);
  }
  function showSpeedHUD(container, speed, video) {
    const showHUDAttr = document.documentElement.getAttribute("data-yt-show-hud");
    const showHUDEnabled = showHUDAttr !== "false";
    if (!showHUDEnabled || !container) return;

    const target = prepareHUDContainer(container, video);
    if (!target) return;

    createHUDStyle();

    let badge = target.querySelector(".yt-speed-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "yt-speed-badge";

      const iconSpan = document.createElement("span");
      iconSpan.className = "yt-speed-icon";
      iconSpan.textContent = "⚡";

      const textSpan = document.createElement("span");
      textSpan.className = "yt-speed-text";
      textSpan.textContent = "1.00x";

      badge.appendChild(iconSpan);
      badge.appendChild(textSpan);

      target.appendChild(badge);
    }

    if (target === document.body && video) {
      const rect = video.getBoundingClientRect();
      badge.style.position = "fixed";
      badge.style.top = `${rect.top + 14}px`;
      badge.style.left = `${rect.left + 14}px`;
    }

    const iconEl = badge.querySelector(".yt-speed-icon");
    const textEl = badge.querySelector(".yt-speed-text");

    const isOverdrive = speed > 8.0;
    iconEl.textContent = isOverdrive ? "🔥" : "⚡";
    textEl.textContent = `${speed.toFixed(2)}x`;
    badge.classList.toggle("overdrive", isOverdrive);

    badge.classList.remove("visible");
    void badge.offsetWidth;
    badge.classList.add("visible");

    if (speedBadgeTimeout) clearTimeout(speedBadgeTimeout);
    speedBadgeTimeout = setTimeout(
      () => badge.classList.remove("visible"),
      1000,
    );
  }
  function showBrightnessHUD(container, pct, video) {
    const showHUDAttr = document.documentElement.getAttribute("data-yt-show-hud");
    const showHUDEnabled = showHUDAttr !== "false";
    if (!showHUDEnabled) return;

    const target = prepareHUDContainer(container, video);
    if (!target) return;

    createHUDStyle();

    let hud = target.querySelector(".yt-brightness-hud");
    if (!hud) {
      hud = document.createElement("div");
      hud.className = "yt-brightness-hud";

      const iconDiv = document.createElement("div");
      iconDiv.className = "yt-hud-icon-container";
      iconDiv.textContent = "☀️";

      const pctDiv = document.createElement("div");
      pctDiv.className = "yt-hud-percentage";
      pctDiv.textContent = "100%";

      const trackDiv = document.createElement("div");
      trackDiv.className = "yt-hud-bar-track";

      const fillDiv = document.createElement("div");
      fillDiv.className = "yt-hud-bar-fill";
      fillDiv.style.width = "50%";

      trackDiv.appendChild(fillDiv);
      hud.appendChild(iconDiv);
      hud.appendChild(pctDiv);
      hud.appendChild(trackDiv);

      target.appendChild(hud);
    }

    if (target === document.body && video) {
      const rect = video.getBoundingClientRect();
      hud.style.position = "fixed";
      hud.style.top = `${rect.top + rect.height / 2}px`;
      hud.style.left = `${rect.left + rect.width / 2}px`;
      hud.style.transform = "translate(-50%, -50%) scale(1)";
    }

    const textEl = hud.querySelector(".yt-hud-percentage");
    const fillEl = hud.querySelector(".yt-hud-bar-fill");

    textEl.textContent = `${pct}%`;
    fillEl.style.width = `${pct / 2}%`;

    hud.classList.remove("visible");
    void hud.offsetWidth;
    hud.classList.add("visible");

    if (brightnessHudTimeout) clearTimeout(brightnessHudTimeout);
    brightnessHudTimeout = setTimeout(() => {
      hud.classList.remove("visible");
    }, 1000);
  }
  function showSeekHUD(container, seconds, forward, video) {
    const showHUDAttr = document.documentElement.getAttribute("data-yt-show-hud");
    const showHUDEnabled = showHUDAttr !== "false";
    if (!showHUDEnabled || !container) return;

    const target = prepareHUDContainer(container, video);
    if (!target) return;

    createHUDStyle();

    let hud = target.querySelector(".yt-seek-hud");
    if (!hud) {
      hud = document.createElement("div");
      hud.className = "yt-seek-hud";

      const iconDiv = document.createElement("div");
      iconDiv.className = "yt-hud-icon-container";
      iconDiv.textContent = "⏩";

      const pctDiv = document.createElement("div");
      pctDiv.className = "yt-hud-percentage";
      pctDiv.textContent = "+5s";

      hud.appendChild(iconDiv);
      hud.appendChild(pctDiv);

      target.appendChild(hud);
    }

    if (target === document.body && video) {
      const rect = video.getBoundingClientRect();
      hud.style.position = "fixed";
      hud.style.top = `${rect.top + rect.height / 2}px`;
      hud.style.left = `${rect.left + rect.width / 2}px`;
      hud.style.transform = "translate(-50%, -50%) scale(1)";
    }

    const iconEl = hud.querySelector(".yt-hud-icon-container");
    const textEl = hud.querySelector(".yt-hud-percentage");
    iconEl.textContent = forward ? "⏩" : "⏪";
    const secFormatted = Number(seconds).toFixed(Number(seconds) % 1 === 0 ? 0 : 1);
    textEl.textContent = `${forward ? "+" : "-"}${secFormatted}s`;

    hud.classList.remove("visible");
    void hud.offsetWidth;
    hud.classList.add("visible");

    if (seekHudTimeout) clearTimeout(seekHudTimeout);
    seekHudTimeout = setTimeout(() => {
      hud.classList.remove("visible");
    }, 800);
  }
  function calculateNextSkipStep(current, scrollUp) {
    let val = Math.round(Number(current) * 10) / 10;
    if (isNaN(val) || val <= 0) val = 5.0;

    if (scrollUp) {
      if (val < 1.0) {
        val = Math.round((val + 0.1) * 10) / 10;
      } else {
        val = Math.round((val + 0.5) * 10) / 10;
      }
      return Math.min(60.0, Math.max(0.1, val));
    } else {
      if (val <= 1.0) {
        val = Math.round((val - 0.1) * 10) / 10;
      } else {
        val = Math.round((val - 0.5) * 10) / 10;
        if (val < 1.0) {
          val = 1.0;
        }
      }
      return Math.min(60.0, Math.max(0.1, val));
    }
  }
  function showSeekStepHUD(container, seconds, video) {
    const showHUDAttr = document.documentElement.getAttribute("data-yt-show-hud");
    const showHUDEnabled = showHUDAttr !== "false";
    if (!showHUDEnabled || !container) return;

    const target = prepareHUDContainer(container, video);
    if (!target) return;

    createHUDStyle();

    let hud = target.querySelector(".yt-seek-step-hud");
    if (!hud) {
      hud = document.createElement("div");
      hud.className = "yt-seek-step-hud";

      const iconDiv = document.createElement("div");
      iconDiv.className = "yt-hud-icon-container";
      iconDiv.textContent = "⏱️";

      const labelDiv = document.createElement("div");
      labelDiv.className = "yt-hud-label";
      labelDiv.textContent = "Skip Interval";

      const valDiv = document.createElement("div");
      valDiv.className = "yt-hud-percentage";
      valDiv.textContent = "2.5s";

      hud.appendChild(iconDiv);
      hud.appendChild(labelDiv);
      hud.appendChild(valDiv);

      target.appendChild(hud);
    }

    if (target === document.body && video) {
      const rect = video.getBoundingClientRect();
      hud.style.position = "fixed";
      hud.style.top = `${rect.top + rect.height / 2}px`;
      hud.style.left = `${rect.left + rect.width / 2}px`;
      hud.style.transform = "translate(-50%, -50%) scale(1)";
    }

    const valEl = hud.querySelector(".yt-hud-percentage");
    const secFormatted = Number(seconds).toFixed(Number(seconds) % 1 === 0 ? 0 : 1);
    valEl.textContent = `${secFormatted}s`;

    hud.classList.remove("visible");
    void hud.offsetWidth;
    hud.classList.add("visible");

    if (seekStepHudTimeout) clearTimeout(seekStepHudTimeout);
    seekStepHudTimeout = setTimeout(() => {
      hud.classList.remove("visible");
    }, 900);
  }

  // ── [Module: videoFilters.js] ───────────────────────────────
  // ── SVG Tone Filter & Video Color Grading Engine ───────────────────────────
  // Implements Blacks / Whites / Shadows / Highlights tone curve via SVG feComponentTransfer
  // and hardware-accelerated CSS filters (brightness, contrast, saturation, temperature, eye protection).

  const YT_SVG_ID   = "yt-svgf-container";
  const YT_TONE_ID  = "yt-tone";        // referenced by filter: url(#yt-tone)
  const YT_FUNC_IDS = { r: "yt-fR", g: "yt-fG", b: "yt-fB" };
  function injectToneFilterSVG() {
    try {
      if (document.getElementById(YT_SVG_ID)) return;
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.id = YT_SVG_ID;
      svg.setAttribute("width", "0");
      svg.setAttribute("height", "0");
      svg.setAttribute("aria-hidden", "true");
      try {
        svg.style.position = "absolute";
        svg.style.width = "0px";
        svg.style.height = "0px";
        svg.style.overflow = "hidden";
        svg.style.pointerEvents = "none";
        svg.style.opacity = "0";
      } catch (_) {}

    const defs = document.createElementNS(svgNS, "defs");
    const filter = document.createElementNS(svgNS, "filter");
    filter.id = YT_TONE_ID;
    filter.setAttribute("color-interpolation-filters", "linearRGB");
    filter.setAttribute("x", "0");
    filter.setAttribute("y", "0");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "100%");

    const transfer = document.createElementNS(svgNS, "feComponentTransfer");

    const funcR = document.createElementNS(svgNS, "feFuncR");
    funcR.id = YT_FUNC_IDS.r;
    funcR.setAttribute("type", "table");
    funcR.setAttribute("tableValues", "0 0.25 0.5 0.75 1");

    const funcG = document.createElementNS(svgNS, "feFuncG");
    funcG.id = YT_FUNC_IDS.g;
    funcG.setAttribute("type", "table");
    funcG.setAttribute("tableValues", "0 0.25 0.5 0.75 1");

    const funcB = document.createElementNS(svgNS, "feFuncB");
    funcB.id = YT_FUNC_IDS.b;
    funcB.setAttribute("type", "table");
    funcB.setAttribute("tableValues", "0 0.25 0.5 0.75 1");

    transfer.appendChild(funcR);
    transfer.appendChild(funcG);
    transfer.appendChild(funcB);
    filter.appendChild(transfer);
    defs.appendChild(filter);
    svg.appendChild(defs);

    document.documentElement.appendChild(svg);
    } catch (_) {}
  }
  function computeToneTableValues(blacks, whites, shadows, highlights) {
    // 5-point piecewise-linear tone curve mapped to [0,1] output range.
    // blacks    : 0–100  (0=no lift, 100=lift shadows floor by +0.10)
    // whites    : 50–100 (100=full range, 50=highlights pulled to 0.50)
    // shadows   : -100–0–100 (negative=darker, positive=brighter at 25% input)
    // highlights: -100–0–100 (negative=recover/dim, positive=boost at 75% input)
    const p0 = Math.max(0, Math.min(1, blacks * 0.001));
    const p1 = Math.max(0, Math.min(1, 0.25 + shadows * 0.0006));
    const p2 = 0.5;
    const p3 = Math.max(0, Math.min(1, 0.75 + highlights * 0.0006));
    const p4 = Math.max(0, Math.min(1, whites / 100));
    return `${p0.toFixed(4)} ${p1.toFixed(4)} ${p2} ${p3.toFixed(4)} ${p4.toFixed(4)}`;
  }
  function updateToneFilter() {
    const blacks     = parseFloat(document.documentElement.getAttribute("data-yt-filter-blacks")     || "0");
    const whites     = parseFloat(document.documentElement.getAttribute("data-yt-filter-whites")     || "100");
    const shadows    = parseFloat(document.documentElement.getAttribute("data-yt-filter-shadows")    || "0");
    const highlights = parseFloat(document.documentElement.getAttribute("data-yt-filter-highlights") || "0");

    const isNeutral = blacks === 0 && whites === 100 && shadows === 0 && highlights === 0;
    if (isNeutral) return; // skip SVG update — url(#yt-tone) won't be in the filter string

    injectToneFilterSVG(); // idempotent

    const tv = computeToneTableValues(blacks, whites, shadows, highlights);
    for (const id of Object.values(YT_FUNC_IDS)) {
      const el = document.getElementById(id);
      if (el) el.setAttribute("tableValues", tv);
    }
  }
  function buildVideoFilter(video) {
    const brightness   = Number(video.dataset.ytBrightness   ?? 100);
    const contrast     = parseFloat(document.documentElement.getAttribute("data-yt-filter-contrast")       || "100");
    const saturation   = parseFloat(document.documentElement.getAttribute("data-yt-filter-saturation")     || "100");
    const temperature  = parseFloat(document.documentElement.getAttribute("data-yt-filter-temperature")    || "0");
    const eyeProt      = parseFloat(document.documentElement.getAttribute("data-yt-filter-eye-protection") || "0");
    const blacks       = parseFloat(document.documentElement.getAttribute("data-yt-filter-blacks")         || "0");
    const whites       = parseFloat(document.documentElement.getAttribute("data-yt-filter-whites")         || "100");
    const shadows      = parseFloat(document.documentElement.getAttribute("data-yt-filter-shadows")        || "0");
    const highlights   = parseFloat(document.documentElement.getAttribute("data-yt-filter-highlights")     || "0");

    const hasTone = blacks !== 0 || whites !== 100 || shadows !== 0 || highlights !== 0;

    const parts = [];
    // Tone filter must come FIRST so it operates on original pixel values
    if (hasTone)          parts.push(`url(#${YT_TONE_ID})`);
    if (brightness !== 100) parts.push(`brightness(${brightness}%)`);
    if (contrast   !== 100) parts.push(`contrast(${contrast}%)`);
    if (saturation !== 100) parts.push(`saturate(${saturation}%)`);
    if (temperature !== 0 ) parts.push(`hue-rotate(${temperature}deg)`);
    if (eyeProt    !== 0  ) parts.push(`sepia(${eyeProt}%)`);
    return parts.join(" ");
  }
  function getVideoBrightness(video) {
    const stored = video.dataset.ytBrightness;
    return stored !== undefined ? Number(stored) : 100;
  }
  function setVideoBrightness(video, pct) {
    const clamped = Math.max(0, Math.min(200, pct));
    video.dataset.ytBrightness = String(clamped);
    video.style.filter = buildVideoFilter(video);
    return clamped;
  }
  function applyAllVideoFilters() {
    for (const video of document.querySelectorAll("video")) {
      video.style.filter = buildVideoFilter(video);
    }
  }
  function initVideoFilters() {
    // Watch for panel filter attribute changes and reapply to all videos immediately
    const filterObserver = new MutationObserver(() => {
      updateToneFilter();
      applyAllVideoFilters();
    });
    filterObserver.observe(document.documentElement, { attributes: true, attributeFilter: [
      "data-yt-filter-contrast",
      "data-yt-filter-saturation",
      "data-yt-filter-temperature",
      "data-yt-filter-eye-protection",
      "data-yt-filter-blacks",
      "data-yt-filter-whites",
      "data-yt-filter-shadows",
      "data-yt-filter-highlights",
    ]});
  }

  // ── [Module: playerAdapter.js] ───────────────────────────────
  // ── HTML5 Video Player Adapter & Geometry Recognition ──────────────────────
  // Provides unified volume/speed API abstraction and robust cursor-player hit testing
  // across YouTube, Hotstar, and any universal HTML5 video website.

  let activePlayer = null;
  function setActivePlayer(player) {
    activePlayer = player;
  }
  function getActivePlayer() {
    if (activePlayer && document.body.contains(activePlayer)) {
      return activePlayer;
    }
    // Fallback: Find the first video element on the page
    const video = document.querySelector("video");
    if (video) {
      const ytPlayer = video.closest(".html5-video-player");
      return ytPlayer || video;
    }
    return null;
  }
  function isTyping() {
    const active = document.activeElement;
    if (!active) return false;
    return (
      active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.isContentEditable
    );
  }
  function getPlayerInfo(playerOrVideo) {
    if (!playerOrVideo) return null;

    // If it's a YouTube player wrapper
    if (
      playerOrVideo.classList &&
      playerOrVideo.classList.contains("html5-video-player")
    ) {
      const video = playerOrVideo.querySelector("video");
      return {
        getVolume: () => playerOrVideo.getVolume(),
        setVolume: (v) => {
          playerOrVideo.setVolume(v);
          if (playerOrVideo.isMuted() && v > 0) playerOrVideo.unMute();
        },
        isMuted: () => playerOrVideo.isMuted(),
        setMuted: (m) => {
          if (m) playerOrVideo.mute();
          else playerOrVideo.unMute();
        },
        getSpeed: () => {
          if (video) return video.playbackRate;
          return playerOrVideo.getPlaybackRate() || 1.0;
        },
        setSpeed: (s) => {
          // Clamp to browser's hard limit of 16.0 to prevent NotSupportedError in Chromium
          const clampedSpeed = Math.min(16.0, Math.max(0.0625, s));
          if (video) {
            try {
              video.playbackRate = clampedSpeed;
            } catch (err) {
              console.warn("Failed to set video.playbackRate:", err);
            }
          }
          if (typeof playerOrVideo.setPlaybackRate === "function") {
            try {
              playerOrVideo.setPlaybackRate(clampedSpeed);
            } catch (err) {}
          }
        },
        container: playerOrVideo,
      };
    }

    // If it's a standard video element or an ancestor container
    const video =
      playerOrVideo.tagName === "VIDEO"
        ? playerOrVideo
        : playerOrVideo.querySelector("video");
    if (video) {
      const container = (playerOrVideo.tagName === "VIDEO" && playerOrVideo.parentElement) ? playerOrVideo.parentElement : playerOrVideo;
      return {
        getVolume: () => Math.round(video.volume * 100),
        setVolume: (v) => {
          video.volume = Math.max(0, Math.min(1, v / 100));
          if (video.muted && v > 0) video.muted = false;
        },
        isMuted: () => video.muted,
        setMuted: (m) => {
          video.muted = m;
        },
        getSpeed: () => video.playbackRate,
        setSpeed: (s) => {
          // Clamp to browser's hard limit of 16.0 to prevent NotSupportedError in Chromium
          const clampedSpeed = Math.min(16.0, Math.max(0.0625, s));
          try {
            video.playbackRate = clampedSpeed;
          } catch (err) {
            console.warn("Failed to set video.playbackRate:", err);
          }
        },
        container: container,
      };
    }
    return null;
  }
  function applyStartupVolume(playerOrVideo) {
    const startupEnabled =
      document.documentElement.getAttribute(
        "data-yt-startup-volume-enabled",
      ) === "true";
    if (!startupEnabled) return;

    const startupVolumeAttr = document.documentElement.getAttribute(
      "data-yt-startup-volume",
    );
    const startupVolume = parseInt(startupVolumeAttr || "30", 10);

    const info = getPlayerInfo(playerOrVideo);
    if (info) {
      info.setVolume(startupVolume);
      if (info.isMuted() && startupVolume > 0) {
        info.setMuted(false);
      }
    }
  }
  function findVideoPlayerAtCursor(e) {
    const cx = e.clientX;
    const cy = e.clientY;
    const isYouTube =
      window.location.hostname.includes("youtube.com") ||
      window.location.hostname.includes("youtube-nocookie.com");

    const minW = isYouTube ? 320 : 120;
    const minH = isYouTube ? 180 : 80;

    for (const video of document.querySelectorAll("video")) {
      const rect = video.getBoundingClientRect();

      // Guard 1 — skip invisible / zero-size videos (preloaded, hidden, etc.)
      if (rect.width < 10 || rect.height < 10) continue;

      // Guard 2 — skip feed thumbnail preview videos (too small to be a real player)
      if (rect.width < minW || rect.height < minH)
        continue;

      // Guard 3 — on YouTube, only activate for the dedicated player wrapper.
      // Feed preview <video> elements are NOT inside .html5-video-player.
      const ytPlayer = video.closest(".html5-video-player");
      if (isYouTube && !ytPlayer) continue;

      // Guard 4 — cursor must be within the video's rendered area or container.
      const container = ytPlayer || (video.parentElement && video.parentElement !== document.body ? video.parentElement : video);
      const cRect = container ? container.getBoundingClientRect() : rect;

      const inVideo = (
        cx >= rect.left &&
        cx <= rect.right &&
        cy >= rect.top &&
        cy <= rect.bottom + 70
      );
      const inContainer = container && (
        cRect.width <= Math.max(window.innerWidth * 0.95, rect.width * 2) &&
        cRect.height <= Math.max(window.innerHeight * 0.95, rect.height + 150) &&
        cx >= cRect.left &&
        cx <= cRect.right &&
        cy >= cRect.top &&
        cy <= cRect.bottom
      );

      if (inVideo || inContainer) {
        return { video, container };
      }
    }

    return null;
  }

  // ── [Module: videoControls.js] ───────────────────────────────
  // ── Universal Wheel, Zone Gestures & Hotkey Controller ─────────────────────
  // Handles mouse wheel scrolling across interactive zones (volume, brightness, speed, seek),
  // Ctrl+Wheel skip step tuning, hotkey speed boosts, and middle-click mute toggles.



  let originalSpeed = null;
  let isBoosting = false;
  let isAdjustingVolume = false;
  function getZoneAction(videoRect, cursorX, cursorY) {
    const third = videoRect.width / 3;
    const relX = cursorX - videoRect.left;

    // Left zone
    if (relX < third)
      return document.documentElement.getAttribute("data-yt-zone-left") || "brightness";

    // Middle zone
    if (relX < third * 2)
      return document.documentElement.getAttribute("data-yt-zone-middle") || "volume";

    // Right zone — split top/bottom
    const midY = videoRect.top + videoRect.height / 2;
    return cursorY < midY ? "speed" : "seek";
  }
  function initVideoControls() {
    // Monitor mouse movements to identify the hovered player container
    document.addEventListener(
      "mousemove",
      (e) => {
        let container = e.target;
        let video = null;
        while (container && container !== document.body) {
          if (
            container.classList &&
            container.classList.contains("html5-video-player")
          ) {
            video = container.querySelector("video");
            break;
          }
          video = container.querySelector("video");
          if (video) break;
          container = container.parentElement;
        }
        if (video) {
          const active =
            container &&
            container.classList &&
            container.classList.contains("html5-video-player")
              ? container
              : video;
          setActivePlayer(active);
        }
      },
      { passive: true },
    );

    // Keyboard events listener for speed control shortcuts
    window.addEventListener(
      "keydown",
      function (e) {
        if (isTyping()) return;

        const active =
          document.documentElement.getAttribute("data-yt-active") === "true";
        if (!active) return;

        const player = getActivePlayer();
        if (!player) return;

        const info = getPlayerInfo(player);
        if (!info) return;

        const speedSensitivityAttr = document.documentElement.getAttribute(
          "data-yt-speed-sensitivity",
        );
        const sensitivity = parseFloat(speedSensitivityAttr || "0.25");
        const allowOverdrive =
          document.documentElement.getAttribute("data-yt-allow-overdrive") ===
          "true";

        const holdEnabled =
          document.documentElement.getAttribute("data-yt-hotkey-hold-2x") ===
          "true";
        const holdKey = (
          document.documentElement.getAttribute("data-yt-hold-key") || "s"
        ).toLowerCase();
        const holdMultiplier = parseFloat(
          document.documentElement.getAttribute("data-yt-hold-speed-mult") ||
            "2.0",
        );

        // 1. Plus (+), Equal (=), or Shift + Right Arrow (Speed Up)
        if (
          (e.key === "+" ||
            e.key === "=" ||
            (e.shiftKey && e.key === "ArrowRight")) &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          e.preventDefault();
          e.stopPropagation();
          const currentSpeed = info.getSpeed();
          const maxLimit = allowOverdrive ? 16.0 : 2.0;
          const nextSpeed = Math.min(maxLimit, currentSpeed + sensitivity);
          info.setSpeed(nextSpeed);
          showSpeedHUD(info.container, nextSpeed);
        }
        // 2. Minus (-), Underscore (_), or Shift + Left Arrow (Speed Down)
        else if (
          (e.key === "-" ||
            e.key === "_" ||
            (e.shiftKey && e.key === "ArrowLeft")) &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          e.preventDefault();
          e.stopPropagation();
          const currentSpeed = info.getSpeed();
          const nextSpeed = Math.max(0.25, currentSpeed - sensitivity);
          info.setSpeed(nextSpeed);
          showSpeedHUD(info.container, nextSpeed);
        }
        // 3. Asterisk (*) or Shift + R (Reset Speed)
        else if (
          (e.key === "*" || (e.shiftKey && e.key.toLowerCase() === "r")) &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          e.preventDefault();
          e.stopPropagation();
          info.setSpeed(1.0);
          showSpeedHUD(info.container, 1.0);
        }
        // 4. Hold Boost Action (Keydown)
        else if (
          holdEnabled &&
          e.key.toLowerCase() === holdKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          e.preventDefault();
          e.stopPropagation();
          if (!isBoosting) {
            isBoosting = true;
            originalSpeed = info.getSpeed();
            const maxLimit = allowOverdrive ? 16.0 : 2.0;
            const targetSpeed = Math.min(maxLimit, holdMultiplier);
            info.setSpeed(targetSpeed);
            showSpeedHUD(info.container, targetSpeed);
          }
        }
      },
      true,
    );

    window.addEventListener(
      "keyup",
      function (e) {
        if (isTyping()) return;

        const holdEnabled =
          document.documentElement.getAttribute("data-yt-hotkey-hold-2x") ===
          "true";
        const holdKey = (
          document.documentElement.getAttribute("data-yt-hold-key") || "s"
        ).toLowerCase();

        if (holdEnabled && e.key.toLowerCase() === holdKey) {
          e.preventDefault();
          e.stopPropagation();
          if (isBoosting) {
            const player = getActivePlayer();
            if (player) {
              const info = getPlayerInfo(player);
              if (info && originalSpeed !== null) {
                info.setSpeed(originalSpeed);
                showSpeedHUD(info.container, originalSpeed);
              }
            }
            isBoosting = false;
            originalSpeed = null;
          }
        }
      },
      true,
    );

    // Intercept playing elements to apply startup volume once per video ID
    document.addEventListener(
      "play",
      function (e) {
        if (e.target && e.target.tagName === "VIDEO") {
          let container = e.target;
          let foundPlayer = e.target;
          while (container && container !== document.body) {
            if (
              container.classList &&
              container.classList.contains("html5-video-player")
            ) {
              foundPlayer = container;
              break;
            }
            container = container.parentElement;
          }

          const currentVideoId =
            new URLSearchParams(window.location.search).get("v") ||
            window.location.pathname + window.location.search;
          if (foundPlayer.dataset.lastStartupVideoId !== currentVideoId) {
            foundPlayer.dataset.lastStartupVideoId = currentVideoId;
            applyStartupVolume(foundPlayer);
          }
          // Re-apply all CSS filters (brightness, contrast, etc.) on each play
          applyAllVideoFilters();
        }
      },
      { capture: true, passive: true },
    );

    // Globally intercept volume changes to enforce the maximum cap limit
    document.addEventListener(
      "volumechange",
      function (e) {
        if (isAdjustingVolume) return;

        const active =
          document.documentElement.getAttribute("data-yt-active") === "true";
        const volumeControlEnabled =
          document.documentElement.getAttribute("data-yt-volume-control") ===
          "true";
        if (!active || !volumeControlEnabled) return;

        if (e.target && e.target.tagName === "VIDEO") {
          let container = e.target;
          let foundPlayer = e.target;
          while (container && container !== document.body) {
            if (
              container.classList &&
              container.classList.contains("html5-video-player")
            ) {
              foundPlayer = container;
              break;
            }
            container = container.parentElement;
          }

          const info = getPlayerInfo(foundPlayer);
          if (info) {
            const maxVolumeAttr =
              document.documentElement.getAttribute("data-yt-max-volume");
            const maxVolume = parseInt(maxVolumeAttr || "100", 10);
            const currentVolume = info.getVolume();

            if (currentVolume > maxVolume) {
              isAdjustingVolume = true;
              info.setVolume(maxVolume);
              isAdjustingVolume = false;
              showCustomHUD(info.container, maxVolume);
            }
          }
        }
      },
      { capture: true, passive: true },
    );

    // Zone-aware mouse wheel handler
    window.addEventListener(
      "wheel",
      function (e) {
        const activeAttr = document.documentElement.getAttribute("data-yt-active");
        if (activeAttr === "false") return;

        const zonesAttr = document.documentElement.getAttribute("data-yt-zones-enabled");
        const zonesEnabled = zonesAttr !== "false";

        const volumeAttr = document.documentElement.getAttribute("data-yt-volume-control");
        const volumeControlEnabled = volumeAttr !== "false";

        // Neither feature is on — let page scroll
        if (!zonesEnabled && !volumeControlEnabled) return;

        // Detect if cursor is over any HTML5 video player
        const found = findVideoPlayerAtCursor(e);
        if (!found) return;

        // Consume the scroll event — we handle it
        e.preventDefault();
        e.stopPropagation();

        const info = getPlayerInfo(found.container || found.video);
        if (!info) return;

        const scrollUp = e.deltaY < 0;

        // ── Ctrl + Mouse Wheel: Adjust Skipping Time (0.5s step, 0.1s when <= 1s) ──
        if (e.ctrlKey) {
          const currentStep = parseFloat(
            document.documentElement.getAttribute("data-yt-seek-step") || "5"
          );
          const nextStep = calculateNextSkipStep(currentStep, scrollUp);
          document.documentElement.setAttribute("data-yt-seek-step", String(nextStep));
          window.dispatchEvent(
            new CustomEvent("YT_UPDATE_SEEK_STEP", { detail: { step: nextStep } })
          );
          showSeekStepHUD(info.container, nextStep, found.video);
          return;
        }

        // ── Zone mode ────────────────────────────────────────────────────────────
        if (zonesEnabled) {
          const videoRect = found.video.getBoundingClientRect();
          const action = getZoneAction(videoRect, e.clientX, e.clientY);

          if (action === "volume") {
            if (!volumeControlEnabled) return;
            const step = parseInt(document.documentElement.getAttribute("data-yt-volume-step") || "5", 10);
            const maxVolume = parseInt(document.documentElement.getAttribute("data-yt-max-volume") || "100", 10);
            const current = info.getVolume();
            const next = scrollUp
              ? Math.min(maxVolume, current + step)
              : Math.max(0, current - step);
            if (next !== current) {
              info.setVolume(next);
              showCustomHUD(info.container, next, found.video);
            }

          } else if (action === "speed") {
            const sensitivity = parseFloat(
              document.documentElement.getAttribute("data-yt-speed-sensitivity") || "0.25"
            );
            const allowOverdrive =
              document.documentElement.getAttribute("data-yt-allow-overdrive") === "true";
            const maxLimit = allowOverdrive ? 16.0 : 2.0;
            const current = info.getSpeed();
            const next = scrollUp
              ? Math.min(maxLimit, current + sensitivity)
              : Math.max(0.25, current - sensitivity);
            info.setSpeed(next);
            showSpeedHUD(info.container, next, found.video);

          } else if (action === "brightness") {
            const step = parseInt(
              document.documentElement.getAttribute("data-yt-brightness-step") || "5", 10
            );
            const current = getVideoBrightness(found.video);
            const next = setVideoBrightness(
              found.video,
              scrollUp ? current + step : current - step
            );
            showBrightnessHUD(info.container, next, found.video);

          } else if (action === "seek") {
            const seekStep = parseFloat(
              document.documentElement.getAttribute("data-yt-seek-step") || "5"
            );
            const video = found.video;
            if (video && isFinite(video.duration) && video.duration > 0) {
              video.currentTime = Math.max(
                0,
                Math.min(video.duration, video.currentTime + (scrollUp ? seekStep : -seekStep))
              );
              showSeekHUD(info.container, seekStep, scrollUp, found.video);
            }
          }
          return;
        }

        // ── Legacy mode (zones disabled, volumeControl enabled) ──────────────────
        if (!volumeControlEnabled) return;
        const step = parseInt(document.documentElement.getAttribute("data-yt-volume-step") || "5", 10);
        const maxVolume = parseInt(document.documentElement.getAttribute("data-yt-max-volume") || "100", 10);
        const current = info.getVolume();
        const next = scrollUp
          ? Math.min(maxVolume, current + step)
          : Math.max(0, current - step);
        if (next !== current) {
          info.setVolume(next);
          showCustomHUD(info.container, next, found.video);
        }
      },
      { passive: false, capture: true },
    );

    // Bind left click on Speed zone to reset playback speed to normal (1.0x) without toggling play/pause
    window.addEventListener(
      "click",
      function (e) {
        if (e.button !== 0) return; // Primary (left) click only

        const activeAttr = document.documentElement.getAttribute("data-yt-active");
        if (activeAttr === "false") return;

        const zonesAttr = document.documentElement.getAttribute("data-yt-zones-enabled");
        const zonesEnabled = zonesAttr !== "false";
        if (!zonesEnabled) return;

        // Skip clicks on interactive buttons, links, or form controls
        if (
          e.target &&
          e.target.closest(
            "button, a, .ytp-button, .ytp-chrome-top-buttons, .ytp-title-link, input, select, textarea"
          )
        ) {
          return;
        }

        const found = findVideoPlayerAtCursor(e);
        if (!found) return;

        const videoRect = found.video.getBoundingClientRect();
        const action = getZoneAction(videoRect, e.clientX, e.clientY);

        if (action === "speed") {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const info = getPlayerInfo(found.container || found.video);
          if (info) {
            info.setSpeed(1.0);
            showSpeedHUD(info.container, 1.0, found.video);
          }
        }
      },
      { capture: true }
    );

    // Bind middle mouse click to toggle mute directly
    window.addEventListener(
      "auxclick",
      function (e) {
        if (e.button !== 1) return; // Middle click only

        const activeAttr = document.documentElement.getAttribute("data-yt-active");
        if (activeAttr === "false") return;

        const volumeAttr = document.documentElement.getAttribute("data-yt-volume-control");
        const volumeControlEnabled = volumeAttr !== "false";
        if (!volumeControlEnabled) return;

        const found = findVideoPlayerAtCursor(e);
        if (!found) return;

        e.preventDefault();
        e.stopPropagation();

        const info = getPlayerInfo(found.container || found.video);
        if (info) {
          const isMuted = info.isMuted();
          if (isMuted) {
            info.setMuted(false);
            const maxVolumeAttr =
              document.documentElement.getAttribute("data-yt-max-volume");
            const maxVolume = parseInt(maxVolumeAttr || "100", 10);
            const targetVol = Math.min(maxVolume, info.getVolume() || 50);
            info.setVolume(targetVol);
            showCustomHUD(info.container, targetVol, found.video);
          } else {
            info.setMuted(true);
            showCustomHUD(info.container, 0, found.video);
          }
        }
      },
      { capture: true },
    );

    // Prevent scroll click default context trigger on middle click over player
    window.addEventListener(
      "mousedown",
      function (e) {
        if (e.button !== 1) return;
        const activeAttr = document.documentElement.getAttribute("data-yt-active");
        if (activeAttr === "false") return;

        const volumeAttr = document.documentElement.getAttribute("data-yt-volume-control");
        const volumeControlEnabled = volumeAttr !== "false";
        if (!volumeControlEnabled) return;

        const found = findVideoPlayerAtCursor(e);
        if (found) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { capture: true },
    );
  }

  // ── Modular Engine Execution Bootstrap ────────────────────────────────
  const host = typeof window !== "undefined" && window.location && window.location.hostname ? window.location.hostname.toLowerCase() : "";
  const EXCLUDED_HOSTS = ["claude.ai", "anthropic.com", "chatgpt.com", "openai.com", "instagram.com"];
  if (EXCLUDED_HOSTS.some((h) => host.includes(h))) return;

  initYouTubeAdShield();
  initHotstarAdShield();
  initVideoFilters();
  initVideoControls();
})();
