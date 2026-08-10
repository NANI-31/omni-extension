import React from "react";

// ── Zone Definitions ──────────────────────────────────────────────────────────

const ACTIONS = [
  { value: "volume",     label: "🔊 Volume" },
  { value: "speed",      label: "⚡ Speed" },
  { value: "brightness", label: "☀️ Brightness" },
  { value: "none",       label: "⛔ None" },
];

const ZONE_COLORS = {
  volume:     "from-red-600/30 to-red-900/10 border-red-500/40",
  speed:      "from-yellow-500/30 to-yellow-900/10 border-yellow-400/40",
  brightness: "from-amber-400/30 to-amber-900/10 border-amber-300/40",
  seek:       "from-sky-400/30 to-sky-900/10 border-sky-300/40",
  none:       "from-zinc-800/30 to-zinc-900/10 border-zinc-700/40",
};

const ZONE_ICONS = {
  volume:     "🔊",
  speed:      "⚡",
  brightness: "☀️",
  seek:       "⏩",
  none:       "⛔",
};

const ZONE_LABELS = {
  volume:     "Volume",
  speed:      "Speed",
  brightness: "Brightness",
  seek:       "Seek",
  none:       "None",
};

// ── ZoneSelect ────────────────────────────────────────────────────────────────

function ZoneSelect({ position, value, onChange }) {
  const colorClass = ZONE_COLORS[value] || ZONE_COLORS.none;
  return (
    <div
      className={`flex-1 flex flex-col items-center justify-between gap-3 bg-linear-to-b ${colorClass} border rounded-xl p-4 transition-all duration-300`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 select-none">
        {position} Zone
      </p>
      <div className="text-4xl select-none leading-none">
        {ZONE_ICONS[value] || "⛔"}
      </div>
      <p className="text-sm font-bold text-white">{ZONE_LABELS[value] || "None"}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:border-zinc-500 transition-colors"
        aria-label={`${position} zone action`}
      >
        {ACTIONS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── SensitivityCard ───────────────────────────────────────────────────────────
//
// Custom slider pattern:
//  - Visual track = a pair of divs (background rail + colored fill + circular thumb)
//  - Native <input type="range"> is positioned absolutely over the track,
//    set to opacity-0 so it is invisible but still handles all mouse/touch events.
// This avoids relying on any CSS class that doesn't exist.

function SensitivityCard({
  id,
  icon,
  title,
  description,
  badge,
  color,
  displayValue,
  value,
  min,
  max,
  step = 1,
  onChange,
  minLabel,
  maxLabel,
}) {
  // Normalise fill% from the raw value
  const fillPct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80">

      {/* ── Header ── */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0">

          {/* Icon badge */}
          <div
            className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700/80 text-xl select-none"
            style={{
              background: `${color}18`,
              boxShadow: `0 0 18px ${color}25`,
            }}
          >
            {icon}
          </div>

          {/* Title + description */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-white text-sm leading-tight">{title}</h4>
              {badge && (
                <span className="rounded-md bg-zinc-700/80 px-2 py-0.5 text-[10px] font-bold tracking-widest text-zinc-300 border border-zinc-600/50">
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Live value chip */}
        <span
          className="shrink-0 rounded-lg px-3 py-1 text-sm font-bold tabular-nums"
          style={{
            background: `${color}18`,
            color,
            border: `1px solid ${color}35`,
          }}
        >
          {displayValue}
        </span>
      </div>

      {/* ── Custom slider ── */}
      {/*
        The native <input> sits absolutely on top of the decorative track.
        It is fully transparent (opacity-0) so the custom visuals show through,
        while still receiving all pointer/keyboard events.
      */}
      <div className="relative flex items-center" style={{ height: "20px" }}>

        {/* Background rail */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-zinc-700/60" />

        {/* Filled portion */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all duration-75 pointer-events-none"
          style={{
            width: `${fillPct}%`,
            background: `linear-gradient(90deg, ${color}90, ${color})`,
            boxShadow: `0 0 10px ${color}55`,
          }}
        />

        {/* Glow behind fill */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full blur-sm pointer-events-none transition-all duration-75"
          style={{
            width: `${fillPct}%`,
            background: color,
            opacity: 0.25,
          }}
        />

        {/* Thumb dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 pointer-events-none transition-all duration-75 z-10"
          style={{
            left: `calc(${fillPct}% - 8px)`,
            borderColor: color,
            background: "#18181b",
            boxShadow: `0 0 12px ${color}70, 0 2px 6px rgba(0,0,0,0.8)`,
          }}
        />

        {/* Invisible native input — handles all interaction */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="absolute inset-0 w-full cursor-pointer z-20"
          style={{
            opacity: 0,
            height: "100%",
            margin: 0,
            padding: 0,
          }}
        />
      </div>

      {/* ── Min / Max labels ── */}
      <div className="mt-3 flex justify-between text-[11px] text-zinc-600 font-medium">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>

    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function YoutubeMouse({
  zonesEnabled,
  handleToggleZonesEnabled,
  zoneLeft,
  handleZoneLeftChange,
  zoneMiddle,
  handleZoneMiddleChange,
  brightnessSensitivity,
  handleBrightnessSensitivityChange,
  seekSensitivity,
  handleSeekSensitivityChange,
  seekCtrlSensitivity,
  handleSeekCtrlSensitivityChange,
}) {
  return (
    <div className="space-y-6">

      {/* ── Header toggle ── */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-base font-bold text-white">Mouse Scroll Zones</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Divide the video into configurable zones — the right side is always split top/bottom.
            </p>
          </div>
          <button
            id="yt-zones-toggle"
            onClick={handleToggleZonesEnabled}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 shrink-0 ${
              zonesEnabled ? "bg-red-600" : "bg-zinc-700"
            }`}
            aria-pressed={zonesEnabled}
            title={zonesEnabled ? "Disable scroll zones" : "Enable scroll zones"}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                zonesEnabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Zone visualiser + controls ── */}
      <div className={`transition-opacity duration-300 ${zonesEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Zone Assignment</h3>

          {/* Video Mockup */}
          <div
            className="relative rounded-xl overflow-hidden border border-zinc-700/60 shadow-lg select-none"
            style={{ aspectRatio: "16/9", background: "#111" }}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-zinc-700 text-sm font-bold tracking-wide">VIDEO PLAYER</div>
            </div>

            {/* Zone backgrounds */}
            <div className="absolute inset-0 flex pointer-events-none">
              <div className={`flex-1 bg-linear-to-b ${ZONE_COLORS[zoneLeft]} opacity-35`} />
              <div className={`flex-1 bg-linear-to-b ${ZONE_COLORS[zoneMiddle]} opacity-35`} />
              <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-linear-to-b from-yellow-500/25 to-yellow-900/10 opacity-60" />
                <div className="flex-1 bg-linear-to-b from-sky-400/25 to-sky-900/10 opacity-60" />
              </div>
            </div>

            {/* Zone labels */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/10 gap-1">
                <div className="text-2xl">{ZONE_ICONS[zoneLeft] || "⛔"}</div>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{ZONE_LABELS[zoneLeft] || "None"}</span>
                <span className="text-[9px] text-white/30 mt-0.5">LEFT</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/10 gap-1">
                <div className="text-2xl">{ZONE_ICONS[zoneMiddle] || "⛔"}</div>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{ZONE_LABELS[zoneMiddle] || "None"}</span>
                <span className="text-[9px] text-white/30 mt-0.5">MIDDLE</span>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center border-b border-white/15 gap-0.5">
                  <div className="text-xl">⚡</div>
                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Speed</span>
                  <span className="text-[8px] text-white/25">RIGHT · TOP</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                  <div className="text-xl">⏩</div>
                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Seek</span>
                  <span className="text-[8px] text-white/25">RIGHT · BOTTOM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Zone selector cards */}
          <div className="flex gap-3">
            <ZoneSelect position="Left"   value={zoneLeft}   onChange={handleZoneLeftChange} />
            <ZoneSelect position="Middle" value={zoneMiddle} onChange={handleZoneMiddleChange} />

            {/* Right zone — read-only */}
            <div className="flex-1 flex flex-col gap-0 rounded-xl overflow-hidden border border-zinc-700/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-800/60 px-3 py-2 text-center select-none">
                Right Zone
              </p>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 py-3 bg-linear-to-b from-yellow-500/10 to-transparent border-b border-white/10">
                <span className="text-xl">⚡</span>
                <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-wide">Speed</span>
                <span className="text-[8px] text-zinc-500">Top half · Click resets to 1.0x</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 py-3 bg-linear-to-b from-sky-400/10 to-transparent">
                <span className="text-xl">⏩</span>
                <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wide">Seek</span>
                <span className="text-[8px] text-zinc-600">Bottom half</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sensitivity sliders ── */}
      <div
        className={`transition-all duration-300 ${
          zonesEnabled ? "opacity-100" : "opacity-50 blur-[1px] pointer-events-none"
        }`}
      >
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-linear-to-br from-zinc-900 via-zinc-900 to-black shadow-2xl">

          {/* Header */}
          <div className="border-b border-zinc-800 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Sensitivity Controls</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Adjust how much each scroll gesture changes the video.
                </p>
              </div>
              <div className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                3 Controls
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6">

            <SensitivityCard
              id="yt-brightness-sensitivity"
              icon="☀️"
              title="Brightness"
              description="Brightness change per scroll tick."
              color="#f59e0b"
              displayValue={`${brightnessSensitivity}%`}
              value={brightnessSensitivity}
              min={1}
              max={20}
              step={1}
              onChange={(e) => handleBrightnessSensitivityChange(Number(e.target.value))}
              minLabel="1%"
              maxLabel="20%"
            />

            <SensitivityCard
              id="yt-seek-sensitivity"
              icon="⏩"
              title="Seek"
              description="Jump distance for each scroll tick."
              color="#38bdf8"
              displayValue={`${seekSensitivity}s`}
              value={seekSensitivity}
              min={1}
              max={60}
              step={1}
              onChange={(e) => handleSeekSensitivityChange(Number(e.target.value))}
              minLabel="1s"
              maxLabel="60s"
            />

            <SensitivityCard
              id="yt-seek-ctrl-sensitivity"
              icon="⚡"
              title="Ctrl + Seek"
              description="Large seek while holding Ctrl."
              badge="CTRL"
              color="#06b6d4"
              displayValue={`${seekCtrlSensitivity}s`}
              value={seekCtrlSensitivity}
              min={5}
              max={300}
              step={5}
              onChange={(e) => handleSeekCtrlSensitivityChange(Number(e.target.value))}
              minLabel="5s"
              maxLabel="300s"
            />

          </div>
        </div>
      </div>

      {/* ── Info box ── */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 text-xs text-zinc-500 leading-relaxed">
        <span className="font-bold text-zinc-400">How zones work:</span> The video is split into
        three columns. Left and Middle are fully configurable. The{" "}
        <span className="text-yellow-400">Right</span> column is always split — scroll on the{" "}
        <span className="text-yellow-400 font-semibold">top half</span> to adjust{" "}
        <span className="text-yellow-400">speed</span> (click to reset to 1.0x), scroll on the{" "}
        <span className="text-sky-400 font-semibold">bottom half</span> to{" "}
        <span className="text-sky-400">seek</span> through the timeline.
      </div>

    </div>
  );
}
