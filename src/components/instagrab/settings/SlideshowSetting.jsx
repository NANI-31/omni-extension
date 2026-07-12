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
    isChromeExtension
  } = useSettings();

  return (
    <>
      <ToggleCard
        title="Compile Slides as Video"
        description="Merge image-only carousels into a single video slideshow instead of downloading individual files."
        checked={compileSlidesAsVideo}
        onChange={setCompileSlidesAsVideo}
        activeColorClass="peer-checked:bg-violet-500"
      />

      {/* Controls visible only when Compile Slides is ON */}
      {compileSlidesAsVideo && (
        <div className="space-y-2 mt-2">
          {/* Slide duration slider */}
          <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider whitespace-nowrap">Slide Duration</span>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={slideDurationSecs}
              onChange={(e) => setSlideDurationSecs(parseFloat(e.target.value))}
              className="flex-1 accent-violet-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-violet-400 w-10 text-right tabular-nums">{slideDurationSecs}s</span>
          </div>

          {/* Encoder selector */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 space-y-1.5">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Output Format</span>
            <div className="flex gap-2">
              {/* Canvas / WebM option */}
              <button
                type="button"
                onClick={() => setSlideshowEncoder('canvas')}
                className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md border text-[10px] font-semibold transition-all cursor-pointer ${
                  slideshowEncoder === 'canvas'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                <span className="text-base leading-none">🎞️</span>
                <span>WebM</span>
                <span className="text-[8px] font-normal opacity-70">Canvas · Fast</span>
              </button>
              {/* FFmpeg / MP4 option */}
              <button
                type="button"
                onClick={() => setSlideshowEncoder('ffmpeg')}
                className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md border text-[10px] font-semibold transition-all cursor-pointer ${
                  slideshowEncoder === 'ffmpeg'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                <span className="text-base leading-none">🎬</span>
                <span>MP4</span>
                <span className="text-[8px] font-normal opacity-70">FFmpeg · Best compat</span>
              </button>
            </div>

            {/* Video Quality (CRF) Slider — Visible only when FFmpeg/MP4 is enabled */}
            {slideshowEncoder === 'ffmpeg' && (
              <div className="space-y-1.5 pt-1.5 border-t border-zinc-800/50">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  <span>Video Quality (CRF)</span>
                  <span className="text-violet-400 normal-case font-bold tracking-normal text-xs">
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
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-zinc-500 font-semibold">
                  <span>HIGH QUALITY (LARGE MB)</span>
                  <span>MIN SIZE (SMALL MB)</span>
                </div>
              </div>
            )}

            {slideshowEncoder === 'ffmpeg' && (
              <p className="text-[9px] text-amber-400/70 leading-relaxed pt-0.5">
                ⚡ First use downloads ~31 MB WASM core. Subsequent encodes are fast.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
