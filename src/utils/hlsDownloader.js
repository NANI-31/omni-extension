// HLS Stream Downloader & Segment Stitcher
// Downloads HLS (.m3u8) video playlists, fetches segments in parallel, and merges them into a full video file.

export function isHlsUrl(url, format) {
  if (!url) return false;
  return (
    format === "hls" ||
    url.includes(".m3u8") ||
    url.includes("hls-videos") ||
    url.includes("/hls/") ||
    url.includes("playlist.m3u8")
  );
}

// Resolves relative/absolute URLs and inherits query parameters (e.g. auth tokens, signatures)
export function resolveUrl(urlStr, baseUrl) {
  try {
    const resolved = new URL(urlStr, baseUrl);
    // If target URL has no query and baseUrl has query parameters (e.g. CDN auth tokens), inherit them
    if (!resolved.search && baseUrl) {
      try {
        const baseObj = new URL(baseUrl);
        if (baseObj.search) {
          resolved.search = baseObj.search;
        }
      } catch (_) {}
    }
    return resolved.href;
  } catch (_) {
    return urlStr;
  }
}

// Extracts all available quality/bandwidth variants from a master M3U8 playlist
export async function extractHlsVariants(masterPlaylistUrl) {
  try {
    const resp = await fetch(masterPlaylistUrl, { credentials: "include" });
    if (!resp.ok) return [];
    const text = await resp.text();
    if (!text.includes("#EXT-X-STREAM-INF")) return [];

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const variants = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXT-X-STREAM-INF")) {
        const line = lines[i];
        const resMatch = line.match(/RESOLUTION=(\d+x\d+)/i);
        const bwMatch = line.match(/BANDWIDTH=(\d+)/i);
        const resolution = resMatch ? resMatch[1] : null;
        const height = resolution ? resolution.split("x")[1] + "p" : null;
        const bw = bwMatch ? parseInt(bwMatch[1], 10) : 0;
        const bitrateStr = bw > 1000000 ? `${(bw / 1000000).toFixed(1)} Mbps` : `${Math.round(bw / 1000)} kbps`;

        // Look ahead for URI
        let uriLine = null;
        for (let j = i + 1; j < lines.length; j++) {
          if (!lines[j].startsWith("#")) {
            uriLine = lines[j];
            break;
          }
        }

        if (uriLine) {
          const variantUrl = resolveUrl(uriLine, masterPlaylistUrl);
          const label = height ? `HLS - ${height} (${bitrateStr})` : `HLS - ${bitrateStr}`;
          variants.push({
            label,
            resolution: height || resolution || "Standard",
            format: "hls",
            bitrate: bitrateStr,
            bandwidth: bw,
            url: variantUrl,
          });
        }
      }
    }

    variants.sort((a, b) => b.bandwidth - a.bandwidth);
    return variants;
  } catch (err) {
    console.warn("[HLS] Failed to extract master variants:", err);
    return [];
  }
}

// In-memory key cache for AES-128 encrypted streams
const keyCache = new Map();

async function getDecryptionKey(keyUrl) {
  if (keyCache.has(keyUrl)) {
    return keyCache.get(keyUrl);
  }
  const resp = await fetch(keyUrl, { credentials: "include" });
  if (!resp.ok) throw new Error(`Failed to fetch decryption key: ${resp.status}`);
  const keyBytes = await resp.arrayBuffer();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
  keyCache.set(keyUrl, cryptoKey);
  return cryptoKey;
}

async function decryptSegment(segmentBuffer, keyInfo, seqIndex) {
  if (!keyInfo || keyInfo.method !== "AES-128") return segmentBuffer;

  const cryptoKey = await getDecryptionKey(keyInfo.keyUrl);

  // Generate IV if not explicitly provided in M3U8
  let ivBytes;
  if (keyInfo.iv) {
    const hex = keyInfo.iv.replace(/^0x/i, "").padStart(32, "0");
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    ivBytes = bytes;
  } else {
    // RFC 8216 Section 5.2: 16-octet big-endian sequence number
    ivBytes = new Uint8Array(16);
    const view = new DataView(ivBytes.buffer);
    view.setUint32(12, seqIndex, false);
  }

  return await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: ivBytes },
    cryptoKey,
    segmentBuffer
  );
}

