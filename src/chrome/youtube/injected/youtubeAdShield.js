// ── Modern YouTube AdShield Engine ──────────────────────────────────────────
// Fast-forwards and auto-skips video ads in 0.05s without triggering YouTube's anti-adblock canaries.
// Automatically eradicates enforcement modals, removes dark backdrops, and restores video playback and scrolling.

export function initYouTubeAdShield() {
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
