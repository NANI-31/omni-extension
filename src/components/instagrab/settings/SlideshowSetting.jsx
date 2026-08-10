import React from "react";
import { useSettings } from "../../../context/SettingsContext.jsx";
import ToggleCard from "./ToggleCard.jsx";

export default function SlideshowSetting() {
  const {
    compileSlidesAsVideo,
    setCompileSlidesAsVideo,
    slideDurationSecs,
    setSlideDurationSecs,
    slideshowEncoder,
    setSlideshowEncoder,
    slideshowQuality,
    setSlideshowQuality,
  } = useSettings();

  return (
    <div className="space-y-3">
      <ToggleCard
        title="Compile Slides as Video"
        description="Merge image-only carousels into a single video slideshow instead of downloading individual files."
        checked={compileSlidesAsVideo}
        onChange={setCompileSlidesAsVideo}
      />

      {compileSlidesAsVideo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* Slide duration slider */}
          <div className="flex items-center gap-3 bg-[#161824] border border-zinc-800 rounded-xl px-4 py-3 shadow-md">
            <span className="text-xs text-white font-bold uppercase tracking-wider whitespace-nowrap">Slide Duration</span>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={slideDurationSecs}
              onChange={(e) => setSlideDurationSecs(parseFloat(e.target.value))}
              className="flex-1 accent-fuchsia-500 cursor-pointer"
            />
            <span className="text-xs font-extrabold text-fuchsia-400 w-10 text-right tabular-nums">{slideDurationSecs}s</span>
          </div>

          {/* Encoder selector */}
          <div className="bg-[#161824] border border-zinc-800 rounded-xl p-3.5 space-y-2.5 shadow-md">
            <span className="text-xs text-white font-bold uppercase tracking-wider block">Output Format</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSlideshowEncoder('canvas')}
                className={`flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  slideshowEncoder === 'canvas'
                    ? 'border-fuchsia-500 bg-fuchsia-600/25 text-white shadow-md shadow-fuchsia-600/20'
                    : 'border-zinc-700/80 bg-[#1b1e2e] text-zinc-300 hover:border-zinc-600 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">🎞️</span>
                <span>WebM</span>
                <span className="text-[9.5px] font-medium opacity-75">Canvas · Fast</span>
              </button>

              <button
                type="button"
                onClick={() => setSlideshowEncoder('ffmpeg')}
                className={`flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  slideshowEncoder === 'ffmpeg'
                    ? 'border-fuchsia-500 bg-fuchsia-600/25 text-white shadow-md shadow-fuchsia-600/20'
                    : 'border-zinc-700/80 bg-[#1b1e2e] text-zinc-300 hover:border-zinc-600 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">🎬</span>
                <span>MP4</span>
                <span className="text-[9.5px] font-medium opacity-75">FFmpeg · Best compat</span>
              </button>
            </div>

            {slideshowEncoder === 'ffmpeg' && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between text-xs text-zinc-300 font-bold uppercase tracking-wider">
                  <span>Video Quality (CRF)</span>
                  <span className="text-fuchsia-400 normal-case font-extrabold text-xs">
                    {slideshowQuality === 18 ? 'Lossless (18)' :
                     slideshowQuality === 24 ? 'Optimal (24)' :
                     slideshowQuality === 28 ? 'Min Size (28)' :
                     `Custom (${slideshowQuality})`}
                  </span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="28"
                  step="1"
                  value={slideshowQuality}
                  onChange={(e) => setSlideshowQuality(parseInt(e.target.value, 10))}
                  className="w-full accent-fuchsia-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                  <span>HIGH QUALITY (LARGE MB)</span>
                  <span>MIN SIZE (SMALL MB)</span>
                </div>
                <p className="text-[10px] text-amber-300 font-medium leading-relaxed pt-1">
                  ⚡ First use downloads ~31 MB WASM core. Subsequent encodes are fast.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
