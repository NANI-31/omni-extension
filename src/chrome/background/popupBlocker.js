// Omni Extension — Background Popup & Popunder Destroyer Engine
// Inspired by AdBlock Plus (Eyeo GmbH) popup-blocker-service-worker.js
// Intercepts navigation targets at the browser level and terminates popup tabs
// via chrome.tabs.remove before they can render or distract the user.

const POPUP_CHECK_WINDOW_MS = 2500; // 2.5s window after in-page popup attempt
const recentPopupAttempts = new Map(); // sourceTabId -> timestamp
const potentialPopups = new Map(); // tabId -> { sourceTabId, sourceHost, createdAt, initialUrl }

// Known popup ad, popunder, and clickjacking network patterns
const POPUP_AD_PATTERNS = [
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
  /onclick\./i,
  /adcash\./i,
  /richpush\./i,
  /clickadu\./i,
  /juicyads\./i,
  /ero-advertising\./i,
  /trafficstars\./i,
  /yadro\.ru/i,
  /rotator\./i,
  /popunder/i,
  /popup/i,
  /doubleclick\.net/i,
  /googleads\./i,
  /googlesyndication\./i,
  /outbrain\./i,
  /taboola\./i,
  /revcontent\./i,
  /adnxs\./i,
  /openx\.net/i,
  /criteo\./i,
  /zeroredirect\./i,
  /tracking\./i,
  /affiliate\./i,
  /\/ad\//i,
  /\/ads\//i,
  /\/advert/i,
  /aff_id=/i,
  /campaign=/i,
  /utm_campaign=/i,
  /zoneid=/i,
  /clickid=/i,
  /subid=/i,
  /token=/i,
];

// Legitimate SSO & OAuth providers that should never be closed
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

function isAdUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return false;
  for (const pattern of POPUP_AD_PATTERNS) {
    if (pattern.test(urlStr)) return true;
  }
  return false;
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
 * Record an in-page popup attempt signaled from content script
 */
export function recordInPagePopupAttempt(sourceTabId) {
  if (!sourceTabId) return;
  recentPopupAttempts.set(sourceTabId, Date.now());
}

/**
 * Checks whether a newly created tab is an ad/popunder and terminates it
 */
async function checkAndDestroyPopup(tabId, url, sourceTabId, sourceHost) {
  if (!tabId || !url) return false;
  if (isAuthDomain(url)) return false;

  const urlLower = url.toLowerCase();
  let shouldDestroy = false;
  let reason = "";

  // 1. Direct match against known ad / popunder networks
  if (isAdUrl(urlLower)) {
    shouldDestroy = true;
    reason = "Matched known ad/popunder URL pattern";
  }

  // 2. Check if opener tab had an in-page popup attempt within the last 2.5 seconds
  if (!shouldDestroy && sourceTabId && recentPopupAttempts.has(sourceTabId)) {
    const attemptTime = recentPopupAttempts.get(sourceTabId);
    if (Date.now() - attemptTime < POPUP_CHECK_WINDOW_MS) {
      try {
        const parsed = new URL(url);
        const targetHost = parsed.hostname.toLowerCase().replace(/^www\./, "");
        if (targetHost && sourceHost && targetHost !== sourceHost && !isAuthDomain(url)) {
          shouldDestroy = true;
          reason = `Spawned during active popup attempt from ${sourceHost} to ${targetHost}`;
        }
      } catch (_) {}
    }
  }

  // 3. High-risk cross-origin popup check
  if (!shouldDestroy && sourceHost) {
    try {
      const parsed = new URL(url);
      const targetHost = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (
        targetHost &&
        targetHost !== sourceHost &&
        !isAuthDomain(url) &&
        (urlLower.includes("redirect") ||
          urlLower.includes("click") ||
          urlLower.includes("track") ||
          urlLower.includes("aff_") ||
          urlLower.includes("zone") ||
          urlLower.includes("banner"))
      ) {
        shouldDestroy = true;
        reason = `Suspicious cross-origin redirect from ${sourceHost} to ${targetHost}`;
      }
    } catch (_) {}
  }

  if (shouldDestroy) {
    potentialPopups.delete(tabId);
    try {
      await chrome.tabs.remove(tabId);
      console.log(`[AdShield Popup Killer] Terminated popup tab ${tabId} (${url}) — Reason: ${reason}`);

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
