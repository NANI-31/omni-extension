// ─── Pinterest Context Menu & Download Routing Module ──────────────────────

const PINTEREST_PATTERNS = [
  "*://*.pinterest.com/*",
  "*://*.pinterest.co.uk/*",
  "*://*.pinterest.ca/*",
  "*://*.pinterest.de/*",
  "*://*.pinterest.fr/*",
  "*://*.pinterest.es/*",
  "*://*.pinterest.it/*",
  "*://*.pinterest.jp/*",
  "*://*.pinterest.pt/*",
  "*://*.pinterest.ru/*",
  "*://*.pinimg.com/*",
];

const PINTEREST_MENU_ID = "pgrab_download_pin";

/**
 * Converts a thumbnail / preview pinimg URL to the original high-resolution master image.
 */
export function getHighResPinterestUrl(srcUrl) {
  if (!srcUrl) return srcUrl;
  try {
    const url = new URL(srcUrl);
    if (url.hostname.includes("pinimg.com")) {
      // Replace size path segment (e.g., /236x/, /474x/, /564x/, /736x/) with /originals/
      url.pathname = url.pathname.replace(/\/(236x|474x|564x|736x|originals)\//i, "/originals/");
      return url.toString();
    }
  } catch (_) {}
  return srcUrl;
}

/**
 * Resolves the target Pinterest download folder from storage or metadata.
 */
export function resolvePinterestFolder(result, message = {}, meta = {}) {
  let subdir;
  if (message.folder || meta?.folder || message.subfolder || meta?.subfolder) {
    subdir = message.folder || meta?.folder || message.subfolder || meta?.subfolder;
  } else {
    subdir = result?.pinterestFolder !== undefined ? result.pinterestFolder : "pinterest";
  }
  return (subdir || "pinterest").replace(/[\\/:*?"<>|]/g, "").trim() || "pinterest";
}

/**
 * Sets up Pinterest context menu entries and handles context menu download clicks.
 */
export function initPinterestHandler() {
  if (typeof chrome === "undefined" || !chrome.contextMenus) return;

  // Create context menu entry idempotently
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create(
      {
        id: PINTEREST_MENU_ID,
        title: "Download with PinterestGrab",
        contexts: ["image", "video", "link"],
        documentUrlPatterns: PINTEREST_PATTERNS,
      },
      () => {
        // Suppress lastError if already exists or page refreshed
        if (chrome.runtime.lastError) {}
      }
    );
  });

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== PINTEREST_MENU_ID) return;

    const rawUrl = info.srcUrl || info.linkUrl;
    if (!rawUrl) return;

    const hiResUrl = getHighResPinterestUrl(rawUrl);
    const ext = (() => {
      try {
        const p = new URL(hiResUrl).pathname;
        const m = p.match(/\.(jpg|jpeg|png|webp|gif|mp4)$/i);
        return m ? m[1].toLowerCase() : "jpg";
      } catch (_) {
        return "jpg";
      }
    })();

    const pinIdMatch = (info.linkUrl || info.pageUrl || rawUrl).match(/\/pin\/(\d+)/);
    const pinId = pinIdMatch ? pinIdMatch[1] : Date.now();
    const filename = `pinterest_${pinId}.${ext}`;

    chrome.storage.local.get(["pinterestFolder"], (res) => {
      const folder = resolvePinterestFolder(res);
      const finalPath = folder ? `${folder}/${filename}` : filename;

      chrome.downloads.download({
        url: hiResUrl,
        filename: finalPath,
        conflictAction: "uniquify",
      });
    });
  });
}
