// Instagram Downloader Content Script Orchestrator
import {
  DOWNLOAD_ICON_SVG,
  SUCCESS_ICON_SVG,
  ERROR_ICON_SVG,
  LOADING_ICON_SVG,
  settings,
  logger
} from './content/constants.js';

import {
  downloadMediaList
} from './content/downloader.js';

import {
  requestDirectMediaFromReact
} from './content/reactExtractor.js';

import {
  getUsername,
  getPostId,
  getActiveSlideIndex,
  getCaptionFromDOM,
  isActiveSlideVideo,
  getMediaDetails,
  injectCustomStyles,
  injectMainWorldScript
} from './content/domScraper.js';

import {
  fetchDirectUrls
} from './content/jsonParser.js';

import {
  isChatPage,
  setupChatUnsendObserver,
  stopChatUnsendObserver
} from './content/chatUnsend.js';

// Cache validated fiber results: postId → { mediaList, caption }
// Prevents stale fiber data when Instagram re-opens a modal (same post, different DOM)
const mediaCacheByPostId = new Map();

// Injects the download button into the Post action bar
function processPost(article) {
  // Check if button is already injected
  if (article.querySelector('.instagrab-download-btn')) {
    return;
  }

  // Find standard action bar section containing Like, Comment, Share, Bookmark
  const sections = Array.from(article.querySelectorAll('section'));
  const actionBar = sections.find(section => {
    return section.querySelector('svg');
  });

  if (!actionBar) return;

  // Find the Bookmark/Save button on the right side
  const svgs = actionBar.querySelectorAll('svg');
  let bookmarkBtn = null;
  
  for (let svg of svgs) {
    const label = (svg.getAttribute('aria-label') || '').toLowerCase();
    if (label.includes('save') || label.includes('bookmark') || label.includes('remove')) {
      bookmarkBtn = svg.closest('button') || svg.closest('div[role="button"]');
      break;
    }
    const polygon = svg.querySelector('polygon');
    if (polygon) {
      bookmarkBtn = svg.closest('button') || svg.closest('div[role="button"]');
      break;
    }
  }

  const anchorNode = bookmarkBtn ? bookmarkBtn : null;

  // Create Download Button Container
  const btnContainer = document.createElement('div');
  btnContainer.className = 'instagrab-download-btn';
  btnContainer.style.display = 'inline-flex';
  btnContainer.style.alignItems = 'center';
  btnContainer.style.justifyContent = 'center';
  btnContainer.style.cursor = 'pointer';
  btnContainer.style.padding = '8px';
  btnContainer.style.marginLeft = '4px';
  btnContainer.style.marginRight = '4px';
  
  const siblingSvg = actionBar.querySelector('svg');
  if (siblingSvg) {
    btnContainer.style.color = window.getComputedStyle(siblingSvg).color || 'currentColor';
  } else {
    btnContainer.style.color = 'currentColor';
  }

  btnContainer.innerHTML = DOWNLOAD_ICON_SVG;
  const postId = getPostId(article);
  btnContainer.setAttribute('data-post-id', postId);
  // Also stamp the article itself so injected.js can uniquely find it
  article.setAttribute('data-instagrab-post-id', postId);

  // Block Instagram from intercepting events (Capture Phase)
  const stopProp = (e) => e.stopPropagation();
  const preventAndStop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  btnContainer.addEventListener('mousedown', preventAndStop, true);
  btnContainer.addEventListener('mouseup', stopProp, true);
  btnContainer.addEventListener('mouseover', stopProp, true);
  btnContainer.addEventListener('mouseenter', stopProp, true);
  btnContainer.addEventListener('mouseout', stopProp, true);
  btnContainer.addEventListener('mouseleave', stopProp, true);

  // Click Handler in Capture Phase
  btnContainer.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Show loading spinner
    btnContainer.innerHTML = LOADING_ICON_SVG;

    let username = getUsername(article);
    const postId = btnContainer.getAttribute('data-post-id') || getPostId(article);
    const slideIndex = getActiveSlideIndex(article);
    const isVideoPost = isActiveSlideVideo(article, slideIndex);

    // Mark this article container as active target for precise extraction in the main world
    article.classList.add('instagrab-active-target');

    try {
      let mediaList = null;
      let captionText = "";
      let finalPostId = postId;

      // 0. Check cache first — avoids stale fiber data on modal re-open
      if (mediaCacheByPostId.has(postId)) {
        const cached = mediaCacheByPostId.get(postId);
        mediaList = cached.mediaList;
        captionText = cached.caption;
      }

      // 1. Try React props extraction (only if no cache hit)
      if (!mediaList || mediaList.length === 0) {
        const reactResult = await requestDirectMediaFromReact(postId, slideIndex, isVideoPost);

        if (reactResult && reactResult.mediaList && reactResult.mediaList.length > 0) {
          // VALIDATION: Check that extracted URLs actually match the currently displayed content.
          let validationPassed = true;
          const displayedImg = article.querySelector('img[srcset]:not(header img)');
          if (displayedImg && !isVideoPost) {
            const srcset = displayedImg.getAttribute('srcset') || '';
            const displayedSrcs = srcset.split(',').map(s => s.trim().split(/\s+/)[0]).concat([displayedImg.src]);
            
            const getFingerprint = (url) => {
              if (!url) return null;
              const m = url.match(/\/(\d+_\d+_\d+_n)\./);
              return m ? m[1] : null;
            };
            
            const displayedFingerprints = displayedSrcs.map(getFingerprint).filter(Boolean);
            
            if (displayedFingerprints.length > 0) {
              const extractedFingerprints = reactResult.mediaList.map(item => getFingerprint(item.url)).filter(Boolean);
              const anyMatch = extractedFingerprints.some(ef => displayedFingerprints.includes(ef));
              
              if (!anyMatch) {
                validationPassed = false;
              }
            }
          }
          
          if (validationPassed) {
            mediaList = reactResult.mediaList;
            captionText = reactResult.caption || "";
            if (reactResult.realPostId) {
              finalPostId = reactResult.realPostId;
              article.setAttribute('data-instagrab-post-id', finalPostId);
              btnContainer.setAttribute('data-post-id', finalPostId);
            }
            if (reactResult.username) {
              username = reactResult.username;
            }
            // Cache this validated result for future re-downloads
            mediaCacheByPostId.set(finalPostId, { mediaList, caption: captionText });
          }
        }
      } // end React extraction block

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

      if (!mediaList || mediaList.length === 0) {
        throw new Error("Failed to extract media URL");
      }

      const success = await downloadMediaList(mediaList, username, finalPostId, captionText);
      if (success) {
        btnContainer.innerHTML = SUCCESS_ICON_SVG;
        setTimeout(() => {
          btnContainer.innerHTML = DOWNLOAD_ICON_SVG;
        }, 2000);
      } else {
        throw new Error("Download failed");
      }

    } catch (error) {
      btnContainer.innerHTML = ERROR_ICON_SVG;
      setTimeout(() => {
        btnContainer.innerHTML = DOWNLOAD_ICON_SVG;
      }, 3000);
    } finally {
      article.classList.remove('instagrab-active-target');
    }
  }, true);

  // Insert the button
  if (anchorNode && anchorNode.parentNode) {
    anchorNode.parentNode.insertBefore(btnContainer, anchorNode);
  } else {
    actionBar.appendChild(btnContainer);
  }
}

