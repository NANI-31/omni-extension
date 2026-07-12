// Skip Wait - DOM Bypasser Content Script
const isChromeExtension = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

if (isChromeExtension) {
  chrome.storage.local.get(["activeModules", "bypassDomains"], (result) => {
    const activeModules = result.activeModules || {};
    const domains = result.bypassDomains || [];
    
    if (activeModules.timers) {
      const hostname = window.location.hostname.toLowerCase();
      const isMatched = domains.some(domain => hostname.includes(domain));
      if (isMatched) {
        initializeDOMBypasses();
      }
    }
  });
}

function initializeDOMBypasses() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runDOMBypasses);
  } else {
    runDOMBypasses();
  }
}

// Code running in the content script isolated context (fully compliant with CSP)
function runDOMBypasses() {
  const hostname = window.location.hostname.toLowerCase();

  // Scroll to bottom helper to satisfy scroll-detection scripts
  const triggerScroll = () => {
    window.scrollTo({
      top: document.body.scrollHeight || document.documentElement.scrollHeight,
      behavior: "instant"
    });
  };

  // Continuous auto-clicking loop
  setInterval(() => {
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
  }, 800); // Poll every 800ms for swift actions
}
