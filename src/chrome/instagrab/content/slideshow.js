// Slideshow compilation functions (Canvas WebM / FFmpeg MP4)
// Supports image-only, video-only, and mixed (image + video) carousels.
import { logger } from './constants.js';

/**
 * compileSlideshowViaFFmpeg(mediaList, durationSecs, crf)
 *
 * Fetches every carousel item (image or video) in the content script context
 * (same-origin as instagram.com — no CORS issues), converts each to base64, and
 * sends the full mediaItems array to the background → offscreen FFmpeg encoder.
 *
 * Each item in mediaItems:
 *   { data: string (raw base64, no prefix), type: 'image'|'video', ext: 'jpg'|'mp4' }
 *
 * The offscreen encoder writes images as still frames (with durationSecs hold time)
 * and videos as real segments (re-encoded and joined). All merged into one MP4.
 */
export async function compileSlideshowViaFFmpeg(mediaList, durationSecs, crf = 24, onProgress = null) {
  // Step 1: Fetch every item in parallel and encode as base64
  const mediaItems = await Promise.all(
    mediaList.map(async (item) => {
      // For blob: URLs (e.g. from <video src="blob:...">) convert via blobToDataURL first
      let fetchUrl = item.url;
      if (fetchUrl.startsWith('blob:')) {
        fetchUrl = await blobToDataURL(fetchUrl);
        const base64 = fetchUrl.split(',')[1];
        // blob: URLs are always local — trust item.type directly
        const isVideo = item.type === 'video';
        return { data: base64, type: isVideo ? 'video' : 'image', ext: isVideo ? 'mp4' : 'jpg' };
      }

      const resp = await fetch(fetchUrl, { credentials: 'omit' });
      if (!resp.ok) throw new Error(`Fetch failed (${resp.status}) for ${fetchUrl}`);
      const blob = await resp.blob();

      // ── 4-layer type detection (most reliable → least reliable) ───────────
      //
      // 1. item.type from React extractor — usually accurate for clean extractions
      // 2. blob MIME type — unreliable: Instagram CDN returns 'application/octet-stream'
      //    for MP4 files, not 'video/mp4'
      // 3. URL extension (before ?) — Instagram CDN URLs are query-string based with
      //    no .mp4 in the path, so this also fails for most Instagram videos
      // 4. Magic bytes — read the first 12 bytes and check for known video signatures:
      //      MP4/M4V/QuickTime: box type at offset 4 is 'ftyp', 'moov', 'mdat', etc.
      //      WebM/Matroska: EBML header 0x1A 0x45 0xDF 0xA3 at offset 0
      //    This is the most reliable layer — it reads actual file content, not metadata.

      const urlPath = fetchUrl.split('?')[0].toLowerCase();
      const isVideoByUrl  = urlPath.endsWith('.mp4') || urlPath.endsWith('.mov') || urlPath.endsWith('.webm');
      const isVideoByMime = blob.type.startsWith('video/');

      // Read first 12 bytes for magic-number detection (async, minimal overhead)
      let isVideoByMagic = false;
      try {
        const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
        // MP4 ISO box: bytes 4-7 are the box type (size is at 0-3)
        const boxType = String.fromCharCode(header[4], header[5], header[6], header[7]);
        const isMp4Box = ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip'].includes(boxType);
        // WebM EBML header
        const isWebM   = header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3;
        isVideoByMagic = isMp4Box || isWebM;
      } catch (_) { /* non-fatal — fall through to other layers */ }

      const isVideo = item.type === 'video' || isVideoByMime || isVideoByUrl || isVideoByMagic;

      const ext = isVideo ? 'mp4' : 'jpg';

      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });

      return { data: base64, type: isVideo ? 'video' : 'image', ext };

    })
  );

  // Step 2: Send compile request to background. BG responds IMMEDIATELY with
  // { started: true, requestId } to close the message channel quickly.
  // The actual result is pushed back via chrome.tabs.sendMessage once FFmpeg
  // finishes (could take minutes). Progress events are also pushed this way.
  return new Promise((resolve, reject) => {
    const isContextValid = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    if (!isContextValid) {
      return reject(new Error('Extension context invalidated'));
    }

    let targetRequestId = null;

    // Listener that receives both progress events and the final result from background → tab
    function onMessage(msg) {
      if (!targetRequestId || msg.requestId !== targetRequestId) return;

      if (msg.type === 'FFMPEG_PROGRESS') {
        // Forward progress to caller (e.g. to update button label)
        if (onProgress) {
          onProgress({
            segment: msg.segment,
            totalSegments: msg.totalSegments,
            phase: msg.phase,
          });
        }
        return; // keep listener alive for more progress / final result
      }

      if (msg.type === 'FFMPEG_COMPILE_RESULT') {
        chrome.runtime.onMessage.removeListener(onMessage);
        if (msg.success) {
          resolve(msg.dataUrl);
        } else {
          reject(new Error(msg.error || 'FFmpeg compile failed'));
        }
      }
    }

    chrome.runtime.onMessage.addListener(onMessage);

    try {
      chrome.runtime.sendMessage(
        { type: 'FFMPEG_COMPILE_SLIDESHOW', mediaItems, durationSecs, crf },
        (response) => {
          if (chrome.runtime.lastError) {
            chrome.runtime.onMessage.removeListener(onMessage);
            return reject(new Error(chrome.runtime.lastError.message));
          }
          if (!response || !response.started) {
            chrome.runtime.onMessage.removeListener(onMessage);
            return reject(new Error('Background did not acknowledge compile request'));
          }
          // Store the requestId so the push listener can filter correctly
          targetRequestId = response.requestId;
        }
      );
    } catch (err) {
      chrome.runtime.onMessage.removeListener(onMessage);
      reject(err);
    }
  });
}



