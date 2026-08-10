import React, { useState } from "react";

export default function YoutubeAdskipSettings() {
  const [autoSkip, setAutoSkip] = useState(true);
  const [accelerateAds, setAccelerateAds] = useState(true);
  const [hideBanners, setHideBanners] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      {/* Configuration Column (7 cols) */}
      <div className="md:col-span-7 space-y-6">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📺</span>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                Ad Skip Config
              </h3>
            </div>
            <span className="text-xs bg-zinc-900/80 text-zinc-500 border border-zinc-800 px-2.5 py-1 rounded-md font-mono select-none uppercase font-bold tracking-wider">
              Roadmap Feature
            </span>
          </div>

          {/* Toggle Option: Auto-Skip Buttons */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>⚡</span> Auto-Click "Skip Ad"
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Instantly clicks YouTube's skip button as soon as it becomes active on the video.
              </p>
            </div>
            <button
              onClick={() => setAutoSkip(!autoSkip)}
              className={`w-9 h-5 rounded-full transition-all relative shrink-0 cursor-pointer ${
                autoSkip
                  ? "bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                  : "bg-zinc-700 border border-zinc-650"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all ${
                  autoSkip ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Toggle Option: Ad Acceleration */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-zinc-850/40 py-1">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>⏩</span> Ad Speed Acceleration (16x)
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Accelerates ads to 16x speed and mutes their audio automatically, bypassing long wait cycles.
              </p>
            </div>
            <button
              onClick={() => setAccelerateAds(!accelerateAds)}
              className={`w-9 h-5 rounded-full transition-all relative shrink-0 cursor-pointer ${
                accelerateAds
                  ? "bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                  : "bg-zinc-700 border border-zinc-650"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all ${
                  accelerateAds ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Toggle Option: Banner Remover */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-zinc-850/40 py-1">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>🚫</span> Hide In-Video Banners
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Automatically hides visual overlay promotional banner elements and product popups.
              </p>
            </div>
            <button
              onClick={() => setHideBanners(!hideBanners)}
              className={`w-9 h-5 rounded-full transition-all relative shrink-0 cursor-pointer ${
                hideBanners
                  ? "bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                  : "bg-zinc-700 border border-zinc-650"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all ${
                  hideBanners ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tutorial Block */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 flex gap-3.5 items-start">
          <span className="text-lg bg-zinc-950/60 p-2 rounded-lg border border-zinc-850 select-none leading-none shrink-0 text-red-400">
            💡
          </span>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              Bypasser Information
            </h4>
            <ul className="list-disc list-inside text-xs text-zinc-455 space-y-1 mt-1 leading-relaxed">
              <li>Automatically detects HTML5 player ad-state elements.</li>
              <li>Acceleration logic speeds up unskippable promotional blocks.</li>
              <li>Does not require network level block lists, keeping extension light.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Column (5 cols) */}
      <div className="md:col-span-5 space-y-6">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4 shadow-2xl backdrop-blur-md text-center py-8">
          <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl mx-auto animate-bounce select-none text-red-500/80">
            📺
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-zinc-200">Ad Skipper System</h3>
            <p className="text-xs text-zinc-450 leading-relaxed max-w-xs mx-auto">
              Automates the skipping of video promotions by increasing player speed to 16x and triggering clicks immediately, preserving layout performance.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono select-none">
            In Active Design
          </div>
        </div>
      </div>
    </div>
  );
}
