// ── YouTube Format Presets & Resolution Display Utility ─────────────────────

export const YOUTUBE_FMT_QUALITIES = [
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
  { label: "MP4 - 426x240 - 257KB/s", resolution: "240p", format: "webm", bitrate: "257KB/s", quality: "240p" },
  { label: "WEBM - 426x240 - 202KB/s", resolution: "240p", format: "webm", bitrate: "202KB/s", quality: "240p" },
  { label: "WEBM - 256x144 - 376KB/s", resolution: "144p", format: "webm", bitrate: "376KB/s", quality: "144p" },
  { label: "M4A - 128kbps (Audio Only)", resolution: "Audio", format: "m4a", bitrate: "128kbps", quality: "Audio" },
  { label: "WEBM - Opus Audio (160kbps)", resolution: "Audio", format: "webm", bitrate: "160kbps", quality: "Audio" },
  { label: "MP3 - 320kbps (HQ Audio)", resolution: "Audio", format: "mp3", bitrate: "320kbps", quality: "Audio" },
];

export const YOUTUBE_HLS_QUALITIES = [
  { label: "HLS - Adaptive Stream - 4MB/s", resolution: "Adaptive Stream", format: "hls", bitrate: "4MB/s" },
  { label: "HLS - 1080p - 3MB/s", resolution: "1080p", format: "hls", bitrate: "3MB/s" },
  { label: "HLS - 720p - 2MB/s", resolution: "720p", format: "hls", bitrate: "2MB/s" },
  { label: "HLS - 480p - 1MB/s", resolution: "480p", format: "hls", bitrate: "1MB/s" },
  { label: "HLS - 360p - 562KB/s", resolution: "360p", format: "hls", bitrate: "562KB/s" },
  { label: "AAC - Audio Stream - 128kbps", resolution: "Audio", format: "aac", bitrate: "128kbps" },
];

// Helper to cleanly extract format tag and clean resolution name
export function getFormatDisplay(activeFormat) {
  if (!activeFormat) return { format: "MP4", resolution: "1080p" };
  const fmt = (activeFormat.format || "mp4").toUpperCase();
  const rawRes = activeFormat.resolution || "";
  const label = activeFormat.label || "";

  let res = "1080p";
  if (/adaptive/i.test(rawRes) || /adaptive/i.test(label)) {
    res = "Adaptive";
  } else if (/2160|4k/i.test(rawRes) || /2160|4k/i.test(label)) {
    res = "4K";
  } else if (/1440|2k/i.test(rawRes) || /1440|2k/i.test(label)) {
    res = "2K";
  } else if (/1080/i.test(rawRes) || /1080/i.test(label)) {
    res = "1080p";
  } else if (/720/i.test(rawRes) || /720/i.test(label)) {
    res = "720p";
  } else if (/480/i.test(rawRes) || /480/i.test(label)) {
    res = "480p";
  } else if (/360/i.test(rawRes) || /360/i.test(label)) {
    res = "360p";
  } else if (/240/i.test(rawRes) || /240/i.test(label)) {
    res = "240p";
  } else if (/144/i.test(rawRes) || /144/i.test(label)) {
    res = "144p";
  } else if (/audio/i.test(rawRes) || /audio|mp3|m4a|aac/i.test(fmt)) {
    res = "Audio";
  } else {
    res = rawRes || "1080p";
  }

  return { format: fmt, resolution: res };
}
