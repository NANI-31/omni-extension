import { Volume2, Sliders, Shield, Music, Ban, HelpCircle, Sparkles } from "lucide-react";
import Toggle from "../../../ui/Toggle";

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
      {/* Main Configuration Card */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-zinc-700/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
              <Volume2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Volume Scroll Control
              </h3>
              <p className="text-xs text-zinc-300 font-normal mt-0.5">
                Customize player scrollwheel sensitivity, caps, and HUD display
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${volumeControl ? "bg-red-400 opacity-75" : "bg-zinc-500"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${volumeControl ? "bg-red-500" : "bg-zinc-600"}`}></span>
            </span>
            <span className="text-[10px] bg-red-500/20 text-red-200 border border-red-500/35 px-2.5 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
              {volumeControl ? "Active" : "Disabled"}
            </span>
          </div>
        </div>

        {/* Row 1: Mouse Scroll Volume Toggle */}
        <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-red-400" />
                <span>Mouse Wheel Volume Control</span>
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                volumeControl
                  ? "border-red-500/40 bg-red-500/20 text-red-300"
                  : "border-zinc-700/80 bg-[#141626] text-zinc-400"
              }`}>
                {volumeControl ? "Enabled" : "Paused"}
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-xl">
              Adjust video volume instantly by hovering anywhere over the video player and rotating your mouse wheel. Middle click toggles mute.
            </p>
          </div>
          <div className="shrink-0">
            <Toggle enabled={volumeControl} onChange={handleToggleVolumeControl} />
          </div>
        </div>

        {/* Sensitivity Step (Nested Well) */}
        {volumeControl && (
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-red-400" />
                  <span>Scroll Step Sensitivity</span>
                </p>
                <p className="text-xs text-zinc-300 font-normal">
                  Percentage volume shift applied per scrollwheel notch.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#141626] border border-zinc-700/80 px-3 py-1 rounded-xl shadow-inner focus-within:border-red-500/50 transition-colors">
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={volumeStep}
                  onChange={handleStepChange}
                  className="w-8 text-center text-xs font-sans font-bold text-white focus:outline-none"
                />
                <span className="text-[11px] text-zinc-400 font-bold">%</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] text-zinc-400 font-sans">1%</span>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={volumeStep}
                onChange={handleStepChange}
                className="flex-1 accent-red-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-red-400 transition-colors"
              />
              <span className="text-[10px] text-zinc-400 font-sans">25%</span>
            </div>
          </div>
        )}

        {/* Row 2: Premium HUD Overlay Toggle */}
        <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-400" />
                <span>Premium Glassmorphic HUD Overlay</span>
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                showHUD
                  ? "border-red-500/40 bg-red-500/20 text-red-300"
                  : "border-zinc-700/80 bg-[#141626] text-zinc-400"
              }`}>
                {showHUD ? "Visible" : "Hidden"}
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-xl">
              Displays a modern glassmorphic on-screen percentage indicator in the center of the video viewport while scrolling.
            </p>
          </div>
          <div className="shrink-0">
            <Toggle enabled={showHUD} onChange={handleToggleShowHUD} />
          </div>
        </div>

        {/* Row 3: Maximum Volume Cap */}
        <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 space-y-3 shadow-inner">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span>Maximum Volume Limit</span>
              </p>
              <p className="text-xs text-zinc-300 font-normal">
                Caps the maximum achievable player volume to protect hearing from loud spikes.
              </p>
            </div>
            <span className="text-xs font-sans font-bold text-red-200 bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/35 shadow-sm">
              {maxVolumeCap}% Cap
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[10px] text-zinc-400 font-sans">50%</span>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={maxVolumeCap}
              onChange={handleMaxVolumeChange}
              className="flex-1 accent-red-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-red-400 transition-colors"
            />
            <span className="text-[10px] text-zinc-400 font-sans">100%</span>
          </div>
        </div>

        {/* Row 4: Default Startup Volume Toggle */}
        <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-red-400" />
                <span>Default Startup Volume</span>
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                defaultVolumeEnabled
                  ? "border-red-500/40 bg-red-500/20 text-red-300"
                  : "border-zinc-700/80 bg-[#141626] text-zinc-400"
              }`}>
                {defaultVolumeEnabled ? `${defaultVolume}% Fixed` : "YouTube Native"}
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-xl">
              Forces a fixed startup volume level whenever a new YouTube video player begins playback.
            </p>
          </div>
          <div className="shrink-0">
            <Toggle enabled={defaultVolumeEnabled} onChange={handleToggleDefaultVolumeEnabled} />
          </div>
        </div>

        {/* Startup Volume Slider (Nested Well) */}
        {defaultVolumeEnabled && (
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold text-white">Startup Level</p>
              <span className="text-xs font-sans font-bold text-red-200 bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/35 shadow-sm">
                {defaultVolume}%
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] text-zinc-400 font-sans">0%</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={defaultVolume}
                onChange={handleDefaultVolumeChange}
                className="flex-1 accent-red-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-red-400 transition-colors"
              />
              <span className="text-[10px] text-zinc-400 font-sans">100%</span>
            </div>
          </div>
        )}

        {/* Row 5: Custom Site Blacklist */}
        <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 space-y-3 shadow-inner">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-red-400" />
              <span>Custom Domain Blacklist</span>
            </p>
            <p className="text-xs text-zinc-300 font-normal">
              Disable mouse wheel volume interception on specific domains (one hostname per line).
            </p>
          </div>
          <textarea
            value={blacklistDomains}
            onChange={handleBlacklistDomainsChange}
            placeholder="udemy.com&#10;netflix.com&#10;coursera.org"
            rows="3"
            className="w-full bg-[#141626] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-red-500/60 font-sans transition-colors placeholder:text-zinc-600 resize-y shadow-inner"
          />
        </div>
      </div>

      {/* Quick Tutorial Callout Panel */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5.5 shadow-xl shadow-black/60 flex gap-4 items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm mt-0.5">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Quick User Guide
          </h4>
          <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Open YouTube, Udemy, or any website playing HTML5 video.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Hover your mouse cursor anywhere over the active player window.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Rotate scroll wheel <b>Up</b> or <b>Down</b> to adjust volume smoothly.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
              <span><b>Middle click</b> anywhere on the player to toggle instant mute states.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
