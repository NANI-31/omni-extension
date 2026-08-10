import React, { useMemo } from "react";

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
    border: "border-orange-500/30",
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
    border: "border-violet-500/30",
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
    border: "border-amber-500/30",
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
    border: "border-cyan-500/30",
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
    border: "border-yellow-500/30",
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
    border: "border-emerald-500/30",
    values: {
      ytFilterContrast: 106, ytFilterSaturation: 132, ytFilterTemperature: 5,   ytFilterEyeProtection: 0,
      ytFilterHighlights: 5, ytFilterShadows: 20, ytFilterWhites: 100, ytFilterBlacks: 3,
    },
  },
];

// ── Filter slider definitions ─────────────────────────────────────────────────

const CSS_FILTERS = [
  {
    key: "ytFilterContrast", label: "Contrast", icon: "◐", unit: "%",
    min: 50, max: 200, default: 100,
    accent: "#a78bfa", trackColor: "#7c3aed",
    desc: "Difference between dark and light",
    css: (v) => `contrast(${v}%)`,
  },
  {
    key: "ytFilterSaturation", label: "Saturation", icon: "🎨", unit: "%",
    min: 0, max: 200, default: 100,
    accent: "#f472b6", trackColor: "#db2777",
    desc: "Color intensity",
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
    desc: "Warm sepia tint reduces blue light",
    css: (v) => `sepia(${v}%)`,
  },
];

