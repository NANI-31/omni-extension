// General Video Tools Injected Script (Main World Context)
(function () {
  let hudTimeout = null;
  let activePlayer = null;
  let originalSpeed = null;
  let isBoosting = false;

  // ── Shared HUD style injected once ──────────────────────────────────────────

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

  function showCustomHUD(container, volume) {
    const showHUDEnabled =
      document.documentElement.getAttribute("data-yt-show-hud") === "true";
    if (!showHUDEnabled || !container) return;

    createHUDStyle();

    if (window.getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    let hud = container.querySelector(
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

      container.appendChild(hud);
    }

    const iconEl = hud.querySelector(".yt-hud-icon-container");
    const textEl = hud.querySelector(".yt-hud-percentage");
    const fillEl = hud.querySelector(".yt-hud-bar-fill");

    iconEl.textContent = getSpeakerIcon(volume);
    textEl.textContent = `${volume}%`;
    fillEl.style.width = `${volume}%`;

    // Remove speed HUD if visible to prevent overlap
    const speedHud = container.querySelector(".yt-custom-speed-hud");
    if (speedHud) speedHud.classList.remove("visible");

    hud.classList.remove("visible");
    void hud.offsetWidth; // Force reflow
    hud.classList.add("visible");

    if (hudTimeout) clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => {
      hud.classList.remove("visible");
    }, 1000);
  }

  // ── SVG Tone Filter ──────────────────────────────────────────────────────────────────
  // We use a hidden SVG <feComponentTransfer> filter to implement
  // Blacks / Whites / Shadows / Highlights as a 5-point tone curve.
  // This runs at compositor level (same GPU path as CSS filters) so it
  // works on cross-origin <video> elements without any CORS restriction.

  const YT_SVG_ID   = "yt-svgf-container";
  const YT_TONE_ID  = "yt-tone";        // referenced by filter: url(#yt-tone)
  const YT_FUNC_IDS = { r: "yt-fR", g: "yt-fG", b: "yt-fB" };

  function injectToneFilterSVG() {
    if (document.getElementById(YT_SVG_ID)) return;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.id = YT_SVG_ID;
    svg.setAttribute("style",
      "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;opacity:0;"
    );
    svg.setAttribute("aria-hidden", "true");

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

  // ── Video filter system ──────────────────────────────────────────────────────

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

  // Prime the SVG filter element immediately so url(#yt-tone) resolves
  injectToneFilterSVG();

  let brightnessHudTimeout = null;

  function showBrightnessHUD(container, pct) {
    const showHUDEnabled =
      document.documentElement.getAttribute("data-yt-show-hud") === "true";
    if (!showHUDEnabled || !container) return;

    createHUDStyle();

    if (window.getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    let hud = container.querySelector(".yt-brightness-hud");
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

      container.appendChild(hud);
    }

    const textEl = hud.querySelector(".yt-hud-percentage");
    const fillEl = hud.querySelector(".yt-hud-bar-fill");

    textEl.textContent = `${pct}%`;
    // Scale fill: 0% bright → 0% bar, 100% bright → 50% bar, 200% bright → 100% bar
    fillEl.style.width = `${pct / 2}%`;

    hud.classList.remove("visible");
    void hud.offsetWidth;
    hud.classList.add("visible");

    if (brightnessHudTimeout) clearTimeout(brightnessHudTimeout);
    brightnessHudTimeout = setTimeout(() => {
      hud.classList.remove("visible");
    }, 1000);
  }

  // ── Seek HUD ─────────────────────────────────────────────────────────────────

  let seekHudTimeout = null;

  function showSeekHUD(container, seconds, forward) {
    const showHUDEnabled =
      document.documentElement.getAttribute("data-yt-show-hud") === "true";
    if (!showHUDEnabled || !container) return;

    createHUDStyle();

    if (window.getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    let hud = container.querySelector(".yt-seek-hud");
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

      container.appendChild(hud);
    }

    const iconEl = hud.querySelector(".yt-hud-icon-container");
    const textEl = hud.querySelector(".yt-hud-percentage");
    iconEl.textContent = forward ? "⏩" : "⏪";
    textEl.textContent = `${forward ? "+" : "-"}${seconds}s`;

    hud.classList.remove("visible");
    void hud.offsetWidth;
    hud.classList.add("visible");

    if (seekHudTimeout) clearTimeout(seekHudTimeout);
    seekHudTimeout = setTimeout(() => {
      hud.classList.remove("visible");
    }, 800);
  }

  // ── Speed badge — top-left corner of the video ──────────────────────────────
  // Persistent while speed is anything other than 1.0x.
  // Fades out 1 second after speed returns to exactly 1.0x.

  let speedBadgeTimeout = null;

  function showSpeedHUD(container, speed) {
    const showHUDEnabled =
      document.documentElement.getAttribute("data-yt-show-hud") === "true";
    if (!showHUDEnabled || !container) return;

    createHUDStyle();

    if (window.getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    // Create badge once, reuse on subsequent calls
    let badge = container.querySelector(".yt-speed-badge");
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

      container.appendChild(badge);
    }

    const iconEl = badge.querySelector(".yt-speed-icon");
    const textEl = badge.querySelector(".yt-speed-text");

    const isOverdrive = speed > 8.0;
    iconEl.textContent = isOverdrive ? "🔥" : "⚡";
    textEl.textContent = `${speed.toFixed(2)}x`;
    badge.classList.toggle("overdrive", isOverdrive);

    // Show badge, then always auto-hide after 1 s
    badge.classList.remove("visible");
    void badge.offsetWidth; // force reflow so the fade-in re-triggers
    badge.classList.add("visible");

    if (speedBadgeTimeout) clearTimeout(speedBadgeTimeout);
    speedBadgeTimeout = setTimeout(
      () => badge.classList.remove("visible"),
      1000,
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
      const container = video.parentElement || video;
      return {
        getVolume: () => Math.round(video.volume * 100),
        setVolume: (v) => {
          video.volume = v / 100;
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

  // Enforce startup volume
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

  // Check if target is a keyboard text entry component
  function isTyping() {
    const active = document.activeElement;
    if (!active) return false;
    return (
      active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.isContentEditable
    );
  }

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
        activePlayer =
          container &&
          container.classList &&
          container.classList.contains("html5-video-player")
            ? container
            : video;
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
  let isAdjustingVolume = false;
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

  // ── Universal video player detection — bounding rect approach ─────────────
  //
  // Works on YouTube watch page, Udemy, Coursera, Khan Academy, and any
  // HTML5 video player — but NOT on YouTube's homepage feed preview videos.
  //
  // Guards applied in order:
  //
  //  1. Minimum size (400 × 250 px):
  //     YouTube feed thumbnail previews are ~320×180 px.
  //     Real video players on any site are at least 400px wide.
  //     This guard alone skips 99% of feed preview false-positives.
  //
  //  2. YouTube-specific: must be inside .html5-video-player:
  //     On youtube.com, only the dedicated player wrapper gets volume control.
  //     Feed preview <video> tags are bare elements not inside that wrapper,
  //     so they're ignored even if they happen to be large enough.
  //
  //  3. Cursor position within video rect + 70 px below (for control bars).

  // Minimum rendered size a video must have to qualify for volume control.
  // Feed preview thumbnails on YouTube homepage are ~320×180 — comfortably below this.
  const MIN_PLAYER_WIDTH = 400; // px
  const MIN_PLAYER_HEIGHT = 250; // px

  function findVideoPlayerAtCursor(e) {
    const cx = e.clientX;
    const cy = e.clientY;
    const isYouTube = window.location.hostname.includes("youtube.com");

    for (const video of document.querySelectorAll("video")) {
      const rect = video.getBoundingClientRect();

      // Guard 1 — skip invisible / zero-size videos (preloaded, hidden, etc.)
      if (rect.width < 10 || rect.height < 10) continue;

      // Guard 2 — skip feed thumbnail preview videos (too small to be a real player)
      // YouTube feed previews are ~320×180 px; a real player is at least 400×250.
      if (rect.width < MIN_PLAYER_WIDTH || rect.height < MIN_PLAYER_HEIGHT)
        continue;

      // Guard 3 — on YouTube, only activate for the dedicated player wrapper.
      // Feed preview <video> elements are NOT inside .html5-video-player.
      const ytPlayer = video.closest(".html5-video-player");
      if (isYouTube && !ytPlayer) continue;

      // Guard 4 — cursor must be within the video's rendered area.
      // We extend 70 px below to cover control bars under the video element.
      if (
        cx >= rect.left &&
        cx <= rect.right &&
        cy >= rect.top &&
        cy <= rect.bottom + 70
      ) {
        return { video, container: ytPlayer || video.parentElement || video };
      }
    }

    return null; // cursor is not over a qualifying player — let scroll pass through
  }

  // ── Zone-aware mouse wheel handler ───────────────────────────────────────────
  //
  // Horizontal zones (thirds of the video width):
  //   Left third   → data-yt-zone-left   (default: brightness)
  //   Middle third → data-yt-zone-middle  (default: volume)
  //   Right third  → split top / bottom:
  //       Top half of right third    → Speed control
  //       Bottom half of right third → Seek control
  //
  // When ytZonesEnabled is false the feature degrades to the original
  // full-video volume control (ytVolumeControl must also be enabled).

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

  window.addEventListener(
    "wheel",
    function (e) {
      const active =
        document.documentElement.getAttribute("data-yt-active") === "true";
      if (!active) return;

      const zonesEnabled =
        document.documentElement.getAttribute("data-yt-zones-enabled") === "true";
      const volumeControlEnabled =
        document.documentElement.getAttribute("data-yt-volume-control") === "true";

      // Neither feature is on — let page scroll
      if (!zonesEnabled && !volumeControlEnabled) return;

      // Detect if cursor is over any HTML5 video player
      const found = findVideoPlayerAtCursor(e);
      if (!found) return;

      // Consume the scroll event — we handle it
      e.preventDefault();
      e.stopPropagation();

      const info = getPlayerInfo(found.container);
      if (!info) return;

      const scrollUp = e.deltaY < 0;

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
            showCustomHUD(info.container, next);
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
          showSpeedHUD(info.container, next);

        } else if (action === "brightness") {
          const step = parseInt(
            document.documentElement.getAttribute("data-yt-brightness-step") || "5", 10
          );
          const current = getVideoBrightness(found.video);
          const next = setVideoBrightness(
            found.video,
            scrollUp ? current + step : current - step
          );
          showBrightnessHUD(info.container, next);

        } else if (action === "seek") {
          // Ctrl+wheel = fast seek, plain wheel = normal seek
          // scroll wheel forward (deltaY < 0) = seek forward; backward (deltaY > 0) = seek backward
          const seekStep = e.ctrlKey
            ? parseFloat(document.documentElement.getAttribute("data-yt-seek-ctrl-step") || "30")
            : parseFloat(document.documentElement.getAttribute("data-yt-seek-step") || "5");
          const video = found.video;
          if (video && isFinite(video.duration) && video.duration > 0) {
            video.currentTime = Math.max(
              0,
              Math.min(video.duration, video.currentTime + (scrollUp ? seekStep : -seekStep))
            );
            showSeekHUD(info.container, seekStep, scrollUp);
          }

        }
        // action === "none" → do nothing (but scroll is already consumed)
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
        showCustomHUD(info.container, next);
      }
    },
    { passive: false, capture: true },
  );

  // Bind left click on Speed zone to reset playback speed to normal (1.0x) without toggling play/pause
  window.addEventListener(
    "click",
    function (e) {
      if (e.button !== 0) return; // Primary (left) click only

      const active =
        document.documentElement.getAttribute("data-yt-active") === "true";
      const zonesEnabled =
        document.documentElement.getAttribute("data-yt-zones-enabled") === "true";
      if (!active || !zonesEnabled) return;

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

        const info = getPlayerInfo(found.container);
        if (info) {
          info.setSpeed(1.0);
          showSpeedHUD(info.container, 1.0);
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

      const active =
        document.documentElement.getAttribute("data-yt-active") === "true";
      const volumeControlEnabled =
        document.documentElement.getAttribute("data-yt-volume-control") ===
        "true";
      if (!active || !volumeControlEnabled) return;

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

      if (!video) return;

      e.preventDefault();
      e.stopPropagation();

      const targetPlayer =
        container &&
        container.classList &&
        container.classList.contains("html5-video-player")
          ? container
          : video;
      const info = getPlayerInfo(targetPlayer);

      if (info) {
        const isMuted = info.isMuted();
        if (isMuted) {
          info.setMuted(false);
          const maxVolumeAttr =
            document.documentElement.getAttribute("data-yt-max-volume");
          const maxVolume = parseInt(maxVolumeAttr || "100", 10);
          const targetVol = Math.min(maxVolume, info.getVolume() || 50);
          info.setVolume(targetVol);
          showCustomHUD(info.container, targetVol);
        } else {
          info.setMuted(true);
          showCustomHUD(info.container, 0);
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
      const active =
        document.documentElement.getAttribute("data-yt-active") === "true";
      const volumeControlEnabled =
        document.documentElement.getAttribute("data-yt-volume-control") ===
        "true";
      if (!active || !volumeControlEnabled) return;

      let container = e.target;
      let hasVideo = false;
      while (container && container !== document.body) {
        if (container.querySelector("video")) {
          hasVideo = true;
          break;
        }
        container = container.parentElement;
      }

      if (hasVideo) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { capture: true },
  );
})();
