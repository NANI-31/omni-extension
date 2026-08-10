// PinterestGrab — Pinterest Media Downloader Content Script
//
// Strategy: scan <a href="/pin/..."> elements that CONTAIN an <img>.
// That is definitively the pin image link (not a text link or description).
// Walking down from the definitive source avoids all the false-positive
// profile avatars / ads that have no /pin/ ancestor.

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLE_ID = "pinterestgrab-styles";
const DBG = (...a) => console.log("[PGrab]", ...a);

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .pgrab-btn-wrap {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      opacity: 0;
      transition: opacity 0.18s ease;
      pointer-events: none;
    }
    [data-pgrab-card]:hover .pgrab-btn-wrap {
      opacity: 1 !important;
      pointer-events: auto;
    }
    .pgrab-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 9px 9px;
      background: rgba(0,0,0,0.82);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      cursor: pointer;
      backdrop-filter: blur(4px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      transition: background 0.15s, transform 0.12s;
      white-space: nowrap;
      line-height: 1;
    }
    .pgrab-btn:hover { background: rgba(230,0,35,0.92) !important; transform: scale(1.05); }
    .pgrab-btn:active { transform: scale(0.96); }
    .pgrab-btn svg { width: 20px; height: 20px; flex-shrink: 0; }
    /* Detail page full-width button */
    .pgrab-detail-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      width: 100%;
      margin-top: 12px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #e60023, #ad081b);
      color: #fff;
      border: none;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(230,0,35,0.35);
      transition: background 0.15s, transform 0.12s;
    }
    .pgrab-detail-btn:hover { background: linear-gradient(135deg, #ad081b, #8c0615); transform: translateY(-1px); }
    @keyframes pgrab-spin { to { transform: rotate(360deg); } }
    .pgrab-spin { animation: pgrab-spin 0.8s linear infinite; display:inline-flex; }
  `;
  document.head.appendChild(style);
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const DOWNLOAD_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13M7 11l5 5 5-5"/><path d="M5 21h14"/></svg>`;
const SPIN_SVG = `<svg x="0px" y="0px" fill="white" width="100" height="100" viewBox="0 0 50 50">
<path d="M 25 2 A 2.0002 2.0002 0 1 0 25 6 C 35.517124 6 44 14.482876 44 25 C 44 35.517124 35.517124 44 25 44 C 14.482876 44 6 35.517124 6 25 C 6 19.524201 8.3080175 14.608106 12 11.144531 L 12 15 A 2.0002 2.0002 0 1 0 16 15 L 16 4 L 5 4 A 2.0002 2.0002 0 1 0 5 8 L 9.5253906 8 C 4.9067015 12.20948 2 18.272325 2 25 C 2 37.678876 12.321124 48 25 48 C 37.678876 48 48 37.678876 48 25 C 48 12.321124 37.678876 2 25 2 z"></path>
</svg>`;
const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;

// ── URL helpers ───────────────────────────────────────────────────────────────
let preferredResolution = "originals";

chrome.storage.local.get(["pinterestResolution"], (r) => {
  if (r.pinterestResolution) preferredResolution = r.pinterestResolution;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.pinterestResolution) {
    preferredResolution = changes.pinterestResolution.newValue || "originals";
  }
});

function buildFallbackUrls(src) {
  if (!src || !src.includes("pinimg.com")) return src ? [src] : [];
  if (!SIZE_RE.test(src)) return [src]; // already originals or unknown size

  const target = `/${preferredResolution}/`;
  const defaultChain = ["/originals/", "/1200x/", "/736x/"];
  const chain = [target, ...defaultChain.filter((r) => r !== target)];

  const urls = chain.map((r) => src.replace(SIZE_RE, r));
  urls.push(src);
  return Array.from(new Set(urls));
}

/** Picks the best URL from an <img>: checks src, srcset, data-src. */
function imgBestSrc(img) {
  if (img.src?.includes("pinimg.com")) return img.src;
  if (img.srcset) {
    // srcset: "url 1x, url 2x, ..." — take the LAST (highest-res)
    const entries = img.srcset.split(",").map((e) => e.trim().split(/\s+/)[0]);
    const pinEntries = entries.filter((u) => u.includes("pinimg.com"));
    if (pinEntries.length) return pinEntries[pinEntries.length - 1];
  }
  if (img.dataset?.src?.includes("pinimg.com")) return img.dataset.src;
  return null;
}

async function resolveUrl(candidates) {
  for (const url of candidates) {
    try {
      const r = await fetch(url, {
        method: "HEAD",
        mode: "cors",
        cache: "no-store",
      });
      if (r.ok) return url;
    } catch {
      /* CORS or network — try next */
    }
  }
  return candidates[candidates.length - 1]; // always return something
}

/** Extract best media from a pin card element. */
async function extractMedia(cardEl) {
  // 1. Video (Pinterest video pins)
  const video = cardEl.querySelector("video");
  if (video) {
    // Try direct src
    const vsrc = video.currentSrc || video.src;
    if (vsrc && !vsrc.startsWith("blob:"))
      return { url: vsrc, ext: "mp4", type: "video" };
    // Try <source> children
    for (const src of video.querySelectorAll("source")) {
      if (src.src && !src.src.startsWith("blob:"))
        return { url: src.src, ext: "mp4", type: "video" };
    }
  }

  // 2. Image — search for pinimg.com images inside card
  const imgs = cardEl.querySelectorAll("img");
  let bestSrc = null;
  let bestWidth = 0;
  for (const img of imgs) {
    const src = imgBestSrc(img);
    if (!src) continue;
    const w = img.naturalWidth || img.width || 0;
    if (w > bestWidth) {
      bestWidth = w;
      bestSrc = src;
    }
    if (!bestSrc) bestSrc = src; // at least take first
  }

  if (!bestSrc) return null;

  const candidates = buildFallbackUrls(bestSrc);
  const url = await resolveUrl(candidates);
  const raw = url.split("?")[0].split(".").pop()?.toLowerCase();
  const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(raw) ? raw : "jpg";
  return { url, ext, type: "image" };
}

// ── Filename helpers ──────────────────────────────────────────────────────────
function pinIdFromHref(href) {
  const m = href?.match(/\/pin\/(\d+)/);
  return m ? m[1] : null;
}

function pinIdFromUrl() {
  const m = window.location.pathname.match(/\/pin\/(\d+)/);
  return m ? m[1] : Date.now().toString();
}

// ── Download via background ───────────────────────────────────────────────────
async function downloadMedia(url, filename) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "DOWNLOAD_MEDIA",
        url,
        filename,
        meta: {
          username: "pinterest",
          postId: filename,
          mediaType: "image",
          thumbnailUrl: "",
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          DBG(
            "DOWNLOAD_MEDIA channel error (popup may have closed):",
            chrome.runtime.lastError.message,
          );
          resolve(false);
          return;
        }
        resolve(response?.success ?? false);
      },
    );
  });
}