// Scans the DOM for Instagram posts and processes them
function scanDOM() {
  const articles = document.querySelectorAll('article');
  articles.forEach(processPost);

  const reelContainers = document.querySelectorAll('div[role="dialog"]');
  containerLoop: for (let container of reelContainers) {
    // Prevent double processing Reels
    if (container.querySelector('.instagrab-download-btn')) continue;
    const article = container.querySelector('article') || container;
    processPost(article);
  }
}

// Observe DOM mutations to scan when scrolling or switching views
let scanTimeout = null;
const observer = new MutationObserver(() => {
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = setTimeout(scanDOM, 300);
});

// Delay observer start and initial scan to prevent React hydration mismatches (Error #418)
function initializeDownloader() {
  injectCustomStyles();
  injectMainWorldScript();

  // Sync state for Quick Unsend
  chrome.storage.local.get(["quickUnsendEnabled"], (result) => {
    if (result.quickUnsendEnabled) setupChatUnsendObserver();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.quickUnsendEnabled) {
      if (changes.quickUnsendEnabled.newValue) setupChatUnsendObserver();
      else stopChatUnsendObserver();
    }
  });

  setTimeout(() => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    scanDOM();
  }, 2500);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initializeDownloader();
} else {
  window.addEventListener('load', initializeDownloader);
}

