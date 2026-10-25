// Omni Extension — MAIN World AdShield Engine (Ultra-Secure Popup & Popunder Blocker)
// Runs in the webpage execution context ("world": "MAIN") at document_start.
// Enforces zero-tolerance popup suppression:
// 1. Intercepts window.open across all windows and iframes, returning a Decoy Window Proxy.
// 2. Traps blank/delayed window.open popunders and neutralizes late location.href assignments.
// 3. Destroys transparent clickjacking overlays and full-screen trap backdrops.
// 4. Neutralizes synthetic and physical clicks on third-party <a target="_blank"> popups.
// 5. Defuses outstream floating video players and anti-adblock detection routines.

(function () {
  "use strict";

  if (window.__omni_main_shield_injected__) return;
  window.__omni_main_shield_injected__ = true;

  let isShieldActive = true;
  const currentHost = window.location.hostname.toLowerCase().replace(/^www\./, "");

  // Exclude YouTube entirely — YouTube has its own dedicated, optimized AdShield engine
  // Running popup/clickjack heuristics and global honeypots on YouTube triggers anti-adblock canaries
  // and intercepts legit player clicks/overlays.
  if (currentHost.includes("youtube.com") || currentHost.includes("youtube-nocookie.com")) {
    return;
  }

  // Check initial state from sessionStorage or DOM attribute
  try {
    const storedState = sessionStorage.getItem("omni_adblock_enabled");
    if (storedState === "false") {
      isShieldActive = false;
    }
  } catch (_) {}

  // Synchronize configuration from isolated content script in real-time
  document.addEventListener("omni-adblock-config", (e) => {
    if (e.detail && typeof e.detail.enabled === "boolean") {
      isShieldActive = e.detail.enabled;
    }
  });

  // ── 1. Anti-Adblock Defuser (Fool detection scripts) ──────────────────────────
  try {
    Object.defineProperty(window, "canRunAds", { value: true, writable: true, configurable: true });
    Object.defineProperty(window, "isAdBlockActive", { value: false, writable: true, configurable: true });
    Object.defineProperty(window, "adblock", { value: false, writable: true, configurable: true });
    Object.defineProperty(window, "google_ad_status", { value: 1, writable: true, configurable: true });
  } catch (_) {}

  // ── 2. Authorized SSO / OAuth Providers (Always Permitted) ───────────────────
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

  function isKnownAdUrl(urlStr) {
    if (!urlStr || typeof urlStr !== "string") return false;
    for (const pattern of KNOWN_POPUP_AD_DOMAINS) {
      if (pattern.test(urlStr)) return true;
    }
    return false;
  }

  function isAuthUrl(urlStr) {
    if (!urlStr || typeof urlStr !== "string") return false;
    const lower = urlStr.toLowerCase();
    return AUTH_DOMAINS.some((auth) => lower.includes(auth));
  }

  function isSameOriginUrl(urlStr) {
    if (!urlStr || typeof urlStr !== "string") return false;
    const trimmed = urlStr.trim();
    if (!trimmed || trimmed === "about:blank" || trimmed.startsWith("javascript:")) return false;
    try {
      const parsed = new URL(trimmed, window.location.href);
      const targetHost = parsed.hostname.toLowerCase().replace(/^www\./, "");
      return targetHost === currentHost;
    } catch (_) {
      return false;
    }
  }

  // ── 3. Decoy Window Proxy Factory ───────────────────────────────────────────
  // Ad scripts call win.focus(), win.location.href = ..., win.document.write(...)
  // The Decoy Proxy absorbs all operations without opening an actual window or tab.
  function createDecoyWindow(requestedUrl) {
    let isClosed = false;

    const fakeLocation = new Proxy(
      {
        href: requestedUrl || "about:blank",
        assign: () => {},
        replace: () => {},
        reload: () => {},
        toString: () => requestedUrl || "about:blank",
      },
      {
        set(target, prop, value) {
          // Trap late location redirect attempts (e.g. win.location.href = adUrl)
          window.postMessage({ type: "OMNI_ADBLOCK_POPUP_BLOCKED", url: String(value) }, "*");
          return true;
        },
      }
    );

    const fakeDocument = {
      location: fakeLocation,
      defaultView: null,
      cookie: "",
      open: () => {},
      write: () => {},
      writeln: () => {},
      close: () => {},
      createElement: () => ({
        style: {},
        setAttribute: () => {},
        appendChild: () => {},
        remove: () => {},
      }),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { appendChild: () => {}, removeChild: () => {} },
      head: { appendChild: () => {}, removeChild: () => {} },
    };

    const fakeHistory = {
      length: 0,
      state: null,
      scrollRestoration: "auto",
      back: () => {},
      forward: () => {},
      go: () => {},
      pushState: () => {},
      replaceState: () => {},
    };

    const decoy = new Proxy(Object.create(null), {
      get(target, prop, receiver) {
        if (prop === "closed") return isClosed;
        if (prop === "close") return () => { isClosed = true; };
        if (prop === "opener") return window;
        if (prop === "frameElement") return null;
        if (
          prop === "parent" ||
          prop === "top" ||
          prop === "self" ||
          prop === "window" ||
          prop === "globalThis" ||
          prop === "frames"
        ) {
          return receiver;
        }
        if (prop === "location") return fakeLocation;
        if (prop === "document") return fakeDocument;
        if (prop === "history") return fakeHistory;
        if (prop === Symbol.toStringTag) return "Window";
        if (prop === "focus" || prop === "blur" || prop === "postMessage" || prop === "print") {
          return () => {};
        }

        try {
          const val = window[prop];
          if (typeof val === "function") return () => {};
          return val !== undefined ? val : undefined;
        } catch (_) {
          return undefined;
        }
      },
      set(target, prop) {
        return true;
      },
      has(target, prop) {
        return prop in window;
      },
    });

    fakeDocument.defaultView = decoy;
    return decoy;
  }

  // ── 4. Airtight window.open Interceptor ──────────────────────────────────────
  const originalOpen = window.open;

  function interceptOpen(url, target, features) {
    if (!isShieldActive) {
      return originalOpen.apply(this, arguments);
    }

    const urlStr = typeof url === "string" ? url.trim() : (url ? String(url).trim() : "");

    // 1. Block verified ad and popunder delivery networks
    if (urlStr && isKnownAdUrl(urlStr)) {
      window.postMessage({ type: "OMNI_ADBLOCK_POPUP_BLOCKED", url: urlStr }, "*");
      window.postMessage({ type: "OMNI_ADBLOCK_POPUP_ATTEMPT" }, "*");
      return createDecoyWindow(urlStr);
    }

    // 2. Allow all legitimate user-initiated and application window.open calls
    return originalOpen.apply(this, arguments);
  }

  // Hook both window.open and Window.prototype.open
  try {
    Object.defineProperty(window, "open", {
      value: interceptOpen,
      writable: true,
      configurable: true,
    });
  } catch (_) {
    window.open = interceptOpen;
  }

  try {
    if (window.Window && window.Window.prototype) {
      Object.defineProperty(window.Window.prototype, "open", {
        value: interceptOpen,
        writable: true,
        configurable: true,
      });
    }
  } catch (_) {}

  // ── 5. Fullscreen Overlay & Clickjacking Defuser ─────────────────────────────
  function isClickTrapOverlay(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    try {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const isPositioned = style.position === "fixed" || style.position === "absolute";
      const zIndex = parseInt(style.zIndex, 10);
      const spansScreen =
        rect.width >= window.innerWidth * 0.7 && rect.height >= window.innerHeight * 0.7;

      if (isPositioned && spansScreen && (zIndex >= 100 || isNaN(zIndex) === false && zIndex > 9999)) {
        const opacity = parseFloat(style.opacity);
        const isTransparent =
          opacity < 0.1 ||
          style.backgroundColor === "transparent" ||
          style.backgroundColor === "rgba(0, 0, 0, 0)";
        const textLen = (el.innerText || "").trim().length;
        if (isTransparent || textLen < 15) {
          return true;
        }
      }

      // Check if overlay covers a video player
      const video = document.querySelector("video");
      if (video && isPositioned && zIndex >= 10) {
        const vRect = video.getBoundingClientRect();
        const coversVideo =
          rect.left <= vRect.left + 50 &&
          rect.top <= vRect.top + 50 &&
          rect.width >= vRect.width * 0.7 &&
          rect.height >= vRect.height * 0.7;
        if (coversVideo && !el.contains(video)) {
          const textLen = (el.innerText || "").trim().length;
          if (textLen < 15) return true;
        }
      }
    } catch (_) {}
    return false;
  }

  // Intercept all clicks at the highest capture phase
  window.addEventListener(
    "click",
    function (event) {
      if (!isShieldActive) return;

      const path = event.composedPath ? event.composedPath() : [event.target];
      const target = event.target;

      // 1. Trap and destroy transparent clickjacking overlays
      if (isClickTrapOverlay(target)) {
        event.stopImmediatePropagation();
        event.preventDefault();

        try {
          target.remove();
        } catch (_) {
          target.style.setProperty("display", "none", "important");
          target.style.setProperty("pointer-events", "none", "important");
        }

        window.postMessage({ type: "OMNI_ADBLOCK_POPUP_BLOCKED", url: "clickjack-overlay" }, "*");
        window.postMessage({ type: "OMNI_ADBLOCK_POPUP_ATTEMPT" }, "*");

        // Re-click the legitimate underlying element
        setTimeout(() => {
          try {
            const elements = document.elementsFromPoint(event.clientX, event.clientY);
            const realElement = elements.find((el) => el !== target && !isClickTrapOverlay(el));
            if (realElement && typeof realElement.click === "function") {
              realElement.click();
            }
          } catch (_) {}
        }, 15);
        return;
      }

      // 2. Intercept clickjacking trap overlays masquerading as <a> tags or verified ad domains
      for (const node of path) {
        if (node && node.tagName === "A") {
          const href = node.getAttribute("href") || node.href || "";
          const isTrap = isClickTrapOverlay(node) || isKnownAdUrl(href);
          if (isTrap) {
            event.stopImmediatePropagation();
            event.preventDefault();
            window.postMessage({ type: "OMNI_ADBLOCK_POPUP_BLOCKED", url: href }, "*");
            window.postMessage({ type: "OMNI_ADBLOCK_POPUP_ATTEMPT" }, "*");
            try { node.remove(); } catch (_) {}
            return;
          }
        }
      }
    },
    true
  );

  // ── 6. Neutralize Programmatic Ad Network Clickjacking ───────────────────────
  try {
    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (isShieldActive) {
        const href = this.getAttribute("href") || this.href;
        if (href && isKnownAdUrl(href)) {
          window.postMessage({ type: "OMNI_ADBLOCK_POPUP_BLOCKED", url: href }, "*");
          window.postMessage({ type: "OMNI_ADBLOCK_POPUP_ATTEMPT" }, "*");
          return;
        }
      }
      return originalAnchorClick.apply(this, arguments);
    };
  } catch (_) {}

  // ── 7. Neutralize Synthetic Event Dispatching on Ad Anchors ──────────────────
  try {
    const originalDispatch = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function (event) {
      if (isShieldActive && event && event.type === "click" && this instanceof HTMLAnchorElement) {
        const href = this.getAttribute("href") || this.href;
        if (href && isKnownAdUrl(href)) {
          window.postMessage({ type: "OMNI_ADBLOCK_POPUP_BLOCKED", url: href }, "*");
          window.postMessage({ type: "OMNI_ADBLOCK_POPUP_ATTEMPT" }, "*");
          return false;
        }
      }
      return originalDispatch.apply(this, arguments);
    };
  } catch (_) {}

  // ── 8. Neutralize Form Submissions with target="_blank" ──────────────────────
  try {
    const originalFormSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function () {
      if (isShieldActive) {
        const target = this.getAttribute("target") || this.target;
        const action = this.getAttribute("action") || this.action;
        if (target === "_blank" && action && !isSameOriginUrl(action) && !isAuthUrl(action)) {
          window.postMessage({ type: "OMNI_ADBLOCK_POPUP_BLOCKED", url: action }, "*");
          window.postMessage({ type: "OMNI_ADBLOCK_POPUP_ATTEMPT" }, "*");
          return;
        }
      }
      return originalFormSubmit.apply(this, arguments);
    };
  } catch (_) {}

  // ── 9. Outstream Video Ad Neutralization ──────────────────────────────────────
  try {
    const OUTSTREAM_SELECTORS = [
      ".primis_container",
      "#primis_player",
      "[id*='connatix']",
      "[class*='cnx-']",
      "[id*='aniview']",
      "[class*='aniview']",
      ".playwire-video",
      "[id*='playwire']",
      ".teads-inread",
      "[id*='teads']",
      "[class*='brid-']",
      "[id*='vdo_container']",
      ".floating-video-ad",
      ".sticky-video-ad",
      "div[data-ad-type='video']",
    ];

    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!isShieldActive) {
        return originalPlay.apply(this, arguments);
      }

      const isOutstreamAd = OUTSTREAM_SELECTORS.some((sel) => {
        try {
          return this.closest(sel) !== null;
        } catch (_) {
          return false;
        }
      });

      if (isOutstreamAd) {
        try {
          this.muted = true;
          this.pause();
          const container = this.closest(OUTSTREAM_SELECTORS.join(","));
          if (container) {
            container.style.setProperty("display", "none", "important");
            container.style.setProperty("height", "0", "important");
            container.style.setProperty("pointer-events", "none", "important");
          }
        } catch (_) {}
        return Promise.resolve();
      }

      return originalPlay.apply(this, arguments);
    };
  } catch (_) {}
})();
