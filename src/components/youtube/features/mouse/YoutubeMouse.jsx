import { MousePointer2, Sliders, HelpCircle, Sparkles } from "lucide-react";
import Toggle from "../../../ui/Toggle";

// ── Zone Definitions ──────────────────────────────────────────────────────────

const ACTIONS = [
  { value: "volume",     label: "🔊 Volume" },
  { value: "speed",      label: "⚡ Speed" },
  { value: "brightness", label: "☀️ Brightness" },
  { value: "none",       label: "⛔ None" },
];

const ZONE_THEMES = {
  volume: {
    label: "Volume",
    icon: "🔊",
    cardBorder: "border-red-500/70 ring-1 ring-red-400/20 shadow-lg shadow-red-950/40",
    cardBg: "from-red-600/25 via-red-950/15 to-[#0f111e]",
    badge: "text-red-200 bg-red-500/20 border-red-500/40",
    selectFocus: "focus:border-red-500/80",
    mockupBg: "from-red-600/45 via-red-800/25 to-red-950/20",
    iconGlow: "drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]",
  },
  speed: {
    label: "Speed",
    icon: "⚡",
    cardBorder: "border-yellow-400/70 ring-1 ring-yellow-400/20 shadow-lg shadow-yellow-950/40",
    cardBg: "from-yellow-500/25 via-yellow-950/15 to-[#0f111e]",
    badge: "text-yellow-200 bg-yellow-500/20 border-yellow-500/40",
    selectFocus: "focus:border-yellow-400/80",
    mockupBg: "from-yellow-500/45 via-yellow-700/25 to-yellow-950/20",
    iconGlow: "drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]",
  },
  brightness: {
    label: "Brightness",
    icon: "☀️",
    cardBorder: "border-amber-400/70 ring-1 ring-amber-400/25 shadow-lg shadow-amber-950/40",
    cardBg: "from-amber-500/25 via-amber-950/15 to-[#0f111e]",
    badge: "text-amber-200 bg-amber-500/20 border-amber-500/40",
    selectFocus: "focus:border-amber-400/80",
    mockupBg: "from-amber-400/45 via-amber-700/25 to-amber-950/20",
    iconGlow: "drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]",
  },
  seek: {
    label: "Seek",
    icon: "⏩",
    cardBorder: "border-sky-400/70 ring-1 ring-sky-400/20 shadow-lg shadow-sky-950/40",
    cardBg: "from-sky-500/25 via-sky-950/15 to-[#0f111e]",
    badge: "text-sky-200 bg-sky-500/20 border-sky-500/40",
    selectFocus: "focus:border-sky-400/80",
    mockupBg: "from-sky-400/45 via-sky-700/25 to-sky-950/20",
    iconGlow: "drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]",
  },
  none: {
    label: "None",
    icon: "⛔",
    cardBorder: "border-zinc-700/80 ring-1 ring-white/5",
    cardBg: "from-zinc-800/40 via-zinc-900/25 to-[#0f111e]",
    badge: "text-zinc-400 bg-zinc-800/80 border-zinc-700/80",
    selectFocus: "focus:border-zinc-500/80",
    mockupBg: "from-zinc-800/40 via-zinc-900/25 to-zinc-950/20",
    iconGlow: "drop-shadow-md",
  },
};

// ── ZoneSelect Component ──────────────────────────────────────────────────────

