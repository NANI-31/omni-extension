import { useState, useEffect } from "react";
import {
  Film,
  Monitor,
  Activity,
  Cpu,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Eye,
  Check
} from "lucide-react";
import Toggle from "../../../ui/Toggle";

const RESOLUTION_OPTIONS = [
  { id: "auto-max", label: "Auto (Max)", res: "Dynamic", badge: "Smart", desc: "Always requests the highest stream available" },
  { id: "4k", label: "4K UHD", res: "2160p", badge: "UHD", desc: "3840 x 2160 ultra high-definition clarity" },
  { id: "1440p", label: "1440p QHD", res: "1440p", badge: "2K", desc: "2560 x 1440 quad high-definition" },
  { id: "1080p", label: "1080p FHD", res: "1080p", badge: "1080p", desc: "1920 x 1080 crisp standard HD resolution" },
  { id: "720p", label: "720p HD", res: "720p", badge: "720p", desc: "1280 x 720 balance of quality and data" },
  { id: "480p", label: "480p SD", res: "480p", badge: "Saver", desc: "854 x 480 bandwidth saving stream" }
];

export default function YoutubeQualitySettings() {
  const [preferredQuality, setPreferredQuality] = useState("1080p");
  const [force60fps, setForce60fps] = useState(true);
  const [disableAmbient, setDisableAmbient] = useState(true);
  const [showStatsForNerds, setShowStatsForNerds] = useState(false);

  // Load from chrome.storage.local
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ["ytPreferredQuality", "ytForce60fps", "ytDisableAmbient"],
        (result) => {
          if (result.ytPreferredQuality !== undefined) setPreferredQuality(result.ytPreferredQuality);
          if (result.ytForce60fps !== undefined) setForce60fps(result.ytForce60fps);
          if (result.ytDisableAmbient !== undefined) setDisableAmbient(result.ytDisableAmbient);
        }
      );
    }
  }, []);

  const updateSetting = (key, val) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: val });
    }
  };

  const handleQualityChange = (val) => {
    setPreferredQuality(val);
    updateSetting("ytPreferredQuality", val);
  };

  const handleToggleForce60fps = () => {
    const next = !force60fps;
    setForce60fps(next);
    updateSetting("ytForce60fps", next);
  };

  const handleToggleDisableAmbient = () => {
    const next = !disableAmbient;
    setDisableAmbient(next);
    updateSetting("ytDisableAmbient", next);
  };

  const currentOption = RESOLUTION_OPTIONS.find((opt) => opt.id === preferredQuality) || RESOLUTION_OPTIONS[3];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* ── Left Column: Configuration Controls (7 cols) ── */}
      <div className="md:col-span-7 space-y-6">
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-6">
          
          {/* Header Section */}
          <div className="flex items-center justify-between border-b border-zinc-700/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
                <Film className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Resolution & FPS Locker
                </h3>
                <p className="text-xs text-zinc-300 font-normal mt-0.5">
                  Lock high-definition streams and prevent automatic quality drops
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-200 border border-red-500/35 px-2.5 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
                Locked
              </span>
            </div>
          </div>

          {/* Section: Resolution Selector Card Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-red-400" />
                  <span>Target Playback Resolution</span>
                </h4>
                <p className="text-xs text-zinc-300 font-normal">
                  Forces YouTube to initialize video streams at your selected target resolution.
                </p>
              </div>
              <span className="text-xs font-sans font-extrabold text-red-200 bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/35 shadow-sm">
                {currentOption.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {RESOLUTION_OPTIONS.map((opt) => {
                const isSelected = preferredQuality === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleQualityChange(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "bg-linear-to-b from-red-500/25 to-red-500/10 border-red-500/60 shadow-md shadow-red-950/40 ring-1 ring-red-500/40"
                        : "bg-[#0f111e] border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white shadow-inner"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-sans font-bold uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-red-500/30 text-red-200 border border-red-500/40"
                          : "bg-[#141626] text-zinc-400 border border-zinc-700/80"
                      }`}>
                        {opt.badge}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-tight ${isSelected ? "text-white font-extrabold" : "text-zinc-200"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-zinc-400 leading-snug mt-0.5 line-clamp-1">
                        {opt.res}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Force 60 FPS Framerate Lock */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-400" />
                  <span>Lock High Framerate (60 FPS)</span>
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  force60fps
                    ? "border-red-500/40 bg-red-500/20 text-red-300 font-sans"
                    : "border-zinc-700/80 bg-[#141626] text-zinc-400 font-sans"
                }`}>
                  {force60fps ? "60 FPS Locked" : "30 FPS Standard"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-sm">
                Instructs player to request smooth 60fps high-refresh streams whenever the content was encoded at 60fps.
              </p>
            </div>
            <Toggle enabled={force60fps} onChange={handleToggleForce60fps} />
          </div>

          {/* Row 3: Block Ambient Glow Shader */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-red-400" />
                  <span>Block Ambient Glow Mode</span>
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  disableAmbient
                    ? "border-red-500/40 bg-red-500/20 text-red-300"
                    : "border-zinc-700/80 bg-[#141626] text-zinc-400"
                }`}>
                  {disableAmbient ? "Suppressed" : "Active"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-sm">
                Disables YouTube's background ambient glow canvas shader to dramatically reduce CPU, GPU, and memory load.
              </p>
            </div>
            <Toggle enabled={disableAmbient} onChange={handleToggleDisableAmbient} />
          </div>
        </div>

        {/* Quick User Guide Block */}
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5.5 shadow-xl shadow-black/60 flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Quality Engine Architecture
            </h4>
            <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Directly binds to YouTube HTML5 video player's internal <b className="text-white font-sans text-[11px]">setPlaybackQualityRange()</b> API.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Locks quality against temporary bitrate drops or buffer throttling without page reloads.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Ambient glow blocking saves up to <b className="text-white font-semibold">25% GPU rendering cycles</b> on laptops and integrated graphics.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Right Column: Interactive Video Quality Mockup Pad (5 cols) ── */}
      <div className="md:col-span-5 space-y-6 md:sticky md:top-0">
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 space-y-4 shadow-xl shadow-black/60">
          <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>Stream Quality Preview</span>
            </h3>
            <span className="rounded-md border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-200 font-sans shadow-inner">
              Live Preview
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
            Inspect stream quality parameters, active resolution tags, and framerate lock overlay.
          </p>

          {/* Interactive Player Mockup */}
          <div className="w-full aspect-video rounded-xl bg-black border border-zinc-700/80 relative overflow-hidden flex flex-col justify-between p-4 group select-none shadow-inner">
            {/* Top Indicator bar */}
            <div className="flex justify-between items-center text-white z-10">
              <span className="text-xs font-semibold truncate max-w-45 text-zinc-200">
                Nature Documentary (4K 60fps)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-red-500/30 text-red-200 border border-red-500/40 px-2 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
                  {currentOption.res}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-bold uppercase tracking-wider ${
                  force60fps ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/35" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}>
                  {force60fps ? "60fps" : "30fps"}
                </span>
              </div>
            </div>

            {/* Central Video Mock Elements */}
            <div className="absolute inset-0 bg-radial from-zinc-900 via-zinc-950 to-black flex items-center justify-center">
              {showStatsForNerds ? (
                /* Stats for Nerds Overlay */
                <div className="bg-[#0f111e]/95 border border-zinc-700/80 backdrop-blur-md rounded-xl p-3.5 text-[10px] font-sans text-zinc-300 w-11/12 max-w-xs space-y-1 shadow-2xl">
                  <div className="flex justify-between border-b border-zinc-700/60 pb-1 text-white font-bold">
                    <span>Stats for Nerds (Mock)</span>
                    <span className="text-emerald-400">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Video Quality:</span>
                    <span className="text-white font-bold">{currentOption.label} @ {force60fps ? "60fps" : "30fps"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Resolution:</span>
                    <span className="text-zinc-200">{currentOption.id === "4k" ? "3840x2160@60" : currentOption.id === "1440p" ? "2560x1440@60" : "1920x1080@60"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Video Codec:</span>
                    <span className="text-zinc-200">av01.0.08M.08 (AV1)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Buffer Health:</span>
                    <span className="text-emerald-400 font-bold">38.4 s (Optimal)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ambient Lighting:</span>
                    <span className={disableAmbient ? "text-amber-300" : "text-zinc-400"}>{disableAmbient ? "Blocked (GPU Saved)" : "Enabled"}</span>
                  </div>
                </div>
              ) : (
                /* Standard Center Badge */
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-300 shadow-lg">
                    <Film className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white font-sans tracking-wide">
                      Stream Locked: <span className="text-red-300">{currentOption.label}</span>
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {force60fps ? "60 FPS High Framerate Enabled" : "30 FPS Standard Mode"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Overlay */}
            <div className="w-full flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/80 text-xs z-10">
              <div className="flex items-center gap-3">
                <span>⏯</span>
                <span>⏭</span>
                <span className="text-[11px] font-sans text-zinc-300">
                  {currentOption.res} {force60fps ? "60fps" : "30fps"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStatsForNerds(!showStatsForNerds)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-sans font-bold cursor-pointer transition-colors"
                >
                  {showStatsForNerds ? "Hide Stats" : "Stats for Nerds"}
                </button>
                <span>⚙️</span>
                <span>📺</span>
              </div>
            </div>

            {/* Bottom Player ProgressBar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div className="h-full bg-red-600 shadow-[0_0_6px_rgba(239,68,68,0.8)]" style={{ width: "65%" }} />
            </div>
          </div>

          {/* Toggle Stats for Nerds Quick Button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowStatsForNerds(!showStatsForNerds)}
              className="flex-1 py-2.5 px-3.5 bg-[#141626] hover:bg-[#1b1e32] border border-zinc-700/80 hover:border-red-500/50 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition-all shadow-inner cursor-pointer flex items-center justify-center gap-2"
            >
              <Eye className="w-3.5 h-3.5 text-red-400" />
              <span>{showStatsForNerds ? "Hide Stream Debug Stats" : "Show Stream Debug Stats (HUD)"}</span>
            </button>
          </div>

          {/* Stream Diagnostics Monitor under the mockup */}
          <div className="flex justify-between items-center text-xs text-zinc-300 bg-[#0f111e] p-3 rounded-xl border border-zinc-700/80 shadow-inner font-medium">
            <span>
              Quality Status: <b className="text-emerald-400">Locked ({currentOption.res})</b>
            </span>
            <span>
              Framerate: <b className="font-sans text-white text-sm">{force60fps ? "60 FPS" : "30 FPS"}</b>
            </span>
          </div>

          {/* Codec & GPU Integrity Note */}
          <div className="rounded-xl border border-zinc-700/80 bg-[#0f111e] p-3.5 flex items-center gap-3 shadow-inner">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">Hardware Decoder Optimized</p>
              <p className="text-[11px] text-zinc-400 leading-snug">
                AV1 & VP9 hardware acceleration supported without dropping frames.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
