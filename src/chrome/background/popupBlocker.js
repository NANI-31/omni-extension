// Omni Extension — Background Popup & Popunder Destroyer Engine
// Protects against intrusive popups, popunders, and rogue ad tabs across ALL websites
// without requiring any domain whitelists. Normal user link clicks across the entire web open freely.

const POPUP_CHECK_WINDOW_MS = 2500; // 2.5s window after an unprompted clickjack trap is triggered
const recentPopupAttempts = new Map(); // sourceTabId -> timestamp
const potentialPopups = new Map(); // tabId -> { sourceTabId, sourceHost, createdAt, initialUrl }

// Explicit ad delivery and popunder network domains (never false-positive normal websites)
const KNOWN_POPUP_AD_DOMAINS = [
  /popads\./i,
  /propellerads\./i,
  /adsterra\./i,
  /exoclick\./i,
  /bet365\./i,
  /1xbet\./i,
  /monetag\./i,
  /hilltopads\./i,
  /tsyndicate\./i,
  /trafficjunky\./i,
  /ad-maven\./i,
  /onclickads\./i,
  /adcash\./i,
  /richpush\./i,
  /clickadu\./i,
  /juicyads\./i,
  /ero-advertising\./i,
  /trafficstars\./i,
  /yadro\.ru/i,
  /zeroredirect\./i,
  /popunder/i,
];

// Legitimate SSO, OAuth, & payment providers
const AUTH_DOMAINS = [
  "accounts.google.com",
  "appleid.apple.com",
  "github.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "discord.com",
  "linkedin.com",
  "microsoftonline.com",
  "live.com",
  "paypal.com",
];

function isAuthDomain(urlStr) {
  if (!urlStr) return false;
  return AUTH_DOMAINS.some((auth) => urlStr.includes(auth));
}

function isKnownAdUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return false;
  for (const pattern of KNOWN_POPUP_AD_DOMAINS) {
    if (pattern.test(urlStr)) return true;
  }
  return false;
}

function checkAdblockActive() {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
      resolve(true);
      return;
    }
    chrome.storage.local.get(["activeModules", "adblockEnabled"], (result) => {
      const activeModules = result?.activeModules || {};
      const isModuleActive = activeModules.adblock !== false;
      const isEnabled = result?.adblockEnabled !== false;
      resolve(isModuleActive && isEnabled);
    });
  });
}

function cleanExpiredEntries() {
  const now = Date.now();
  for (const [tabId, info] of potentialPopups.entries()) {
    if (now - info.createdAt > 15000) {
      potentialPopups.delete(tabId);
    }
  }
  for (const [sourceTabId, timestamp] of recentPopupAttempts.entries()) {
    if (now - timestamp > POPUP_CHECK_WINDOW_MS) {
      recentPopupAttempts.delete(sourceTabId);
    }
  }
}

/**
 * Record an in-page popup attempt signaled from content script when a clickjack trap overlay is destroyed
 */
export function recordInPagePopupAttempt(sourceTabId) {
  if (!sourceTabId) return;
  recentPopupAttempts.set(sourceTabId, Date.now());
}

/**
 * Checks whether a newly created tab is a rogue ad/popunder and terminates it.
 * Legitimate user links clicked on ANY website on the internet will NEVER be closed.
 */
async function checkAndDestroyPopup(tabId, url, sourceTabId, sourceHost) {
  if (!tabId || !url) return false;

  // 1. Never close tabs if the adblocker module is disabled
  const isActive = await checkAdblockActive();
  if (!isActive) return false;

  // 2. Never close auth, OAuth logins, internal or extension pages
  if (isAuthDomain(url)) return false;
  if (url.startsWith("chrome://") || url.startsWith("chrome-extension://") || url.startsWith("about:")) {
    return false;
  }

  const urlLower = url.toLowerCase();
  let shouldDestroy = false;
  let reason = "";

  // A. Direct match against verified popup/popunder ad delivery networks
  if (isKnownAdUrl(urlLower)) {
    shouldDestroy = true;
    reason = "Destination matched verified ad/popunder delivery network";
  }

  // B. Opener tab had an unprompted transparent clickjack overlay trap triggered within the last 2.5s
  if (!shouldDestroy && sourceTabId && recentPopupAttempts.has(sourceTabId)) {
    const attemptTime = recentPopupAttempts.get(sourceTabId);
    if (Date.now() - attemptTime < POPUP_CHECK_WINDOW_MS) {
      try {
        const parsed = new URL(url);
        const targetHost = parsed.hostname.toLowerCase().replace(/^www\./, "");
        if (targetHost && sourceHost && targetHost !== sourceHost && !isAuthDomain(url)) {
          shouldDestroy = true;
          reason = `Spawned during confirmed clickjack trap from ${sourceHost} to ${targetHost}`;
        }
      } catch (_) {}
    }
  }

  if (shouldDestroy) {
    potentialPopups.delete(tabId);
    try {
      await chrome.tabs.remove(tabId);
      console.log(`[AdShield Popup Killer] Terminated rogue ad tab ${tabId} (${url}) — Reason: ${reason}`);

      // Increment stats
      chrome.storage.local.get({ adblockBlockedCount: 0 }, (data) => {
        chrome.storage.local.set({ adblockBlockedCount: (data.adblockBlockedCount || 0) + 1 });
      });
      return true;
    } catch (_) {}
  }

  return false;
}

/**
 * Initializes the background popup killer engine
 */
export function initPopupBlocker() {
  if (typeof chrome === "undefined" || !chrome.webNavigation || !chrome.tabs) return;

  // 1. Intercept newly created navigation targets (spawned by an opener tab)
  chrome.webNavigation.onCreatedNavigationTarget.addListener(async (details) => {
    const { tabId, sourceTabId, url } = details;
    if (!tabId) return;

    let sourceHost = "";
    if (sourceTabId) {
      try {
        const sourceTab = await chrome.tabs.get(sourceTabId);
        if (sourceTab && sourceTab.url) {
          sourceHost = new URL(sourceTab.url).hostname.toLowerCase().replace(/^www\./, "");
        }
      } catch (_) {}
    }

    potentialPopups.set(tabId, {
      sourceTabId,
      sourceHost,
      initialUrl: url || "",
      createdAt: Date.now(),
    });

    if (url && url !== "about:blank") {
      await checkAndDestroyPopup(tabId, url, sourceTabId, sourceHost);
    }

    cleanExpiredEntries();
  });

  // 2. Intercept top-level navigation on the popup tab before network request
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0) return;
    const info = potentialPopups.get(details.tabId);
    if (!info) return;

    await checkAndDestroyPopup(details.tabId, details.url, info.sourceTabId, info.sourceHost);
  });

  // 3. Safety check on committed navigation (catches instant server redirects)
  chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return;
    const info = potentialPopups.get(details.tabId);
    if (!info) return;

    const destroyed = await checkAndDestroyPopup(details.tabId, details.url, info.sourceTabId, info.sourceHost);
    if (destroyed) {
      potentialPopups.delete(details.tabId);
    }
  });

  // 4. Clean up closed tabs
  chrome.tabs.onRemoved.addListener((tabId) => {
    potentialPopups.delete(tabId);
  });
}
