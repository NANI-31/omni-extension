// SVG icons and shared settings configuration

export const DOWNLOAD_ICON_SVG = `
<svg aria-label="Download" class="instagrab-svg" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24" style="transition: transform 0.2s ease;">
  <path d="M12 2C11.4477 2 11 2.44772 11 3V13.5858L7.70711 10.2929C7.31658 9.90237 6.68342 9.90237 6.29289 10.2929C5.90237 10.6834 5.90237 11.3166 6.29289 11.7071L11.2929 16.7071C11.6834 17.0976 12.3166 17.0976 12.7071 16.7071L17.7071 11.7071C18.0976 11.3166 18.0976 10.6834 17.7071 10.2929C17.3166 9.90237 16.6834 9.90237 16.2929 10.2929L13 13.5858V3C13 2.44772 12.5523 2 12 2Z"></path>
  <path d="M4 18C4 17.4477 4.44772 17 5 17H19C19.5523 17 20 17.4477 20 18C20 18.5523 19.5523 19 19 19H5C4.44772 19 4 18.5523 4 18Z"></path>
</svg>
`;

export const SUCCESS_ICON_SVG = `
<svg aria-label="Success" class="instagrab-svg" fill="#00f2fe" height="24" role="img" viewBox="0 0 24 24" width="24">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
</svg>
`;

export const ERROR_ICON_SVG = `
<svg aria-label="Error" class="instagrab-svg" fill="#ff4b4b" height="24" role="img" viewBox="0 0 24 24" width="24">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
</svg>
`;

export const LOADING_ICON_SVG = `
<svg aria-label="Loading" class="instagrab-svg" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24" style="animation: instagrab-spin 1s linear infinite;">
  <path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.42 3.58-8 8-8zm0 16v2c5.52 0 10-4.48 10-10h-2c0 4.42-3.58 8-8 8z" />
</svg>
`;

// Mutable settings object to share state across modules synchronously
export const settings = {
  clickToDownloadEnabled: false,
  compileSlidesAsVideo: false,
  slideDurationSecs: 2,
  slideshowEncoder: 'canvas',
  slideshowQuality: 24, // CRF value (18-28)
  isUnsendEnabled: false,
  logLevel: 'verbose' // 'silent' | 'errors' | 'verbose'
};

export const logHistory = [];

function appendToHistory(level, args) {
  const time = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
  const prefix = `[${time}] [${level.toUpperCase()}]`;
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
  logHistory.push(`${prefix} ${message}`);
  if (logHistory.length > 300) {
    logHistory.shift();
  }
}

export const logger = {
  log: (...args) => {
    appendToHistory('info', args);
    if (settings.logLevel === 'verbose') console.log(...args);
  },
  warn: (...args) => {
    appendToHistory('warn', args);
    if (settings.logLevel === 'verbose') console.warn(...args);
  },
  error: (...args) => {
    appendToHistory('error', args);
    if (settings.logLevel === 'verbose' || settings.logLevel === 'errors') console.error(...args);
  }
};

// Window listener for logs forwarded from injected.js context
window.addEventListener('INSTAGRAB_LOG', (event) => {
  if (event.detail && event.detail.level && event.detail.msg) {
    appendToHistory(event.detail.level, [event.detail.msg]);
  }
});

// Runtime listener to respond to popup GET_CONTENT_LOGS requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'GET_CONTENT_LOGS') {
    sendResponse({ logs: logHistory });
  }
});

// Initial load
chrome.storage.local.get([
  'clickToDownloadEnabled',
  'compileSlidesAsVideo',
  'slideDurationSecs',
  'slideshowEncoder',
  'slideshowQuality',
  'quickUnsendEnabled',
  'logLevel'
], (result) => {
  if (result.clickToDownloadEnabled !== undefined) settings.clickToDownloadEnabled = result.clickToDownloadEnabled;
  if (result.compileSlidesAsVideo !== undefined) settings.compileSlidesAsVideo = result.compileSlidesAsVideo;
  if (result.slideDurationSecs !== undefined) settings.slideDurationSecs = result.slideDurationSecs;
  if (result.slideshowEncoder !== undefined) settings.slideshowEncoder = result.slideshowEncoder;
  if (result.slideshowQuality !== undefined) settings.slideshowQuality = result.slideshowQuality;
  if (result.quickUnsendEnabled !== undefined) settings.isUnsendEnabled = result.quickUnsendEnabled;
  if (result.logLevel !== undefined) {
    settings.logLevel = result.logLevel;
    // Set cross-world DOM attribute for injected.js logging state
    document.documentElement.setAttribute('data-instagrab-logging', result.logLevel);
  }
});

// Dynamic sync listener
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.clickToDownloadEnabled !== undefined) settings.clickToDownloadEnabled = changes.clickToDownloadEnabled.newValue;
  if (changes.compileSlidesAsVideo !== undefined) settings.compileSlidesAsVideo = changes.compileSlidesAsVideo.newValue;
  if (changes.slideDurationSecs !== undefined) settings.slideDurationSecs = changes.slideDurationSecs.newValue;
  if (changes.slideshowEncoder !== undefined) settings.slideshowEncoder = changes.slideshowEncoder.newValue;
  if (changes.slideshowQuality !== undefined) settings.slideshowQuality = changes.slideshowQuality.newValue;
  if (changes.quickUnsendEnabled !== undefined) settings.isUnsendEnabled = changes.quickUnsendEnabled.newValue;
  if (changes.logLevel !== undefined) {
    settings.logLevel = changes.logLevel.newValue;
    // Update cross-world DOM attribute for injected.js logging state
    document.documentElement.setAttribute('data-instagrab-logging', changes.logLevel.newValue);
  }
});


