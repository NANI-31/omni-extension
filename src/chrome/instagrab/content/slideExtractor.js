// ─── Instagram Slide & Media Extractor Module ──────────────────────────────
import { requestDirectMediaFromReact } from './reactExtractor.js';
import { fetchDirectUrls } from './jsonParser.js';
import {
  getUsername,
  getCaptionFromDOM,
  getMediaDetails
} from './domScraper.js';

// Cache validated fiber results: postId → { mediaList, caption }
// Prevents stale fiber data when Instagram re-opens a modal (same post, different DOM)
export const mediaCacheByPostId = new Map();

/**
 * Validates that extracted URLs from React fiber match the currently displayed content.
 */
export function validateExtractedMedia(article, isVideoPost, reactResult) {
  if (!reactResult?.mediaList?.length) return false;
  if (isVideoPost) return true;

  const displayedImg = article.querySelector('img[srcset]:not(header img)');
  if (!displayedImg) return true;

  const srcset = displayedImg.getAttribute('srcset') || '';
  const displayedSrcs = srcset
    .split(',')
    .map(s => s.trim().split(/\s+/)[0])
    .concat([displayedImg.src]);

  const getFingerprint = (url) => {
    if (!url) return null;
    const m = url.match(/\/(\d+_\d+_\d+_n)\./);
    return m ? m[1] : null;
  };

  const displayedFingerprints = displayedSrcs.map(getFingerprint).filter(Boolean);
  if (displayedFingerprints.length === 0) return true;

  const extractedFingerprints = reactResult.mediaList
    .map(item => getFingerprint(item.url))
    .filter(Boolean);

  return extractedFingerprints.some(ef => displayedFingerprints.includes(ef));
}

/**
 * Multi-layer pipeline for resolving all slides and media URLs in an Instagram post:
 * 1. Checks memory cache
 * 2. React fiber extraction
 * 3. Instagram post HTML JSON endpoint fallback
 * 4. High-resolution DOM scraping fallback
 */
export async function extractPostMedia(article, postId, slideIndex, isVideoPost) {
  let mediaList = null;
  let captionText = "";
  let finalPostId = postId;
  let username = getUsername(article);

  // 0. Check cache first — avoids stale fiber data on modal re-open
  if (mediaCacheByPostId.has(postId)) {
    const cached = mediaCacheByPostId.get(postId);
    mediaList = cached.mediaList;
    captionText = cached.caption;
  }

  // 1. Try React props extraction (only if no cache hit)
  if (!mediaList || mediaList.length === 0) {
    const reactResult = await requestDirectMediaFromReact(postId, slideIndex, isVideoPost);

    if (reactResult?.mediaList?.length > 0) {
      const validationPassed = validateExtractedMedia(article, isVideoPost, reactResult);

      if (validationPassed) {
        mediaList = reactResult.mediaList;
        captionText = reactResult.caption || "";
        if (reactResult.realPostId) {
          finalPostId = reactResult.realPostId;
          article.setAttribute('data-instagrab-post-id', finalPostId);
        }
        if (reactResult.username) {
          username = reactResult.username;
        }
        // Cache this validated result for future re-downloads
        mediaCacheByPostId.set(finalPostId, { mediaList, caption: captionText });
      }
    }
  }

  // 2. Fallback: query the post HTML endpoint
  if (!mediaList || mediaList.length === 0) {
    const fetchResult = await fetchDirectUrls(postId);
    if (fetchResult) {
      mediaList = fetchResult.mediaList;
      captionText = fetchResult.caption || "";
      if (fetchResult.username) {
        username = fetchResult.username;
      }
    }
  }

  // 3. Last resort fallback: DOM Scraping + high-res image detection
  if (!mediaList || mediaList.length === 0) {
    const singleMedia = getMediaDetails(article);
    if (singleMedia) {
      mediaList = [singleMedia];
    }
  }

  if (!captionText) {
    captionText = getCaptionFromDOM(article);
  }

  return {
    mediaList,
    captionText,
    username,
    finalPostId,
  };
}

/**
 * Resolves media items in Direct Message (Chat) contexts or fallback direct clicks.
 */
export async function extractChatMedia(target, postId, isInsideArticle) {
  let username = (isInsideArticle ? getUsername(isInsideArticle) : "") || "instagram_post";
  const dmIsVideo = !!(target.tagName === 'VIDEO' || target.querySelector?.('video'));
  const reactResult = await requestDirectMediaFromReact(postId, 0, dmIsVideo, 8000);

  let mediaList = null;
  let captionText = "";
  let finalPostId = postId;

  if (reactResult?.mediaList?.length > 0) {
    mediaList = reactResult.mediaList;
    captionText = reactResult.caption || "";
    if (reactResult.realPostId) finalPostId = reactResult.realPostId;
    if (reactResult.username) username = reactResult.username;
  }

  if ((!mediaList || mediaList.length === 0) && finalPostId && finalPostId !== 'chat_click') {
    const fetchResult = await fetchDirectUrls(finalPostId);
    if (fetchResult?.mediaList?.length > 0) {
      mediaList = fetchResult.mediaList;
      captionText = fetchResult.caption || "";
      if (fetchResult.username) username = fetchResult.username;
    }
  }

  return {
    mediaList,
    captionText,
    username,
    finalPostId,
  };
}
