// ── yt-dlp CLI Argument Construction Module ──────────────────────────────
// Translates browser resolution, format, and folder options into robust yt-dlp CLI flags.

import { getDownloadDirectory } from "./config.js";

export function buildYtDlpArgs(url, { resolution, format, folder, filename }) {
  const downloadDir = getDownloadDirectory(folder);
  const args = [
    "--no-playlist",
    "--newline",
    "--retries",
    "10",
    "--fragment-retries",
    "10",
    "--file-access-retries",
    "5",
    "-P",
    downloadDir,
  ];

  const resStr = String(resolution || "").toLowerCase();
  const fmtStr = String(format || "").toLowerCase();

  const isAudio = fmtStr === "mp3" || fmtStr === "m4a" || fmtStr === "audio" || resStr.includes("audio");

  if (isAudio) {
    const audioFmt = fmtStr === "m4a" ? "m4a" : "mp3";
    args.push("-x", "--audio-format", audioFmt);
  } else {
    const heightMatch = resStr.match(/(\d{3,4})p?/);
    const height = heightMatch ? parseInt(heightMatch[1], 10) : null;

    if (height && height >= 2160) {
      args.push("-f", "bestvideo+bestaudio/best/best", "--merge-output-format", "mp4");
    } else if (height) {
      args.push(
        "-f",
        `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best/best`,
        "--merge-output-format",
        "mp4"
      );
    } else {
      args.push("-f", "bestvideo+bestaudio/best/best", "--merge-output-format", "mp4");
    }
  }

  // Output filename template
  if (filename && filename.trim()) {
    const cleanFilename = filename.replace(/[\\/:*?"<>|]/g, "_").trim();
    args.push("-o", `${cleanFilename}.%(ext)s`);
  } else {
    args.push("-o", "%(title)s.%(ext)s");
  }

  args.push(url);
  return { args, downloadDir };
}
