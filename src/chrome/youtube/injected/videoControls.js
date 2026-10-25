// ── Universal Wheel, Zone Gestures & Hotkey Controller ─────────────────────
// Handles mouse wheel scrolling across interactive zones (volume, brightness, speed, seek),
// Ctrl+Wheel skip step tuning, hotkey speed boosts, and middle-click mute toggles.

import {
  showCustomHUD,
  showSpeedHUD,
  showBrightnessHUD,
  showSeekHUD,
  showSeekStepHUD,
  calculateNextSkipStep,
} from "./hudStyles.js";
import {
  getVideoBrightness,
  setVideoBrightness,
  applyAllVideoFilters,
} from "./videoFilters.js";
import {
  getPlayerInfo,
  applyStartupVolume,
  getActivePlayer,
  setActivePlayer,
  findVideoPlayerAtCursor,
  isTyping,
} from "./playerAdapter.js";

let originalSpeed = null;
let isBoosting = false;
let isAdjustingVolume = false;

export function getZoneAction(videoRect, cursorX, cursorY) {
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

export function initVideoControls() {
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
