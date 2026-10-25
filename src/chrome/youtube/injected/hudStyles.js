// ── Shared HUD Styles & OSD Overlay Engine ──────────────────────────────────
// Manages volume, speed, brightness, seek, and skip-interval on-screen display badges.

let hudTimeout = null;
let speedBadgeTimeout = null;
let brightnessHudTimeout = null;
let seekHudTimeout = null;
let seekStepHudTimeout = null;

export function createHUDStyle() {
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

export function getSpeakerIcon(vol) {
  if (vol === 0) return "🔇";
  if (vol < 33) return "🔈";
  if (vol < 66) return "🔉";
  return "🔊";
}

export function prepareHUDContainer(container, video) {
  let target = container;
  if (!target || target.tagName === "VIDEO") {
    target = (target && target.parentElement) || (video && video.parentElement) || document.body;
  }
  if (target && target !== document.body && window.getComputedStyle(target).position === "static") {
    target.style.position = "relative";
  }
  return target;
}

export function showCustomHUD(container, volume, video) {
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

export function showSpeedHUD(container, speed, video) {
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

export function showBrightnessHUD(container, pct, video) {
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

export function showSeekHUD(container, seconds, forward, video) {
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

export function calculateNextSkipStep(current, scrollUp) {
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

export function showSeekStepHUD(container, seconds, video) {
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
