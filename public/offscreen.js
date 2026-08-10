"use strict";
// InstaGrab — FFmpeg offscreen encoder
// Loaded by offscreen.html after ffmpeg/ffmpeg.js sets window.FFmpegWASM = { FFmpeg }
// Images arrive as base64 strings (pre-fetched by content.js on instagram.com) so there
// is NO cross-origin fetch needed here — avoids CORS failures in the extension origin.

/* global FFmpegWASM, chrome */

const { FFmpeg } = FFmpegWASM;

let ffmpegInstance = null; // Reused across calls within the same offscreen lifetime

// ─── Logger ───────────────────────────────────────────────────────────────────
// NOTE: chrome.storage is NOT available in MV3 offscreen documents.
// We use plain console.* methods instead. All log lines are prefixed so they
// are easy to filter in DevTools → offscreen.html context.

const logger = {
  log: (msg, ...args) => console.log(msg, ...args),
  warn: (msg, ...args) => console.warn(msg, ...args),
  error: (msg, ...args) => console.error(msg, ...args),
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

// Terminate the cached FFmpeg instance and clear the module-level reference.
// Called after a RuntimeError (WASM OOM) so the next compilation starts with
// a completely clean 256MB WASM heap instead of one already full of orphaned
// temp files from the crashed run.
function resetFFmpeg() {
  try {
    if (ffmpegInstance) ffmpegInstance.terminate();
  } catch (_) { /* ignore — instance may already be dead */ }
  ffmpegInstance = null;
  logger.log("[InstaGrab Offscreen] FFmpeg instance reset (heap cleared)");
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

// ─── Mixed carousel compilation ───────────────────────────────────────────────
//
// compileMP4(mediaItems, durationSecs, crf)
//
// mediaItems: Array of { data: string (raw base64), type: 'image'|'video', ext: 'jpg'|'mp4' }
//   - Image items: rendered as still frames held for durationSecs each
//   - Video items: re-encoded at native duration with audio preserved
//   All segments are concatenated into a single H.264 MP4.
//
// Legacy: if mediaItems is absent but imageDataArray is provided, the old
// image-only path is used for backwards compatibility.

async function compileMP4(
  mediaItems,
  durationSecs,
  crf = 24,
  onProgress = null,
) {
  const ff = await getFFmpeg();

  // ── Normalise input ───────────────────────────────────────────────────────
  // Support both new mediaItems and legacy imageDataArray
  const items = mediaItems && mediaItems.length > 0 ? mediaItems : []; // legacy handled below

  // Track every temp filename written so the finally block can clean up even
  // if an error (including RuntimeError WASM OOM) causes an early exit.
  const segmentFiles = [];
  const tempFiles    = new Set(); // rawFilename + any intermediate files

  try {
    // ── Write each item to FFmpeg virtual FS and produce a normalised segment ─
    //
    // Strategy:
    //   Images  → write raw bytes, use `concat` demuxer with a duration entry
    //   Videos  → write raw bytes, re-encode to a normalised .ts segment
    //             (same resolution rules, same codec, same frame rate)
    //   Then use `concat` demuxer to join all segments into output.mp4.
    //
    // All segments are re-encoded to the same target so that resolution/codec
    // mismatches between slides don't break the concat step.

    const TARGET_FPS = "10";
    const TARGET_RES = "720";
    // Force all segments to the same canvas: 720×720 letterbox with black bars.
    // Identical dimensions are REQUIRED by filter_complex concat (used in the
    // final join step to guarantee VLC-compatible continuous timestamps).
    const SCALE_FILTER = [
      `scale=${TARGET_RES}:${TARGET_RES}:force_original_aspect_ratio=decrease`,
      `pad=${TARGET_RES}:${TARGET_RES}:(ow-iw)/2:(oh-ih)/2:black`,
      "setsar=1",
    ].join(",");
    const CRF_STR = String(crf);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rawFilename = `raw_${i}.${item.ext || (item.type === "video" ? "mp4" : "jpg")}`;
      const segFilename = `seg_${i}.mp4`;
      tempFiles.add(rawFilename);
      tempFiles.add(segFilename);

      // Write the raw bytes to FFmpeg's virtual FS, then immediately null out
      // the data reference so the JS garbage collector can free the base64
      // string from the JS heap — critical for large carousels where total
      // media data can be 100MB+.
      await ff.writeFile(rawFilename, base64ToUint8Array(item.data));
      items[i].data = null;

      // ── Report progress: slide N of total is starting to encode ─────────────
      if (onProgress)
        onProgress({
          segment: i + 1,
          totalSegments: items.length,
          phase: item.type === "video" ? "video" : "image",
        });

      // ── Determine actual media type using both item.type AND file extension ──
      // item.type is set by slideshow.js type detection.
      // item.ext is 'mp4' only if the item was correctly identified as video.
      // Both checks together catch edge cases where one layer misidentifies.
      // Without this guard, videos misidentified as images would get the -t
      // duration cap and still go through the correct encode path (no -t duration cap).
      const isVideoItem =
        item.type === "video" || (item.ext || "").toLowerCase() === "mp4";

      if (isVideoItem) {
        // ── Video segment ─────────────────────────────────────────────────────
        // Attempt 1: Re-encode with native audio track (most Instagram videos have audio)
        let exitCode = await ff.exec([
          "-i",
          rawFilename,
          "-map",
          "0:v",
          "-map",
          "0:a",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          CRF_STR,
          "-bf",
          "0", // disable B-frames → DTS=PTS, no edit lists → VLC-safe
          "-r",
          TARGET_FPS,
          "-pix_fmt",
          "yuv420p",
          "-vf",
          SCALE_FILTER,
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-ar",
          "44100",
          "-ac",
          "2",
          "-avoid_negative_ts",
          "make_zero",
          segFilename,
        ]);

        if (exitCode !== 0) {
          // Attempt 2: Video has no audio stream — add a silent audio track instead
          logger.log(
            `[InstaGrab Offscreen] Video ${i} has no audio, adding silent track`,
          );
          await ff.deleteFile(segFilename).catch(() => {});
          exitCode = await ff.exec([
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=44100:cl=stereo", // silent audio (infinite)
            "-i",
            rawFilename, // actual video
            "-map",
            "1:v",
            "-map",
            "0:a",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            CRF_STR,
            "-bf",
            "0", // disable B-frames → DTS=PTS, no edit lists → VLC-safe
            "-r",
            TARGET_FPS,
            "-pix_fmt",
            "yuv420p",
            "-vf",
            SCALE_FILTER,
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-avoid_negative_ts",
            "make_zero",
            "-shortest",
            segFilename,
          ]);
        }

        if (exitCode !== 0) {
          logger.warn(
            `[InstaGrab Offscreen] Video segment ${i} encode failed (exit ${exitCode}), skipping`,
          );
          await ff.deleteFile(rawFilename).catch(() => {});
          continue;
        }
      } else {
        // ── Image segment ─────────────────────────────────────────────────────
        // Encode still image as a video segment with a SILENT AUDIO track.
        // All segments must have the same stream count (video+audio) for the
        // concat demuxer to join them without blank frames at boundaries.
        const exitCode = await ff.exec([
          "-f",
          "lavfi",
          "-t",
          String(durationSecs),
          "-i",
          "anullsrc=r=44100:cl=stereo",
          "-loop",
          "1",
          "-i",
          rawFilename,
          "-map",
          "1:v",
          "-map",
          "0:a",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-tune",
          "stillimage",
          "-crf",
          CRF_STR,
          "-bf",
          "0", // disable B-frames → DTS=PTS, no edit lists → VLC-safe
          "-r",
          TARGET_FPS,
          "-pix_fmt",
          "yuv420p",
          "-vf",
          SCALE_FILTER,
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-t",
          String(durationSecs),
          segFilename,
        ]);

        if (exitCode !== 0) {
          logger.warn(
            `[InstaGrab Offscreen] Image segment ${i} encode failed (exit ${exitCode}), skipping`,
          );
          await ff.deleteFile(rawFilename).catch(() => {});
          continue;
        }
      }

      segmentFiles.push(segFilename);
      await ff.deleteFile(rawFilename).catch(() => {}); // free memory immediately
    }

    if (segmentFiles.length === 0) {
      throw new Error("All segments failed to encode — cannot produce output.");
    }

    // ── Step 1: Join segments with concat demuxer (memory-safe) ──────────────
    const enc = new TextEncoder();
    const concatTxt = segmentFiles.map((f) => `file '${f}'`).join("\n") + "\n";
    await ff.writeFile("concat.txt", enc.encode(concatTxt));
    tempFiles.add("concat.txt");

    const joinExit = await ff.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "concat.txt",
      "-c",
      "copy",
      "joined.mp4",
    ]);
    if (joinExit !== 0)
      throw new Error(`FFmpeg concat join exited with code ${joinExit}`);
    tempFiles.add("joined.mp4");

    // Free all segment files from the WASM heap BEFORE re-encode so the
    // re-encode step has the full heap available.
    for (const f of segmentFiles) await ff.deleteFile(f).catch(() => {});
    await ff.deleteFile("concat.txt").catch(() => {});

    // ── Step 2: Re-encode joined.mp4 for clean, continuous timestamps ─────────
    const finalExit = await ff.exec([
      "-i",
      "joined.mp4",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      CRF_STR,
      "-bf",
      "0",
      "-r",
      TARGET_FPS,
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "copy", // audio already correct — remux only
      "-movflags",
      "+faststart",
      "output.mp4",
    ]);
    await ff.deleteFile("joined.mp4").catch(() => {});
    tempFiles.add("output.mp4");

    if (finalExit !== 0)
      throw new Error(`FFmpeg re-encode exited with code ${finalExit}`);

    // ── Read output ────────────────────────────────────────────────────────────
    const data = await ff.readFile("output.mp4");
    const blob = new Blob([data.buffer], { type: "video/mp4" });
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return dataUrl;

  } catch (err) {
    // ── On WASM OOM or any other fatal error: reset the FFmpeg instance ────────
    // After a RuntimeError the WASM heap may be in an undefined state.
    // Resetting forces the next compilation to load a fresh WASM module,
    // exactly equivalent to removing + re-adding the extension.
    if (err instanceof Error && err.message.includes("memory access out of bounds")) {
      logger.warn("[InstaGrab Offscreen] WASM OOM detected — resetting FFmpeg instance");
      resetFFmpeg();
    }
    throw err; // re-throw so the caller can report failure to the UI

  } finally {
    // ── Guaranteed cleanup — runs on success AND error ────────────────────────
    // Delete every file we registered in tempFiles so orphaned files never
    // accumulate in the WASM FS across multiple compilation attempts.
    const ff2 = ffmpegInstance; // may be null if resetFFmpeg() was just called
    if (ff2) {
      for (const f of tempFiles) {
        await ff2.deleteFile(f).catch(() => {});
      }
    }
  }
}


