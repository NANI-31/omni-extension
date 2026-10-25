// General Video Tools Injected Script (Main World Context)
// Modular entry orchestrator assembling AdShield engines, color grading, HUDs, and gesture controls.

import { initYouTubeAdShield } from "./youtubeAdShield.js";
import { initHotstarAdShield } from "./hotstarAdShield.js";
import { initVideoFilters } from "./videoFilters.js";
import { initVideoControls } from "./videoControls.js";

(function () {
  const host = typeof window !== "undefined" && window.location && window.location.hostname ? window.location.hostname.toLowerCase() : "";
  const EXCLUDED_HOSTS = ["claude.ai", "anthropic.com", "chatgpt.com", "openai.com", "instagram.com"];
  if (EXCLUDED_HOSTS.some((h) => host.includes(h))) return;

  initYouTubeAdShield();
  initHotstarAdShield();
  initVideoFilters();
  initVideoControls();
})();
