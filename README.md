# InstaGrab - Instagram Media Downloader Chrome Extension

InstaGrab is a modern, lightweight, and local Chrome Extension built with React, Vite, and Tailwind CSS. It allows you to download high-resolution videos, images, and Reels directly from Instagram in a single click.

## Features
- **One-Click Download**: Automatically injects a sleek download button next to the Bookmark/Save icon on Instagram posts and Reels.
- **High-Quality Extraction**: Extracts high-definition direct media links from Instagram's elements.
- **Carousel Support**: Smartly detects and downloads the currently active visible slide in a multi-image/video post.
- **Local Download History**: Tracks your recent downloads directly inside the extension popup dashboard.
- **Subdirectory Customization**: Easily customize the folder name inside your default Chrome downloads directory.
- **Modern Dark UI**: Features a premium glassmorphic interface inspired by Instagram's design language.

## Getting Started

### 1. Build the Extension
Before loading the extension into Chrome, you must compile the React code and scripts:
```bash
# Install dependencies (if not already installed)
npm install

# Build the extension assets
npm run build
```
This compiles the code and generates the final extension bundle in the `dist/` directory.

### 2. Load the Extension in Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer Mode** by toggling the switch in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `dist/` folder inside this project directory.
5. The **InstaGrab** extension will now appear in your browser's extensions bar!

### 3. Usage
1. Open [Instagram](https://www.instagram.com) in your browser.
2. Locate any post on your Feed or go to the Reels section.
3. Click the **Download icon** (located directly to the left of the native Bookmark/Save icon).
4. The media will download to your downloads folder under `Instagram-Downloads/` (customizable in the extension settings popup).

