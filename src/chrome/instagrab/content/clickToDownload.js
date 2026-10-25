// ─── Click-to-Download Media Overlay Listener ──────────────────────────────
import { settings, logger } from './constants.js';
import { isChatPage } from './chatUnsend.js';
import { getPostId } from './domScraper.js';
import { extractChatMedia } from './slideExtractor.js';
import { downloadMediaList } from './downloader.js';

/**
 * Attaches the global click listener to intercept direct clicks on media
 */
export function setupClickToDownloadListener(isModuleEnabled = () => true) {
  document.addEventListener(
    'click',
    async (e) => {
      if (!isModuleEnabled()) return; // module is toggled off
      if (!settings.clickToDownloadEnabled) return;

      const target = e.target;
      const interactiveAncestor = target.closest('a, button, input, textarea, [role="button"]');

      let isPlayPause = false;
      if (
        interactiveAncestor &&
        interactiveAncestor.getAttribute('role') === 'button' &&
        interactiveAncestor.tagName === 'DIV'
      ) {
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

      const isKnownMediaOverlay =
        target.closest('div._aabd') ||
        target.closest('div._aamd') ||
        target.closest('div._aamf') ||
        target.closest('div.x1n2onr6');

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
        feedbackCard.style.cursor = 'wait';
        feedbackCard.style.opacity = '0.7';

        try {
          const { mediaList, captionText, username, finalPostId } = await extractChatMedia(
            target,
            postId,
            isInsideArticle
          );

          if (!mediaList || mediaList.length === 0) {
            throw new Error('Failed to extract media list');
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
            throw new Error('Download failed');
          }
        } catch (err) {
          logger.error('[InstaGrab DM Debug] Download failed:', err);
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
    },
    true
  );
}
