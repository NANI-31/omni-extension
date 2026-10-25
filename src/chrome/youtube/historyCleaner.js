// YouTube History Quick Delete Module
// Only activates on youtube.com/feed/history.

export function initYoutubeHistoryDelete(isContextValid) {
  if (typeof window === "undefined" || window.hasYTHistoryDeleteInjected) return;
  window.hasYTHistoryDeleteInjected = true;

  if (!window.location.hostname.includes("youtube.com")) return;

  let hdEnabled = true;
  let hdDebug = false;

  function hdLog(...args) {
    if (hdDebug) console.log("[YT History Delete]", ...args);
  }

  function loadHDSettings() {
    if (!isContextValid()) return;
    try {
      chrome.storage.local.get(
        { ytHistoryDeleteEnabled: true, ytHistoryDeleteDebug: false },
        (data) => {
          if (chrome.runtime?.lastError || !isContextValid() || !data) return;
          hdEnabled = data.ytHistoryDeleteEnabled;
          hdDebug = data.ytHistoryDeleteDebug;
        }
      );
    } catch (_) {}
  }
  loadHDSettings();

  try {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, ns) => {
        if (!isContextValid()) return;
        try {
          if (ns === "local") {
            if (changes.ytHistoryDeleteEnabled) hdEnabled = changes.ytHistoryDeleteEnabled.newValue;
            if (changes.ytHistoryDeleteDebug) hdDebug = changes.ytHistoryDeleteDebug.newValue;
          }
        } catch (_) {}
      });
    }
  } catch (_) {}

  /* ── DOM helpers ─────────────────────────────────────────────────── */
  function hdFindClosest(el, selector) {
    if (!el) return null;
    try {
      const m = el.closest(selector);
      if (m) return m;
    } catch (e) {}
    let cur = el;
    while (cur) {
      if (cur.nodeType === Node.ELEMENT_NODE && cur.matches && cur.matches(selector)) return cur;
      cur = cur.parentNode || (cur.getRootNode && cur.getRootNode().host);
    }
    return null;
  }

  function hdQueryShadow(parent, selector) {
    if (!parent) return null;
    try {
      const m = parent.querySelector(selector);
      if (m) return m;
    } catch (e) {}
    if (parent.shadowRoot) {
      try {
        const m = parent.shadowRoot.querySelector(selector);
        if (m) return m;
      } catch (e) {}
    }
    const children = parent.querySelectorAll ? parent.querySelectorAll("*") : [];
    for (const child of children) {
      if (child.shadowRoot) {
        const r = hdQueryShadow(child.shadowRoot, selector);
        if (r) return r;
      }
    }
    return null;
  }

  function hdQueryShadowAll(parent, selector, results = []) {
    if (!parent) return results;
    try {
      parent.querySelectorAll(selector).forEach((m) => results.push(m));
    } catch (e) {}
    if (parent.shadowRoot) {
      try {
        hdQueryShadowAll(parent.shadowRoot, selector, results);
      } catch (e) {}
    }
    try {
      for (const child of parent.querySelectorAll("*")) {
        if (child.shadowRoot) hdQueryShadowAll(child.shadowRoot, selector, results);
      }
    } catch (e) {}
    return results;
  }

  function hdExtractVideoTitle(videoItem) {
    const titleSelectors = [
      ".yt-lockup-metadata-view-model__title",
      ".yt-lockup-metadata-view-model__title a",
      "#video-title",
      "yt-formatted-string#video-title",
      "a.ytd-rich-grid-media #video-title",
      ".ytd-reel-item-renderer #video-title",
      "h3.ytd-rich-grid-media",
      "h3 a",
      "[class*='title'] a",
      "[class*='title']",
    ];
    for (const sel of titleSelectors) {
      try {
        const el = hdQueryShadow(videoItem, sel);
        if (el) {
          const t = (el.getAttribute("title") || el.textContent || "").trim();
          if (t && t.length > 2 && t.length < 300) return t;
        }
      } catch (e) {}
    }
    const links = hdQueryShadowAll(videoItem, "a[href*='watch?v='], a[href*='/shorts/']");
    for (const link of links) {
      const t = (link.getAttribute("aria-label") || link.getAttribute("title") || "").trim();
      if (t && t.length > 2 && t.length < 300) return t;
    }
    return null;
  }

  function hdFindMenuButton(videoItem) {
    const selectors = [
      ".yt-lockup-metadata-view-model__menu-button button",
      ".yt-lockup-metadata-view-model__menu-button",
      ".ytLockupMetadataViewModelMenuButton button",
      ".ytLockupMetadataViewModelMenuButton",
      'button[aria-label*="menu" i]',
      'button[aria-label*="action" i]',
      'button[aria-label*="option" i]',
      '[aria-label*="Action menu" i]',
      "ytd-menu-renderer button",
      "ytd-menu-renderer yt-icon-button",
      "ytd-menu-renderer #button",
      'yt-icon-button[aria-label*="menu" i]',
      "yt-icon-button",
      "button#button",
      ".yt-icon-button",
      "button",
    ];
    for (const sel of selectors) {
      try {
        const el = hdQueryShadow(videoItem, sel);
        if (el) return el;
      } catch (e) {}
    }
    const all = hdQueryShadowAll(videoItem, "button, [role='button'], yt-icon-button");
    for (const btn of all) {
      const cls = Array.from(btn.classList).join(" ").toLowerCase();
      const id = btn.id.toLowerCase();
      const lbl = (btn.getAttribute("aria-label") || "").toLowerCase();
      if (
        lbl.includes("menu") ||
        lbl.includes("action") ||
        lbl.includes("option") ||
        lbl.includes("more") ||
        cls.includes("menu") ||
        cls.includes("button-shape") ||
        id.includes("button")
      ) {
        return btn;
      }
    }
    return all.length > 0 ? all[0] : null;
  }

  function hdFindRemoveMenuItem() {
    const els = document.querySelectorAll(
      "ytd-menu-service-item-renderer, tp-yt-paper-item, yt-formatted-string, span, a, [role='menuitem'], button"
    );
    for (const el of els) {
      if ((el.textContent || "").toLowerCase().includes("remove from watch history")) return el;
    }
    return null;
  }

  let hdQueue = [];
  let hdProcessing = false;
  let hdSelectedItems = [];

  function hdInjectHideStyles() {
    if (document.getElementById("yt-hqd-hide-menu")) return;
    const s = document.createElement("style");
    s.id = "yt-hqd-hide-menu";
    s.textContent = `
      ytd-popup-container, tp-yt-iron-dropdown, yt-dropdown-menu, .ytd-popup-container {
        opacity: 0 !important; pointer-events: none !important; visibility: hidden !important;
      }
      @keyframes ytHqdGlow {
        0%   { box-shadow: 0 0 0px rgba(239,68,68,0);   background-color: rgba(239,68,68,0);   transform: scale(1); }
        30%  { box-shadow: 0 0 20px rgba(239,68,68,0.6); background-color: rgba(239,68,68,0.1); transform: scale(0.99); }
        100% { box-shadow: 0 0 35px rgba(239,68,68,0.8); background-color: rgba(239,68,68,0.2); transform: scale(0.96); opacity: 0.1; }
      }
      @keyframes ytHqdPopIn {
        from { opacity: 0; transform: translate(-50%, 16px) scale(0.95); }
        to   { opacity: 1; transform: translate(-50%, 0) scale(1); }
      }
      .yt-hqd-highlight {
        animation: ytHqdGlow 0.4s cubic-bezier(0.25,1,0.5,1) forwards !important;
        transition: all 0.4s ease !important;
        z-index: 10 !important;
        pointer-events: none !important;
      }
      .yt-hqd-multiselect-selected {
        outline: 2px solid #ef4444 !important;
        outline-offset: 2px !important;
        background-color: rgba(239, 68, 68, 0.12) !important;
        border-radius: 12px !important;
        box-shadow: 0 0 16px rgba(239, 68, 68, 0.3) !important;
        transition: all 0.2s ease !important;
      }
    `;
    document.head.appendChild(s);
  }

  function hdCleanupStyles() {
    const s = document.getElementById("yt-hqd-hide-menu");
    if (s) s.remove();
  }

  function hdToggleSelect(videoItem) {
    hdInjectHideStyles();
    const index = hdSelectedItems.indexOf(videoItem);
    if (index > -1) {
      hdSelectedItems.splice(index, 1);
      videoItem.classList.remove("yt-hqd-multiselect-selected");
    } else {
      hdSelectedItems.push(videoItem);
      videoItem.classList.add("yt-hqd-multiselect-selected");
    }
    hdRenderFloatingBar();
  }

  function hdRenderFloatingBar() {
    let bar = document.getElementById("yt-hqd-floating-bar");
    if (hdSelectedItems.length === 0) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "yt-hqd-floating-bar";
      bar.style.cssText = `
        position: fixed;
        bottom: 28px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        background: rgba(15, 15, 21, 0.94);
        border: 1px solid rgba(239, 68, 68, 0.4);
        border-radius: 9999px;
        padding: 8px 18px;
        display: flex;
        align-items: center;
        gap: 14px;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.2);
        backdrop-filter: blur(16px);
        color: #fff;
        font-family: Roboto, Arial, sans-serif;
        font-size: 13px;
        user-select: none;
        animation: ytHqdPopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      `;
      document.body.appendChild(bar);
    }

    bar.innerHTML = "";

    const countSpan = document.createElement("span");
    countSpan.style.cssText = "font-weight: 500; color: #e4e4e7; display: flex; align-items: center; gap: 6px;";

    const iconSpan = document.createElement("span");
    iconSpan.style.fontSize = "15px";
    iconSpan.textContent = "🗑️";
    countSpan.appendChild(iconSpan);

    const numStrong = document.createElement("strong");
    numStrong.style.cssText = "color: #f87171; font-weight: 700;";
    numStrong.textContent = String(hdSelectedItems.length);
    countSpan.appendChild(numStrong);

    const txtNode = document.createTextNode(" selected");
    countSpan.appendChild(txtNode);
    bar.appendChild(countSpan);

    const btnGroup = document.createElement("div");
    btnGroup.style.cssText = "display: flex; align-items: center; gap: 8px;";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = `Delete All (${hdSelectedItems.length})`;
    deleteBtn.style.cssText = `
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #ffffff;
      border: none;
      border-radius: 9999px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
      transition: transform 0.15s ease;
    `;
    deleteBtn.onmouseover = () => {
      deleteBtn.style.transform = "scale(1.04)";
    };
    deleteBtn.onmouseout = () => {
      deleteBtn.style.transform = "scale(1)";
    };
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      const itemsToDelete = [...hdSelectedItems];
      hdSelectedItems = [];
      itemsToDelete.forEach((item) => {
        item.classList.remove("yt-hqd-multiselect-selected");
        if (!hdQueue.includes(item)) {
          hdQueue.push(item);
          item.classList.add("yt-hqd-highlight");
        }
      });
      hdRenderFloatingBar();
      hdProcessQueue();
    };
    btnGroup.appendChild(deleteBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.08);
      color: #a1a1aa;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    `;
    cancelBtn.onmouseover = () => {
      cancelBtn.style.background = "rgba(255, 255, 255, 0.15)";
      cancelBtn.style.color = "#fff";
    };
    cancelBtn.onmouseout = () => {
      cancelBtn.style.background = "rgba(255, 255, 255, 0.08)";
      cancelBtn.style.color = "#a1a1aa";
    };
    cancelBtn.onclick = (e) => {
      e.stopPropagation();
      hdSelectedItems.forEach((item) => item.classList.remove("yt-hqd-multiselect-selected"));
      hdSelectedItems = [];
      hdRenderFloatingBar();
    };
    btnGroup.appendChild(cancelBtn);

    bar.appendChild(btnGroup);
  }

  function hdDeleteSingleVideo(videoItem) {
    return new Promise((resolve) => {
      const videoTitle = hdExtractVideoTitle(videoItem);
      const videoTimestamp = Date.now();
      hdLog("Deleting video:", videoTitle);

      const menuBtn = hdFindMenuButton(videoItem);
      if (!menuBtn) {
        videoItem.classList.remove("yt-hqd-highlight");
        return resolve(false);
      }
      menuBtn.click();

      let observer = null,
        watchdogId = null,
        clickId = null;
      const cleanup = () => {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (watchdogId) {
          clearTimeout(watchdogId);
          watchdogId = null;
        }
        if (clickId) {
          clearTimeout(clickId);
          clickId = null;
        }
      };

      const attempt = () => {
        const item = hdFindRemoveMenuItem();
        if (!item) return false;
        cleanup();
        const clickable =
          item.closest(
            "ytd-menu-service-item-renderer, ytd-menu-navigation-item-renderer, " +
              "tp-yt-paper-item, yt-dropdown-menu-item, button, [role='menuitem'], a"
          ) || item;
        clickId = setTimeout(() => {
          clickable.click();
          if (isContextValid()) {
            try {
              chrome.runtime.sendMessage(
                {
                  action: "ytHistoryVideoDeleted",
                  title: videoTitle,
                  timestamp: videoTimestamp,
                },
                () => {
                  if (chrome.runtime?.lastError) {
                    /* suppress */
                  }
                }
              );
            } catch (_) {}
          }
          setTimeout(() => {
            videoItem.classList.remove("yt-hqd-highlight");
            resolve(true);
          }, 150);
        }, 50);
        return true;
      };

      if (attempt()) return;
      observer = new MutationObserver(() => attempt());
      observer.observe(document.body, { childList: true, subtree: true });
      watchdogId = setTimeout(() => {
        cleanup();
        videoItem.classList.remove("yt-hqd-highlight");
        resolve(false);
      }, 1500);
    });
  }

  async function hdProcessQueue() {
    if (hdProcessing || hdQueue.length === 0) return;
    hdProcessing = true;
    hdInjectHideStyles();
    while (hdQueue.length > 0) {
      const item = hdQueue[0];
      await hdDeleteSingleVideo(item);
      hdQueue.shift();
      if (hdQueue.length > 0) await new Promise((r) => setTimeout(r, 80));
    }
    hdProcessing = false;
    hdCleanupStyles();
  }

  function hdAddToQueue(videoItem) {
    if (!hdQueue.includes(videoItem)) {
      hdQueue.push(videoItem);
      videoItem.classList.add("yt-hqd-highlight");
      hdLog("Added to queue. Queue size:", hdQueue.length);
      hdProcessQueue();
    }
  }

  function hdFindVideoItem(target) {
    const containerSelectors = [
      "ytm-shorts-lockup-view-model-v2",
      "ytm-shorts-lockup-view-model",
      "ytd-reel-item-renderer",
      "yt-reel-item-view-model",
      "ytd-video-renderer",
      "ytd-grid-video-renderer",
      "ytd-rich-item-renderer",
      "ytd-playlist-video-renderer",
      "yt-lockup-view-model",
      "ytd-lockup-view-model",
    ];
    for (const sel of containerSelectors) {
      const card = hdFindClosest(target, sel);
      if (card) return card;
    }
    const watchLink = hdFindClosest(target, "a[href*='watch?v='], a[href*='/shorts/']");
    if (watchLink) {
      let parent = watchLink.parentElement;
      while (parent && parent !== document.body) {
        if (
          hdQueryShadow(
            parent,
            "ytd-menu-renderer, button[aria-label*='menu' i], [aria-label*='Action menu' i]"
          )
        )
          return parent;
        parent = parent.parentElement;
      }
    }
    return null;
  }

  const onHistoryClick = (event) => {
    if (!isContextValid()) {
      window.removeEventListener("click", onHistoryClick, true);
      return;
    }
    if (window.location.pathname !== "/feed/history") return;
    if (!hdEnabled) return;

    const target = event.target;
    const exclusionSelector =
      "ytd-menu-renderer, tp-yt-iron-dropdown, ytd-popup-container, .ytd-menu-renderer, " +
      "button, [role='button'], yt-icon-button, yt-button-shape, " +
      ".yt-lockup-metadata-view-model__menu-button, .ytLockupMetadataViewModelMenuButton, " +
      "yt-dropdown-menu, tp-yt-paper-dialog, ytd-menu-service-item-renderer, tp-yt-paper-item, [role='menuitem']";

    if (hdFindClosest(target, exclusionSelector)) return;

    const watchLink = hdFindClosest(target, "a[href*='watch?v='], a[href*='/shorts/']");
    const videoItem = hdFindVideoItem(target);
    if (!videoItem) return;

    const isVideoCard = hdFindClosest(
      target,
      "ytd-video-renderer, yt-lockup-view-model, ytd-reel-item-renderer, yt-reel-item-view-model, ytm-shorts-lockup-view-model-v2, ytm-shorts-lockup-view-model"
    );
    if (!watchLink && !isVideoCard) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (event.shiftKey || hdSelectedItems.length > 0) {
      hdToggleSelect(videoItem);
    } else {
      hdAddToQueue(videoItem);
    }
  };

  window.addEventListener("click", onHistoryClick, true);
  hdLog("History Quick Delete — active. Path:", window.location.pathname);
}
