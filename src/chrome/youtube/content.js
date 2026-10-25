// YouTube Tools Content Script (Isolated Context)
import { initYoutubeHistoryDelete } from "./historyCleaner.js";

// Global suppression of orphaned context invalidation errors
if (typeof self !== "undefined" && self.addEventListener) {
  self.addEventListener("error", (e) => {
    if (e && e.message && e.message.includes("Extension context invalidated")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return true;
    }
  });
  self.addEventListener("unhandledrejection", (e) => {
    if (e && e.reason && String(e.reason).includes("Extension context invalidated")) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  });
}

// ── Guard: do NOT run on non-video platforms or chat apps ─────────────────
const NON_VIDEO_HOSTS = ["claude.ai", "anthropic.com", "chatgpt.com", "openai.com", "instagram.com"];
if (!NON_VIDEO_HOSTS.some((h) => window.location.hostname.includes(h))) {

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

function syncYoutubeSettings() {
  if (!isContextValid()) return;
  try {
    chrome.storage.local.get(
    [
      "activeModules", 
      "ytVolumeControl", 
      "ytVolumeStep", 
      "ytShowVolumeHUD",
      "ytMaxVolumeCap",
      "ytDefaultStartupVolumeEnabled",
      "ytDefaultStartupVolume",
      "ytBlacklistDomains",
      "ytSpeedSensitivity",
      "ytAllowOverdrive",
      "ytHotkeyHold2x",
      "ytHoldSpeedMult",
      "ytHoldKey",
      // Scroll zones
      "ytZonesEnabled",
      "ytZoneLeft",
      "ytZoneMiddle",
      "ytZoneRight",
      "ytBrightnessSensitivity",
      "ytSeekSensitivity",
      "ytSeekCtrlStep",
      // Video color filters
      "ytFilterContrast",
      "ytFilterSaturation",
      "ytFilterTemperature",
      "ytFilterEyeProtection",
      // Tone / LUT controls (SVG feComponentTransfer)
      "ytFilterBlacks",
      "ytFilterWhites",
      "ytFilterShadows",
      "ytFilterHighlights",
    ],
    (result) => {
      if (chrome.runtime?.lastError || !isContextValid() || !result) return;
      const activeModules = result.activeModules || {};
      const blacklistStr = result.ytBlacklistDomains || "";
      const blacklist = blacklistStr
        .split("\n")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
      
      const currentHost = window.location.hostname.toLowerCase();
      const isBlacklisted = blacklist.some(
        (domain) => currentHost === domain || currentHost.endsWith("." + domain)
      );

      const ytActive = (activeModules.youtube !== false) && !isBlacklisted;
      const ytVolumeControl = result.ytVolumeControl !== false;
      const ytVolumeStep = result.ytVolumeStep !== undefined ? result.ytVolumeStep : 5;
      const ytShowVolumeHUD = result.ytShowVolumeHUD !== false;
      const ytMaxVolumeCap = result.ytMaxVolumeCap !== undefined ? Number(result.ytMaxVolumeCap) : 100;
      const ytDefaultStartupVolumeEnabled = !!result.ytDefaultStartupVolumeEnabled;
      const ytDefaultStartupVolume = result.ytDefaultStartupVolume !== undefined ? Number(result.ytDefaultStartupVolume) : 30;
      
      const ytSpeedSensitivity = result.ytSpeedSensitivity !== undefined ? Number(result.ytSpeedSensitivity) : 0.25;
      const ytAllowOverdrive = result.ytAllowOverdrive !== false;
      const ytHotkeyHold2x = result.ytHotkeyHold2x !== false;
      const ytHoldSpeedMult = result.ytHoldSpeedMult !== undefined ? Number(result.ytHoldSpeedMult) : 2.0;
      const ytHoldKey = result.ytHoldKey !== undefined ? String(result.ytHoldKey) : "s";

      // Scroll zones
      const ytZonesEnabled = result.ytZonesEnabled !== false;
      const ytZoneLeft = result.ytZoneLeft !== undefined ? String(result.ytZoneLeft) : "brightness";
      const ytZoneMiddle = result.ytZoneMiddle !== undefined ? String(result.ytZoneMiddle) : "volume";
      const ytZoneRight = result.ytZoneRight !== undefined ? String(result.ytZoneRight) : "speed";
      const ytBrightnessSensitivity = result.ytBrightnessSensitivity !== undefined ? Number(result.ytBrightnessSensitivity) : 5;
      const ytSeekSensitivity = result.ytSeekSensitivity !== undefined ? Number(result.ytSeekSensitivity) : 5;
      const ytSeekCtrlStep = result.ytSeekCtrlStep !== undefined ? Number(result.ytSeekCtrlStep) : 30;

      // Video color filters
      const ytFilterContrast      = result.ytFilterContrast      !== undefined ? Number(result.ytFilterContrast)      : 100;
      const ytFilterSaturation    = result.ytFilterSaturation    !== undefined ? Number(result.ytFilterSaturation)    : 100;
      const ytFilterTemperature   = result.ytFilterTemperature   !== undefined ? Number(result.ytFilterTemperature)   : 0;
      const ytFilterEyeProtection = result.ytFilterEyeProtection !== undefined ? Number(result.ytFilterEyeProtection) : 0;
      // Tone / LUT controls
      const ytFilterBlacks     = result.ytFilterBlacks     !== undefined ? Number(result.ytFilterBlacks)     : 0;
      const ytFilterWhites     = result.ytFilterWhites     !== undefined ? Number(result.ytFilterWhites)     : 100;
      const ytFilterShadows    = result.ytFilterShadows    !== undefined ? Number(result.ytFilterShadows)    : 0;
      const ytFilterHighlights = result.ytFilterHighlights !== undefined ? Number(result.ytFilterHighlights) : 0;

      document.documentElement.setAttribute("data-yt-active", ytActive ? "true" : "false");
      document.documentElement.setAttribute("data-yt-volume-control", ytVolumeControl ? "true" : "false");
      document.documentElement.setAttribute("data-yt-volume-step", String(ytVolumeStep));
      document.documentElement.setAttribute("data-yt-show-hud", ytShowVolumeHUD ? "true" : "false");
      document.documentElement.setAttribute("data-yt-max-volume", String(ytMaxVolumeCap));
      document.documentElement.setAttribute("data-yt-startup-volume-enabled", ytDefaultStartupVolumeEnabled ? "true" : "false");
      document.documentElement.setAttribute("data-yt-startup-volume", String(ytDefaultStartupVolume));
      
      document.documentElement.setAttribute("data-yt-speed-sensitivity", String(ytSpeedSensitivity));
      document.documentElement.setAttribute("data-yt-allow-overdrive", ytAllowOverdrive ? "true" : "false");
      document.documentElement.setAttribute("data-yt-hotkey-hold-2x", ytHotkeyHold2x ? "true" : "false");
      document.documentElement.setAttribute("data-yt-hold-speed-mult", String(ytHoldSpeedMult));
      document.documentElement.setAttribute("data-yt-hold-key", ytHoldKey);

      // Scroll zone attributes
      document.documentElement.setAttribute("data-yt-zones-enabled", ytZonesEnabled ? "true" : "false");
      document.documentElement.setAttribute("data-yt-zone-left", ytZoneLeft);
      document.documentElement.setAttribute("data-yt-zone-middle", ytZoneMiddle);
      document.documentElement.setAttribute("data-yt-zone-right", ytZoneRight);
      document.documentElement.setAttribute("data-yt-brightness-step", String(ytBrightnessSensitivity));
      document.documentElement.setAttribute("data-yt-seek-step", String(ytSeekSensitivity));
      document.documentElement.setAttribute("data-yt-seek-ctrl-step", String(ytSeekCtrlStep));

      // Video color filter attributes
      document.documentElement.setAttribute("data-yt-filter-contrast",       String(ytFilterContrast));
      document.documentElement.setAttribute("data-yt-filter-saturation",     String(ytFilterSaturation));
      document.documentElement.setAttribute("data-yt-filter-temperature",    String(ytFilterTemperature));
      document.documentElement.setAttribute("data-yt-filter-eye-protection", String(ytFilterEyeProtection));
      // Tone / LUT controls
      document.documentElement.setAttribute("data-yt-filter-blacks",      String(ytFilterBlacks));
      document.documentElement.setAttribute("data-yt-filter-whites",      String(ytFilterWhites));
      document.documentElement.setAttribute("data-yt-filter-shadows",     String(ytFilterShadows));
      document.documentElement.setAttribute("data-yt-filter-highlights",  String(ytFilterHighlights));
    }
  );
  } catch (_) {}
}

// Initial Sync (youtube-injected.js runs in MAIN world via manifest.json)
document.documentElement.setAttribute("data-yt-injected", "1");
syncYoutubeSettings();

// Listen for runtime seek step updates from main world injected script
const onSeekStepUpdate = (e) => {
  if (!isContextValid()) {
    window.removeEventListener("YT_UPDATE_SEEK_STEP", onSeekStepUpdate);
    return;
  }
  if (e.detail && typeof e.detail.step === "number") {
    try {
      chrome.storage.local.set({ ytSeekSensitivity: e.detail.step }, () => {
        if (chrome.runtime?.lastError) { /* suppress */ }
      });
    } catch (_) {}
  }
};
window.addEventListener("YT_UPDATE_SEEK_STEP", onSeekStepUpdate);

// Monitor settings changes
try {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (!isContextValid()) return;
      try {
        if (areaName === "local") {
          if (
            changes.activeModules ||
            changes.ytVolumeControl !== undefined ||
            changes.ytVolumeStep !== undefined ||
            changes.ytShowVolumeHUD !== undefined ||
            changes.ytMaxVolumeCap !== undefined ||
            changes.ytDefaultStartupVolumeEnabled !== undefined ||
            changes.ytDefaultStartupVolume !== undefined ||
            changes.ytBlacklistDomains !== undefined ||
            changes.ytSpeedSensitivity !== undefined ||
            changes.ytAllowOverdrive !== undefined ||
            changes.ytHotkeyHold2x !== undefined ||
            changes.ytHoldSpeedMult !== undefined ||
            changes.ytHoldKey !== undefined ||
            // Scroll zones
            changes.ytZonesEnabled !== undefined ||
            changes.ytZoneLeft !== undefined ||
            changes.ytZoneMiddle !== undefined ||
            changes.ytZoneRight !== undefined ||
            changes.ytBrightnessSensitivity !== undefined ||
            changes.ytSeekSensitivity !== undefined ||
            changes.ytSeekCtrlStep !== undefined ||
            // Color filters
            changes.ytFilterContrast !== undefined ||
            changes.ytFilterSaturation !== undefined ||
            changes.ytFilterTemperature !== undefined ||
            changes.ytFilterEyeProtection !== undefined ||
            // Tone controls
            changes.ytFilterBlacks !== undefined ||
            changes.ytFilterWhites !== undefined ||
            changes.ytFilterShadows !== undefined ||
            changes.ytFilterHighlights !== undefined
          ) {
            syncYoutubeSettings();
          }
        }
      } catch (_) {}
    });
  }
} catch (_) {}


// ── YouTube History Quick Delete ─────────────────────────────────────────────
initYoutubeHistoryDelete(isContextValid);

} // end guard: not instagram.com

