/**
 * ytdlpClient.js
 * Client interface for Omni Extension to communicate with the local yt-dlp companion server.
 */

const YTDLP_SERVER_URL = "http://127.0.0.1:8989";

// Check if the local yt-dlp companion server is active
export async function checkYtDlpCompanion() {
  try {
    const res = await fetch(`${YTDLP_SERVER_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return {
      online: !!data.ok,
      version: data.version || "Installed",
      downloadDir: data.downloadDir || "Downloads/OmniVideos",
    };
  } catch (_) {
    return { online: false };
  }
}

// Start the companion server directly from the extension via Native Messaging or Protocol
export async function startYtDlpServer() {
  // 1. Check if already online
  const initial = await checkYtDlpCompanion();
  if (initial.online) {
    return { success: true, alreadyRunning: true, version: initial.version };
  }

  // 2. Try Chrome Native Messaging host
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendNativeMessage) {
    try {
      chrome.runtime.sendNativeMessage("com.omni.ytdlp", { action: "start" }, () => {
        // Suppress lastError if host is not registered yet
        const _ = chrome.runtime.lastError;
      });
    } catch (_) {}
  }

  // 3. Fallback: try custom protocol handler omni-ytdlp://start
  try {
    const a = document.createElement("a");
    a.href = "omni-ytdlp://start";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) document.body.removeChild(a);
    }, 100);
  } catch (_) {}

  // 4. Poll /health for up to 4 seconds
  for (let i = 0; i < 16; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const check = await checkYtDlpCompanion();
    if (check.online) {
      return { success: true, version: check.version };
    }
  }

  return {
    success: false,
    message: "Server did not respond in time. Double-click register-companion.bat to enable auto-start.",
  };
}

// Generate an exact, ready-to-run CLI command for terminal fallback
export function generateYtDlpCommand({
  url,
  resolution = "1080p",
  format = "mp4",
  folder = "OmniVideos",
  filename = "",
}) {
  const heightMatch = String(resolution).match(/(\d{3,4})p?/);
  const height = heightMatch ? parseInt(heightMatch[1], 10) : 1080;
  const isAudio = String(format).toLowerCase() === "mp3" || String(resolution).toLowerCase().includes("audio");

  const savePath = `%USERPROFILE%\\Downloads\\${folder}`;
  const outTemplate =
    filename && filename.trim()
      ? `${filename.replace(/[\\/:*?"<>|]/g, "_").trim()}.%(ext)s`
      : "%(title)s.%(ext)s";

  if (isAudio) {
    return `yt-dlp --js-runtimes node -x --audio-format mp3 -o "${outTemplate}" -P "${savePath}" "${url}"`;
  }

  return `yt-dlp --js-runtimes node -f "bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best" --merge-output-format mp4 -o "${outTemplate}" -P "${savePath}" "${url}"`;
}

// Shutdown companion server
export async function shutdownYtDlpCompanion(force = false) {
  try {
    const res = await fetch(`${YTDLP_SERVER_URL}/shutdown?force=${force}`, {
      method: "POST",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, message: data.message };
  } catch (_) {
    return { success: false };
  }
}

// Open download directory in OS File Explorer
export async function openYtDlpFolder(folder = "OmniVideos") {
  try {
    await fetch(`${YTDLP_SERVER_URL}/open-folder?folder=${encodeURIComponent(folder)}`);
  } catch (_) {}
}

// Get active running jobs on companion server
export async function getActiveYtDlpJobs() {
  try {
    const res = await fetch(`${YTDLP_SERVER_URL}/jobs`, {
      signal: AbortSignal.timeout(1200),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.jobs || [];
  } catch (_) {
    return [];
  }
}

// Download a video via local yt-dlp companion with live progress polling
export async function downloadViaYtDlp({
  id = null,
  videoId = null,
  url,
  resolution = "1080p",
  format = "mp4",
  folder = "OmniVideos",
  filename = "",
  stopServerOnFinish = false,
  onProgress = null,
}) {
  // 1. Check server health
  const health = await checkYtDlpCompanion();
  if (!health.online) {
    throw new Error(
      "yt-dlp Companion Server is offline. Run 'npm run ytdlp' or double-click 'start-ytdlp.bat' to start it."
    );
  }

  // 2. Dispatch download job
  const res = await fetch(`${YTDLP_SERVER_URL}/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      videoId: videoId || id,
      url,
      resolution,
      format,
      folder,
      filename,
      autoStop: stopServerOnFinish,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with ${res.status}`);
  }

  const { jobId, downloadDir } = await res.json();

  if (onProgress) {
    onProgress({ percent: 0, stage: "Connecting to video stream...", speed: "", eta: "" });
  }

  // 3. Poll progress until complete or failed
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const progRes = await fetch(`${YTDLP_SERVER_URL}/progress?id=${encodeURIComponent(jobId)}`);
        if (!progRes.ok) return;

        const info = await progRes.json();

        if (onProgress) {
          onProgress({
            percent: typeof info.percent === "number" ? info.percent : 0,
            stage: info.stage || (info.percent ? `Downloading: ${info.percent}%` : "Connecting to stream..."),
            speed: info.speed,
            eta: info.eta,
          });
        }

        if (info.status === "completed") {
          clearInterval(interval);
          if (onProgress) {
            onProgress({
              percent: 100,
              stage: stopServerOnFinish
                ? `Saved to Downloads/${folder}/ (Server stopped)`
                : `Saved to Downloads/${folder}/!`,
            });
          }

          if (stopServerOnFinish) {
            setTimeout(() => {
              shutdownYtDlpCompanion(false);
            }, 1200);
          }

          resolve({ success: true, downloadDir, filename: info.filename });
        } else if (info.status === "failed") {
          clearInterval(interval);
          reject(new Error(info.error || "yt-dlp process failed"));
        }
      } catch (err) {
        // Transient poll error, keep trying
      }
    }, 600);
  });
}
