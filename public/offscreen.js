"use strict";
// InstaGrab — FFmpeg offscreen encoder
// Loaded by offscreen.html after ffmpeg/ffmpeg.js sets window.FFmpegWASM = { FFmpeg }
// Images arrive as base64 strings (pre-fetched by content.js on instagram.com) so there
// is NO cross-origin fetch needed here — avoids CORS failures in the extension origin.

/* global FFmpegWASM, chrome */

const { FFmpeg } = FFmpegWASM;

let ffmpegInstance = null; // Reused across calls within the same offscreen lifetime

const logger = {
  log: (msg, ...args) => {
    chrome.storage.local.get(['loggingEnabled'], (res) => {
      if (res.loggingEnabled) console.log(msg, ...args);
    });
  },
  warn: (msg, ...args) => {
    chrome.storage.local.get(['loggingEnabled'], (res) => {
      if (res.loggingEnabled) console.warn(msg, ...args);
    });
  },
  error: (msg, ...args) => {
    chrome.storage.local.get(['loggingEnabled'], (res) => {
      if (res.loggingEnabled) console.error(msg, ...args);
    });
  }
};

// ─── Load FFmpeg core (lazy, cached) ────────────────────────────────────────

async function getFFmpeg() {
  if (ffmpegInstance && ffmpegInstance.loaded) return ffmpegInstance;

  logger.log("[InstaGrab Offscreen] Loading FFmpeg core...");
  ffmpegInstance = new FFmpeg();

  ffmpegInstance.on("progress", ({ progress }) => {
    logger.log(`[InstaGrab Offscreen] Encoding ${Math.round(progress * 100)}%`);
  });

  await ffmpegInstance.load({
    // Both files bundled locally — no CDN, no external CSP required
    coreURL: chrome.runtime.getURL("ffmpeg/ffmpeg-core.js"),
    wasmURL: chrome.runtime.getURL("ffmpeg/ffmpeg-core.wasm"),
  });

  logger.log("[InstaGrab Offscreen] FFmpeg core loaded ✓");
  return ffmpegInstance;
}

// ─── Helper: base64 string → Uint8Array ──────────────────────────────────────

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── MP4 compilation ─────────────────────────────────────────────────────────

/**
 * compileMP4(imageDataArray, durationSecs)
 * imageDataArray: array of raw base64 strings (no data: prefix) — already fetched
 *                 by content.js on the instagram.com page (no CORS issue there).
 * durationSecs:   how long each slide is shown.
 * Returns a base64 data: URL of the resulting MP4.
 */
async function compileMP4(imageDataArray, durationSecs, crf = 24) {
  const ff = await getFFmpeg();

  // 1. Decode base64 → Uint8Array and write to FFmpeg virtual FS
  for (let i = 0; i < imageDataArray.length; i++) {
    const bytes = base64ToUint8Array(imageDataArray[i]);
    await ff.writeFile(`img${i}.jpg`, bytes);
  }

  // 2. Build concat demuxer input file
  //    Each entry: file + duration.  Last entry repeated without duration (concat quirk).
  const enc = new TextEncoder();
  let concatTxt = "";
  for (let i = 0; i < imageDataArray.length; i++) {
    concatTxt += `file 'img${i}.jpg'\nduration ${durationSecs}\n`;
  }
  concatTxt += `file 'img${imageDataArray.length - 1}.jpg'\n`;
  await ff.writeFile("concat.txt", enc.encode(concatTxt));

  // 3. Run FFmpeg H.264 encode (Optimized for maximum WebAssembly speed)
  //    -vf scale: Bounds max dimension to 720px while preserving aspect ratio and ensuring even dims
  //    -preset ultrafast: Maximum CPU encoding speed
  //    -tune stillimage: Optimizes compression and speed for stationary slide frames
  //    -crf: High quality, lower encoding complexity
  //    -r 10: Lower output frame rate (slideshow doesn't need 25 FPS)
  //    -pix_fmt yuv420p: Maximum playback compatibility
  //    -movflags +faststart: Places index at start for instant preview
  const exitCode = await ff.exec([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "concat.txt",
    "-vf",
    "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-tune",
    "stillimage",
    "-crf",
    String(crf),
    "-pix_fmt",
    "yuv420p",
    "-r",
    "5",
    "-movflags",
    "+faststart",
    "output.mp4",
  ]);

  if (exitCode !== 0) throw new Error(`FFmpeg exited with code ${exitCode}`);

  // 4. Read output and convert to data: URL
  const data = await ff.readFile("output.mp4");
  const blob = new Blob([data.buffer], { type: "video/mp4" });
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  // 5. Clean up virtual FS to free memory for next call
  for (let i = 0; i < imageDataArray.length; i++) {
    try {
      await ff.deleteFile(`img${i}.jpg`);
    } catch {
      /* ignore */
    }
  }
  try {
    await ff.deleteFile("concat.txt");
  } catch {
    /* ignore */
  }
  try {
    await ff.deleteFile("output.mp4");
  } catch {
    /* ignore */
  }

  return dataUrl;
}

// ─── Message listener ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  // Only handle messages explicitly addressed to this offscreen document
  if (message.target !== "offscreen-ffmpeg") return false;

  if (message.type === "FFMPEG_COMPILE_SLIDESHOW") {
    const { requestId, imageDataArray, durationSecs, crf } = message;
    logger.log(
      `[InstaGrab Offscreen] Compile request ${requestId}: ` +
        `${imageDataArray.length} images × ${durationSecs}s (CRF: ${crf})`
    );

    compileMP4(imageDataArray, durationSecs, crf)
      .then((dataUrl) => {
        chrome.runtime.sendMessage({
          type: "FFMPEG_COMPILE_RESULT",
          requestId,
          success: true,
          dataUrl,
        });
      })
      .catch((err) => {
        logger.error("[InstaGrab Offscreen] FFmpeg error:", err);
        chrome.runtime.sendMessage({
          type: "FFMPEG_COMPILE_RESULT",
          requestId,
          success: false,
          error: err.message || String(err),
        });
      });

    return true; // Respond asynchronously
  }

  return false;
});

logger.log("[InstaGrab Offscreen] Encoder page ready");

// Pre-warm: kick off FFmpeg WASM load immediately so it's ready when the user hits Download.
// The 2–5s cold-start becomes invisible since it runs in the background.
getFFmpeg().catch((err) =>
  logger.warn("[InstaGrab Offscreen] Pre-warm failed (non-fatal):", err)
);