/**
 * compileSlideshowToVideo(mediaList, durationMs)
 *
 * Canvas + MediaRecorder fallback encoder (WebM output).
 * Handles images natively. For video items it draws each frame into the canvas
 * by playing the video element invisibly and capturing frames for durationMs.
 */
export async function compileSlideshowToVideo(mediaList, durationMs) {
  let canvasW = 1080;
  let canvasH = 1080;

  // Pre-process all items into renderable sources
  const sources = await Promise.all(
    mediaList.map(async (item) => {
      const isVideo = item.type === 'video';
      try {
        let srcUrl = item.url;
        if (srcUrl.startsWith('blob:')) {
          // blob: URLs are already usable directly by <video>/<img>
        }

        if (isVideo) {
          // Return a descriptor; the video element is created during rendering
          return { type: 'video', url: srcUrl };
        } else {
          const resp = await fetch(srcUrl, { credentials: 'omit' });
          if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
          const blob = await resp.blob();
          const bitmap = await createImageBitmap(blob);
          return { type: 'image', bitmap };
        }
      } catch (e) {
        logger.warn('[InstaGrab] compileSlideshowToVideo: failed to load item', item.url, e);
        return null;
      }
    })
  );

  // Determine canvas size from the first successfully loaded item
  for (const src of sources) {
    if (!src) continue;
    if (src.type === 'image') {
      canvasW = src.bitmap.width || 1080;
      canvasH = src.bitmap.height || 1080;
      break;
    } else if (src.type === 'video') {
      // We'll set canvas size after the video metadata loads (handled in rendering)
      break;
    }
  }

  const validSources = sources.filter(Boolean);
  if (validSources.length === 0) throw new Error('No items loaded for slideshow compilation');

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  const fps = 10;
  const frameInterval = 1000 / fps;
  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  return new Promise((resolve, reject) => {
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    };
    recorder.onerror = reject;
    recorder.start();

    let idx = 0;

    async function renderNextItem() {
      if (idx >= validSources.length) {
        setTimeout(() => recorder.stop(), 200);
        return;
      }

      const src = validSources[idx++];

      if (src.type === 'image') {
        // Render still image for durationMs at fps
        const bmp = src.bitmap;
        const frames = Math.ceil(durationMs / frameInterval);
        let frameCount = 0;

        function renderImageFrame() {
          if (frameCount >= frames) {
            renderNextItem();
            return;
          }
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(canvas.width / bmp.width, canvas.height / bmp.height);
          const dw = bmp.width * scale;
          const dh = bmp.height * scale;
          ctx.drawImage(bmp, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
          frameCount++;
          setTimeout(renderImageFrame, frameInterval);
        }
        renderImageFrame();

      } else if (src.type === 'video') {
        // Play the video element invisibly and capture its frames to canvas
        const vid = document.createElement('video');
        vid.src = src.url;
        vid.muted = true;
        vid.crossOrigin = 'anonymous';
        vid.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
        document.body.appendChild(vid);

        await new Promise((res) => {
          vid.onloadedmetadata = () => {
            // Size canvas to video dimensions on first video item
            if (canvas.width === 1080 && canvas.height === 1080) {
              canvas.width = vid.videoWidth || 1080;
              canvas.height = vid.videoHeight || 1080;
            }
            res();
          };
          vid.onerror = () => res(); // continue even if metadata fails
          vid.load();
        });

        await vid.play().catch(() => {});

        const videoDurationMs = (vid.duration || durationMs / 1000) * 1000;
        const totalFrames = Math.ceil(videoDurationMs / frameInterval);
        let videoFrameCount = 0;

        function renderVideoFrame() {
          if (videoFrameCount >= totalFrames || vid.ended) {
            vid.pause();
            document.body.removeChild(vid);
            renderNextItem();
            return;
          }
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(canvas.width / vid.videoWidth, canvas.height / vid.videoHeight);
          const dw = vid.videoWidth * scale;
          const dh = vid.videoHeight * scale;
          ctx.drawImage(vid, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
          videoFrameCount++;
          setTimeout(renderVideoFrame, frameInterval);
        }
        renderVideoFrame();
      }
    }

    renderNextItem();
  });
}

// Convert a local blob URL to a base64 Data URL so background script can download it
export async function blobToDataURL(blobUrl) {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to convert blob to Data URL"));
    reader.readAsDataURL(blob);
  });
}
