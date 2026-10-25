// Omni Extension — AdShield / AdBlock Content Script Engine
// Handles CSS element hiding, YouTube anti-adblock mitigation, notification spam suppression,
// and cookie banner neutralization.

(function () {
  const isExtension = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
  if (!isExtension) return;

  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, "");

  // ── 1. Prototype Silencer for Push Notification Requests ────────────────────
  function silencePushNotifications() {
    try {
      if (window.Notification && typeof window.Notification.requestPermission === "function") {
        window.Notification.requestPermission = async function () {
          return "denied";
        };
      }
    } catch (_) {}
  }

  // ── 2. Element-Hiding CSS Rule Registry ──────────────────────────────────────
  const CORE_AD_SELECTORS = [
    // Standard Google Ads, GPT & DFP
    ".adsbygoogle",
    "[id^='google_ads_']",
    "[id^='div-gpt-ad']",
    "[data-ad-client]",
    "[data-ad-slot]",
    "[data-ad-unit]",
    "[data-ad-channel]",
    "[data-ad-zone]",
    ".dfp-ad",
    // Generic Ad & Banner Containers
    ".ad-banner",
    ".ad-container",
    ".ad-wrapper",
    ".ad-placement",
    ".advertisement",
    ".advert",
    ".sponsored-post",
    ".sponsored-content",
    ".sponsor-badge",
    "[aria-label*='advertisement' i]",
    "[aria-label*='sponsored' i]",
    // Outstream Video Ads & Floating Corner Video Units
    ".primis_container",
    "#primis_player",
    "div[id*='primis' i]",
    "div[class*='primis' i]",
    "div[id*='connatix' i]",
    "div[class*='cnx-' i]",
    "div[class*='connatix' i]",
    "div[id*='aniview' i]",
    "div[class*='aniview' i]",
    "div[id^='av-player']",
    ".playwire-video",
    "div[id*='playwire' i]",
    "div[class*='playwire' i]",
    ".teads-inread",
    "div[id*='teads' i]",
    "div[class*='teads' i]",
    "div[class*='brid-' i]",
    "div[id*='brid-' i]",
    "div[id*='vdo_container' i]",
    "div[class*='vdo_container' i]",
    "div[id*='vdo-ai' i]",
    "div[class*='floating-video-ad' i]",
    "div[class*='sticky-video-ad' i]",
    "div[class*='corner-video-ad' i]",
    "div[data-ad-type='video' i]",
    // Popup Ads, Popunder Overlays & Interstitial Dialogs
    "div[class*='interstitial' i]",
    "div[id*='interstitial' i]",
    "div[class*='popup-ad' i]",
    "div[id*='popup-ad' i]",
    "div[class*='popunder' i]",
    "div[id*='popunder' i]",
    "div[class*='overlay-ad' i]",
    "div[id*='overlay-ad' i]",
    "div[class*='modal-ad' i]",
    "div[id*='modal-ad' i]",
    "div[id*='lightbox-ad' i]",
    "div[class*='lightbox-ad' i]",
    "div[class*='ad-modal' i]",
    "div[id*='ad-modal' i]",
    "[data-ad-type='interstitial' i]",
    "[data-ad-type='popup' i]",
    // Sticky Floating Ad Banners & Anchors
    "div[class*='sticky-ad' i]",
    "div[id*='sticky-ad' i]",
    "div[class*='bottom-ad' i]",
    "div[id*='bottom-ad' i]",
    "div[class*='footer-ad' i]",
    "div[id*='footer-ad' i]",
    "div[class*='floating-ad' i]",
    "div[id*='floating-ad' i]",
    "div[class*='anchor-ad' i]",
    "div[id*='anchor-ad' i]",
    // Native & Content Recommendation Widgets
    ".taboola-ad",
    ".outbrain-ad",
    ".revcontent-ad",
    "div[id*='taboola-' i]",
    "div[class*='taboola-' i]",
    "div[id*='outbrain_' i]",
    "div[class*='OUTBRAIN' i]",
    "div[class*='mgid' i]",
    "div[id*='mgid' i]",
    // Major Ad Network Iframes
    "iframe[src*='doubleclick.net' i]",
    "iframe[src*='adservice.google' i]",
    "iframe[src*='googlesyndication.com' i]",
    "iframe[src*='adnxs.com' i]",
    "iframe[src*='openx.net' i]",
    "iframe[src*='rubiconproject.com' i]",
    "iframe[src*='criteo.com' i]",
    "iframe[src*='popads.net' i]",
    "iframe[src*='propellerads.com' i]",
    "iframe[src*='adsterra.com' i]",
    "iframe[src*='exoclick.com' i]",
    // YouTube Specific Ad Overlays, Progress Markers & Slots
    "ytd-ad-slot-renderer",
    "ytd-in-feed-ad-layout-renderer",
    "ytd-player-legacy-desktop-watch-ads-renderer",
    "ytd-banner-promo-renderer",
    "#player-ads",
    ".video-ads",
    ".ytp-ad-module",
    ".ytp-ad-player-overlay",
    ".ytp-ad-player-overlay-layout",
    ".ytp-ad-overlay-container",
    ".ytp-ad-message-container",
    ".ytp-ad-text",
    ".ytp-ad-preview-container",
    ".ytp-ad-progress-list",
    "ytd-statement-banner-renderer",
    "ytd-enforcement-message-view-model",
    "tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)",
    "ytd-popup-container:has(ytd-enforcement-message-view-model)",
    "#masthead-ad",
    "ytd-rich-item-renderer:has(> ytd-ad-slot-renderer)",
    "ytd-promoted-video-renderer",
    "ytd-display-ad-renderer",
    "ytd-action-companion-ad-renderer",
    // Hotstar Ad Containers, Overlays & Badges
    "div[data-testid^='ad-media']",
    "[data-testid='ad-countdown']",
    "[data-testid='ad-badge']",
    "div[class*='ad_overlay']",
    "div[class*='adMarker']",
    "div[class*='adContainer']",
    ".shaka-ad-container",
    "[data-testid='ad-container']"
  ];

  const COOKIE_BANNER_SELECTORS = [
    "#onetrust-consent-sdk",
    "#onetrust-banner-sdk",
    ".qc-cmp2-container",
    ".cookie-notice-container",
    ".cookie-banner",
    ".cookie-consent",
    "#cookieConsent",
    "[id*='cookie-law']",
    "[class*='cookie-dialog']"
  ];

  let styleTag = null;
  let blockedCountSession = 0;

  // Listen for popup block events from the MAIN world shield
  window.addEventListener("message", (event) => {
    if (!event.data) return;

    if (event.data.type === "OMNI_ADBLOCK_POPUP_BLOCKED") {
      blockedCountSession++;
      if (isContextValid() && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: "ADBLOCK_INCREMENT_COUNT",
          count: 1,
          domain: hostname,
        }).catch(() => {});
      }
    }

    if (event.data.type === "OMNI_ADBLOCK_POPUP_ATTEMPT") {
      if (isContextValid() && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: "ADBLOCK_POPUP_ATTEMPT",
          domain: hostname,
        }).catch(() => {});
      }
    }
  });

  function injectHidingStyles(customCss = "", enableCookieBanners = true) {
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "omni-adshield-styles";
      (document.head || document.documentElement).appendChild(styleTag);
    }

    const selectors = [...CORE_AD_SELECTORS];
    if (enableCookieBanners) {
      selectors.push(...COOKIE_BANNER_SELECTORS);
    }

    const hideRule = `${selectors.join(", ")} {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      overflow: hidden !important;
    }
    html:has(ytd-enforcement-message-view-model) tp-yt-iron-overlay-backdrop,
    body:has(ytd-enforcement-message-view-model) tp-yt-iron-overlay-backdrop {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    html:has(ytd-enforcement-message-view-model),
    body:has(ytd-enforcement-message-view-model) {
      overflow: auto !important;
      position: static !important;
    }`;

    styleTag.textContent = `${hideRule}\n${customCss}`;
  }

  function removeHidingStyles() {
    if (styleTag) {
      styleTag.remove();
      styleTag = null;
    }
  }

  // ── 3. YouTube Anti-Adblock Defuser & Video Recovery ────────────────────────
  let ytAdActive = false;
  let ytSavedRate = 1.0;
  let ytSavedMuted = false;

  function runYouTubeShield() {
    if (!hostname.includes("youtube.com")) return;

    // A. Intercept & Completely Eradicate Enforcement Wall, Dialogs, & Dark Backdrops
    const enforcement = document.querySelector("ytd-enforcement-message-view-model");
    const enforcementDialog = document.querySelector(
      "tp-yt-paper-dialog:has(ytd-enforcement-message-view-model), ytd-popup-container:has(ytd-enforcement-message-view-model)"
    );

    if (enforcement || enforcementDialog) {
      if (enforcement) enforcement.remove();
      if (enforcementDialog) enforcementDialog.remove();

      // Eliminate dark backdrop covering the page
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

      // Resume video playback via both YouTube Player API and HTML5 video element
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

    // B. Safe Non-Destructive Ad Skip & Auto-Recovery (Never stall video buffer)
    const adContainer = document.querySelector(".ad-showing, .ad-interrupting");
    const video = document.querySelector("video");

    if (adContainer && video) {
      if (!ytAdActive) {
        ytSavedRate = video.playbackRate || 1.0;
        ytSavedMuted = video.muted;
        ytAdActive = true;
      }

      video.muted = true;
      video.playbackRate = 16.0;
      if (isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.max(0, video.duration - 0.05);
      }

      const skipBtn = document.querySelector(
        ".ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button, button.ytp-ad-skip-button-text, .ytp-ad-skip-button-container button"
      );
      if (skipBtn) {
        try { skipBtn.click(); } catch (_) {}
      }
    } else if (ytAdActive && video) {
      // Ad finished — restore normal playback speed and unmute
      ytAdActive = false;
      video.playbackRate = ytSavedRate <= 2.0 ? ytSavedRate : 1.0;
      video.muted = ytSavedMuted;
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
      // Periodic sweep for stray skip buttons
      const skipBtn = document.querySelector(
        ".ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button, button.ytp-ad-skip-button-text, .ytp-ad-skip-button-container button"
      );
      if (skipBtn) {
        try { skipBtn.click(); } catch (_) {}
      }
    }
  }

  // ── 3.1 Hotstar Ad Defuser & Fast-Forward Recovery ─────────────────────────
  let hotstarMuted = false;
  let hotstarRate = 1.0;
  let hotstarAdActive = false;

  function runHotstarShield() {
    const isHotstar =
      hostname.includes("hotstar.com") ||
      hostname.includes("jiohotstar.com") ||
      hostname.includes("jiostar.com") ||
      hostname.includes("disneyplus.com");
    if (!isHotstar) return;

    const adIndicator = document.querySelector(
      'div[data-testid^="ad-media"], [data-testid="ad-countdown"], [data-testid="ad-badge"], div[class*="ad_overlay"], div[class*="adMarker"], div[class*="adContainer"], .shaka-ad-container'
    );

    const videos = document.querySelectorAll("video");
    if (adIndicator && videos.length > 0) {
      for (const video of videos) {
        if (!hotstarAdActive) {
          hotstarMuted = video.muted;
          hotstarRate = video.playbackRate || 1.0;
          hotstarAdActive = true;
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
    } else if (hotstarAdActive) {
      hotstarAdActive = false;
      for (const video of videos) {
        video.muted = hotstarMuted;
        video.playbackRate = hotstarRate;
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    }
  }

  // ── 4. DOM Scrubbing & Mutation Observer ────────────────────────────────────
  let observer = null;

  function isContextValid() {
    try {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
        return false;
      }
      return Boolean(chrome.runtime.getManifest());
    } catch (_) {
      return false;
    }
  }

  function scrubDom() {
    if (!isContextValid()) {
      stopObserver();
      return;
    }

    let found = 0;
    CORE_AD_SELECTORS.forEach((sel) => {
      try {
        const nodes = document.querySelectorAll(sel);
        if (nodes.length > 0) {
          found += nodes.length;
          nodes.forEach((n) => {
            n.style.setProperty("display", "none", "important");
            n.style.setProperty("visibility", "hidden", "important");
          });
        }
      } catch (_) {}
    });

    if (found > 0) {
      blockedCountSession += found;
      try {
        if (isContextValid() && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: "ADBLOCK_INCREMENT_COUNT",
            count: found,
            domain: hostname,
          }).catch(() => {});
        }
      } catch (_) {
        stopObserver();
      }
    }

    if (hostname.includes("youtube.com")) {
      runYouTubeShield();
    }
    if (
      hostname.includes("hotstar.com") ||
      hostname.includes("jiohotstar.com") ||
      hostname.includes("jiostar.com") ||
      hostname.includes("disneyplus.com")
    ) {
      runHotstarShield();
    }
  }

  function startObserver() {
    if (observer || !isContextValid()) return;
    observer = new MutationObserver(() => {
      if (!isContextValid()) {
        stopObserver();
        return;
      }
      scrubDom();
    });
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // ── 5. Main Initialization & Storage Gate ───────────────────────────────────
  function init() {
    if (!isContextValid()) {
      stopObserver();
      return;
    }
    try {
      chrome.storage.local.get(
        [
          "activeModules",
          "adblockEnabled",
          "adblockWhitelist",
          "adblockCookieBanner",
          "adblockNotifications",
          "adblockCustomRules",
        ],
        (res) => {
          if (!isContextValid() || !res) {
            stopObserver();
            return;
          }
          const modules = res.activeModules || {};
          const isModuleActive = modules.adblock !== false;
          const isAdblockEnabled = res.adblockEnabled !== false;
          const whitelist = Array.isArray(res.adblockWhitelist) ? res.adblockWhitelist : [];
          const isWhitelisted = whitelist.some((d) => hostname.includes(d.toLowerCase().trim()));
          const isShieldActive = isModuleActive && isAdblockEnabled && !isWhitelisted;

          try {
            sessionStorage.setItem("omni_adblock_enabled", isShieldActive ? "true" : "false");
            document.documentElement.setAttribute("data-omni-adblock", isShieldActive ? "true" : "false");
            document.dispatchEvent(new CustomEvent("omni-adblock-config", { detail: { enabled: isShieldActive } }));
          } catch (_) {}

          if (!isShieldActive) {
            removeHidingStyles();
            stopObserver();
            return;
          }

          // Apply Notification Silencer
          if (res.adblockNotifications !== false) {
            silencePushNotifications();
          }

          // Apply Element Hiding Styles
          injectHidingStyles(res.adblockCustomRules || "", res.adblockCookieBanner !== false);

          // Run Initial Scrub & Start Observer
          if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
              scrubDom();
              startObserver();
            });
          } else {
            scrubDom();
            startObserver();
          }
        }
      );
    } catch (_) {
      stopObserver();
    }
  }

  // Watch for storage changes in real-time
  try {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (!isContextValid()) {
          stopObserver();
          return;
        }
        try {
          if (area !== "local") return;
          if (
            changes.activeModules ||
            changes.adblockEnabled ||
            changes.adblockWhitelist ||
            changes.adblockCookieBanner ||
            changes.adblockCustomRules
          ) {
            init();
          }
        } catch (_) {
          stopObserver();
        }
      });
    }
  } catch (_) {}

  init();
})();
