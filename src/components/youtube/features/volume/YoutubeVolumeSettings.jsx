import React from "react";

export default function YoutubeVolumeSettings({
  volumeControl,
  handleToggleVolumeControl,
  volumeStep,
  handleStepChange,
  showHUD,
  handleToggleShowHUD,
  maxVolumeCap,
  handleMaxVolumeChange,
  defaultVolumeEnabled,
  handleToggleDefaultVolumeEnabled,
  defaultVolume,
  handleDefaultVolumeChange,
  blacklistDomains,
  handleBlacklistDomainsChange
}) {
  return (
    <div className="space-y-6">
      <div className="bg-linear-to-tr from-black rounded-2xl p-6 space-y-6 backdrop-blur-xl relative overflow-hidden">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/10">⚙️</span>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-200 uppercase tracking-widest">
                Volume Control Config
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Customize global video scroll settings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Active
            </span>
          </div>
        </div>

        {/* Row 1: Mouse Scroll volume */}
        <div className="flex items-center justify-between gap-6 py-2 hover:bg-zinc-850/10 rounded-lg p-2 -mx-2 transition-colors">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span className="text-red-400 text-base">🔊</span> Mouse Wheel Volume Control
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              Adjust video volume instantly by hovering over any player window and turning the scroll wheel.
            </p>
          </div>
          <button
            onClick={handleToggleVolumeControl}
            className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 cursor-pointer ${
              volumeControl
                ? "bg-linear-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.45)]"
                : "bg-zinc-800 border border-zinc-700 hover:bg-zinc-750"
            }`}
          >
            <span
              className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-all duration-300 shadow-md ${
                volumeControl ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Row 1.5: Sensitivity Step */}
        {volumeControl && (
          <div className="flex flex-col gap-3 pl-6 border-l-2 border-red-500/25 py-2 transition-all duration-300">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-zinc-300">Volume Step Sensitivity</p>
                <p className="text-xs text-zinc-500 leading-normal">
                  Sets the percentage change applied per wheel scroll notch.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-zinc-950/95 border border-zinc-800 px-2.5 py-1 rounded-xl shadow-inner focus-within:border-red-500/40 transition-colors">
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={volumeStep}
                  onChange={handleStepChange}
                  className="w-10 text-center text-sm font-mono font-bold text-zinc-200 focus:outline-none"
                />
                <span className="text-[11px] text-zinc-500 font-bold">%</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-600 font-mono">1%</span>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={volumeStep}
                onChange={handleStepChange}
                className="flex-1 accent-red-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-red-400 transition-colors"
              />
              <span className="text-[10px] text-zinc-600 font-mono">25%</span>
            </div>
          </div>
        )}

        {/* Row 2: HUD Overlay */}
        <div className="flex items-center justify-between gap-6 py-2 border-t border-zinc-850/50 hover:bg-zinc-850/10 rounded-lg p-2 -mx-2 pt-4 transition-colors">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span className="text-red-400 text-base">🎚️</span> Premium HUD Overlay
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              Shows a modern glassmorphic visual indicator displaying volume percentage in the center of the video screen.
            </p>
          </div>
          <button
            onClick={handleToggleShowHUD}
            className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 cursor-pointer ${
              showHUD
                ? "bg-linear-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.45)]"
                : "bg-zinc-800 border border-zinc-700 hover:bg-zinc-750"
            }`}
          >
            <span
              className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-all duration-300 shadow-md ${
                showHUD ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Row 3: Maximum Volume Cap */}
        <div className="flex flex-col gap-3 py-2 border-t border-zinc-850/50 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span className="text-red-400 text-base">🛡️</span> Maximum Volume Limit
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                Caps the maximum possible player volume to protect your hearing from loud video spikes.
              </p>
            </div>
            <span className="text-xs font-mono font-extrabold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 shadow-sm">
              {maxVolumeCap}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-600 font-mono">50%</span>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={maxVolumeCap}
              onChange={handleMaxVolumeChange}
              className="flex-1 accent-red-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-red-400 transition-colors"
            />
            <span className="text-[10px] text-zinc-600 font-mono">100%</span>
          </div>
        </div>

        {/* Row 4: Startup Volume */}
        <div className="flex items-center justify-between gap-6 py-2 border-t border-zinc-850/50 hover:bg-zinc-850/10 rounded-lg p-2 -mx-2 pt-4 transition-colors">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span className="text-red-400 text-base">🎵</span> Default Startup Volume
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              Forces a fixed startup volume when loading a new YouTube video player.
            </p>
          </div>
          <button
            onClick={handleToggleDefaultVolumeEnabled}
            className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 cursor-pointer ${
              defaultVolumeEnabled
                ? "bg-linear-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.45)]"
                : "bg-zinc-800 border border-zinc-700 hover:bg-zinc-750"
            }`}
          >
            <span
              className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-all duration-300 shadow-md ${
                defaultVolumeEnabled ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Row 4.5: Startup Volume Slider */}
        {defaultVolumeEnabled && (
          <div className="flex flex-col gap-3 pl-6 border-l-2 border-red-500/25 py-2 transition-all duration-300 animate-fadeIn">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold text-zinc-300">Startup Volume Level</p>
              <span className="text-xs font-mono font-extrabold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 shadow-sm">
                {defaultVolume}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-600 font-mono">0%</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={defaultVolume}
                onChange={handleDefaultVolumeChange}
                className="flex-1 accent-red-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-red-400 transition-colors"
              />
              <span className="text-[10px] text-zinc-600 font-mono">100%</span>
            </div>
          </div>
        )}

        {/* Row 5: Custom Site Blacklist */}
        <div className="flex flex-col gap-3 py-2 border-t border-zinc-850/50 pt-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span className="text-red-400 text-base">🚫</span> Custom Site Blacklist
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Disable mouse wheel volume control on specific domains (one hostname per line).
            </p>
          </div>
          <textarea
            value={blacklistDomains}
            onChange={handleBlacklistDomainsChange}
            placeholder="udemy.com&#10;netflix.com"
            rows="3"
            className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/40 font-mono transition-colors placeholder:text-zinc-700 resize-y shadow-inner scrollbar-thin scrollbar-thumb-zinc-800"
          />
        </div>
      </div>

      {/* Quick Tutorial Callout Panel */}
      <div className="bg-red-500/2 border-l-4 border-l-red-500/80 border border-zinc-800/45 rounded-r-2xl p-5 flex gap-4 items-start shadow-md backdrop-blur-sm">
        <span className="text-xl bg-red-500/10 p-2.5 rounded-xl border border-red-500/10 select-none leading-none shrink-0 text-red-400">
          💡
        </span>
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-zinc-200 uppercase tracking-widest">
            Quick User Guide
          </h4>
          <ul className="text-xs text-zinc-400 space-y-2 mt-1 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
              <span>Open YouTube, Udemy, or any site playing HTML5 video.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
              <span>Hover your cursor over the active player window.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
              <span>Scroll wheel <b>Up</b> or <b>Down</b> to adjust volume.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
              <span><b>Middle click</b> anywhere on the player to toggle mute states.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
