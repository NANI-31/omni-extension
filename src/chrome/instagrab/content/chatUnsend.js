// Quick Unsend in Chats feature implementation
import { settings } from './constants.js';

let unsendObserver = null;

export function isChatPage() {
  return window.location.pathname.startsWith('/direct/');
}

export function getMessageMoreButtons() {
  const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
  return buttons.filter(btn => {
    const label = (btn.getAttribute('aria-label') || '').toLowerCase();
    if (label === 'more' || label.includes('option') || label.includes('actions')) {
      return true;
    }
    const svg = btn.querySelector('svg');
    if (svg) {
      const circleCount = svg.querySelectorAll('circle').length;
      if (circleCount === 3) return true;
      const title = svg.querySelector('title');
      if (title && (title.textContent.toLowerCase() === 'more' || title.textContent.toLowerCase().includes('option'))) {
        return true;
      }
    }
    return false;
  });
}

export function isSentMessage(btn) {
  const row = btn.closest('div');
  if (!row) return false;

  const messageBubble = row.querySelector('div[role="button"], div[class*="x1n2onr6"], div[class*="xjb2p0i"]');
  if (messageBubble && messageBubble !== btn) {
    const btnRect = btn.getBoundingClientRect();
    const bubbleRect = messageBubble.getBoundingClientRect();
    if (btnRect.left < bubbleRect.left) {
      return true;
    }
  }

  const flexContainer = btn.parentElement;
  if (flexContainer) {
    const style = window.getComputedStyle(flexContainer);
    if (style.flexDirection === 'row-reverse' || style.justifyContent === 'flex-end') {
      return true;
    }
  }
  return false;
}

export function waitForElement(queryFunc, timeout = 600) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const el = queryFunc();
      if (el) {
        clearInterval(interval);
        resolve(el);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for element"));
      }
    }, 20);
  });
}

export async function unsendMessage(moreBtn) {
  try {
    moreBtn.click();

    const unsendMenuBtn = await waitForElement(() => {
      const elements = Array.from(document.querySelectorAll('button, div[role="button"], span'));
      return elements.find(el => {
        const text = el.textContent.trim().toLowerCase();
        return text === 'unsend' || text === 'unsend message' || text.includes('unsend');
      });
    }, 600);

    unsendMenuBtn.click();

    const confirmBtn = await waitForElement(() => {
      const elements = Array.from(document.querySelectorAll('button, div[role="button"]'));
      return elements.find(el => {
        const isInDialog = el.closest('div[role="dialog"]') || el.closest('div.x1ia3grj') || el.closest('div[class*="dialog"]');
        const text = el.textContent.trim().toLowerCase();
        return isInDialog && (text === 'unsend' || text.includes('unsend'));
      });
    }, 600);

    confirmBtn.click();
  } catch (err) {
  }
}

export function scanAndInjectUnsendButtons() {
  if (!settings.isUnsendEnabled || !isChatPage()) return;

  const moreButtons = getMessageMoreButtons();
  moreButtons.forEach(btn => {
    const parent = btn.parentNode;
    if (!parent || parent.querySelector('.instagrab-quick-unsend')) return;

    if (isSentMessage(btn)) {
      const quickUnsendBtn = document.createElement('button');
      quickUnsendBtn.className = 'instagrab-quick-unsend';
      quickUnsendBtn.type = 'button';
      quickUnsendBtn.title = 'Quick Unsend (Single Click)';
      
      quickUnsendBtn.style.cssText = `
        background: none;
        border: none;
        padding: 4px;
        margin: 0 4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s, transform 0.1s;
        color: #ff3b30;
      `;
      
function setSafeHTML(element, html) {
  if (!element) return;
  if (window.trustedTypes && typeof window.trustedTypes.createPolicy === "function") {
    try {
      if (!window.__omniTrustedPolicy) {
        window.__omniTrustedPolicy = window.trustedTypes.createPolicy("omniPolicy", {
          createHTML: (s) => s,
        });
      }
      element.innerHTML = window.__omniTrustedPolicy.createHTML(html);
      return;
    } catch (e) {}
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    element.replaceChildren(...doc.body.childNodes);
  } catch (err) {
    try {
      element.innerHTML = html;
    } catch (e) {}
  }
}

      setSafeHTML(quickUnsendBtn, `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      `);
      
      quickUnsendBtn.addEventListener('mouseenter', () => {
        quickUnsendBtn.style.backgroundColor = 'rgba(255, 59, 48, 0.15)';
      });
      quickUnsendBtn.addEventListener('mouseleave', () => {
        quickUnsendBtn.style.backgroundColor = 'transparent';
      });
      quickUnsendBtn.addEventListener('mousedown', () => {
        quickUnsendBtn.style.transform = 'scale(0.9)';
      });
      quickUnsendBtn.addEventListener('mouseup', () => {
        quickUnsendBtn.style.transform = 'scale(1)';
      });
      
      quickUnsendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        unsendMessage(btn);
      });
      
      parent.insertBefore(quickUnsendBtn, btn);
    }
  });
}

export function setupChatUnsendObserver() {
  if (unsendObserver) {
    unsendObserver.disconnect();
  }
  
  scanAndInjectUnsendButtons();
  
  unsendObserver = new MutationObserver(() => {
    scanAndInjectUnsendButtons();
  });
  unsendObserver.observe(document.body, { childList: true, subtree: true });
}

export function stopChatUnsendObserver() {
  if (unsendObserver) {
    unsendObserver.disconnect();
    unsendObserver = null;
  }
  document.querySelectorAll('.instagrab-quick-unsend').forEach(btn => btn.remove());
}
