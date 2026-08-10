// Skip Wait - DOM Bypasser Content Script
const isChromeExtension = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

// ── State ────────────────────────────────────────────────────────────────────
// timersRunning tracks whether the setInterval loop is active.
// It is not easily stoppable once started (clearInterval needs the id), so we
// use a flag to make the inner loop a no-op when the module is toggled off,
// and store the interval id so it can be cleared on disable.
let timersIntervalId = null;

function startTimers() {
  if (timersIntervalId !== null) return; // already running
  timersIntervalId = setInterval(runBypassLoop, 800);
}

function stopTimers() {
  if (timersIntervalId !== null) {
    clearInterval(timersIntervalId);
    timersIntervalId = null;
  }
}

// ── Core bypass loop ─────────────────────────────────────────────────────────
function runBypassLoop() {
  const hostname = window.location.hostname.toLowerCase();

  // Scroll to bottom helper to satisfy scroll-detection scripts
  const triggerScroll = () => {
    window.scrollTo({
      top: document.body.scrollHeight || document.documentElement.scrollHeight,
      behavior: "instant"
    });
  };

  // 1. Direct domain-specific overrides
  if (hostname.includes("fc.lc") || hostname.includes("fc-lc.xyz")) {
    const submitBtn = document.querySelector("#submitBtn");
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click();
      return;
    }
  }

  if (hostname.includes("arolinks.com") || hostname.includes("deltastudy.site")) {
    const btn = document.getElementById("btn6") || document.getElementById("btn7") || document.querySelector("#link1s");
    if (btn && !btn.disabled) {
      btn.click();
      return;
    }
  }

  // 2. Generic rule matches for "Verify", "Scroll Down", "Continue" and "Get Link"
  const elements = document.querySelectorAll("button, a, input[type='button'], input[type='submit'], div[role='button']");

  elements.forEach((el) => {
    // Skip disabled or hidden components
    if (el.disabled || el.style.display === "none" || el.style.visibility === "hidden") return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const text = (el.innerText || el.textContent || el.value || "").trim().toLowerCase();
    const id = (el.id || "").toLowerCase();
    const className = (el.className || "").toLowerCase();

    // Step A: Verify/Captcha triggers
    if (
      text.includes("verify") ||
      text.includes("verification") ||
      text.includes("i'm not a robot") ||
      id.includes("verify") ||
      className.includes("verify")
    ) {
      if (!className.includes("share") && !className.includes("social")) {
        el.click();
      }
    }

    // Step B: Scroll Down & Continue triggers
    if (
      text.includes("scroll down") ||
      text.includes("continue") ||
      text.includes("double click") ||
      text.includes("next") ||
      text.includes("get link") ||
      id.includes("continue") ||
      id.includes("next") ||
      id.includes("btn") ||
      className.includes("btn-success")
    ) {
      triggerScroll();
      el.click();
    }
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function isHostnameAllowed(bypassDomains) {
  const hostname = window.location.hostname.toLowerCase();
  return bypassDomains.some(domain => hostname.includes(domain));
}

function initializeDOMBypasses() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startTimers);
  } else {
    startTimers();
  }
}

// ── Active-module gate ────────────────────────────────────────────────────────
// Read initial state from storage, then watch for real-time toggle changes.
// This mirrors the same pattern used in the InstaGrab content script.

if (isChromeExtension) {
  // Initial check: only start if timers module is enabled AND hostname is matched
  chrome.storage.local.get(["activeModules", "bypassDomains"], (result) => {
    const activeModules = result.activeModules || {};
    const domains = result.bypassDomains || [];

    if (activeModules.timers !== false && isHostnameAllowed(domains)) {
      initializeDOMBypasses();
    }
  });

  // Real-time toggle: responds instantly when the popup flips the switch
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;

    // Re-evaluate whenever activeModules or bypassDomains changes
    if (!changes.activeModules && !changes.bypassDomains) return;

    chrome.storage.local.get(["activeModules", "bypassDomains"], (result) => {
      const activeModules = result.activeModules || {};
      const domains = result.bypassDomains || [];
      const shouldRun = activeModules.timers !== false && isHostnameAllowed(domains);

      if (shouldRun && timersIntervalId === null) {
        initializeDOMBypasses(); // was off, now on
      } else if (!shouldRun && timersIntervalId !== null) {
        stopTimers(); // was on, now off
      }
    });
  });
}
