// Slideshow compilation functions (Canvas WebM / FFmpeg MP4)
import { logger } from './constants.js';

/**
 * compileSlideshowViaFFmpeg(mediaList, durationSecs)
 * Fetches images here in the content script context (same-origin as instagram.com,
 * so no CORS issue), encodes them as base64, then sends the data to the background
 * service worker which routes it to the offscreen FFmpeg encoder.
 * Returns a Promise<string> of the MP4 data: URL.
 */
export async function compileSlideshowViaFFmpeg(mediaList, durationSecs, crf = 24) {
  // Step 1: fetch all images in parallel (avoids sequential round-trip cost for carousels)
  const imageDataArray = await Promise.all(
    mediaList.map(async (item) => {
      const resp = await fetch(item.url, { credentials: 'omit' });
      if (!resp.ok) throw new Error(`Image fetch failed (${resp.status}) for ${item.url}`);
      const blob = await resp.blob();
      return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
    })
  );

  // Step 2: send base64 image data to background → offscreen for FFmpeg encoding
  return new Promise((resolve, reject) => {
    const isContextValid = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    if (!isContextValid) {
      return reject(new Error('Extension context invalidated'));
    }
    try {
      chrome.runtime.sendMessage(
        { type: 'FFMPEG_COMPILE_SLIDESHOW', imageDataArray, durationSecs, crf },
        (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          if (response && response.success) return resolve(response.dataUrl);
          reject(new Error(response?.error || 'FFmpeg compile failed'));
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * compileSlideshowToVideo(mediaList, durationMs)
 * Encodes an array of image-only mediaList items into a WebM video using
 * the native Canvas + MediaRecorder pipeline. Each image is shown for
 * durationMs milliseconds. Returns a data: URL string for the video blob.
 */
export async function compileSlideshowToVideo(mediaList, durationMs) {
  // Determine canvas dimensions from first image (default 1080x1080)
  let canvasW = 1080;
  let canvasH = 1080;

  // Fetch all image blobs in parallel (avoids sequential fetch latency)
  const imageBitmaps = [];
  const fetchedBlobs = await Promise.all(
    mediaList.map(async (item) => {
      try {
        const resp = await fetch(item.url, { credentials: 'omit' });
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        return await resp.blob();
      } catch (e) {
        logger.warn('[InstaGrab] compileSlideshowToVideo: failed to fetch image', item.url, e);
        return null;
      }
    })
  );

  for (const blob of fetchedBlobs) {
    if (!blob) continue;
    try {
      const bitmap = await createImageBitmap(blob);
      if (imageBitmaps.length === 0) {
        // Use first image's native dimensions as canvas size
        canvasW = bitmap.width || 1080;
        canvasH = bitmap.height || 1080;
      }
      imageBitmaps.push(bitmap);
    } catch (e) {
      logger.warn('[InstaGrab] Failed to create ImageBitmap from blob', e);
    }
  }

  if (imageBitmaps.length === 0) throw new Error('No images loaded for slideshow compilation');

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  const fps = 10; // 10 frames per second is smooth enough and highly reliable for canvas streaming
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
      reader.onloadend = () => resolve(reader.result); // data: URL
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    };
    recorder.onerror = reject;

    recorder.start();

    let currentSlideIdx = 0;
    let elapsedForCurrentSlide = 0;

    function renderFrame() {
      if (currentSlideIdx >= imageBitmaps.length) {
        // Hold last frame for a short duration, then stop recorder
        setTimeout(() => {
          recorder.stop();
        }, 200);
        return;
      }

      const bmp = imageBitmaps[currentSlideIdx];
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvasW, canvasH);
      
      // Center-fit the image on the canvas
      const scale = Math.min(canvasW / bmp.width, canvasH / bmp.height);
      const dw = bmp.width * scale;
      const dh = bmp.height * scale;
      const dx = (canvasW - dw) / 2;
      const dy = (canvasH - dh) / 2;
      ctx.drawImage(bmp, dx, dy, dw, dh);

      elapsedForCurrentSlide += frameInterval;
      if (elapsedForCurrentSlide >= durationMs) {
        currentSlideIdx++;
        elapsedForCurrentSlide = 0;
      }

      setTimeout(renderFrame, frameInterval);
    }

    renderFrame();
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
