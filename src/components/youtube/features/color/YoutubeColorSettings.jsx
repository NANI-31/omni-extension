import { useMemo } from "react";
import { Palette, HelpCircle } from "lucide-react";
import { COLOR_PRESETS, CSS_FILTERS, TONE_FILTERS } from "./colorData";
import ColorSlider from "./ColorSlider";
import ColorPresets from "./ColorPresets";
import ToneCurveControls from "./ToneCurveControls";
import ColorViewport from "./ColorViewport";

export default function YoutubeColorSettings({
  // CSS filters
  filterContrast,
  handleFilterContrastChange,
  filterSaturation,
  handleFilterSaturationChange,
  filterTemperature,
  handleFilterTemperatureChange,
  filterEyeProtection,
  handleFilterEyeProtectionChange,
  // Tone / LUT filters
  filterHighlights,
  handleFilterHighlightsChange,
  filterShadows,
  handleFilterShadowsChange,
  filterWhites,
  handleFilterWhitesChange,
  filterBlacks,
  handleFilterBlacksChange,
  // Preset
  onApplyPreset,
  onResetAll,
}) {
  const values = {
    ytFilterContrast: filterContrast,
    ytFilterSaturation: filterSaturation,
    ytFilterTemperature: filterTemperature,
    ytFilterEyeProtection: filterEyeProtection,
    ytFilterHighlights: filterHighlights,
    ytFilterShadows: filterShadows,
    ytFilterWhites: filterWhites,
    ytFilterBlacks: filterBlacks,
  };

  const handlers = {
    ytFilterContrast: handleFilterContrastChange,
    ytFilterSaturation: handleFilterSaturationChange,
    ytFilterTemperature: handleFilterTemperatureChange,
    ytFilterEyeProtection: handleFilterEyeProtectionChange,
    ytFilterHighlights: handleFilterHighlightsChange,
    ytFilterShadows: handleFilterShadowsChange,
    ytFilterWhites: handleFilterWhitesChange,
    ytFilterBlacks: handleFilterBlacksChange,
  };

  const ALL_FILTERS = [...CSS_FILTERS, ...TONE_FILTERS];

  // Detect active preset by exact value match
  const activePreset = useMemo(
    () =>
      COLOR_PRESETS.find(
        (p) =>
          p.values.ytFilterContrast === filterContrast &&
          p.values.ytFilterSaturation === filterSaturation &&
          p.values.ytFilterTemperature === filterTemperature &&
          p.values.ytFilterEyeProtection === filterEyeProtection &&
          p.values.ytFilterHighlights === filterHighlights &&
          p.values.ytFilterShadows === filterShadows &&
          p.values.ytFilterWhites === filterWhites &&
          p.values.ytFilterBlacks === filterBlacks
      )?.id ?? "custom",
    [
      filterContrast,
      filterSaturation,
      filterTemperature,
      filterEyeProtection,
      filterHighlights,
      filterShadows,
      filterWhites,
      filterBlacks,
    ]
  );

  const hasChanges = ALL_FILTERS.some((f) => values[f.key] !== f.default);
  const activeCount = ALL_FILTERS.filter((f) => values[f.key] !== f.default).length;

  return (
    <div className="space-y-6">
      {/* ── Live Viewport Header Card ── */}
      <ColorViewport
        values={values}
        activeCount={activeCount}
        hasChanges={hasChanges}
        onResetAll={onResetAll}
        activePreset={activePreset}
        allFilters={ALL_FILTERS}
      />

      {/* ── Presets Card ── */}
      <ColorPresets
        activePreset={activePreset}
        onApplyPreset={onApplyPreset}
      />

      {/* ── Tone Controls (SVG Component Transfer) ── */}
      <ToneCurveControls
        values={values}
        handlers={handlers}
      />

      {/* ── Color Controls (CSS Filters) ── */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/35 shadow-sm">
              <Palette className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Color Controls
              </h3>
              <p className="text-xs text-zinc-300 font-normal mt-0.5">
                CSS filter functions — contrast, saturation, temperature, eye protection
              </p>
            </div>
          </div>
          <span className="rounded-full border border-zinc-700/80 bg-[#0f111e] px-3 py-1 text-xs text-zinc-300 font-sans">
            4 CSS Filters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CSS_FILTERS.map((filter) => (
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

      {/* ── Browser Hardware & CORS Constraints ── */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/35 shadow-sm">
              <HelpCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Browser Hardware & CORS Constraints
              </h3>
              <p className="text-xs text-zinc-300 font-normal mt-0.5">
                Architectural limits on client-side pixel manipulation
              </p>
            </div>
          </div>
          <span className="rounded-full border border-zinc-700/80 bg-[#0f111e] px-3 py-1 text-xs text-zinc-300 font-sans">
            Security Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              label: "Vibrance",
              icon: "✨",
              reason:
                "Smart saturation requires per-pixel luminance calculation — use the Saturation slider as an ultra-fast hardware approximation.",
            },
            {
              label: "Sharpness",
              icon: "🔍",
              reason:
                "Convolution kernel (unsharp mask) requires raw HTML5 canvas pixel access — blocked by cross-origin iframe security on YouTube.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-zinc-700/80 bg-[#0f111e] p-4.5 shadow-inner"
            >
              <div className="text-2xl mb-2 select-none">{item.icon}</div>
              <p className="text-xs font-bold text-white">{item.label}</p>
              <p className="text-xs text-zinc-300 leading-relaxed mt-1">{item.reason}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-700/70 pt-3">
          <p className="text-xs leading-relaxed text-zinc-300">
            <span className="text-white font-bold">
              Highlights, Shadows, Whites, and Blacks
            </span>{" "}
            are implemented via GPU-accelerated SVG{" "}
            <code className="text-zinc-200 bg-[#0f111e] px-1.5 py-0.5 rounded border border-zinc-700/70 font-sans text-[10px]">
              feComponentTransfer
            </code>{" "}
            — a 5-point tone curve executed directly inside the Chrome graphics compositor
            pipeline with zero CORS penalties and zero frame drops.
          </p>
        </div>
      </div>
    </div>
  );
}
