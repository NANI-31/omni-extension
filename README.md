# Omni Extension — Browser Productivity Workspace

Omni Extension is a unified, modular Chrome Extension (Manifest V3) built with React 19, Vite, and Tailwind CSS. It combines heavy media downloaders, video playback enhancements, network proxy management, and web navigation bypassers into a single, cohesive browser tool.

---

## ⚡ Core Feature Modules

### 1. 🎬 Stream Sniffer & Downloader (`videograb`)
- **Network Traffic Sniffing**: Intercepts active HTTP headers across open tabs using `chrome.webRequest` to capture `.m3u8` (HLS playlists), `.mp4`, `.webm`, and `.mpd` streams.
- **Client-Side HLS Stitching**: Merges `.ts` stream segments directly inside the browser with variant selection (resolution/bitrate).
- **yt-dlp Companion Bridge**: Seamlessly sends download jobs to a local Node companion server (`localhost:8989`) to harness system `yt-dlp` for protected or high-bitrate media.
- **Tab Media Registry**: Aggregates detected media streams per tab with dynamic badge counts on the extension icon.

### 2. 📺 YouTube & Video Tools (`youtube`)
- **Zone-Aware Mouse Wheel Controls**: Hover over different zones of any HTML5 video player to control playback:
  - **Left Column**: Real-time video brightness adjustments (0%–200%).
  - **Middle Column**: High-precision volume control with center OSD HUD.
  - **Right Top Column**: Playback speed adjustment (supports Speed Overdrive up to 16x).
  - **Right Bottom Column (Seek)**: Scrub timeline forward and backward.
- **Dynamic Skip Step (Ctrl + Wheel)**:
  - Press `Ctrl + Mouse Wheel` to adjust the skipping interval in **0.5-second steps** (e.g. $2.0\text{s} \rightarrow 2.5\text{s}$).
  - Once the interval reaches **$\le 1.0\text{s}$**, it adjusts in **0.1-second increments** ($1.0\text{s} \rightarrow 0.9\text{s} \dots \rightarrow 0.1\text{s}$).
  - Subsequent normal mouse wheel scrolls skip the video by that exact configured interval.
- **Live Color Grading Filters**: Hardware-accelerated CSS and SVG filters for contrast, saturation, color temperature, blue-light eye protection, and tone LUT controls (blacks, whites, shadows, highlights).
- **Watch History Quick Delete**: Quick-deletion button on YouTube watch history with live session tracking and deletion logs.

### 3. 📸 InstaGrab (`instagrab`)
- **Single-Click Extraction**: Injects download buttons into Instagram posts, reels, and stories.
- **Carousel & Slideshow Compilation**: Extracts visible slides or compiles entire multi-image carousels into a unified MP4 video in-browser using `@ffmpeg/ffmpeg` WebAssembly inside a Chrome offscreen document.
- **Direct Message Unsend Tracker**: Monitors real-time GraphQL messaging channels to log unsent messages.

### 4. 🔒 Secure VPN & Proxy Manager (`vpn`)
- **Live Anonymous Proxy Scraping**: Fetches live elite and anonymous HTTP/SOCKS proxies from ProxyScrape.
- **Geo-Enrichment**: Enriches proxy server IPs with country flags and latency metrics via `ip-api.com`.
- **System Proxy Routing**: Controls Chrome proxy settings (`chrome.proxy.settings`) using PAC scripts or fixed-server routing.
- **Health Monitoring & Auto-Failover**: Automatically catches network errors via `chrome.webRequest.onErrorOccurred` and rotates to healthy proxies within the same pool.

### 5. ⏳ Bypass Timers (`timers`)
- **Automatic Countdown Bypass**: Injects at `document_start` to neutralize artificial wait timers, redirect delays, and interstitial countdowns on shortlink and file-sharing domains (Arolinks, Linkjust, DeltaStudy, FlightSim, etc.).

### 6. 📌 PinterestGrab (`pinterest`)
- **Board & Feed Downloader**: Injects one-click download buttons into Pinterest feed cards, board grids, and pin closeups to download highest-resolution image sources and videos without opening pins.

---

## 🛠️ Tech Stack & Architecture

- **Manifest V3 Core**: Service worker background architecture (`background.js`) paired with an MV3 offscreen document for heavy WebAssembly workloads (`offscreen.html`).
- **UI Framework**: React 19, Tailwind CSS 4 (`@tailwindcss/vite`), Redux Toolkit 2.12, Framer Motion 12.
- **Dual Runtime Surfaces**:
  - **Toolbar Popup ($\le 600$px)**: Ultra-compact, fast video sniffer & instant downloader interface (`VideoDownloaderPopup.jsx`).
  - **Full Dashboard Tab (`mode=tab`)**: Comprehensive workspace dashboard with code-split tabs loaded via `React.lazy`.
- **Optimized Memory Layer**: `StorageAdapter.js` provides an in-memory synchronous cache over `chrome.storage.local` to guarantee 0-latency reads and optimistic updates.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Build Extension Bundle
```bash
npm run build
```
This triggers the prebuild icon generator and copies the offline `@ffmpeg/core` WASM files into `public/ffmpeg/`, outputting the final extension to `dist/`.

### 3. Load into Google Chrome
1. Navigate to `chrome://extensions/` in your browser.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the compiled `dist/` directory.
4. Pin **Omni Extension** to your browser toolbar!

---

## 🖥️ Local yt-dlp Companion Server (Optional)

For downloading high-bitrate streams or YouTube videos through system-installed `yt-dlp`:

```bash
# Start companion server on port 8989
npm run ytdlp

# Or on Windows using the batch script:
start-ytdlp.bat
```
The extension will automatically connect to `http://127.0.0.1:8989` when available to delegate heavy downloads.

---

## 📄 License
Private project.
