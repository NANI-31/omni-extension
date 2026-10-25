// ─── Instagram Download Button Overlay & DOM Scanner ───────────────────────
import {
  DOWNLOAD_ICON_SVG,
  SUCCESS_ICON_SVG,
  ERROR_ICON_SVG,
  LOADING_ICON_SVG,
  setSafeHTML
} from './constants.js';

import { downloadMediaList } from './downloader.js';
import { extractPostMedia } from './slideExtractor.js';
import {
  getPostId,
  getActiveSlideIndex,
  isActiveSlideVideo
} from './domScraper.js';

let scanTimeout = null;
let isObserving = false;
let observer = null;

/**
 * Injects the download button into the Post action bar
 */
export function processPost(article) {
  // Check if button is already injected
  if (article.querySelector('.instagrab-download-btn')) {
    return;
  }

  // Find standard action bar section containing Like, Comment, Share, Bookmark
  const sections = Array.from(article.querySelectorAll('section'));
  const actionBar = sections.find((section) => section.querySelector('svg'));
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

  setSafeHTML(btnContainer, DOWNLOAD_ICON_SVG);

  const postId = getPostId(article);
  btnContainer.setAttribute('data-post-id', postId);
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
  btnContainer.addEventListener(
    'click',
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Show loading spinner
      setSafeHTML(btnContainer, LOADING_ICON_SVG);

      const targetPostId = btnContainer.getAttribute('data-post-id') || getPostId(article);
      const slideIndex = getActiveSlideIndex(article);
      const isVideoPost = isActiveSlideVideo(article, slideIndex);

      article.classList.add('instagrab-active-target');

      try {
        const { mediaList, captionText, username, finalPostId } = await extractPostMedia(
          article,
          targetPostId,
          slideIndex,
          isVideoPost
        );

        if (finalPostId && finalPostId !== targetPostId) {
          btnContainer.setAttribute('data-post-id', finalPostId);
        }

        if (!mediaList || mediaList.length === 0) {
          throw new Error('Failed to extract media URL');
        }

        const success = await downloadMediaList(
          mediaList,
          username,
          finalPostId,
          captionText,
          btnContainer
        );

        if (success) {
          setSafeHTML(btnContainer, SUCCESS_ICON_SVG);
          setTimeout(() => {
            setSafeHTML(btnContainer, DOWNLOAD_ICON_SVG);
          }, 2000);
        } else {
          throw new Error('Download failed');
        }
      } catch (error) {
        setSafeHTML(btnContainer, ERROR_ICON_SVG);
        setTimeout(() => {
          setSafeHTML(btnContainer, DOWNLOAD_ICON_SVG);
        }, 3000);
      } finally {
        article.classList.remove('instagrab-active-target');
      }
    },
    true
  );

  // Insert the button
  if (anchorNode && anchorNode.parentNode) {
    anchorNode.parentNode.insertBefore(btnContainer, anchorNode);
  } else {
    actionBar.appendChild(btnContainer);
  }
}

/**
 * Scans the DOM for Instagram posts and reels and injects action bar buttons
 */
export function scanDOM() {
  const articles = document.querySelectorAll('article');
  articles.forEach(processPost);

  const reelContainers = document.querySelectorAll('div[role="dialog"]');
  for (let container of reelContainers) {
    if (container.querySelector('.instagrab-download-btn')) continue;
    const article = container.querySelector('article') || container;
    processPost(article);
  }
}

/**
 * Initializes MutationObserver and debounced DOM scanner
 */
export function initButtonOverlay() {
  if (isObserving) return;

  if (!observer) {
    observer = new MutationObserver(() => {
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(scanDOM, 300);
    });
  }

  setTimeout(() => {
    isObserving = true;
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    scanDOM();
  }, 2500);
}

/**
 * Disconnects observer and removes all injected buttons from DOM
 */
export function removeButtonOverlays() {
  if (observer) {
    observer.disconnect();
  }
  isObserving = false;
  if (scanTimeout) {
    clearTimeout(scanTimeout);
    scanTimeout = null;
  }
  document.querySelectorAll('.instagrab-download-btn').forEach((el) => el.remove());
}
