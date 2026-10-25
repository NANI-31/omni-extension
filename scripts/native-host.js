#!/usr/bin/env node
/**
 * native-host.js
 * Chrome Native Messaging Host for Omni Extension
 * Launches and manages the local yt-dlp companion server on demand.
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverScript = path.join(__dirname, "ytdlp-server.js");

// Read Chrome Native Message from stdin (4-byte length prefix + UTF-8 JSON)
function readMessage() {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let totalLen = 0;
    let expectedMsgLen = null;

    function onReadable() {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        chunks.push(chunk);
        totalLen += chunk.length;

        const fullBuffer = Buffer.concat(chunks, totalLen);

        if (expectedMsgLen === null && fullBuffer.length >= 4) {
          expectedMsgLen = fullBuffer.readUInt32LE(0);
        }

        if (expectedMsgLen !== null && fullBuffer.length >= 4 + expectedMsgLen) {
          process.stdin.removeListener("readable", onReadable);
          const msgBuffer = fullBuffer.slice(4, 4 + expectedMsgLen);
          try {
            const parsed = JSON.parse(msgBuffer.toString("utf8"));
            resolve(parsed);
          } catch (err) {
            reject(err);
          }
          return;
        }
      }
    }

    process.stdin.on("readable", onReadable);
    process.stdin.on("end", () => {
      if (expectedMsgLen === null) {
        resolve({ action: "start" }); // default fallback
      }
    });
  });
}

// Send Chrome Native Message to stdout (4-byte length prefix + UTF-8 JSON)
function sendMessage(msg) {
  try {
    const json = JSON.stringify(msg);
    const len = Buffer.byteLength(json, "utf8");
    const header = Buffer.alloc(4);
    header.writeUInt32LE(len, 0);
    process.stdout.write(header);
    process.stdout.write(json);
  } catch (_) {}
}

async function main() {
  try {
    const msg = await readMessage().catch(() => ({ action: "start" }));
    const action = String(msg?.action || "start").toLowerCase();

    if (action === "start" || action === "start_server" || action === "launch") {
      // Launch ytdlp-server.js silently as a detached background process
      const child = spawn(process.execPath, [serverScript], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
      child.unref();

      sendMessage({
        ok: true,
        status: "started",
        pid: child.pid,
        port: 8989,
        message: "Omni companion server started successfully in background",
      });
    } else {
      sendMessage({
        ok: true,
        status: "ready",
        port: 8989,
      });
    }
  } catch (err) {
    sendMessage({ ok: false, error: err.message });
  }

  // Allow short buffer drain before exiting
  setTimeout(() => process.exit(0), 150);
}

main();