function ZoneSelect({ position, value, onChange }) {
  const theme = ZONE_THEMES[value] || ZONE_THEMES.none;
  return (
    <div
      className={`flex-1 flex flex-col items-center justify-between gap-3 bg-linear-to-b ${theme.cardBg} border ${theme.cardBorder} rounded-xl p-4 transition-all duration-300 shadow-inner select-none`}
    >
      <div className="flex items-center justify-between w-full">
        <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-300 select-none">
          {position} Zone
        </p>
        <span className={`text-[9px] font-sans font-extrabold uppercase px-1.5 py-0.5 rounded border shadow-sm ${theme.badge}`}>
          {theme.label}
        </span>
      </div>
      <div className={`text-3xl select-none leading-none py-1 ${theme.iconGlow}`}>
        {theme.icon}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full text-xs bg-[#141626] border border-zinc-700/80 text-white rounded-xl px-2.5 py-1.5 cursor-pointer focus:outline-none ${theme.selectFocus} transition-colors shadow-inner font-medium`}
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

// ── SensitivityCard Component ─────────────────────────────────────────────────

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
    <div className="group rounded-xl bg-[#0f111e] border border-zinc-700/80 p-5 transition-all duration-200 shadow-inner hover:border-zinc-600">

      {/* ── Header ── */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0">

          {/* Icon badge */}
          <div
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700/80 text-lg select-none shadow-sm"
            style={{
              background: `${color}18`,
              boxShadow: `0 0 16px ${color}20`,
            }}
          >
            {icon}
          </div>

          {/* Title + description */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-white text-sm leading-tight">{title}</h4>
              {badge && (
                <span className="rounded-md bg-[#141626] px-2 py-0.5 text-[10px] font-bold font-sans tracking-wider text-zinc-300 border border-zinc-700/80">
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-300 leading-relaxed font-normal">{description}</p>
          </div>
        </div>

        {/* Live value chip */}
        <span
          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-sans font-extrabold tabular-nums border shadow-sm"
          style={{
            background: `${color}18`,
            color,
            borderColor: `${color}40`,
          }}
        >
          {displayValue}
        </span>
      </div>

      {/* ── Custom Range Slider ── */}
      <div className="relative flex items-center" style={{ height: "20px" }}>

        {/* Background rail */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-zinc-800" />

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

        {/* Invisible native input */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="absolute inset-0 w-full cursor-pointer z-20 opacity-0"
          style={{
            height: "100%",
            margin: 0,
            padding: 0,
          }}
        />
      </div>

      {/* ── Min / Max labels ── */}
      <div className="mt-2.5 flex justify-between text-[10px] text-zinc-400 font-sans">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>

    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

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
  const themeLeft = ZONE_THEMES[zoneLeft] || ZONE_THEMES.none;
  const themeMiddle = ZONE_THEMES[zoneMiddle] || ZONE_THEMES.none;

  return (
    <div className="space-y-6">

      {/* ── Header toggle card ── */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-zinc-700/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
              <MousePointer2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Mouse Scroll Zones
              </h3>
              <p className="text-xs text-zinc-300 font-normal mt-0.5">
                Divide the player into 3 interactive columns with dedicated scroll actions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${zonesEnabled ? "bg-red-400 opacity-75" : "bg-zinc-500"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${zonesEnabled ? "bg-red-500" : "bg-zinc-600"}`}></span>
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-200 border border-red-500/35 px-2.5 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
                {zonesEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <Toggle enabled={zonesEnabled} onChange={handleToggleZonesEnabled} />
          </div>
        </div>
      </div>

      {/* ── Zone Visualizer + Controls ── */}
      <div className={`transition-opacity duration-300 ${zonesEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>3-Column Interactive Zone Layout</span>
            </h3>
            <span className="rounded-md border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-200 font-sans shadow-inner">
              3 Columns
            </span>
          </div>

          {/* Video Mockup */}
          <div
            className="relative rounded-xl overflow-hidden border border-zinc-700/80 shadow-2xl select-none"
            style={{ aspectRatio: "16/9", background: "#000" }}
          >
            {/* Center Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="text-zinc-700 text-xs font-extrabold tracking-widest font-sans uppercase bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800/80">
                Interactive 3-Zone Viewport
              </div>
            </div>

            {/* Zone backgrounds — vibrant default luminous brightness */}
            <div className="absolute inset-0 flex pointer-events-none">
              <div className={`flex-1 bg-linear-to-b ${themeLeft.mockupBg} opacity-85`} />
              <div className={`flex-1 bg-linear-to-b ${themeMiddle.mockupBg} opacity-85`} />
              <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-linear-to-b from-yellow-500/40 via-yellow-700/25 to-yellow-950/20 opacity-85" />
                <div className="flex-1 bg-linear-to-b from-sky-400/40 via-sky-700/25 to-sky-950/20 opacity-85" />
              </div>
            </div>

            {/* Zone labels & overlay — neutral dividers without border colors */}
            <div className="absolute inset-0 flex z-10">
              {/* Left Zone Overlay */}
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/10 gap-1.5">
                <div className={`text-3xl ${themeLeft.iconGlow}`}>{themeLeft.icon}</div>
                <span className="text-xs font-extrabold text-white tracking-wide">{themeLeft.label}</span>
                <span className="text-[9px] font-sans font-bold text-zinc-300 bg-black/70 px-2 py-0.5 rounded-md border border-white/15">
                  LEFT 33%
                </span>
              </div>

              {/* Middle Zone Overlay */}
              <div className="flex-1 flex flex-col items-center justify-center border-r border-white/10 gap-1.5">
                <div className={`text-3xl ${themeMiddle.iconGlow}`}>{themeMiddle.icon}</div>
                <span className="text-xs font-extrabold text-white tracking-wide">{themeMiddle.label}</span>
                <span className="text-[9px] font-sans font-bold text-zinc-300 bg-black/70 px-2 py-0.5 rounded-md border border-white/15">
                  MIDDLE 33%
                </span>
              </div>

              {/* Right Zone Overlay (Split) */}
              <div className="flex-1 flex flex-col">
                {/* Right Top (Speed) */}
                <div className="flex-1 flex flex-col items-center justify-center border-b border-white/10 gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">⚡</span>
                    <span className="text-xs font-bold text-yellow-300 tracking-wide">Speed</span>
                  </div>
                  <span className="text-[8px] font-sans font-bold text-zinc-300 bg-black/70 px-1.5 py-0.5 rounded border border-white/15">
                    RIGHT · TOP
                  </span>
                </div>

                {/* Right Bottom (Seek) */}
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">⏩</span>
                    <span className="text-xs font-bold text-sky-300 tracking-wide">Seek</span>
                  </div>
                  <span className="text-[8px] font-sans font-bold text-zinc-300 bg-black/70 px-1.5 py-0.5 rounded border border-white/15">
                    RIGHT · BOTTOM
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Zone selector cards with respective color borders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ZoneSelect position="Left"   value={zoneLeft}   onChange={handleZoneLeftChange} />
            <ZoneSelect position="Middle" value={zoneMiddle} onChange={handleZoneMiddleChange} />

            {/* Right zone — read-only with respective dual color border & split accents */}
            <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-sky-400/60 ring-1 ring-yellow-400/30 bg-[#0f111e] shadow-lg shadow-sky-950/30 select-none">
              <div className="flex items-center justify-between px-3 py-2 bg-[#141626] border-b border-zinc-700/70 select-none">
                <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-300">
                  Right Zone
                </p>
                <span className="text-[9px] font-sans font-extrabold text-amber-300 uppercase bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                  Split 50/50
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-linear-to-b from-yellow-500/25 via-yellow-950/15 to-[#0f111e] border-b border-yellow-500/30">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">⚡</span>
                  <span className="text-xs font-bold text-yellow-300 uppercase tracking-wide">Speed (Top)</span>
                </div>
                <span className="text-[10px] text-zinc-300 font-medium">Click resets to 1.0x</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-linear-to-b from-sky-500/25 via-sky-950/15 to-[#0f111e]">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">⏩</span>
                  <span className="text-xs font-bold text-sky-300 uppercase tracking-wide">Seek (Bottom)</span>
                </div>
                <span className="text-[10px] text-zinc-300 font-medium">Timeline scrubber</span>
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
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-700/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
                <Sliders className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Sensitivity & Jump Distance Controls
                </h3>
                <p className="text-xs text-zinc-300 font-normal mt-0.5">
                  Adjust step increments and timeline jump distances for each scroll zone
                </p>
              </div>
            </div>
            <span className="rounded-full border border-zinc-700/80 bg-[#0f111e] px-3 py-1 text-xs text-zinc-300 font-sans">
              3 Calibrations
            </span>
          </div>

          <div className="space-y-4">

            <SensitivityCard
              id="yt-seek-sensitivity"
              icon="⏩"
              title="Seek Jump Interval"
              description="Jump distance in seconds per scroll tick when scrolling in the seek zone."
              badge="Standard"
              color="#38bdf8"
              displayValue={`${Number(seekSensitivity).toFixed(Number(seekSensitivity) % 1 === 0 ? 0 : 1)}s`}
              value={seekSensitivity}
              min={0.1}
              max={60}
              step={0.1}
              onChange={(e) => handleSeekSensitivityChange(Number(e.target.value))}
              minLabel="0.1s"
              maxLabel="60s"
            />

            <SensitivityCard
              id="yt-seek-ctrl-sensitivity"
              icon="⚡"
              title="Ctrl + Seek Turbo Jump"
              description="Large timeline skip when scrolling while holding the Ctrl keyboard key."
              badge="Ctrl Key"
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

            <SensitivityCard
              id="yt-brightness-sensitivity"
              icon="☀️"
              title="Brightness Sensitivity"
              description="Percentage brightness shift applied per scroll tick in brightness zone."
              badge="Display"
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

          </div>
        </div>
      </div>

      {/* ── Quick User Guide ── */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5.5 shadow-xl shadow-black/60 flex gap-4 items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm mt-0.5">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
            How Scroll Zones Operate
          </h4>
          <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
              <span>The video is split into three vertical columns across the player width.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
              <span><b className="text-white font-semibold">Left</b> and <b className="text-white font-semibold">Middle</b> zones can be individually mapped to Volume, Speed, or Brightness.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
              <span><b className="text-white font-semibold">Right</b> zone is split 50/50: scroll <b className="text-yellow-300 font-semibold">Top half</b> for Speed (click to reset 1.0x), scroll <b className="text-sky-300 font-semibold">Bottom half</b> to Seek timeline.</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
