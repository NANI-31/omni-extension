// Direct DOM Scraper functions (extraction from active DOM nodes)

// Extract high-resolution uncropped image URL from DOM element's srcset
export function getHighResImageFromDOM(imgElement) {
  const srcset = imgElement.getAttribute('srcset');
  if (!srcset) return imgElement.src;
  
  const candidates = srcset.split(',').map(item => {
    const parts = item.trim().split(/\s+/);
    const url = parts[0];
    const width = parseInt(parts[1] || '0', 10);
    return { url, width };
  });
  
  candidates.sort((a, b) => b.width - a.width);
  return candidates[0]?.url || imgElement.src;
}

// Helper function to extract Username from post article
export function getUsername(article) {
  const profileLinks = article.querySelectorAll('a[href^="/"]');
  for (let link of profileLinks) {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('/p/') && !href.startsWith('/reels/') && !href.startsWith('/explore/') && !href.startsWith('/stories/')) {
      const username = href.replace(/\//g, '').split('?')[0];
      if (username && username.length > 0) return username;
    }
  }
  return 'instagram_user';
}

// Helper function to extract Post Shortcode / ID
export function getPostId(article) {
  const postLinks = article.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
  for (let link of postLinks) {
    const href = link.getAttribute('href');
    const match = href.match(/\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Alternative: Check URL if it's a single post detail page
  const match = window.location.pathname.match(/\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  return 'fallback_' + Math.random().toString(36).substring(2, 10);
}

// Helper to identify active slide index in a carousel post
export function getActiveSlideIndex(article) {
  const scrollContainer = article.querySelector('div[style*="overflow-x: auto"], div[style*="overflow-x: scroll"], div.x1n2onr6[style*="flex-direction: row"]');
  if (scrollContainer) {
    const slides = Array.from(scrollContainer.querySelectorAll('li, div.x11i5r08'));
    if (slides.length > 1) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      let minDiff = Infinity;
      let activeIndex = 0;
      
      slides.forEach((slide, idx) => {
        const rect = slide.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const diff = Math.abs(slideCenter - containerCenter);
        if (diff < minDiff) {
          minDiff = diff;
          activeIndex = idx;
        }
      });
      return activeIndex;
    }
  }
  return 0;
}

// Helper to extract the caption text from DOM
export function getCaptionFromDOM(article) {
  if (!article) return '';
  const username = getUsername(article);

  // 1. Check for standard <h1> (Post details pages / Modal dialogs)
  const h1 = article.querySelector('h1');
  if (h1) {
    let text = h1.innerText.trim();
    if (username && text.startsWith(username)) {
      text = text.substring(username.length).trim();
    }
    if (text) return text;
  }

  // 2. Scan for a container that has the username link followed by the caption text
  const links = Array.from(article.querySelectorAll('a[href^="/"]'));
  for (let link of links) {
    const href = link.getAttribute('href');
    if (href) {
      const linkUser = href.replace(/\//g, '').split('?')[0];
      if (linkUser === username) {
        const parent = link.parentElement;
        if (parent) {
          let text = parent.innerText.trim();
          if (text) {
            if (text.startsWith(username)) {
              text = text.substring(username.length).trim();
            }
            return text;
          }
        }
      }
    }
  }

  // 3. Fallback: look for spans with class/attributes
  const span = article.querySelector('div[role="button"] ~ span, span._ap3a, div.x1nh3cc8 span');
  if (span) {
    let text = span.innerText.trim();
    if (username && text.startsWith(username)) {
      text = text.substring(username.length).trim();
    }
    return text;
  }
  
  return '';
}

// Helper to check if the active slide in a carousel contains a video
export function isActiveSlideVideo(article, slideIndex) {
  const scrollContainer = article.querySelector('div[style*="overflow-x: auto"], div[style*="overflow-x: scroll"], div.x1n2onr6[style*="flex-direction: row"]');
  if (scrollContainer) {
    const slides = Array.from(scrollContainer.querySelectorAll('li, div.x11i5r08'));
    if (slides.length > 1 && slides[slideIndex]) {
      if (slides[slideIndex].querySelector('video')) return true;
      const slideBtns = Array.from(slides[slideIndex].querySelectorAll('button, div[role="button"]'));
      const hasAudioBtn = slideBtns.some(btn => {
        const label = (btn.getAttribute('aria-label') || '').toLowerCase();
        return label.includes('audio') || label.includes('mute') || label.includes('sound') || label.includes('unmute');
      });
      if (hasAudioBtn) return true;
    }
  }

  if (article.querySelector('video')) return true;

  const allSpans = Array.from(article.querySelectorAll('span'));
  const hasDurationBadge = allSpans.some(span => /^\d+:\d{2}$/.test(span.textContent.trim()));
  if (hasDurationBadge) return true;

  const allBtns = Array.from(article.querySelectorAll('button, div[role="button"]'));
  const hasAudioControl = allBtns.some(btn => {
    const label = (btn.getAttribute('aria-label') || '').toLowerCase();
    return label.includes('audio') || label.includes('mute') || label.includes('sound') || label.includes('unmute');
  });
  if (hasAudioControl) return true;

  return false;
}

// Helper to extract media Details from DOM elements (Fallback method)
export function getMediaDetails(article) {
  // 1. Check for video
  const video = article.querySelector('video');
  if (video) {
    return {
      url: video.src,
      type: 'video',
      thumbnail: video.getAttribute('poster') || '',
      slideIndex: 0
    };
  }

  // 2. Check for images
  const images = Array.from(article.querySelectorAll('img'));
  const mainImages = images.filter(img => {
    const width = img.offsetWidth || img.naturalWidth || 0;
    const isAvatar = img.closest('header') || (img.closest('a[href^="/"]') && !img.closest('a[href*="/p/"]'));
    const isIcon = img.getAttribute('height') < 50 || img.getAttribute('width') < 50;
    return !isAvatar && !isIcon && (width > 200 || img.hasAttribute('srcset'));
  });

  let activeImage = mainImages[0];
  if (mainImages.length > 1) {
    activeImage = mainImages.find(img => {
      const rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 &&
             img.style.display !== 'none' &&
             img.style.visibility !== 'hidden' &&
             img.style.opacity !== '0';
    }) || mainImages[0];
  }

  if (activeImage) {
    const highResUrl = getHighResImageFromDOM(activeImage);
    return {
      url: highResUrl,
      type: 'image',
      thumbnail: highResUrl,
      slideIndex: 0
    };
  }

  return null;
}

/**
 * Appends custom CSS animation styles for the injected download buttons to document.head.
 */
export function injectCustomStyles() {
  if (document.getElementById('instagrab-custom-styles')) return;
  const style = document.createElement('style');
  style.id = 'instagrab-custom-styles';
  style.textContent = `
    @keyframes instagrab-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .instagrab-download-btn:hover svg {
      transform: scale(1.15);
      opacity: 0.8;
    }
    .instagrab-download-btn:active svg {
      transform: scale(0.9);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Injects the injected.js script into the page's main world context to extract React state.
 */
export function injectMainWorldScript() {
  if (document.documentElement.getAttribute('data-instagrab-injected')) return;
  const injectedScript = document.createElement('script');
  injectedScript.src = chrome.runtime.getURL('injected.js') + '?t=' + Date.now();
  injectedScript.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(injectedScript);
}
