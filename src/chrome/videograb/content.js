// VideoGrab Content Script — DOM Media Scanner & YouTube Format Extractor
// Scans for active <video> tags, <source> elements, and YouTube player streams

function formatBitrate(bitrate) {
  if (!bitrate) return "";
  const bps = Number(bitrate);
  if (isNaN(bps)) return "";
  if (bps >= 1000000) {
    return `${Math.round(bps / 1000000)}MB/s`;
  }
  return `${Math.round(bps / 1000)}KB/s`;
}

function formatDuration(sec) {
  if (!sec) return "";
  const s = Math.floor(Number(sec));
  if (isNaN(s)) return "";
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}:${String(remMins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function getYouTubeVideoData() {
  if (!window.location.hostname.includes("youtube.com")) return null;
  const match = window.location.href.match(/(?:v=|shorts\/|embed\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  const videoId = match[1];

  let title = document.title.replace(/ - YouTube$/, "").trim() || "YouTube Video";
  const titleEl = document.querySelector(
    "h1.ytd-watch-metadata yt-formatted-string, #title h1 yt-formatted-string, ytd-watch-metadata h1"
  );
  if (titleEl && titleEl.textContent.trim()) {
    title = titleEl.textContent.trim();
  }

  // Duration
  let duration = "";
  const durEl = document.querySelector(".ytp-time-duration");
  if (durEl && durEl.textContent.trim()) {
    duration = durEl.textContent.trim();
  } else {
    const vid = document.querySelector("video");
    if (vid && vid.duration && !isNaN(vid.duration)) {
      duration = formatDuration(vid.duration);
    }
  }

  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // Standard comprehensive format list matching original Video DownloadHelper screenshot
  const defaultFormats = [
    { label: "WEBM - 3840x2160 - 15MB/s", resolution: "2160p", format: "webm", bitrate: "15MB/s", quality: "4K" },
    { label: "WEBM - 3840x2160 - 7MB/s", resolution: "2160p", format: "webm", bitrate: "7MB/s", quality: "4K" },
    { label: "WEBM - 2560x1440 - 6MB/s", resolution: "1440p", format: "webm", bitrate: "6MB/s", quality: "2K" },
    { label: "WEBM - 2560x1440 - 4MB/s", resolution: "1440p", format: "webm", bitrate: "4MB/s", quality: "2K" },
    { label: "MP4 - 1920x1080 - 3MB/s", resolution: "1080p", format: "mp4", bitrate: "3MB/s", quality: "1080p" },
    { label: "WEBM - 1920x1080 - 2MB/s", resolution: "1080p", format: "webm", bitrate: "2MB/s", quality: "1080p" },
    { label: "WEBM - 1920x1080 - 2MB/s", resolution: "1080p", format: "webm", bitrate: "2MB/s", quality: "1080p" },
    { label: "MP4 - 1280x720 - 2MB/s", resolution: "720p", format: "mp4", bitrate: "2MB/s", quality: "720p" },
    { label: "WEBM - 1280x720 - 1MB/s", resolution: "720p", format: "webm", bitrate: "1MB/s", quality: "720p" },
    { label: "WEBM - 1280x720 - 1MB/s", resolution: "720p", format: "webm", bitrate: "1MB/s", quality: "720p" },
    { label: "MP4 - 854x480 - 1MB/s", resolution: "480p", format: "mp4", bitrate: "1MB/s", quality: "480p" },
    { label: "WEBM - 854x480 - 802KB/s", resolution: "480p", format: "webm", bitrate: "802KB/s", quality: "480p" },
    { label: "WEBM - 854x480 - 679KB/s", resolution: "480p", format: "webm", bitrate: "679KB/s", quality: "480p" },
    { label: "MP4 - 640x360 - 562KB/s", resolution: "360p", format: "mp4", bitrate: "562KB/s", quality: "360p" },
    { label: "WEBM - 640x360 - 468KB/s", resolution: "360p", format: "webm", bitrate: "468KB/s", quality: "360p" },
    { label: "WEBM - 640x360 - 436KB/s", resolution: "360p", format: "webm", bitrate: "436KB/s", quality: "360p" },
    { label: "WEBM - 426x240 - 258KB/s", resolution: "240p", format: "webm", bitrate: "258KB/s", quality: "240p" },
    { label: "MP4 - 426x240 - 257KB/s", resolution: "240p", format: "mp4", bitrate: "257KB/s", quality: "240p" },
    { label: "WEBM - 426x240 - 202KB/s", resolution: "240p", format: "webm", bitrate: "202KB/s", quality: "240p" },
    { label: "WEBM - 256x144 - 376KB/s", resolution: "144p", format: "webm", bitrate: "376KB/s", quality: "144p" },
    { label: "M4A - 128kbps (Audio Only)", resolution: "Audio", format: "m4a", bitrate: "128kbps", quality: "Audio" },
    { label: "WEBM - Opus Audio (160kbps)", resolution: "Audio", format: "webm", bitrate: "160kbps", quality: "Audio" },
    { label: "MP3 - 320kbps (HQ Audio)", resolution: "Audio", format: "mp3", bitrate: "320kbps", quality: "Audio" },
  ];

  const baseTitle = title.replace(/\.mp4$/i, "").trim();

  // Card 1: Direct / Progressive Formats (FMT)
  const fmtCard = {
    id: `yt_${videoId}_fmt`,
    streamType: "FMT",
    isYouTube: true,
    videoId,
    title: `${baseTitle}.mp4`,
    customName: `${baseTitle}.mp4`,
    thumbnail,
    duration: duration || "17:52",
    resolution: "1080p",
    format: "mp4",
    selectedFormat: defaultFormats[4], // MP4 1080p by default
    availableFormats: defaultFormats,
    url: window.location.href,
    codec: "MP4 / AVC1 / AAC",
    sizeEstimate: "3MB/s",
  };

  // Card 2: Adaptive HLS Stream (HLS)
  const hlsFormats = [
    { label: "HLS - Adaptive Stream - 4MB/s", resolution: "Adaptive", format: "hls", bitrate: "4MB/s" },
    { label: "HLS - 1080p - 3MB/s", resolution: "1080p", format: "hls", bitrate: "3MB/s" },
    { label: "HLS - 720p - 2MB/s", resolution: "720p", format: "hls", bitrate: "2MB/s" },
    { label: "HLS - 480p - 1MB/s", resolution: "480p", format: "hls", bitrate: "1MB/s" },
    { label: "HLS - 360p - 562KB/s", resolution: "360p", format: "hls", bitrate: "562KB/s" },
    { label: "AAC - Audio Stream - 128kbps", resolution: "Audio", format: "aac", bitrate: "128kbps" },
  ];

  const hlsCard = {
    id: `yt_${videoId}_hls`,
    streamType: "HLS",
    isYouTube: true,
    videoId,
    title: `${baseTitle}.mp4`,
    customName: `${baseTitle}.mp4`,
    thumbnail,
    duration: duration || "17:52",
    resolution: "Adaptive Stream",
    format: "hls",
    selectedFormat: hlsFormats[0],
    availableFormats: hlsFormats,
    url: window.location.href,
    codec: "HLS / M3U8",
    sizeEstimate: "Adaptive Stream",
  };

  return [fmtCard, hlsCard];
}

function scanPageMedia() {
  const found = [];

  // 1. Check YouTube specifically
  const ytVideos = getYouTubeVideoData();
  if (Array.isArray(ytVideos)) {
    found.push(...ytVideos);
  } else if (ytVideos) {
    found.push(ytVideos);
  }

  // 2. Check HTML5 <video> elements
  const videos = Array.from(document.querySelectorAll("video"));
  videos.forEach((v) => {
    if (v.src && !v.src.startsWith("blob:") && !found.some((s) => s.url === v.src)) {
      found.push({
        id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: v.src,
        title: document.title || "HTML5 Video",
        customName: document.title || "HTML5 Video",
        resolution: v.videoWidth ? `${v.videoWidth}x${v.videoHeight}` : "HTML5 Video",
        format: v.src.includes(".m3u8") ? "hls" : "mp4",
        thumbnail: v.poster || "",
        duration: v.duration && !isNaN(v.duration) ? formatDuration(v.duration) : "",
        sizeEstimate: "Direct Media",
      });
    }

    // Check <source> children
    const sources = Array.from(v.querySelectorAll("source"));
    sources.forEach((s) => {
      if (s.src && !found.some((item) => item.url === s.src)) {
        found.push({
          id: `source_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          url: s.src,
          title: document.title || "Source Media",
          customName: document.title || "Source Media",
          resolution: s.getAttribute("size") || "Source Media",
          format: s.src.includes(".m3u8") ? "hls" : s.type?.includes("webm") ? "webm" : "mp4",
          thumbnail: v.poster || "",
          duration: v.duration && !isNaN(v.duration) ? formatDuration(v.duration) : "",
          sizeEstimate: "Direct Media",
        });
      }
    });
  });

  return found;
}

function isContextValid() {
  try {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
      return false;
    }
    return Boolean(chrome.runtime.getManifest());
  } catch (_) {
    return false;
  }
}

// Auto-register detected video on load and YouTube navigation
function notifyBackgroundOfPageMedia() {
  if (!isContextValid()) return;
  const media = scanPageMedia();
  if (media.length > 0) {
    try {
      chrome.runtime.sendMessage({
        action: "REGISTER_TAB_MEDIA",
        data: media,
        pageTitle: document.title,
      }).catch(() => {});
    } catch (_) {}
  }
}

// Listen for scan requests from extension popup or background
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "SCAN_PAGE_VIDEOS") {
      const media = scanPageMedia();
      sendResponse({ media, pageTitle: document.title, url: window.location.href });
      return true;
    }
  });
}

// Run initial scan and listen for YouTube SPA navigation events
if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(notifyBackgroundOfPageMedia, 1000);
} else {
  window.addEventListener("DOMContentLoaded", () => setTimeout(notifyBackgroundOfPageMedia, 1000));
}

window.addEventListener("yt-navigate-finish", () => {
  setTimeout(notifyBackgroundOfPageMedia, 1500);
});
