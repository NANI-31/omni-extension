import { RotateCcw } from "lucide-react";
import { COLOR_PRESETS } from "./colorData";

export default function ColorViewport({
  values,
  activeCount,
  hasChanges,
  onResetAll,
  activePreset,
  allFilters,
}) {
  const activePresetLabel =
    activePreset === "custom"
      ? "Custom LUT"
      : COLOR_PRESETS.find((p) => p.id === activePreset)?.label ?? "Custom LUT";

  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-5">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-700/70 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm text-xl select-none">
            🎨
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Video Color Lab
            </h3>
            <p className="text-xs text-zinc-300 font-normal mt-0.5">
              Real-time GPU compositor color grading with CSS filters & SVG tone curve transfer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] bg-red-500/20 text-red-200 border border-red-500/35 px-2.5 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
              {activeCount > 0 ? `${activeCount} Active` : "Neutral"}
            </span>
          </div>

          {hasChanges && (
            <button
              type="button"
              onClick={onResetAll}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/20 px-3.5 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/30 transition-all shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Filter Grading Viewport */}
      <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4 space-y-3 shadow-inner">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-xs uppercase tracking-wider font-sans">
              Live Color Grading Viewport
            </span>
          </div>
          <span className="text-[10px] font-sans text-zinc-400 bg-[#141626] px-2 py-0.5 rounded border border-zinc-700/80">
            Active LUT: {activePreset === "custom" ? "Custom Profile" : COLOR_PRESETS.find(p => p.id === activePreset)?.label}
          </span>
        </div>

        <div
          className="relative rounded-xl overflow-hidden border border-zinc-700/80 shadow-xl select-none flex items-center justify-center"
          style={{ aspectRatio: "16/6", background: "#000" }}
        >
          {/* Color-graded test scene */}
          <div
            className="absolute inset-0 transition-all duration-150 flex items-center justify-center"
            style={{
              filter: `contrast(${values.ytFilterContrast}%) saturate(${values.ytFilterSaturation}%) hue-rotate(${values.ytFilterTemperature}deg) sepia(${values.ytFilterEyeProtection}%)`,
              background:
                "linear-gradient(135deg, #1e1b4b 0%, #312e81 18%, #4f46e5 35%, #ec4899 65%, #f59e0b 85%, #fbbf24 100%)",
            }}
          >
            {/* Foreground test swatches */}
            <div className="relative z-10 flex items-center gap-2 sm:gap-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 shadow-2xl">
              <span className="h-4 w-4 rounded-full bg-red-500 border border-white/40 shadow-sm" title="Red" />
              <span className="h-4 w-4 rounded-full bg-green-500 border border-white/40 shadow-sm" title="Green" />
              <span className="h-4 w-4 rounded-full bg-blue-500 border border-white/40 shadow-sm" title="Blue" />
              <span className="h-4 w-4 rounded-full bg-amber-400 border border-white/40 shadow-sm" title="Highlights" />
              <span className="h-4 w-4 rounded-full bg-white border border-white/40 shadow-sm" title="Whites" />
              <span className="h-4 w-4 rounded-full bg-zinc-900 border border-white/20 shadow-sm" title="Blacks" />
              <div className="h-4 w-px bg-white/20 mx-0.5" />
              <span className="text-[11px] font-sans font-bold text-white tracking-wide drop-shadow-md">
                {activePresetLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active badges */}
      {hasChanges ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {allFilters
            .filter((f) => values[f.key] !== f.default)
            .map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-sans font-bold shadow-sm"
                style={{
                  color: f.accent,
                  borderColor: `${f.accent}40`,
                  background: `${f.accent}14`,
                }}
              >
                <span>{f.icon}</span>
                <span>
                  {f.label}: {values[f.key]}
                  {f.unit}
                </span>
              </span>
            ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-700/80 bg-[#0f111e] px-4 py-3 text-center text-xs text-zinc-400 font-medium">
          All channels currently at neutral default (100% / 0) — adjust sliders or choose a preset below
        </div>
      )}
    </div>
  );
}
