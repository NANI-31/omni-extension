import { Sparkles } from "lucide-react";
import { COLOR_PRESETS } from "./colorData";

export function PresetChip({ preset, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(preset)}
      className={`group relative flex-1 min-w-28 rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer select-none ${
        isActive
          ? `bg-linear-to-b ${preset.gradient} border-amber-400/70 ring-1 ring-amber-400/30 shadow-lg shadow-black/60`
          : "border-zinc-700/80 bg-[#0f111e] hover:border-zinc-500 hover:bg-[#141626] text-zinc-300 shadow-inner"
      }`}
    >
      {isActive && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-md ring-2 ring-[#141626]">
          ✓
        </span>
      )}
      <div className="text-2xl mb-1.5 select-none drop-shadow-sm">{preset.emoji}</div>
      <p className={`text-xs font-bold leading-tight ${isActive ? "text-white" : "text-zinc-200"}`}>
        {preset.label}
      </p>
      <p
        className={`text-[10px] leading-relaxed mt-1 line-clamp-2 ${
          isActive ? "text-zinc-300" : "text-zinc-400"
        }`}
      >
        {preset.desc}
      </p>
    </button>
  );
}

export default function ColorPresets({ activePreset, onApplyPreset }) {
  const currentLabel =
    activePreset === "custom"
      ? "Custom"
      : COLOR_PRESETS.find((p) => p.id === activePreset)?.label ?? "Custom";

  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">Presets</h3>
            <p className="text-xs text-zinc-300 font-normal mt-0.5">
              One-click filmic & utility color grades — click to calibrate all channels
            </p>
          </div>
        </div>
        <span className="rounded-full border border-zinc-700/80 bg-[#0f111e] px-3 py-1 text-xs text-zinc-300 font-sans">
          {currentLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {COLOR_PRESETS.map((preset) => (
          <PresetChip
            key={preset.id}
            preset={preset}
            isActive={activePreset === preset.id}
            onClick={onApplyPreset}
          />
        ))}
      </div>
    </div>
  );
}
