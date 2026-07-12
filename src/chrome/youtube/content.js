// YouTube Tools Content Script (Isolated Context)

function syncYoutubeSettings() {
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
      "ytHoldKey"
    ],
    (result) => {
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
      const ytVolumeControl = result.ytVolumeControl !== false; // Default true
      const ytVolumeStep = result.ytVolumeStep !== undefined ? result.ytVolumeStep : 5; // Default 5%
      const ytShowVolumeHUD = result.ytShowVolumeHUD !== false; // Default true
      const ytMaxVolumeCap = result.ytMaxVolumeCap !== undefined ? Number(result.ytMaxVolumeCap) : 100; // Default 100%
      const ytDefaultStartupVolumeEnabled = !!result.ytDefaultStartupVolumeEnabled; // Default false
      const ytDefaultStartupVolume = result.ytDefaultStartupVolume !== undefined ? Number(result.ytDefaultStartupVolume) : 30; // Default 30%
      
      const ytSpeedSensitivity = result.ytSpeedSensitivity !== undefined ? Number(result.ytSpeedSensitivity) : 0.25; // Default 0.25x
      const ytAllowOverdrive = !!result.ytAllowOverdrive; // Default false
      const ytHotkeyHold2x = result.ytHotkeyHold2x !== false; // Default true
      const ytHoldSpeedMult = result.ytHoldSpeedMult !== undefined ? Number(result.ytHoldSpeedMult) : 2.0; // Default 2.0x
      const ytHoldKey = result.ytHoldKey !== undefined ? String(result.ytHoldKey) : "s"; // Default 's'

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
    }
  );
}

function injectMainWorldScript() {
  if (document.documentElement.getAttribute("data-yt-injected") === "1") return;
  document.documentElement.setAttribute("data-yt-injected", "1");

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("youtube-injected.js") + "?t=" + Date.now();
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Initial Sync and Script Injection
syncYoutubeSettings();
injectMainWorldScript();

// Monitor settings changes
chrome.storage.onChanged.addListener((changes, areaName) => {
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
      changes.ytHoldKey !== undefined
    ) {
      syncYoutubeSettings();
    }
  }
});