// Recursively parses M3U8 playlist to extract media segment URLs
export async function parseM3U8(playlistUrl) {
  const resp = await fetch(playlistUrl, { credentials: "include" });
  if (!resp.ok) {
    throw new Error(`Failed to fetch M3U8 playlist: ${resp.status} ${resp.statusText}`);
  }
  const text = await resp.text();

  // If Master Playlist: find the highest quality/bandwidth variant stream
  if (text.includes("#EXT-X-STREAM-INF")) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    let bestBandwidth = 0;
    let bestVariantUrl = null;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXT-X-STREAM-INF")) {
        const bwMatch = lines[i].match(/BANDWIDTH=(\d+)/i);
        const bw = bwMatch ? parseInt(bwMatch[1], 10) : 0;

        let uriLine = null;
        for (let j = i + 1; j < lines.length; j++) {
          if (!lines[j].startsWith("#")) {
            uriLine = lines[j];
            break;
          }
        }

        if (uriLine) {
          if (bw >= bestBandwidth || !bestVariantUrl) {
            bestBandwidth = bw;
            bestVariantUrl = resolveUrl(uriLine, playlistUrl);
          }
        }
      }
    }

    if (bestVariantUrl) {
      return parseM3U8(bestVariantUrl);
    }
  }

  // Parse Media Playlist
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const segments = [];
  let currentKeyInfo = null;
  let initSegmentUrl = null;
  let mediaSequence = 0;
  let currentByteRange = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check media sequence base
    if (line.startsWith("#EXT-X-MEDIA-SEQUENCE:")) {
      const seqMatch = line.match(/#EXT-X-MEDIA-SEQUENCE:\s*(\d+)/i);
      if (seqMatch) {
        mediaSequence = parseInt(seqMatch[1], 10);
      }
    }

    // Check for initialization segment (fMP4)
    if (line.startsWith("#EXT-X-MAP:")) {
      const uriMatch = line.match(/URI=["']([^"']+)["']/i);
      if (uriMatch) {
        initSegmentUrl = resolveUrl(uriMatch[1], playlistUrl);
      }
    }

    // Check for byte range
    if (line.startsWith("#EXT-X-BYTERANGE:")) {
      const rangeParts = line.slice(17).trim().split("@");
      const length = parseInt(rangeParts[0], 10);
      const offset = rangeParts[1] ? parseInt(rangeParts[1], 10) : null;
      currentByteRange = { length, offset };
    }

    // Check for AES-128 encryption
    if (line.startsWith("#EXT-X-KEY:")) {
      const methodMatch = line.match(/METHOD=([^,\s]+)/i);
      const method = methodMatch ? methodMatch[1].toUpperCase() : "NONE";

      if (method === "AES-128") {
        const uriMatch = line.match(/URI=["']([^"']+)["']/i);
        const ivMatch = line.match(/IV=(0x[0-9a-fA-F]+)/i);
        if (uriMatch) {
          const keyUrl = resolveUrl(uriMatch[1], playlistUrl);
          currentKeyInfo = {
            method: "AES-128",
            keyUrl,
            iv: ivMatch ? ivMatch[1] : null,
          };
        }
      } else {
        currentKeyInfo = null;
      }
    }

    // Segment URL line
    if (!line.startsWith("#")) {
      const segUrl = resolveUrl(line, playlistUrl);
      segments.push({
        url: segUrl,
        keyInfo: currentKeyInfo,
        byteRange: currentByteRange,
        seqIndex: mediaSequence + segments.length,
      });
      currentByteRange = null; // Reset per-segment byte range
    }
  }

  return { segments, initSegmentUrl, playlistUrl };
}