// Global click listener to intercept clicks on post media (feed & chat DMs)
document.addEventListener('click', async (e) => {
  if (!settings.clickToDownloadEnabled) return;

  const target = e.target;
  const interactiveAncestor = target.closest('a, button, input, textarea, [role="button"]');
  
  let isPlayPause = false;
  if (interactiveAncestor && interactiveAncestor.getAttribute('role') === 'button' && interactiveAncestor.tagName === 'DIV') {
    const rect = interactiveAncestor.getBoundingClientRect();
    if (rect.width > 120 && rect.height > 120) {
      isPlayPause = true;
    }
  }

  let isDetailLink = false;
  if (interactiveAncestor && interactiveAncestor.tagName === 'A') {
    const href = (interactiveAncestor.getAttribute('href') || '').toLowerCase();
    isDetailLink = /\/(?:p|reel|reels)\/[A-Za-z0-9_-]+/.test(href);
  }

  if (interactiveAncestor && !isPlayPause && !isDetailLink) return;

  const isInsideArticle = target.closest('article');
  const isInsideChat = isChatPage();

  if (!isInsideArticle && !isInsideChat) return;

  const isImageOrVideo = target.tagName === 'IMG' || target.tagName === 'VIDEO';
  const hasMediaDescendant = target.querySelector('img, video');
  
  let hasMediaNearby = false;
  let curr = target;
  for (let i = 0; i < 3 && curr; i++) {
    if (curr.tagName === 'ARTICLE') break;
    const videoEl = curr.querySelector('video');
    const imgEl = curr.querySelector('img');
    const isAvatar = imgEl && (imgEl.closest('header') || imgEl.closest('a[href^="/"]'));
    if (videoEl || (imgEl && !isAvatar)) {
      hasMediaNearby = true;
      break;
    }
    curr = curr.parentElement;
  }

  const isKnownMediaOverlay = target.closest('div._aabd') || target.closest('div._aamd') || target.closest('div._aamf') || target.closest('div.x1n2onr6');

  if (!isImageOrVideo && !hasMediaDescendant && !hasMediaNearby && !isKnownMediaOverlay) return;

  const postLink = target.closest('a[href*="/p/"], a[href*="/reel/"], a[href*="/reels/"]');
  let postId = null;
  
  if (postLink) {
    const href = postLink.getAttribute('href');
    const match = href.match(/\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      postId = match[1];
    }
  }
  
  if (!postId && isInsideArticle) {
    postId = isInsideArticle.getAttribute('data-instagrab-post-id') || getPostId(isInsideArticle);
  }
  
  if (!postId && isInsideChat) {
    postId = 'chat_click';
  }
  
  if (!postId) return;

  e.preventDefault();
  e.stopPropagation();

  if (postId === 'chat_click') {
    target.classList.add('instagrab-chat-target');
  }

  // ROUTE 1: Feed/Modal post containing an article and injected button
  if (isInsideArticle && postId !== 'chat_click') {
    const downloadBtn = isInsideArticle.querySelector('.instagrab-download-btn');
    if (downloadBtn) {
      downloadBtn.click();
      return;
    }
  }

  // ROUTE 2: Direct Messages (Chat) or fallback direct download
  if (isInsideChat || postId === 'chat_click' || isInsideArticle) {
    const feedbackCard = target.closest('div[role="button"]') || target;
    const originalCursor = feedbackCard.style.cursor;
    const originalOpacity = feedbackCard.style.opacity;
    feedbackCard.style.cursor = 'wait';
    feedbackCard.style.opacity = '0.7';

    try {
      let username = (isInsideArticle ? getUsername(isInsideArticle) : "") || "instagram_post";
      
      const dmIsVideo = !!(target.tagName === 'VIDEO' || target.querySelector?.('video'));
      const reactResult = await requestDirectMediaFromReact(postId, 0, dmIsVideo, 8000);
      
      let mediaList = null;
      let captionText = "";
      let finalPostId = postId;
      
      if (reactResult && reactResult.mediaList && reactResult.mediaList.length > 0) {
        mediaList = reactResult.mediaList;
        captionText = reactResult.caption || "";
        if (reactResult.realPostId) finalPostId = reactResult.realPostId;
        if (reactResult.username) username = reactResult.username;
      }
      
      if ((!mediaList || mediaList.length === 0) && finalPostId && finalPostId !== 'chat_click') {
        const fetchResult = await fetchDirectUrls(finalPostId);
        if (fetchResult && fetchResult.mediaList && fetchResult.mediaList.length > 0) {
          mediaList = fetchResult.mediaList;
          captionText = fetchResult.caption || "";
          if (fetchResult.username) username = fetchResult.username;
        }
      }
      
      if (!mediaList || mediaList.length === 0) {
        throw new Error("Failed to extract media list");
      }

      const success = await downloadMediaList(mediaList, username, finalPostId, captionText);
      if (success) {
        // Visual success confirmation
        feedbackCard.style.opacity = '1.0';
        feedbackCard.style.backgroundColor = 'rgba(0, 242, 254, 0.1)';
        setTimeout(() => {
          feedbackCard.style.backgroundColor = '';
          feedbackCard.style.cursor = originalCursor;
        }, 1000);
      } else {
        throw new Error("Download failed");
      }

    } catch (err) {
      logger.error("[InstaGrab DM Debug]   Download failed:", err);
      feedbackCard.style.opacity = '1.0';
      feedbackCard.style.backgroundColor = 'rgba(255, 75, 75, 0.15)';
      setTimeout(() => {
        feedbackCard.style.backgroundColor = '';
        feedbackCard.style.cursor = originalCursor;
      }, 1500);
    } finally {
      target.classList.remove('instagrab-chat-target');
    }
  }
}, true);
