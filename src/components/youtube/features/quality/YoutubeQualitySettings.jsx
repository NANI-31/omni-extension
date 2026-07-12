import React, { useState } from "react";

export default function YoutubeQualitySettings() {
  const [preferredQuality, setPreferredQuality] = useState("auto-max");
  const [force60fps, setForce60fps] = useState(true);
  const [disableAmbient, setDisableAmbient] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      {/* Configuration Column (7 cols) */}
      <div className="md:col-span-7 space-y-6">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎬</span>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                Resolution Locker Config
              </h3>
            </div>
            <span className="text-xs bg-zinc-900/80 text-zinc-500 border border-zinc-800 px-2.5 py-1 rounded-md font-mono select-none uppercase font-bold tracking-wider">
              Roadmap Feature
            </span>
          </div>

          {/* Dropdown Select Option: Quality */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>📺</span> Target Playback Quality
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Forces the player to load videos at the selected resolution automatically upon page load.
              </p>
            </div>
            <select
              value={preferredQuality}
              onChange={(e) => setPreferredQuality(e.target.value)}
              className="bg-zinc-950/80 border border-zinc-850 rounded-lg px-2.5 py-1 text-sm text-zinc-255 focus:outline-none focus:border-red-500/50 transition-colors cursor-pointer"
            >
              <option value="auto-max">Highest Available</option>
              <option value="4k">4K / 2160p</option>
              <option value="1440p">1440p / QHD</option>
              <option value="1080p">1080p / Full HD</option>
              <option value="720p">720p / HD</option>
            </select>
          </div>

          {/* Toggle Option: Force High FPS */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-zinc-850/40 py-1">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>🔄</span> Prefer High Framerates (60 FPS)
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Attempts to fetch 60fps streams over standard 30fps versions whenever supported.
              </p>
            </div>
            <button
              onClick={() => setForce60fps(!force60fps)}
              className={`w-9 h-5 rounded-full transition-all relative shrink-0 cursor-pointer ${
                force60fps
                  ? "bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                  : "bg-zinc-700 border border-zinc-650"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${
                  force60fps ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Toggle Option: Disable Ambient Glow */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-zinc-850/40 py-1">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>💡</span> Block Ambient Mode Glow
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Disables YouTube's background ambient glow shader to dramatically lower CPU and graphics memory usage.
              </p>
            </div>
            <button
              onClick={() => setDisableAmbient(!disableAmbient)}
              className={`w-9 h-5 rounded-full transition-all relative shrink-0 cursor-pointer ${
                disableAmbient
                  ? "bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                  : "bg-zinc-700 border border-zinc-650"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${
                  disableAmbient ? "right-1" : "left-1"
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
              Rendering Information
            </h4>
            <ul className="list-disc list-inside text-xs text-zinc-455 space-y-1 mt-1 leading-relaxed">
              <li>Locker hooks directly into YouTube's JS player quality API.</li>
              <li>Saves user bandwidth configurations on slow network networks.</li>
              <li>Prevents YouTube from fluctuating resolution during buffers.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Column (5 cols) */}
      <div className="md:col-span-5 space-y-6">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4 shadow-2xl backdrop-blur-md text-center py-8">
          <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl mx-auto animate-bounce select-none text-red-500/80">
            🎬
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-zinc-200">Quality Lock System</h3>
            <p className="text-xs text-zinc-450 leading-relaxed max-w-xs mx-auto">
              Forces consistent high-definition streams and blocks automatic quality degradation when YouTube detects temporary drops in broadband connection speed.
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