// Downloads all HLS segments concurrently and concatenates them into a unified MP4 video
export async function downloadHlsStream({
  streamUrl,
  filename = "video",
  folder = "OmniVideos",
  saveAs = false,
  onProgress = null,
}) {
  if (onProgress) {
    onProgress({ percent: 0, stage: "Parsing HLS playlist..." });
  }

  const { segments, initSegmentUrl } = await parseM3U8(streamUrl);

  if (!segments || segments.length === 0) {
    throw new Error("No playable video segments found in this HLS stream.");
  }

  const total = segments.length;
  const results = new Array(total);
  let completed = 0;
  const CONCURRENCY = 6;
  let currentIndex = 0;

  // Optional: fetch fMP4 init segment if stream uses fragmented MP4
  let initBuffer = null;
  if (initSegmentUrl) {
    if (onProgress) {
      onProgress({ percent: 0, stage: "Fetching video header..." });
    }
    try {
      const initResp = await fetch(initSegmentUrl, { credentials: "include" });
      if (initResp.ok) {
        initBuffer = await initResp.arrayBuffer();
      }
    } catch (e) {
      console.warn("[HLS] Failed to fetch init segment:", e);
    }
  }

  if (onProgress) {
    onProgress({ percent: 0, stage: `Downloading segments (0/${total})...` });
  }

  // Parallel download workers with retry
  async function worker() {
    let lastByteOffset = 0;

    while (currentIndex < total) {
      const idx = currentIndex++;
      const seg = segments[idx];

      let attempts = 0;
      let success = false;
      let buf = null;

      const fetchHeaders = {};
      if (seg.byteRange) {
        const start = seg.byteRange.offset !== null ? seg.byteRange.offset : lastByteOffset;
        const end = start + seg.byteRange.length - 1;
        fetchHeaders["Range"] = `bytes=${start}-${end}`;
        lastByteOffset = end + 1;
      }

      while (attempts < 3 && !success) {
        try {
          attempts++;
          const resp = await fetch(seg.url, {
            headers: fetchHeaders,
            credentials: "include",
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          let rawBuf = await resp.arrayBuffer();

          if (seg.keyInfo) {
            rawBuf = await decryptSegment(rawBuf, seg.keyInfo, seg.seqIndex);
          }

          buf = rawBuf;
          success = true;
        } catch (err) {
          if (attempts >= 3) {
            console.warn(`[HLS] Segment ${idx} failed after 3 attempts, skipping:`, err);
          } else {
            await new Promise((r) => setTimeout(r, 350 * attempts));
          }
        }
      }

      if (buf) {
        results[idx] = buf;
      }
      completed++;

      if (onProgress) {
        const percent = Math.min(95, Math.max(1, Math.round((completed / total) * 95)));
        onProgress({
          percent,
          stage: `Downloading chunk ${completed}/${total} (${percent}%)...`,
          completed,
          total,
        });
      }
    }
  }

  const workers = [];
  for (let w = 0; w < Math.min(CONCURRENCY, total); w++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  if (onProgress) {
    onProgress({ percent: 96, stage: "Stitching full video..." });
  }

  // Filter valid buffers and prepend init buffer if available
  const allBuffers = [];
  if (initBuffer) {
    allBuffers.push(initBuffer);
  }
  for (let i = 0; i < results.length; i++) {
    if (results[i]) {
      allBuffers.push(results[i]);
    }
  }

  if (allBuffers.length === 0) {
    throw new Error("Failed to download any video chunks from stream.");
  }

  // Combine into single video Blob
  const mergedBlob = new Blob(allBuffers, { type: "video/mp4" });
  const blobUrl = URL.createObjectURL(mergedBlob);

  const cleanFolder = (folder || "OmniVideos").replace(/[\\/:*?"<>|]/g, "").trim();
  const safeFilename = filename.replace(/[\\/:*?"<>|]/g, "_").trim() || "video";
  const cleanBaseName = safeFilename
    .replace(/\.hls/gi, "")
    .replace(/\.(mp4|ts|m3u8|webm|m4s)$/i, "")
    .trim() || "video";
  const downloadPath = cleanFolder ? `${cleanFolder}/${cleanBaseName}.mp4` : `${cleanBaseName}.mp4`;

  return new Promise((resolve, reject) => {
    if (typeof chrome === "undefined" || !chrome.downloads) {
      // In non-chrome context, fallback to anchor download
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${cleanBaseName}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      if (onProgress) onProgress({ percent: 100, stage: "Complete! Saved to PC." });
      resolve({ success: true, downloadPath });
      return;
    }

    chrome.downloads.download(
      {
        url: blobUrl,
        filename: downloadPath,
        saveAs: saveAs || false,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          const err = chrome.runtime.lastError.message;
          reject(new Error(err));
          return;
        }

        if (onProgress) {
          onProgress({ percent: 100, stage: "Complete! Saved to Downloads." });
        }

        // Revoke after safe interval so Chrome finishes writing to disk
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60000);

        resolve({ success: true, downloadId, downloadPath });
      }
    );
  });
}
