import {
  settings,
  logger
} from './constants.js';

import {
  compileSlideshowViaFFmpeg,
  compileSlideshowToVideo,
  blobToDataURL
} from './slideshow.js';

/**
 * Direct browser download using an <a> tag and object URL.
 * Used as a fallback when the extension context is invalidated.
 */
async function downloadDirectly(url, filename) {
  const a = document.createElement('a');
  a.style.display = 'none';
  document.body.appendChild(a);

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    a.href = url;
    a.download = filename;
    a.click();
    document.body.removeChild(a);
    return true;
  }

  try {
    const resp = await fetch(url, { credentials: 'omit' });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    a.href = blobUrl;
    a.download = filename;
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      if (a.parentNode) document.body.removeChild(a);
    }, 100);
    return true;
  } catch (err) {
    logger.error('[InstaGrab] Direct download failed, attempting fallback link:', err);
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.click();
    document.body.removeChild(a);
    return false;
  }
}

/**
 * Sends download message to background, falling back to direct download if extension context is invalidated.
 */
async function safeDownloadMedia(url, filename, meta) {
  const isContextValid = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  
  if (!isContextValid) {
    logger.warn('[InstaGrab] Extension context invalidated. Falling back to direct browser download.');
    return await downloadDirectly(url, filename);
  }

  try {
    return await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_MEDIA',
        url,
        filename,
        meta
      }, (response) => {
        if (chrome.runtime.lastError) {
          const errMsg = chrome.runtime.lastError.message;
          if (errMsg.includes('context invalidated')) {
            logger.warn('[InstaGrab] Extension context invalidated during message. Falling back to direct browser download.');
            resolve(downloadDirectly(url, filename));
          } else {
            logger.error('[InstaGrab] Download failed via extension:', errMsg);
            resolve(false);
          }
        } else {
          resolve(response && response.success);
        }
      });
    });
  } catch (err) {
    if (err.message && err.message.includes('context invalidated')) {
      logger.warn('[InstaGrab] Extension context invalidated caught. Falling back to direct browser download.');
      return await downloadDirectly(url, filename);
    }
    logger.error('[InstaGrab] sendMessage thrown error:', err);
    return false;
  }
}

/**
 * Common download function used for both Feed Posts/Reels and Direct Messages.
 * Handles single file downloads, slideshow video compilations, and metadata extraction.
 */
function getFormattedSize(dataUrl) {
  try {
    if (!dataUrl) return 'Unknown size';
    if (!dataUrl.startsWith('data:')) return 'Remote URL';
    const base64Part = dataUrl.split(',')[1] || dataUrl;
    let sizeInBytes = base64Part.length * 0.75;
    if (base64Part.endsWith('==')) {
      sizeInBytes -= 2;
    } else if (base64Part.endsWith('=')) {
      sizeInBytes -= 1;
    }
    if (sizeInBytes >= 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (sizeInBytes >= 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    }
    return `${Math.round(sizeInBytes)} B`;
  } catch (e) {
    return 'Unknown size';
  }
}

export async function downloadMediaList(mediaList, username, postId, captionText) {
  let downloadCount = 0;
  let failCount = 0;

  // 1. Slideshow compilation branch
  const isImageOnlyCarousel = mediaList.length > 1 && mediaList.every(m => m.type === 'image');
  if (settings.compileSlidesAsVideo && isImageOnlyCarousel) {
    try {
      let videoDataUrl, videoFilename;
      const startTime = performance.now();

      if (settings.slideshowEncoder === 'ffmpeg') {
        // MP4 via FFmpeg.wasm (offscreen document)
        videoDataUrl = await compileSlideshowViaFFmpeg(mediaList, settings.slideDurationSecs, settings.slideshowQuality);
        videoFilename = `${username}_${postId}_slideshow.mp4`;
      } else {
        // WebM via Canvas + MediaRecorder
        videoDataUrl = await compileSlideshowToVideo(mediaList, settings.slideDurationSecs * 1000);
        videoFilename = `${username}_${postId}_slideshow.webm`;
      }

      const durationMs = Math.round(performance.now() - startTime);
      const sizeStr = getFormattedSize(videoDataUrl);
      const formatLabel = settings.slideshowEncoder === 'ffmpeg' ? 'MP4' : 'WebM';
      logger.log(`Successfully compiled ${formatLabel} slideshow in ${durationMs}ms (size: ${sizeStr})`);

      const success = await safeDownloadMedia(videoDataUrl, videoFilename, {
        username,
        postId,
        mediaType: 'video',
        thumbnailUrl: mediaList[0]?.url || ''
      });
      if (success) downloadCount++; else failCount++;
    } catch (slideshowErr) {
      logger.error('[InstaGrab] Slideshow compilation failed, falling back to individual downloads:', slideshowErr);
      for (let i = 0; i < mediaList.length; i++) {
        const item = mediaList[i];
        let downloadUrl = item.url;
        const currentSlideIdx = item.slideIndex !== undefined ? item.slideIndex : i;
        if (downloadUrl.startsWith('blob:')) {
          try { downloadUrl = await blobToDataURL(downloadUrl); } catch { failCount++; continue; }
        }
        const fileExt = item.type === 'video' ? 'mp4' : 'jpg';
        const filename = `${username}_${postId}_${currentSlideIdx + 1}.${fileExt}`;
        const ok = await safeDownloadMedia(downloadUrl, filename, {
          username,
          postId,
          mediaType: item.type,
          thumbnailUrl: item.thumbnail
        });
        if (ok) downloadCount++; else failCount++;
      }
    }
  } else {
    // 2. Normal per-item download loop
    for (let i = 0; i < mediaList.length; i++) {
      const item = mediaList[i];
      let downloadUrl = item.url;
      const currentSlideIdx = item.slideIndex !== undefined ? item.slideIndex : i;

      if (downloadUrl.startsWith('blob:')) {
        try {
          downloadUrl = await blobToDataURL(downloadUrl);
        } catch (blobErr) {
          failCount++;
          continue;
        }
      }

      const fileExt = item.type === 'video' ? 'mp4' : 'jpg';
      const filename = `${username}_${postId}_${currentSlideIdx + 1}.${fileExt}`;

      const downloadSuccess = await safeDownloadMedia(downloadUrl, filename, {
        username,
        postId,
        mediaType: item.type,
        thumbnailUrl: item.thumbnail
      });

      if (downloadSuccess) downloadCount++; else failCount++;
    }
  }

  // 3. Download metadata text file
  try {
    const txtFilename = `${username}_${postId}.txt`;
    const postLink = `https://www.instagram.com/p/${postId}/`;
    const profileLink = `https://www.instagram.com/${username}/`;
    const txtContent = `Instagram ID Link: ${profileLink}\nPost Link: ${postLink}\n\nCaption:\n${captionText}`;
    const dataUrl = "data:text/plain;charset=utf-8," + encodeURIComponent(txtContent);

    await safeDownloadMedia(dataUrl, txtFilename, {
      username,
      postId,
      mediaType: "text",
      thumbnailUrl: ""
    });
  } catch (txtErr) {
    // Fail silently on text file metadata errors
  }

  if (downloadCount === 0 && failCount > 0) {
    throw new Error(`All downloads failed (${failCount} errors).`);
  }

  return downloadCount > 0;
}
