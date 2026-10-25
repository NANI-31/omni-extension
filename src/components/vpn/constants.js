// ─── Country code → flag emoji ─────────────────────────────────────────────
export const countryFlag = (code) => {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
};

export const COUNTRY_NAMES = {
  US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France",
  JP: "Japan", SG: "Singapore", NL: "Netherlands", CA: "Canada",
  AU: "Australia", BR: "Brazil", IN: "India", RU: "Russia",
  HK: "Hong Kong", KR: "South Korea", IT: "Italy", ES: "Spain",
  PL: "Poland", SE: "Sweden", NO: "Norway", FI: "Finland",
  CH: "Switzerland", TR: "Turkey", UA: "Ukraine", CN: "China",
};

// ─── Health score UI helpers ────────────────────────────────────────────────
export function scoreColor(score) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

export function scoreDot(score) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

export function scoreLabel(score, tested) {
  if (!tested) return "Untested";
  if (score >= 75) return "Healthy";
  if (score >= 50) return "Fair";
  return "Poor";
}

// Client-side score calculation mirrors health.js
export function clientCalculateScore(h) {
  if (!h) return null; // null = untested
  const total = (h.successCount || 0) + (h.failureCount || 0);
  if (total === 0) return null;
  const rate = h.successCount / total;
  const hoursSince = (Date.now() - (h.lastChecked || 0)) / 3_600_000;
  const recency = Math.max(0.4, 1 - hoursSince / 48);
  return Math.round(rate * 100 * recency);
}

// ─── Storage & Formatting Helpers ───────────────────────────────────────────
export function updateSetting(key, val) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.set({ [key]: val });
  }
}

export function formatDuration(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h > 0 ? String(h).padStart(2, "0") : null, String(m).padStart(2, "0"), String(sec).padStart(2, "0")]
    .filter(Boolean).join(":");
}