// ── Find card wrapper from a pin link ─────────────────────────────────────────
/**
 * Given an <a href="/pin/..."> that contains an <img>, walk UP to find
 * the outermost card div that makes sense as the hover target.
 *
 * Pinterest's card structure (simplified):
 *   div.card [position:relative, overflow:hidden]  ← we want this
 *     div.inner
 *       a href="/pin/123"
 *         img (the pin image)
 *
 * We walk up max 6 levels and return the first element that:
 *   - Is a DIV or ARTICLE
 *   - Has rendered size > 80×80px
 *   - Is relatively or absolutely positioned (so our absolute button works)
 */
function findCardWrapper(pinLink) {
  let el = pinLink.parentElement;
  let firstBigEnough = null;

  for (let i = 0; i < 6 && el; i++) {
    const tag = el.tagName;
    if (tag === "BODY" || tag === "HTML") break;

    const rect = el.getBoundingClientRect();
    const pos = getComputedStyle(el).position;

    if (rect.width > 80 && rect.height > 80) {
      firstBigEnough = el;
      if (pos === "relative" || pos === "absolute") return el;
    }
    el = el.parentElement;
  }

  // Nothing was relative-positioned — use the first big enough element anyway
  // (we'll force position:relative on it in injectButton)
  return firstBigEnough;
}

