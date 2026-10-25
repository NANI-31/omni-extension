import { RotateCcw, Layers } from "lucide-react";
import { fillPct } from "./colorData";

export default function ColorSlider({ filter, value, onChange, onReset }) {
  const isDefault = value === filter.default;
  const fp = fillPct(value, filter.min, filter.max);

  return (
    <div className="group rounded-xl bg-[#0f111e] border border-zinc-700/80 p-5 transition-all duration-200 shadow-inner hover:border-zinc-600">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0">
          <div
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700/80 text-lg select-none shadow-sm"
            style={{
              background: `${filter.accent}18`,
              boxShadow: `0 0 16px ${filter.accent}20`,
            }}
          >
            {filter.icon}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-white text-sm leading-tight">{filter.label}</h4>
            <p className="mt-0.5 text-xs text-zinc-300 leading-relaxed font-normal">
              {filter.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="rounded-lg px-2.5 py-1 text-xs font-sans font-extrabold tabular-nums border shadow-sm"
            style={{
              background: `${filter.accent}18`,
              color: filter.accent,
              borderColor: `${filter.accent}40`,
            }}
          >
            {value}
            {filter.unit}
          </span>
          {!isDefault && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-sans font-bold text-zinc-300 hover:text-white bg-[#141626] hover:bg-zinc-700 border border-zinc-700/80 px-2 py-1 rounded-lg transition-colors shadow-sm cursor-pointer"
              title={`Reset to default (${filter.default}${filter.unit})`}
              aria-label={`Reset ${filter.label}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Custom Range Slider */}
      <div className="relative flex items-center" style={{ height: "20px" }}>
        {/* Background rail */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-zinc-800" />
        {/* Filled portion */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all duration-75 pointer-events-none"
          style={{
            width: `${fp}%`,
            background: `linear-gradient(90deg, ${filter.trackColor}90, ${filter.trackColor})`,
            boxShadow: `0 0 10px ${filter.trackColor}55`,
          }}
        />
        {/* Glow */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full blur-sm pointer-events-none transition-all duration-75"
          style={{ width: `${fp}%`, background: filter.accent, opacity: 0.25 }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 pointer-events-none transition-all duration-75 z-10"
          style={{
            left: `calc(${fp}% - 8px)`,
            borderColor: filter.accent,
            background: "#18181b",
            boxShadow: `0 0 12px ${filter.accent}70, 0 2px 6px rgba(0,0,0,0.8)`,
          }}
        />
        {/* Invisible native input */}
        <input
          type="range"
          min={filter.min}
          max={filter.max}
          step="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full cursor-pointer z-20 opacity-0"
          style={{ height: "100%", margin: 0, padding: 0 }}
          aria-label={filter.label}
        />
      </div>

      {/* Labels */}
      <div className="mt-2.5 flex justify-between text-[10px] text-zinc-400 font-sans">
        <span>
          {filter.min}
          {filter.unit}
        </span>
        <span className="text-zinc-500 font-medium">
          Default: {filter.default}
          {filter.unit}
        </span>
        <span>
          {filter.max}
          {filter.unit}
        </span>
      </div>

      {filter.engine && (
        <div className="mt-2.5 pt-2 border-t border-zinc-700/60">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-sans font-semibold text-zinc-400 bg-[#141626] border border-zinc-700/70 px-2 py-0.5 rounded-md">
            <Layers className="w-3 h-3 text-amber-400/80" />
            {filter.engine}
          </span>
        </div>
      )}
    </div>
  );
}
