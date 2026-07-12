// General Video Tools Injected Script (Main World Context)
(function () {
  let hudTimeout = null;
  let activePlayer = null;
  let originalSpeed = null;
  let isBoosting = false;

  function createHUDStyle() {
    if (document.getElementById("yt-volume-hud-style")) return;
    const style = document.createElement("style");
    style.id = "yt-volume-hud-style";
    style.textContent = `
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
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      }
      .yt-custom-volume-hud.visible {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      .yt-hud-icon-container {
        font-size: 28px;
        line-height: 1;
      }
      .yt-hud-percentage {
        font-size: 14px;
        font-weight: 800;
        font-family: Roboto, Arial, sans-serif;
        letter-spacing: 0.5px;
      }
      .yt-hud-bar-track {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
      }
      .yt-hud-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #ff0000, #ff4b4b);
        box-shadow: 0 0 8px rgba(255, 0, 0, 0.5);
        border-radius: 2px;
        transition: width 0.08s linear;
      }
      @keyframes yt-hud-pulse {
        0% { box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 10px rgba(239, 68, 68, 0.4); }
        50% { box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 25px rgba(239, 68, 68, 0.8); border-color: rgba(239, 68, 68, 0.6); }
        100% { box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 10px rgba(239, 68, 68, 0.4); }
      }
      .yt-custom-volume-hud.yt-hud-overdrive {
        border-color: rgba(239, 68, 68, 0.5);
        animation: yt-hud-pulse 1.2s infinite ease-in-out;
      }
      .yt-custom-volume-hud.yt-hud-overdrive .yt-hud-icon-container {
        text-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
      }
      .yt-custom-volume-hud.yt-hud-overdrive .yt-hud-bar-fill {
        background: linear-gradient(90deg, #ff3b30, #ff9500);
        box-shadow: 0 0 12px rgba(255, 149, 0, 0.8);
      }
      .yt-hud-spark {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        pointer-events: none;
        opacity: 0;
        z-index: -1;
        display: none;
        filter: blur(0.5px);
        box-shadow: 0 0 6px currentColor;
      }
      .yt-custom-volume-hud.yt-hud-overdrive .yt-hud-spark {
        display: block;
      }
      @keyframes yt-hud-spark-float-1 {
        0% { transform: translate(0, 0) scale(1); opacity: 0; }
        10% { opacity: 0.8; }
        90% { opacity: 0.8; }
        100% { transform: translate(-30px, -110px) scale(0.2); opacity: 0; }
      }
      @keyframes yt-hud-spark-float-2 {
        0% { transform: translate(0, 0) scale(1); opacity: 0; }
        10% { opacity: 0.9; }
        90% { opacity: 0.9; }
        100% { transform: translate(30px, -120px) scale(0.2); opacity: 0; }
      }
      @keyframes yt-hud-spark-float-3 {
        0% { transform: translate(0, 0) scale(1); opacity: 0; }
        10% { opacity: 0.8; }
        90% { opacity: 0.8; }
        100% { transform: translate(-15px, -130px) scale(0.2); opacity: 0; }
      }
      @keyframes yt-hud-spark-float-4 {
        0% { transform: translate(0, 0) scale(1); opacity: 0; }
        10% { opacity: 0.9; }
        90% { opacity: 0.9; }
        100% { transform: translate(20px, -105px) scale(0.2); opacity: 0; }
      }
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
    const showHUDEnabled = document.documentElement.getAttribute("data-yt-show-hud") === "true";
    if (!showHUDEnabled || !container) return;

    createHUDStyle();

    if (window.getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    let hud = container.querySelector(".yt-custom-volume-hud:not(.yt-custom-speed-hud)");
    if (!hud) {
      hud = document.createElement("div");
      hud.className = "yt-custom-volume-hud";
      hud.innerHTML = `
        <div class="yt-hud-icon-container">🔊</div>
        <div class="yt-hud-percentage">100%</div>
        <div class="yt-hud-bar-track">
          <div class="yt-hud-bar-fill" style="width: 100%"></div>
        </div>
      `;
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

  function showSpeedHUD(container, speed) {
    const showHUDEnabled = document.documentElement.getAttribute("data-yt-show-hud") === "true";
    if (!showHUDEnabled || !container) return;

    createHUDStyle();

    if (window.getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    let hud = container.querySelector(".yt-custom-speed-hud");
    if (!hud) {
      hud = document.createElement("div");
      hud.className = "yt-custom-volume-hud yt-custom-speed-hud";
      hud.innerHTML = `
        <div class="yt-hud-spark" style="bottom: 10px; left: 15%; animation: yt-hud-spark-float-1 1s infinite ease-in; color: #ff3b30;"></div>
        <div class="yt-hud-spark" style="bottom: 15px; left: 40%; animation: yt-hud-spark-float-2 1.2s infinite ease-in 0.2s; color: #ff9500;"></div>
        <div class="yt-hud-spark" style="bottom: 8px; left: 60%; animation: yt-hud-spark-float-3 0.9s infinite ease-in 0.4s; color: #ffcc00;"></div>
        <div class="yt-hud-spark" style="bottom: 12px; left: 85%; animation: yt-hud-spark-float-4 1.1s infinite ease-in 0.1s; color: #ff3b30;"></div>
        <div class="yt-hud-icon-container">⚡</div>
        <div class="yt-hud-percentage">1.00x</div>
        <div class="yt-hud-bar-track">
          <div class="yt-hud-bar-fill" style="width: 20%"></div>
        </div>
      `;
      container.appendChild(hud);
    }

    const iconEl = hud.querySelector(".yt-hud-icon-container");
    const textEl = hud.querySelector(".yt-hud-percentage");
    const fillEl = hud.querySelector(".yt-hud-bar-fill");

    if (speed > 8.0) {
      hud.classList.add("yt-hud-overdrive");
      iconEl.textContent = "🔥";
    } else {
      hud.classList.remove("yt-hud-overdrive");
      iconEl.textContent = "⚡";
    }

    textEl.textContent = `${speed.toFixed(2)}x`;
    
    // Represent 0.25x - maxLimit range on a 0-100% fill bar (Chromium standard limit is 16.0x)
    const allowOverdrive = document.documentElement.getAttribute("data-yt-allow-overdrive") === "true";
    const maxLimit = allowOverdrive ? 16.0 : 2.0;
    const percentage = Math.min(100, Math.max(0, ((speed - 0.25) / (maxLimit - 0.25)) * 100));
    fillEl.style.width = `${percentage}%`;

    // Remove volume HUD if visible to prevent overlap
    const volHud = container.querySelector(".yt-custom-volume-hud:not(.yt-custom-speed-hud)");
    if (volHud) volHud.classList.remove("visible");

    hud.classList.remove("visible");
    void hud.offsetWidth; // Force reflow
    hud.classList.add("visible");

    if (hudTimeout) clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => {
      hud.classList.remove("visible");
    }, 1000);
  }

  function getPlayerInfo(playerOrVideo) {
    if (!playerOrVideo) return null;
    
    // If it's a YouTube player wrapper
    if (playerOrVideo.classList && playerOrVideo.classList.contains("html5-video-player")) {
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
        container: playerOrVideo
      };
    }
    
    // If it's a standard video element or an ancestor container
    const video = playerOrVideo.tagName === "VIDEO" ? playerOrVideo : playerOrVideo.querySelector("video");
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
        container: container
      };
    }
    return null;
  }

  // Enforce startup volume
  function applyStartupVolume(playerOrVideo) {
    const startupEnabled = document.documentElement.getAttribute("data-yt-startup-volume-enabled") === "true";
    if (!startupEnabled) return;

    const startupVolumeAttr = document.documentElement.getAttribute("data-yt-startup-volume");
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
  document.addEventListener("mousemove", (e) => {
    let container = e.target;
    let video = null;
    while (container && container !== document.body) {
      if (container.classList && container.classList.contains("html5-video-player")) {
        video = container.querySelector("video");
        break;
      }
      video = container.querySelector("video");
      if (video) break;
      container = container.parentElement;
    }
    if (video) {
      activePlayer = (container && container.classList && container.classList.contains("html5-video-player")) ? container : video;
    }
  }, { passive: true });

  // Keyboard events listener for speed control shortcuts
  window.addEventListener("keydown", function (e) {
    if (isTyping()) return;

    const active = document.documentElement.getAttribute("data-yt-active") === "true";
    if (!active) return;

    const player = getActivePlayer();
    if (!player) return;

    const info = getPlayerInfo(player);
    if (!info) return;

    const speedSensitivityAttr = document.documentElement.getAttribute("data-yt-speed-sensitivity");
    const sensitivity = parseFloat(speedSensitivityAttr || "0.25");
    const allowOverdrive = document.documentElement.getAttribute("data-yt-allow-overdrive") === "true";
    
    const holdEnabled = document.documentElement.getAttribute("data-yt-hotkey-hold-2x") === "true";
    const holdKey = (document.documentElement.getAttribute("data-yt-hold-key") || "s").toLowerCase();
    const holdMultiplier = parseFloat(document.documentElement.getAttribute("data-yt-hold-speed-mult") || "2.0");

    // 1. Plus (+), Equal (=), or Shift + Right Arrow (Speed Up)
    if (
      (e.key === "+" || e.key === "=" || (e.shiftKey && e.key === "ArrowRight")) &&
      !e.ctrlKey && !e.metaKey && !e.altKey
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
      (e.key === "-" || e.key === "_" || (e.shiftKey && e.key === "ArrowLeft")) &&
      !e.ctrlKey && !e.metaKey && !e.altKey
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
      !e.ctrlKey && !e.metaKey && !e.altKey
    ) {
      e.preventDefault();
      e.stopPropagation();
      info.setSpeed(1.0);
      showSpeedHUD(info.container, 1.0);
    }
    // 4. Hold Boost Action (Keydown)
    else if (
      holdEnabled && e.key.toLowerCase() === holdKey &&
      !e.ctrlKey && !e.metaKey && !e.altKey
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
  }, true);

  window.addEventListener("keyup", function (e) {
    if (isTyping()) return;

    const holdEnabled = document.documentElement.getAttribute("data-yt-hotkey-hold-2x") === "true";
    const holdKey = (document.documentElement.getAttribute("data-yt-hold-key") || "s").toLowerCase();

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
  }, true);

  // Intercept playing elements to apply startup volume once per video ID
  document.addEventListener(
    "play",
    function (e) {
      if (e.target && e.target.tagName === "VIDEO") {
        let container = e.target;
        let foundPlayer = e.target;
        while (container && container !== document.body) {
          if (container.classList && container.classList.contains("html5-video-player")) {
            foundPlayer = container;
            break;
          }
          container = container.parentElement;
        }

        const currentVideoId = new URLSearchParams(window.location.search).get("v") || window.location.pathname + window.location.search;
        if (foundPlayer.dataset.lastStartupVideoId !== currentVideoId) {
          foundPlayer.dataset.lastStartupVideoId = currentVideoId;
          applyStartupVolume(foundPlayer);
        }
      }
    },
    { capture: true, passive: true }
  );

  // Globally intercept volume changes to enforce the maximum cap limit
  let isAdjustingVolume = false;
  document.addEventListener(
    "volumechange",
    function (e) {
      if (isAdjustingVolume) return;
      
      const active = document.documentElement.getAttribute("data-yt-active") === "true";
      const volumeControlEnabled = document.documentElement.getAttribute("data-yt-volume-control") === "true";
      if (!active || !volumeControlEnabled) return;

      if (e.target && e.target.tagName === "VIDEO") {
        let container = e.target;
        let foundPlayer = e.target;
        while (container && container !== document.body) {
          if (container.classList && container.classList.contains("html5-video-player")) {
            foundPlayer = container;
            break;
          }
          container = container.parentElement;
        }

        const info = getPlayerInfo(foundPlayer);
        if (info) {
          const maxVolumeAttr = document.documentElement.getAttribute("data-yt-max-volume");
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
    { capture: true, passive: true }
  );

  // ── Universal video player detection — bounding rect approach ─────────────
  //
  // Works on YouTube, Udemy, Coursera, Khan Academy, any HTML5 video player.
  //
  // Instead of guessing via DOM class names or walking the ancestor tree
  // (which causes false positives when a video lives in a shared ancestor with
  // page text), we directly compare the cursor coordinates against each <video>
  // element's real rendered position on screen using getBoundingClientRect().
  //
  // Detection zone:
  //   - The video element's bounding rect (video area itself)
  //   - + 70px below the bottom edge, to include control bars that are
  //     absolutely positioned just below the <video> tag on most platforms.
  //
  // This is pixel-accurate and needs zero knowledge of the site's CSS classes.

  function findVideoPlayerAtCursor(e) {
    const cx = e.clientX;
    const cy = e.clientY;

    for (const video of document.querySelectorAll("video")) {
      const rect = video.getBoundingClientRect();

      // Skip invisible / zero-size videos (e.g. preloaded background videos)
      if (rect.width < 10 || rect.height < 10) continue;

      // Is the cursor within the video's rendered area?
      // We extend 70 px below to cover control bars rendered underneath the video tag.
      if (
        cx >= rect.left  &&
        cx <= rect.right &&
        cy >= rect.top   &&
        cy <= rect.bottom + 70
      ) {
        // Use the YouTube-specific wrapper if available (gives us the JS API).
        // Otherwise fall back to the video element's direct parent.
        const ytPlayer = video.closest(".html5-video-player");
        return { video, container: ytPlayer || video.parentElement || video };
      }
    }

    return null; // cursor is not over any video — let scroll pass through
  }


  // ── Volume control via mouse wheel — works on any site ──────────────────────
  window.addEventListener(
    "wheel",
    function (e) {
      const active = document.documentElement.getAttribute("data-yt-active") === "true";
      const volumeControlEnabled = document.documentElement.getAttribute("data-yt-volume-control") === "true";

      if (!active || !volumeControlEnabled) return;

      // Detect if cursor is over any HTML5 video player (YouTube or any other site)
      const found = findVideoPlayerAtCursor(e);

      // Not over a video — let the page scroll normally
      if (!found) return;

      // Cursor is inside a video player — consume the scroll for volume
      e.preventDefault();
      e.stopPropagation();

      const info = getPlayerInfo(found.container);
      if (!info) return;

      const stepAttr = document.documentElement.getAttribute("data-yt-volume-step");
      const step = parseInt(stepAttr || "5", 10);
      const maxVolumeAttr = document.documentElement.getAttribute("data-yt-max-volume");
      const maxVolume = parseInt(maxVolumeAttr || "100", 10);

      const currentVolume = info.getVolume();
      let newVolume = currentVolume;

      if (e.deltaY < 0) {
        // Scroll up → volume up
        newVolume = Math.min(maxVolume, currentVolume + step);
      } else if (e.deltaY > 0) {
        // Scroll down → volume down
        newVolume = Math.max(0, currentVolume - step);
      }

      if (newVolume !== currentVolume) {
        info.setVolume(newVolume);
        showCustomHUD(info.container, newVolume);
      }
    },
    { passive: false, capture: true }
  );


  // Bind middle mouse click to toggle mute directly
  window.addEventListener(
    "auxclick",
    function (e) {
      if (e.button !== 1) return; // Middle click only

      const active = document.documentElement.getAttribute("data-yt-active") === "true";
      const volumeControlEnabled = document.documentElement.getAttribute("data-yt-volume-control") === "true";
      if (!active || !volumeControlEnabled) return;

      let container = e.target;
      let video = null;
      while (container && container !== document.body) {
        if (container.classList && container.classList.contains("html5-video-player")) {
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

      const targetPlayer = (container && container.classList && container.classList.contains("html5-video-player")) ? container : video;
      const info = getPlayerInfo(targetPlayer);

      if (info) {
        const isMuted = info.isMuted();
        if (isMuted) {
          info.setMuted(false);
          const maxVolumeAttr = document.documentElement.getAttribute("data-yt-max-volume");
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
    { capture: true }
  );

  // Prevent scroll click default context trigger on middle click over player
  window.addEventListener(
    "mousedown",
    function (e) {
      if (e.button !== 1) return;
      const active = document.documentElement.getAttribute("data-yt-active") === "true";
      const volumeControlEnabled = document.documentElement.getAttribute("data-yt-volume-control") === "true";
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
    { capture: true }
  );
})();