// ── Button injection ──────────────────────────────────────────────────────────
function injectButton(cardEl, pinId) {
  if (cardEl.dataset.pgrabCard) return; // already done
  cardEl.dataset.pgrabCard = pinId;

  // Ensure the card is positioned so our absolute child is contained
  const pos = getComputedStyle(cardEl).position;
  if (pos === "static") cardEl.style.position = "relative";

function setSafeHTML(element, html) {
  if (!element) return;
  if (window.trustedTypes && typeof window.trustedTypes.createPolicy === "function") {
    try {
      if (!window.__omniTrustedPolicy) {
        window.__omniTrustedPolicy = window.trustedTypes.createPolicy("omniPolicy", {
          createHTML: (s) => s,
        });
      }
      element.innerHTML = window.__omniTrustedPolicy.createHTML(html);
      return;
    } catch (e) {}
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    element.replaceChildren(...doc.body.childNodes);
  } catch (err) {
    try {
      element.innerHTML = html;
    } catch (e) {}
  }
}

  const wrap = document.createElement("div");
  wrap.className = "pgrab-btn-wrap";

  const btn = document.createElement("button");
  btn.className = "pgrab-btn";
  btn.title = "Download with PinterestGrab";
  setSafeHTML(btn, `${DOWNLOAD_SVG}`);
  wrap.appendChild(btn);
  cardEl.appendChild(wrap);

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (btn.dataset.busy) return;
    btn.dataset.busy = "1";
    const orig = DOWNLOAD_SVG;
    setSafeHTML(btn, `<span class="pgrab-spin">${SPIN_SVG}</span>`);

    try {
      const media = await extractMedia(cardEl);
      if (!media) throw new Error("No media found");
      const filename = `pinterest_${pinId}.${media.ext}`;
      const ok = await downloadMedia(media.url, filename);
      setSafeHTML(btn, ok ? `${CHECK_SVG}<span>Saved!</span>` : `<span>⚠ Failed</span>`);
    } catch (err) {
      DBG("Download error:", err.message);
      setSafeHTML(btn, `<span>⚠ Error</span>`);
    } finally {
      setTimeout(() => {
        setSafeHTML(btn, orig);
        delete btn.dataset.busy;
      }, 2300);
    }
  });
}

// ── Detail page button (/pin/xxx/) ────────────────────────────────────────────
function injectDetailButton() {
  if (document.getElementById("pgrab-detail-btn")) return;

  const pinId = pinIdFromUrl();

  // Ordered list of selectors to find the image/video container
  const anchors = [
    '[data-test-id="pin-detail-image"]',
    '[data-test-id="pin-closeup-image"]',
    'section img[src*="pinimg.com"]',
    'article img[src*="pinimg.com"]',
    'div[role="main"] img[src*="pinimg.com"]',
  ];

  let anchor = null;
  for (const sel of anchors) {
    const el = document.querySelector(sel);
    if (el) {
      anchor = el.tagName === "IMG" ? el.parentElement : el;
      break;
    }
  }

  if (!anchor) {
    // Pinterest detail pages load lazily — retry
    setTimeout(injectDetailButton, 1200);
    return;
  }

  const btn = document.createElement("button");
  btn.id = "pgrab-detail-btn";
  btn.className = "pgrab-detail-btn";
  setSafeHTML(btn, `${DOWNLOAD_SVG} Download`);

  btn.addEventListener("click", async () => {
    if (btn.dataset.busy) return;
    btn.dataset.busy = "1";
    const orig = `${DOWNLOAD_SVG} Download`;
    setSafeHTML(btn, `<span class="pgrab-spin">⟳</span> Downloading…`);
    try {
      const root = document.querySelector('[role="main"]') || document.body;
      const media = await extractMedia(root);
      if (!media) throw new Error("No media found");
      const filename = `pinterest_${pinId}.${media.ext}`;
      const ok = await downloadMedia(media.url, filename);
      setSafeHTML(btn, ok ? `${CHECK_SVG} Saved!` : `⚠ Download failed`);
    } catch (err) {
      DBG("Detail error:", err.message);
      setSafeHTML(btn, `⚠ Error`);
    } finally {
      setTimeout(() => {
        setSafeHTML(btn, orig);
        delete btn.dataset.busy;
      }, 2500);
    }
  });

  anchor.insertAdjacentElement("afterend", btn);
  DBG("Detail button injected, pin:", pinId);
}

