// ── SVG Tone Filter & Video Color Grading Engine ───────────────────────────
// Implements Blacks / Whites / Shadows / Highlights tone curve via SVG feComponentTransfer
// and hardware-accelerated CSS filters (brightness, contrast, saturation, temperature, eye protection).

const YT_SVG_ID   = "yt-svgf-container";
const YT_TONE_ID  = "yt-tone";        // referenced by filter: url(#yt-tone)
const YT_FUNC_IDS = { r: "yt-fR", g: "yt-fG", b: "yt-fB" };

export function injectToneFilterSVG() {
  try {
    if (document.getElementById(YT_SVG_ID)) return;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.id = YT_SVG_ID;
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    try {
      svg.style.position = "absolute";
      svg.style.width = "0px";
      svg.style.height = "0px";
      svg.style.overflow = "hidden";
      svg.style.pointerEvents = "none";
      svg.style.opacity = "0";
    } catch (_) {}

  const defs = document.createElementNS(svgNS, "defs");
  const filter = document.createElementNS(svgNS, "filter");
  filter.id = YT_TONE_ID;
  filter.setAttribute("color-interpolation-filters", "linearRGB");
  filter.setAttribute("x", "0");
  filter.setAttribute("y", "0");
  filter.setAttribute("width", "100%");
  filter.setAttribute("height", "100%");

  const transfer = document.createElementNS(svgNS, "feComponentTransfer");

  const funcR = document.createElementNS(svgNS, "feFuncR");
  funcR.id = YT_FUNC_IDS.r;
  funcR.setAttribute("type", "table");
  funcR.setAttribute("tableValues", "0 0.25 0.5 0.75 1");

  const funcG = document.createElementNS(svgNS, "feFuncG");
  funcG.id = YT_FUNC_IDS.g;
  funcG.setAttribute("type", "table");
  funcG.setAttribute("tableValues", "0 0.25 0.5 0.75 1");

  const funcB = document.createElementNS(svgNS, "feFuncB");
  funcB.id = YT_FUNC_IDS.b;
  funcB.setAttribute("type", "table");
  funcB.setAttribute("tableValues", "0 0.25 0.5 0.75 1");

  transfer.appendChild(funcR);
  transfer.appendChild(funcG);
  transfer.appendChild(funcB);
  filter.appendChild(transfer);
  defs.appendChild(filter);
  svg.appendChild(defs);

  document.documentElement.appendChild(svg);
  } catch (_) {}
}

export function computeToneTableValues(blacks, whites, shadows, highlights) {
  // 5-point piecewise-linear tone curve mapped to [0,1] output range.
  // blacks    : 0–100  (0=no lift, 100=lift shadows floor by +0.10)
  // whites    : 50–100 (100=full range, 50=highlights pulled to 0.50)
  // shadows   : -100–0–100 (negative=darker, positive=brighter at 25% input)
  // highlights: -100–0–100 (negative=recover/dim, positive=boost at 75% input)
  const p0 = Math.max(0, Math.min(1, blacks * 0.001));
  const p1 = Math.max(0, Math.min(1, 0.25 + shadows * 0.0006));
  const p2 = 0.5;
  const p3 = Math.max(0, Math.min(1, 0.75 + highlights * 0.0006));
  const p4 = Math.max(0, Math.min(1, whites / 100));
  return `${p0.toFixed(4)} ${p1.toFixed(4)} ${p2} ${p3.toFixed(4)} ${p4.toFixed(4)}`;
}

export function updateToneFilter() {
  const blacks     = parseFloat(document.documentElement.getAttribute("data-yt-filter-blacks")     || "0");
  const whites     = parseFloat(document.documentElement.getAttribute("data-yt-filter-whites")     || "100");
  const shadows    = parseFloat(document.documentElement.getAttribute("data-yt-filter-shadows")    || "0");
  const highlights = parseFloat(document.documentElement.getAttribute("data-yt-filter-highlights") || "0");

  const isNeutral = blacks === 0 && whites === 100 && shadows === 0 && highlights === 0;
  if (isNeutral) return; // skip SVG update — url(#yt-tone) won't be in the filter string

  injectToneFilterSVG(); // idempotent

  const tv = computeToneTableValues(blacks, whites, shadows, highlights);
  for (const id of Object.values(YT_FUNC_IDS)) {
    const el = document.getElementById(id);
    if (el) el.setAttribute("tableValues", tv);
  }
}

export function buildVideoFilter(video) {
  const brightness   = Number(video.dataset.ytBrightness   ?? 100);
  const contrast     = parseFloat(document.documentElement.getAttribute("data-yt-filter-contrast")       || "100");
  const saturation   = parseFloat(document.documentElement.getAttribute("data-yt-filter-saturation")     || "100");
  const temperature  = parseFloat(document.documentElement.getAttribute("data-yt-filter-temperature")    || "0");
  const eyeProt      = parseFloat(document.documentElement.getAttribute("data-yt-filter-eye-protection") || "0");
  const blacks       = parseFloat(document.documentElement.getAttribute("data-yt-filter-blacks")         || "0");
  const whites       = parseFloat(document.documentElement.getAttribute("data-yt-filter-whites")         || "100");
  const shadows      = parseFloat(document.documentElement.getAttribute("data-yt-filter-shadows")        || "0");
  const highlights   = parseFloat(document.documentElement.getAttribute("data-yt-filter-highlights")     || "0");

  const hasTone = blacks !== 0 || whites !== 100 || shadows !== 0 || highlights !== 0;

  const parts = [];
  // Tone filter must come FIRST so it operates on original pixel values
  if (hasTone)          parts.push(`url(#${YT_TONE_ID})`);
  if (brightness !== 100) parts.push(`brightness(${brightness}%)`);
  if (contrast   !== 100) parts.push(`contrast(${contrast}%)`);
  if (saturation !== 100) parts.push(`saturate(${saturation}%)`);
  if (temperature !== 0 ) parts.push(`hue-rotate(${temperature}deg)`);
  if (eyeProt    !== 0  ) parts.push(`sepia(${eyeProt}%)`);
  return parts.join(" ");
}

export function getVideoBrightness(video) {
  const stored = video.dataset.ytBrightness;
  return stored !== undefined ? Number(stored) : 100;
}

export function setVideoBrightness(video, pct) {
  const clamped = Math.max(0, Math.min(200, pct));
  video.dataset.ytBrightness = String(clamped);
  video.style.filter = buildVideoFilter(video);
  return clamped;
}

export function applyAllVideoFilters() {
  for (const video of document.querySelectorAll("video")) {
    video.style.filter = buildVideoFilter(video);
  }
}

export function initVideoFilters() {
  // Watch for panel filter attribute changes and reapply to all videos immediately
  const filterObserver = new MutationObserver(() => {
    updateToneFilter();
    applyAllVideoFilters();
  });
  filterObserver.observe(document.documentElement, { attributes: true, attributeFilter: [
    "data-yt-filter-contrast",
    "data-yt-filter-saturation",
    "data-yt-filter-temperature",
    "data-yt-filter-eye-protection",
    "data-yt-filter-blacks",
    "data-yt-filter-whites",
    "data-yt-filter-shadows",
    "data-yt-filter-highlights",
  ]});
}
