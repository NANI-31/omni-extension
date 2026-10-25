/**
 * ytdlp-server.js
 * Lightweight local companion server for Omni Extension.
 * Bridges browser extension download requests directly to locally installed yt-dlp.
 * Zero npm dependencies — uses Node.js standard modules.
 */

import http from "http";
import { PORT, getDownloadDirectory, getYtDlpVersion } from "./ytdlp/config.js";
import { handleRequest } from "./ytdlp/router.js";
import { resetIdleTimer } from "./ytdlp/idleTimer.js";

const server = http.createServer(async (req, res) => {
  resetIdleTimer(server);
  await handleRequest(req, res, server);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`[Notice] Port ${PORT} is already in use — companion server is already active!`);
    process.exit(0);
  } else {
    console.error("[Server Error]:", err);
    process.exit(1);
  }
});

server.listen(PORT, "127.0.0.1", async () => {
  resetIdleTimer(server);
  const version = await getYtDlpVersion();
  console.log(`\n======================================================`);
  console.log(`🚀 Omni Extension yt-dlp Local Companion Server`);
  console.log(`   Running at:  http://127.0.0.1:${PORT}`);
  console.log(`   yt-dlp:      ${version ? `v${version} (Ready)` : "NOT FOUND on PATH"}`);
  console.log(`   Save folder: ${getDownloadDirectory()}`);
  console.log(`======================================================\n`);
});
