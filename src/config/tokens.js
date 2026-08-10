/**
 * OmniExtension Design Token Registry
 * Centralized design system tokens for color palettes, typography, glow effects,
 * card surfaces, and module branding across YouTube, InstaGrab, Pinterest, Timers, and VPN.
 */

export const COLOR_TOKENS = {
  // Brand Module Color Palettes
  youtube: {
    primary: "#ef4444",
    primaryHover: "#dc2626",
    gradient: "from-red-600 via-rose-600 to-orange-600",
    accentBg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.3)",
    glow: "rgba(239, 68, 68, 0.35)",
    text: "#f87171",
    badgeStyle: "border-red-500/30 bg-red-500/10 text-red-300",
    borderColor: "border-red-500/30 hover:border-red-400/80",
  },
  instagrab: {
    primary: "#ec4899",
    primaryHover: "#db2777",
    gradient: "from-fuchsia-500 via-rose-500 to-amber-500",
    accentBg: "rgba(236, 72, 153, 0.1)",
    border: "rgba(236, 72, 153, 0.3)",
    glow: "rgba(236, 72, 153, 0.35)",
    text: "#f472b6",
    badgeStyle: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300",
    borderColor: "border-fuchsia-500/30 hover:border-fuchsia-400/80",
  },
  pinterest: {
    primary: "#e11d48",
    primaryHover: "#be123c",
    gradient: "from-rose-600 via-pink-600 to-purple-600",
    accentBg: "rgba(225, 29, 72, 0.1)",
    border: "rgba(225, 29, 72, 0.3)",
    glow: "rgba(225, 29, 72, 0.35)",
    text: "#fb7185",
    badgeStyle: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    borderColor: "border-rose-500/30 hover:border-rose-400/80",
  },
  timers: {
    primary: "#10b981",
    primaryHover: "#059669",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    accentBg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.3)",
    glow: "rgba(16, 185, 129, 0.35)",
    text: "#34d399",
    badgeStyle: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    borderColor: "border-emerald-500/30 hover:border-emerald-400/80",
  },
  vpn: {
    primary: "#0ea5e9",
    primaryHover: "#0284c7",
    gradient: "from-sky-400 via-blue-600 to-indigo-600",
    accentBg: "rgba(14, 165, 233, 0.1)",
    border: "rgba(14, 165, 233, 0.3)",
    glow: "rgba(14, 165, 233, 0.35)",
    text: "#38bdf8",
    badgeStyle: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    borderColor: "border-sky-500/30 hover:border-sky-400/80",
  },

  // Dark Theme Surface Hierarchy
  surfaces: {
    bgBase: "#0f0f15",
    cardBg: "rgba(24, 24, 37, 0.6)",
    cardHover: "rgba(32, 32, 48, 0.7)",
    panelBg: "rgba(18, 18, 26, 0.4)",
    borderSubtle: "rgba(255, 255, 255, 0.08)",
    borderMedium: "rgba(255, 255, 255, 0.15)",
    borderFocus: "rgba(239, 68, 68, 0.5)",
  },

  // Standard Text Colors
  text: {
    primary: "#f4f4f5",
    secondary: "#a1a1aa",
    tertiary: "#71717a",
    muted: "#52525b",
  },
};

export const GLOW_EFFECTS = {
  youtube: "0 0 24px rgba(239, 68, 68, 0.25)",
  instagrab: "0 0 24px rgba(236, 72, 153, 0.25)",
  pinterest: "0 0 24px rgba(225, 29, 72, 0.25)",
  emerald: "0 0 24px rgba(16, 185, 129, 0.25)",
  sky: "0 0 24px rgba(14, 165, 233, 0.25)",
  panel: "0 10px 30px rgba(0, 0, 0, 0.5)",
};

export const TYPOGRAPHY_TOKENS = {
  headerTitle: "text-base font-bold text-zinc-200 tracking-tight",
  sectionHeader: "text-xs font-bold text-zinc-400 uppercase tracking-widest",
  bodyText: "text-xs text-zinc-400 leading-relaxed",
  bodyBold: "text-xs font-semibold text-zinc-200",
  badgeText: "text-[10px] font-bold font-mono uppercase tracking-wider",
  inputField: "w-full px-3 py-1.5 bg-zinc-900/90 border border-zinc-800 focus:border-red-500/50 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors",
};