// ── Configuration & Environment Module ────────────────────────────────────
// Handles port definitions, download directories, and yt-dlp binary detection.

import path from "path";
import os from "os";
import fs from "fs";
import { spawn } from "child_process";

export const PORT = 8989;

let cachedYtDlpVersion = null;
let versionCheckPromise = null;

// Ensure download directory exists
export function getDownloadDirectory(subfolder = "OmniVideos") {
  const cleanSub = (subfolder || "OmniVideos").replace(/[\\/:*?"<>|]/g, "").trim() || "OmniVideos";
  const targetDir = path.join(os.homedir(), "Downloads", cleanSub);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

// Get installed yt-dlp version
export function getYtDlpVersion() {
  if (cachedYtDlpVersion !== null) {
    return Promise.resolve(cachedYtDlpVersion || null);
  }
  if (versionCheckPromise) {
    return versionCheckPromise;
  }
  versionCheckPromise = new Promise((resolve) => {
    const proc = spawn("yt-dlp", ["--version"], { shell: false, windowsHide: true });
    let out = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.on("close", (code) => {
      cachedYtDlpVersion = code === 0 && out.trim() ? out.trim() : false;
      versionCheckPromise = null;
      resolve(cachedYtDlpVersion || null);
    });
    proc.on("error", () => {
      cachedYtDlpVersion = false;
      versionCheckPromise = null;
      resolve(null);
    });
  });
  return versionCheckPromise;
}