// ── DOM scanner ───────────────────────────────────────────────────────────────
let scanCount = 0;

function scanPins() {
  scanCount++;

  // ── Key insight: select ONLY <a href="/pin/..."> that directly CONTAIN an img.
  // These are definitively the pin image links — not description/title links.
  // The [data-pgrab-link] attribute prevents re-processing the same link.
  const pinImageLinks = document.querySelectorAll(
    'a[href*="/pin/"]:not([data-pgrab-link])',
  );

  let injected = 0;
  pinImageLinks.forEach((link) => {
    // Only care about links that wrap an image (the pin image link)
    const img = link.querySelector("img");
    if (!img) {
      // Mark text/description pin links so we don't re-query them
      link.dataset.pgrabLink = "skip";
      return;
    }

    link.dataset.pgrabLink = "done";

    const pinId = pinIdFromHref(link.getAttribute("href"));
    if (!pinId) return;

    const card = findCardWrapper(link);
    if (!card) return;
    if (card.dataset.pgrabCard) return; // already injected for this card

    injectButton(card, pinId);
    injected++;
  });

  if (injected > 0) DBG(`scan #${scanCount}: injected ${injected} buttons`);

  // Detail page
  if (window.location.pathname.includes("/pin/")) injectDetailButton();
}

// ── Active-module gate ────────────────────────────────────────────────────────
let pinterestEnabled = true;
let isObserving = false;
let scanTimeout = null;

const observer = new MutationObserver(() => {
  if (!pinterestEnabled) return;
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = setTimeout(scanPins, 400);
});

function enablePinterest() {
  pinterestEnabled = true;
  if (isObserving) return;
  injectStyles();
  isObserving = true;
  observer.observe(document.body, { childList: true, subtree: true });
  scanPins();
  DBG("enabled — observing");
}

function disablePinterest() {
  pinterestEnabled = false;
  observer.disconnect();
  isObserving = false;
  if (scanTimeout) {
    clearTimeout(scanTimeout);
    scanTimeout = null;
  }
  document
    .querySelectorAll(".pgrab-btn-wrap, #pgrab-detail-btn")
    .forEach((el) => el.remove());
  document
    .querySelectorAll("[data-pgrab-card]")
    .forEach((el) => delete el.dataset.pgrabCard);
  document
    .querySelectorAll("[data-pgrab-link]")
    .forEach((el) => delete el.dataset.pgrabLink);
  document.getElementById(STYLE_ID)?.remove();
  DBG("disabled");
}

// Real-time toggle
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.activeModules) return;
  const wasOn = !!changes.activeModules.oldValue?.pinterest;
  const isOn = !!changes.activeModules.newValue?.pinterest;
  if (isOn && !wasOn) enablePinterest();
  if (!isOn && wasOn) disablePinterest();
});

// Bootstrap
chrome.storage.local.get(["activeModules"], (result) => {
  const mods = result.activeModules || {};
  pinterestEnabled = mods.pinterest !== false; // true if absent (default on)
  DBG(
    "init: pinterest enabled =",
    pinterestEnabled,
    "| storage:",
    JSON.stringify(mods),
  );

  if (pinterestEnabled) {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      enablePinterest();
    } else {
      window.addEventListener("load", enablePinterest);
    }
  }
});

// SPA navigation watcher
let lastPathname = location.pathname;
setInterval(() => {
  if (location.pathname !== lastPathname) {
    lastPathname = location.pathname;
    document.getElementById("pgrab-detail-btn")?.remove();
    if (pinterestEnabled) setTimeout(scanPins, 800);
  }
}, 500);
