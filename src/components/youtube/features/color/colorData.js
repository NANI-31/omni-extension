// ── Preset definitions ────────────────────────────────────────────────────────
// All keys are storage keys. Values are the settings applied when the preset is activated.
// Brightness is scroll-zone-only and not included here.

export const COLOR_PRESETS = [
  {
    id: "cinema",
    label: "Cinema",
    emoji: "🎬",
    desc: "Filmic teal-orange with crushed blacks",
    gradient: "from-orange-500/20 to-amber-900/10",
    border: "border-orange-500/40",
    values: {
      ytFilterContrast: 112, ytFilterSaturation: 78,  ytFilterTemperature: -4,  ytFilterEyeProtection: 0,
      ytFilterHighlights: -30, ytFilterShadows: 12, ytFilterWhites: 90, ytFilterBlacks: 6,
    },
  },
  {
    id: "amoled",
    label: "AMOLED",
    emoji: "🖤",
    desc: "Deep blacks with punchy contrast",
    gradient: "from-violet-500/20 to-violet-900/10",
    border: "border-violet-500/40",
    values: {
      ytFilterContrast: 130, ytFilterSaturation: 110, ytFilterTemperature: 0,   ytFilterEyeProtection: 0,
      ytFilterHighlights: -8, ytFilterShadows: -25, ytFilterWhites: 98, ytFilterBlacks: 0,
    },
  },
  {
    id: "night",
    label: "Night",
    emoji: "🌙",
    desc: "Dim, warm — easy on the eyes",
    gradient: "from-amber-500/20 to-amber-900/10",
    border: "border-amber-500/40",
    values: {
      ytFilterContrast: 88,  ytFilterSaturation: 68,  ytFilterTemperature: -14, ytFilterEyeProtection: 28,
      ytFilterHighlights: -35, ytFilterShadows: 8, ytFilterWhites: 82, ytFilterBlacks: 4,
    },
  },
  {
    id: "vivid",
    label: "Vivid",
    emoji: "✨",
    desc: "Boosted colors and lifted highlights",
    gradient: "from-cyan-500/20 to-sky-900/10",
    border: "border-cyan-500/40",
    values: {
      ytFilterContrast: 118, ytFilterSaturation: 148, ytFilterTemperature: 8,   ytFilterEyeProtection: 0,
      ytFilterHighlights: 18, ytFilterShadows: 10, ytFilterWhites: 100, ytFilterBlacks: 0,
    },
  },
  {
    id: "vintage",
    label: "Vintage",
    emoji: "📷",
    desc: "Warm film look with lifted shadows",
    gradient: "from-yellow-500/20 to-yellow-900/10",
    border: "border-yellow-500/40",
    values: {
      ytFilterContrast: 88,  ytFilterSaturation: 72,  ytFilterTemperature: -10, ytFilterEyeProtection: 15,
      ytFilterHighlights: -18, ytFilterShadows: 28, ytFilterWhites: 88, ytFilterBlacks: 14,
    },
  },
  {
    id: "nature",
    label: "Nature",
    emoji: "🌿",
    desc: "Vivid greens and blues, lifted shadows",
    gradient: "from-emerald-500/20 to-emerald-900/10",
    border: "border-emerald-500/40",
    values: {
      ytFilterContrast: 106, ytFilterSaturation: 132, ytFilterTemperature: 5,   ytFilterEyeProtection: 0,
      ytFilterHighlights: 5, ytFilterShadows: 20, ytFilterWhites: 100, ytFilterBlacks: 3,
    },
  },
];

// ── Filter slider definitions ─────────────────────────────────────────────────

export const CSS_FILTERS = [
  {
    key: "ytFilterContrast", label: "Contrast", icon: "◐", unit: "%",
    min: 50, max: 200, default: 100,
    accent: "#a78bfa", trackColor: "#7c3aed",
    desc: "Difference between dark and light values across the frame",
    css: (v) => `contrast(${v}%)`,
  },
  {
    key: "ytFilterSaturation", label: "Saturation", icon: "🎨", unit: "%",
    min: 0, max: 200, default: 100,
    accent: "#f472b6", trackColor: "#db2777",
    desc: "Intensity and purity of video colors",
    css: (v) => `saturate(${v}%)`,
  },
  {
    key: "ytFilterTemperature", label: "Temperature", icon: "🌡️", unit: "°",
    min: -30, max: 30, default: 0,
    accent: "#fb923c", trackColor: "#ea580c",
    desc: "Warm (−) ↔ Cool (+) color cast",
    css: (v) => `hue-rotate(${v}deg)`,
  },
  {
    key: "ytFilterEyeProtection", label: "Eye Protection", icon: "👁️", unit: "%",
    min: 0, max: 50, default: 0,
    accent: "#fbbf24", trackColor: "#d97706",
    desc: "Warm sepia tint reduces blue light fatigue during night viewing",
    css: (v) => `sepia(${v}%)`,
  },
];

export const TONE_FILTERS = [
  {
    key: "ytFilterHighlights", label: "Highlights", icon: "🔆", unit: "",
    min: -100, max: 100, default: 0,
    accent: "#fde68a", trackColor: "#f59e0b",
    desc: "Recover (−) or boost (+) bright areas",
    engine: "SVG tone curve @ 75% input",
  },
  {
    key: "ytFilterShadows", label: "Shadows", icon: "🔅", unit: "",
    min: -100, max: 100, default: 0,
    accent: "#818cf8", trackColor: "#6366f1",
    desc: "Crush (−) or lift (+) shadow detail",
    engine: "SVG tone curve @ 25% input",
  },
  {
    key: "ytFilterWhites", label: "Whites", icon: "⬜", unit: "",
    min: 50, max: 100, default: 100,
    accent: "#d4d4d8", trackColor: "#a1a1aa",
    desc: "Compress highlight ceiling to prevent clipping",
    engine: "SVG tone curve @ 100% input",
  },
  {
    key: "ytFilterBlacks", label: "Blacks", icon: "⬛", unit: "",
    min: 0, max: 100, default: 0,
    accent: "#9ca3af", trackColor: "#6b7280",
    desc: "Lift the shadow floor for a filmic faded matte aesthetic",
    engine: "SVG tone curve @ 0% input",
  },
];

export function fillPct(value, min, max) {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}
