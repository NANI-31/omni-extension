// Instagram Downloader Content Script Orchestrator
import { injectCustomStyles, injectMainWorldScript } from './content/domScraper.js';
import { initChatUnsendListener } from './content/chatUnsend.js';
import { initButtonOverlay, removeButtonOverlays } from './content/buttonOverlay.js';
import { setupClickToDownloadListener } from './content/clickToDownload.js';

let instagrabEnabled = true; // optimistic default; corrected by first storage read

function enableInstagrab() {
  instagrabEnabled = true;
  injectCustomStyles();
  injectMainWorldScript();
  initButtonOverlay();
}

function disableInstagrab() {
  instagrabEnabled = false;
  removeButtonOverlays();
  document.getElementById('instagrab-custom-styles')?.remove();
}

// 1. Initialize Quick Unsend in Chats listener
initChatUnsendListener();

// 2. Initialize Click-to-Download media interception
setupClickToDownloadListener(() => instagrabEnabled);

// 3. Listen for real-time module toggle changes (popup flips the switch)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.activeModules) return;
  const isNowEnabled = !!changes.activeModules.newValue?.instagrab;
  const wasPreviouslyEnabled = !!changes.activeModules.oldValue?.instagrab;
  if (isNowEnabled && !wasPreviouslyEnabled) enableInstagrab();
  else if (!isNowEnabled && wasPreviouslyEnabled) disableInstagrab();
});

// 4. Read initial module state, then start (or stay idle) accordingly
chrome.storage.local.get(['activeModules'], (result) => {
  const modules = result.activeModules || {};
  const enabled = modules.instagrab !== false;
  instagrabEnabled = enabled;
  if (enabled) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      enableInstagrab();
    } else {
      window.addEventListener('load', enableInstagrab);
    }
  }
});
