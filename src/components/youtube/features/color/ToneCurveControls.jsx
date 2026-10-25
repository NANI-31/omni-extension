import { Sliders } from "lucide-react";
import ColorSlider from "./ColorSlider";
import { TONE_FILTERS } from "./colorData";

export default function ToneCurveControls({ values, handlers }) {
  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/35 shadow-sm">
            <Sliders className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">Tone Controls</h3>
            <p className="text-xs text-zinc-300 font-normal mt-0.5">
              SVG feComponentTransfer — GPU-accelerated 5-point tone curve at compositor level
            </p>
          </div>
        </div>
        <span className="rounded-full border border-zinc-700/80 bg-[#0f111e] px-3 py-1 text-xs text-zinc-300 font-sans">
          4 Tone Channels
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TONE_FILTERS.map((filter) => (
          <ColorSlider
            key={filter.key}
            filter={filter}
            value={values[filter.key]}
            onChange={handlers[filter.key]}
            onReset={() => handlers[filter.key](filter.default)}
          />
        ))}
      </div>
    </div>
  );
}