// ─── Legacy image-only path (backwards compat) ───────────────────────────────
// Used when imageDataArray is sent instead of mediaItems (old code paths).

async function compileMP4Legacy(
  imageDataArray,
  durationSecs,
  crf = 24,
  onProgress = null,
) {
  const items = imageDataArray.map((data) => ({
    data,
    type: "image",
    ext: "jpg",
  }));
  return compileMP4(items, durationSecs, crf, onProgress);
}

// ─── Message listener ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  // Only handle messages explicitly addressed to this offscreen document
  if (message.target !== "offscreen-ffmpeg") return false;

  if (message.type === "FFMPEG_COMPILE_SLIDESHOW") {
    const { requestId, tabId, mediaItems, imageDataArray, durationSecs, crf } =
      message;

    const itemCount = mediaItems
      ? mediaItems.length
      : imageDataArray
        ? imageDataArray.length
        : 0;
    logger.log(
      `[InstaGrab Offscreen] Compile request ${requestId}: ` +
        `${itemCount} items × ${durationSecs}s (CRF: ${crf})`,
    );

    // Progress callback — fires before each segment encode begins.
    // Sends FFMPEG_PROGRESS to background, which relays it to the tab.
    function reportProgress(info) {
      chrome.runtime
        .sendMessage({
          type: "FFMPEG_PROGRESS",
          requestId,
          tabId,
          segment: info.segment,
          totalSegments: info.totalSegments,
          phase: info.phase,
        })
        .catch(() => {}); // fire-and-forget
    }

    // Choose compile path: new mixed path or legacy image-only
    const compilePromise =
      mediaItems && mediaItems.length > 0
        ? compileMP4(mediaItems, durationSecs, crf, reportProgress)
        : compileMP4Legacy(imageDataArray, durationSecs, crf, reportProgress);

    compilePromise
      .then((dataUrl) => {
        chrome.runtime.sendMessage({
          type: "FFMPEG_COMPILE_RESULT",
          requestId,
          tabId,
          success: true,
          dataUrl,
        });
      })
      .catch((err) => {
        logger.error("[InstaGrab Offscreen] FFmpeg error:", err);
        chrome.runtime.sendMessage({
          type: "FFMPEG_COMPILE_RESULT",
          requestId,
          tabId,
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
  logger.warn("[InstaGrab Offscreen] Pre-warm failed (non-fatal):", err),
);