const TONE_FILTERS = [
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
    desc: "Compress highlight ceiling (prevent clipping)",
    engine: "SVG tone curve @ 100% input",
  },
  {
    key: "ytFilterBlacks", label: "Blacks", icon: "⬛", unit: "",
    min: 0, max: 100, default: 0,
    accent: "#71717a", trackColor: "#52525b",
    desc: "Lift the shadow floor (faded / matte look)",
    engine: "SVG tone curve @ 0% input",
  },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function fillPct(value, min, max) {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

// ── FilterSlider component ────────────────────────────────────────────────────

function FilterSlider({ filter, value, onChange, onReset }) {
  const isDefault = value === filter.default;
  const fp = fillPct(value, filter.min, filter.max);

  return (
    <div className="group rounded-2xl border border-zinc-700/60 bg-zinc-800/60 p-4 transition-all hover:border-zinc-600 hover:bg-zinc-800/80">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-lg select-none"
            style={{ background: `${filter.accent}18`, boxShadow: `0 0 14px ${filter.accent}22` }}
          >
            {filter.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-100 leading-tight">{filter.label}</p>
            <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{filter.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums"
            style={{ background: `${filter.accent}18`, color: filter.accent, border: `1px solid ${filter.accent}35` }}
          >
            {value}{filter.unit}
          </span>
          {!isDefault && (
            <button
              onClick={onReset}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-200 bg-zinc-700/60 hover:bg-zinc-600/80 px-2 py-1 rounded-lg transition-all"
            >
              ↺
            </button>
          )}
        </div>
      </div>

      {/* Custom slider */}
      <div className="relative flex items-center" style={{ height: "18px" }}>
        {/* Background rail */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-zinc-700/70" />
        {/* Filled portion */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none transition-all duration-75"
          style={{ width: `${fp}%`, background: `linear-gradient(90deg, ${filter.trackColor}90, ${filter.trackColor})`, boxShadow: `0 0 8px ${filter.trackColor}55` }}
        />
        {/* Glow */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full blur-sm pointer-events-none transition-all duration-75"
          style={{ width: `${fp}%`, background: filter.accent, opacity: 0.22 }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 pointer-events-none transition-all duration-75"
          style={{ left: `calc(${fp}% - 7px)`, borderColor: filter.accent, background: "#18181b", boxShadow: `0 0 10px ${filter.accent}70` }}
        />
        {/* Invisible native input */}
        <input
          type="range" min={filter.min} max={filter.max} step="1" value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
          style={{ height: "100%" }}
        />
      </div>

      {/* Labels */}
      <div className="mt-3 flex justify-between text-[10px] text-zinc-600 font-medium">
        <span>{filter.min}{filter.unit}</span>
        <span className="text-zinc-700">Default: {filter.default}{filter.unit}</span>
        <span>{filter.max}{filter.unit}</span>
      </div>

      {filter.engine && (
        <p className="mt-1.5 text-[9px] text-zinc-700 font-medium tracking-wider uppercase">{filter.engine}</p>
      )}
    </div>
  );
}

// ── PresetChip component ──────────────────────────────────────────────────────

function PresetChip({ preset, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(preset)}
      className={`group relative flex-1 min-w-20 rounded-2xl border p-3 text-left transition-all duration-200 hover:scale-[1.02] ${
        isActive
          ? `bg-linear-to-br ${preset.gradient} ${preset.border} shadow-lg`
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/50"
      }`}
    >
      {isActive && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] shadow-md">
          ✓
        </span>
      )}
      <div className="text-xl mb-1.5 select-none">{preset.emoji}</div>
      <p className={`text-xs font-bold leading-tight ${isActive ? "text-white" : "text-zinc-300"}`}>{preset.label}</p>
      <p className={`text-[9px] leading-tight mt-0.5 ${isActive ? "text-zinc-300" : "text-zinc-600"}`}>{preset.desc}</p>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function YoutubeColorSettings({
  // CSS filters
  filterContrast, handleFilterContrastChange,
  filterSaturation, handleFilterSaturationChange,
  filterTemperature, handleFilterTemperatureChange,
  filterEyeProtection, handleFilterEyeProtectionChange,
  // Tone / LUT filters
  filterHighlights, handleFilterHighlightsChange,
  filterShadows, handleFilterShadowsChange,
  filterWhites, handleFilterWhitesChange,
  filterBlacks, handleFilterBlacksChange,
  // Preset
  onApplyPreset,
  onResetAll,
}) {
  const values = {
    ytFilterContrast:      filterContrast,
    ytFilterSaturation:    filterSaturation,
    ytFilterTemperature:   filterTemperature,
    ytFilterEyeProtection: filterEyeProtection,
    ytFilterHighlights:    filterHighlights,
    ytFilterShadows:       filterShadows,
    ytFilterWhites:        filterWhites,
    ytFilterBlacks:        filterBlacks,
  };

  const handlers = {
    ytFilterContrast:      handleFilterContrastChange,
    ytFilterSaturation:    handleFilterSaturationChange,
    ytFilterTemperature:   handleFilterTemperatureChange,
    ytFilterEyeProtection: handleFilterEyeProtectionChange,
    ytFilterHighlights:    handleFilterHighlightsChange,
    ytFilterShadows:       handleFilterShadowsChange,
    ytFilterWhites:        handleFilterWhitesChange,
    ytFilterBlacks:        handleFilterBlacksChange,
  };

  const ALL_FILTERS = [...CSS_FILTERS, ...TONE_FILTERS];

  // Detect active preset by exact value match
  const activePreset = useMemo(() =>
    COLOR_PRESETS.find(p => Object.entries(p.values).every(([k, v]) => values[k] === v))?.id ?? "custom",
    [filterContrast, filterSaturation, filterTemperature, filterEyeProtection,
     filterHighlights, filterShadows, filterWhites, filterBlacks]
  );

  const hasChanges = ALL_FILTERS.some(f => values[f.key] !== f.default);
  const activeCount = ALL_FILTERS.filter(f => values[f.key] !== f.default).length;

  return (
    <div className="space-y-7">

      {/* ═══════════════════════════════════════════════════════ HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-32 w-40 rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-2xl select-none">🎨</div>
              <div>
                <h2 className="text-xl font-bold text-white">Video Color Lab</h2>
                <p className="text-xs text-zinc-400 mt-0.5">CSS + SVG compositor filters — real-time, cross-origin safe</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />Live Preview
              </div>
              <span className="text-xs text-zinc-600">{ALL_FILTERS.length} Controls</span>
              {activeCount > 0 && (
                <span className="text-xs text-cyan-400 font-semibold">{activeCount} Active</span>
              )}
            </div>
          </div>
          {hasChanges && (
            <button
              onClick={onResetAll}
              className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Active filters badges */}
        <div className="relative mt-5">
          {hasChanges ? (
            <div className="flex flex-wrap gap-2">
              {ALL_FILTERS.filter(f => values[f.key] !== f.default).map(f => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
                  style={{ color: f.accent, borderColor: `${f.accent}40`, background: `${f.accent}14` }}
                >
                  {f.icon} {f.label}: {values[f.key]}{f.unit}
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-3 text-center text-xs text-zinc-600">
              All filters at default — adjust sliders or pick a preset below
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ PRESETS */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl">
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Presets</h3>
            <p className="text-xs text-zinc-500 mt-0.5">One-click color grades — click to apply all sliders</p>
          </div>
          <span className="rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
            {activePreset === "custom" ? "Custom" : COLOR_PRESETS.find(p => p.id === activePreset)?.label ?? "Custom"}
          </span>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-3">
            {COLOR_PRESETS.map(preset => (
              <PresetChip
                key={preset.id}
                preset={preset}
                isActive={activePreset === preset.id}
                onClick={onApplyPreset}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ TONE / LUT CONTROLS */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-lg select-none">🎚️</div>
            <div>
              <h3 className="text-sm font-bold text-white">Tone Controls</h3>
              <p className="text-xs text-zinc-500 mt-0.5">SVG feComponentTransfer — GPU-accelerated tone curve, same as WebGL quality</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {TONE_FILTERS.map(filter => (
            <FilterSlider
              key={filter.key}
              filter={filter}
              value={values[filter.key]}
              onChange={handlers[filter.key]}
              onReset={() => handlers[filter.key](filter.default)}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ CSS FILTERS */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-lg select-none">🌈</div>
            <div>
              <h3 className="text-sm font-bold text-white">Color Controls</h3>
              <p className="text-xs text-zinc-500 mt-0.5">CSS filter functions — contrast, saturation, temperature, eye protection</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {CSS_FILTERS.map(filter => (
            <FilterSlider
              key={filter.key}
              filter={filter}
              value={values[filter.key]}
              onChange={handlers[filter.key]}
              onReset={() => handlers[filter.key](filter.default)}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ BROWSER LIMITATIONS */}
      <div className="rounded-3xl border border-yellow-500/10 bg-zinc-900/50 overflow-hidden shadow-xl">
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
          <span className="text-xl select-none">⚠️</span>
          <div>
            <h3 className="text-sm font-semibold text-white">Browser Limitations</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Two controls cannot be implemented via CSS/SVG filters</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5">
          {[
            { label: "Vibrance", icon: "✨", reason: "Smart saturation needs per-pixel luminance — use Saturation as an approximation" },
            { label: "Sharpness", icon: "🔍", reason: "Convolution kernel (unsharp mask) requires canvas pixel access — blocked cross-origin" },
          ].map(item => (
            <div key={item.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 opacity-55">
              <div className="text-2xl mb-2 select-none">{item.icon}</div>
              <p className="text-xs font-semibold text-zinc-400">{item.label}</p>
              <p className="text-[10px] text-zinc-600 leading-relaxed mt-1">{item.reason}</p>
            </div>
          ))}
        </div>
        <p className="border-t border-zinc-800 px-6 py-4 text-[10px] leading-relaxed text-zinc-600">
          <span className="text-zinc-400">Highlights, Shadows, Whites, Blacks</span> are now fully implemented via GPU-accelerated SVG{" "}
          <code className="text-zinc-500">feComponentTransfer</code> — a 5-point tone curve applied at compositor level without CORS restrictions.
        </p>
      </div>

    </div>
  );
}
