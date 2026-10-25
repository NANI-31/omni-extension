import { useState, useEffect, useRef } from "react";
import {
  Zap,
  FastForward,
  EyeOff,
  VolumeX,
  Timer,
  Play,
  RotateCcw,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Flame
} from "lucide-react";
import Toggle from "../../../ui/Toggle";

export default function YoutubeAdskipSettings() {
  // Settings States
  const [autoSkip, setAutoSkip] = useState(true);
  const [accelerateAds, setAccelerateAds] = useState(true);
  const [hideBanners, setHideBanners] = useState(true);
  const [muteDuringAd, setMuteDuringAd] = useState(true);
  const [skipDelay, setSkipDelay] = useState(0.0);
  const [adsSkippedCount, setAdsSkippedCount] = useState(0);

  // Live Simulator States
  const [simulatingAd, setSimulatingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5.0);
  const [adSkipped, setAdSkipped] = useState(false);
  const simTimerRef = useRef(null);

  // Load configuration from chrome.storage.local
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        [
          "ytAutoSkip",
          "ytAccelerateAds",
          "ytHideBanners",
          "ytMuteDuringAd",
          "ytSkipDelay",
          "ytAdsSkippedCount"
        ],
        (result) => {
          if (result.ytAutoSkip !== undefined) setAutoSkip(result.ytAutoSkip);
          if (result.ytAccelerateAds !== undefined) setAccelerateAds(result.ytAccelerateAds);
          if (result.ytHideBanners !== undefined) setHideBanners(result.ytHideBanners);
          if (result.ytMuteDuringAd !== undefined) setMuteDuringAd(result.ytMuteDuringAd);
          if (result.ytSkipDelay !== undefined) setSkipDelay(Number(result.ytSkipDelay));
          if (result.ytAdsSkippedCount !== undefined) setAdsSkippedCount(Number(result.ytAdsSkippedCount));
        }
      );
    }
  }, []);

  const updateSetting = (key, val) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: val });
    }
  };

  const handleToggleAutoSkip = () => {
    const next = !autoSkip;
    setAutoSkip(next);
    updateSetting("ytAutoSkip", next);
  };

  const handleToggleAccelerateAds = () => {
    const next = !accelerateAds;
    setAccelerateAds(next);
    updateSetting("ytAccelerateAds", next);
  };

  const handleToggleHideBanners = () => {
    const next = !hideBanners;
    setHideBanners(next);
    updateSetting("ytHideBanners", next);
  };

  const handleToggleMuteDuringAd = () => {
    const next = !muteDuringAd;
    setMuteDuringAd(next);
    updateSetting("ytMuteDuringAd", next);
  };

  const handleSkipDelayChange = (val) => {
    setSkipDelay(val);
    updateSetting("ytSkipDelay", val);
  };

  const handleResetCount = () => {
    setAdsSkippedCount(0);
    updateSetting("ytAdsSkippedCount", 0);
  };

  // Run or cancel the interactive ad simulation
  const startSimulation = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setSimulatingAd(true);
    setAdSkipped(false);
    setAdCountdown(5.0);

    const stepMs = 100;
    const rate = accelerateAds ? 1.6 : 0.1; // 16x speed vs 1x speed

    simTimerRef.current = setInterval(() => {
      setAdCountdown((prev) => {
        const next = Math.max(0, prev - rate);

        // Auto-skip triggered when countdown reaches delay buffer
        if (autoSkip && next <= (5.0 - skipDelay - 0.2)) {
          clearInterval(simTimerRef.current);
          setSimulatingAd(false);
          setAdSkipped(true);
          setAdsSkippedCount((c) => {
            const nextCount = c + 1;
            updateSetting("ytAdsSkippedCount", nextCount);
            return nextCount;
          });
          return 0;
        }

        if (next <= 0) {
          clearInterval(simTimerRef.current);
          setSimulatingAd(false);
          setAdSkipped(true);
          return 0;
        }
        return next;
      });
    }, stepMs);
  };

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* ── Configuration Column (7 cols) ── */}
      <div className="md:col-span-7 space-y-6">
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-6">
          
          {/* Header Section */}
          <div className="flex items-center justify-between border-b border-zinc-700/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
                <FastForward className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  AdSkip & Auto-Skip Engine
                </h3>
                <p className="text-xs text-zinc-300 font-normal mt-0.5">
                  Autonomous ad-state detection, 16x accelerated fast-forward, and banner suppression
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoSkip || accelerateAds ? "bg-red-400 opacity-75" : "bg-zinc-500"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${autoSkip || accelerateAds ? "bg-red-500" : "bg-zinc-600"}`}></span>
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-200 border border-red-500/35 px-2.5 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
                {autoSkip ? "Active" : "Disabled"}
              </span>
            </div>
          </div>

          {/* Row 1: Auto-Click "Skip Ad" */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" />
                  <span>Auto-Click "Skip Ad"</span>
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  autoSkip
                    ? "border-red-500/40 bg-red-500/20 text-red-300"
                    : "border-zinc-700/80 bg-[#141626] text-zinc-400"
                }`}>
                  {autoSkip ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-sm">
                Instantly clicks YouTube's native skip button the millisecond it becomes clickable on the video player.
              </p>
            </div>
            <Toggle enabled={autoSkip} onChange={handleToggleAutoSkip} />
          </div>

          {/* Row 2: Countdown Timer Buffer (Nested Well) */}
          {autoSkip && (
            <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 space-y-3 shadow-inner">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-red-400" />
                    <span>Auto-Skip Delay Buffer</span>
                  </p>
                  <p className="text-xs text-zinc-300 font-normal">
                    Wait duration after skip button appears before triggering click.
                  </p>
                </div>
                <span className="text-xs font-sans font-extrabold text-red-200 bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/35 shadow-sm">
                  {skipDelay === 0 ? "Instant (0.0s)" : `${skipDelay.toFixed(1)}s Delay`}
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] text-zinc-400 font-sans">0.0s (Instant)</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={skipDelay}
                  onChange={(e) => handleSkipDelayChange(Number(e.target.value))}
                  className="flex-1 accent-red-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-red-400 transition-colors"
                />
                <span className="text-[10px] text-zinc-400 font-sans">5.0s</span>
              </div>
            </div>
          )}

          {/* Row 3: Ad Speed Acceleration (16x) */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <span>Ad Speed Acceleration (16x)</span>
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  accelerateAds
                    ? "border-red-500/40 bg-red-500/20 text-red-300"
                    : "border-zinc-700/80 bg-[#141626] text-zinc-400"
                }`}>
                  {accelerateAds ? "16x Boost" : "Normal Speed"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-sm">
                Speeds up unskippable promotional blocks by 16x and fast-forwards through required video ad countdowns.
              </p>
            </div>
            <Toggle enabled={accelerateAds} onChange={handleToggleAccelerateAds} />
          </div>

          {/* Row 4: Auto-Mute During Ads */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-red-400" />
                  <span>Mute Audio During Ads</span>
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  muteDuringAd
                    ? "border-red-500/40 bg-red-500/20 text-red-300"
                    : "border-zinc-700/80 bg-[#141626] text-zinc-400"
                }`}>
                  {muteDuringAd ? "Muted" : "Unmuted"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-sm">
                Silences ad audio completely and restores your original video volume when normal content resumes.
              </p>
            </div>
            <Toggle enabled={muteDuringAd} onChange={handleToggleMuteDuringAd} />
          </div>

          {/* Row 5: Hide In-Video Banners */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-red-400" />
                  <span>Hide In-Video Promotional Banners</span>
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  hideBanners
                    ? "border-red-500/40 bg-red-500/20 text-red-300"
                    : "border-zinc-700/80 bg-[#141626] text-zinc-400"
                }`}>
                  {hideBanners ? "Hidden" : "Visible"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-sm">
                Suppresses promotional overlay banners, product badges, and pop-up cards that obstruct video view.
              </p>
            </div>
            <Toggle enabled={hideBanners} onChange={handleToggleHideBanners} />
          </div>
        </div>

        {/* Quick User Guide Block */}
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5.5 shadow-xl shadow-black/60 flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Bypasser Engine Logic
            </h4>
            <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Continuously polls YouTube HTML5 video DOM mutation events for ad elements.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Unskippable countdowns are bypassed by executing 16x playback speed acceleration.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Does not require external filter lists or network proxy blocks, preventing site breakage.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Right Column: Interactive Live Ad Skip & Countdown Simulator (5 cols) ── */}
      <div className="md:col-span-5 space-y-6 md:sticky md:top-0">
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 space-y-4 shadow-xl shadow-black/60">
          <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>Ad Countdown Simulator</span>
            </h3>
            <span className="rounded-md border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-200 font-sans shadow-inner">
              Live Mockup
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
            Test real-time ad detection, live countdown progression, 16x acceleration, and instant skip button triggering.
          </p>

          {/* Video Mockup Display */}
          <div className="w-full aspect-video rounded-xl bg-black border border-zinc-700/80 relative overflow-hidden flex flex-col justify-between p-4 group select-none shadow-inner">
            {/* Top Indicator bar */}
            <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white z-10">
              <span className="text-xs font-semibold truncate max-w-45 text-zinc-200">
                {simulatingAd ? "Simulating Pre-Roll Ad..." : adSkipped ? "Normal Video Resumed" : "Ready to test"}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm border ${
                simulatingAd
                  ? "bg-amber-500/30 text-amber-200 border-amber-500/40"
                  : adSkipped
                  ? "bg-emerald-500/30 text-emerald-200 border-emerald-500/40"
                  : "bg-red-500/20 text-red-200 border-red-500/35"
              }`}>
                {simulatingAd ? "Ad Playing" : adSkipped ? "Skipped" : "Ready"}
              </span>
            </div>

            {/* Central Simulator State Elements */}
            <div className="absolute inset-0 bg-radial from-zinc-900 via-zinc-950 to-black flex items-center justify-center">
              {simulatingAd ? (
                <div className="bg-[#0f111e]/95 border border-amber-500/40 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center gap-2 text-white shadow-2xl animate-pulse">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Timer className="w-4 h-4 animate-spin" />
                    <span>Ad Countdown</span>
                  </div>
                  <span className="text-2xl font-black font-sans text-white tracking-wide">
                    {adCountdown.toFixed(1)}s
                  </span>
                  <div className="w-32 h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-amber-500 to-red-500 transition-all duration-75"
                      style={{ width: `${(adCountdown / 5.0) * 100}%` }}
                    />
                  </div>
                  {accelerateAds && (
                    <span className="text-[10px] bg-red-500/25 text-red-200 border border-red-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3 text-red-400" />
                      <span>16x Fast-Forward</span>
                    </span>
                  )}
                </div>
              ) : adSkipped ? (
                <div className="bg-[#0f111e]/95 border border-emerald-500/40 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center gap-1.5 text-white shadow-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Ad Successfully Skipped!
                  </span>
                  <span className="text-[11px] text-zinc-400 font-sans">
                    Video playback resumed at 1.0x
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startSimulation}
                  className="w-14 h-14 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center justify-center text-red-300 hover:text-white transition-all duration-300 shadow-xl cursor-pointer hover:scale-105"
                >
                  <Play className="w-6 h-6 ml-0.5 fill-current" />
                </button>
              )}
            </div>

            {/* In-Player Skip Ad Button (Native YouTube Placement) */}
            <div className="absolute bottom-5 right-4 z-20">
              {simulatingAd ? (
                adCountdown > 0.5 ? (
                  <div className="bg-black/80 backdrop-blur-md border border-white/20 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-sans font-bold shadow-lg">
                    Skip in {Math.ceil(adCountdown)}s
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (simTimerRef.current) clearInterval(simTimerRef.current);
                      setSimulatingAd(false);
                      setAdSkipped(true);
                      setAdsSkippedCount((c) => {
                        const nextCount = c + 1;
                        updateSetting("ytAdsSkippedCount", nextCount);
                        return nextCount;
                      });
                    }}
                    className="bg-white/95 hover:bg-white text-black px-3.5 py-1.5 rounded-lg text-xs font-black shadow-2xl flex items-center gap-1.5 animate-pulse cursor-pointer hover:scale-105 transition-all"
                  >
                    <span>Skip Ad</span>
                    <span className="text-sm leading-none">➔</span>
                  </button>
                )
              ) : adSkipped ? (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-bold font-sans shadow-sm flex items-center gap-1">
                  <span>✓ Bypassed</span>
                </div>
              ) : null}
            </div>

            {/* Bottom Progress Track */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div
                className={`h-full transition-all duration-100 ${
                  simulatingAd ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" : "bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.8)]"
                }`}
                style={{
                  width: simulatingAd ? `${(1 - adCountdown / 5.0) * 100}%` : adSkipped ? "100%" : "30%"
                }}
              />
            </div>
          </div>

          {/* Action Trigger & Reset Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={startSimulation}
              className="flex-1 py-2.5 px-3.5 bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-950/40 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Ad Encounter</span>
            </button>
            {adsSkippedCount > 0 && (
              <button
                type="button"
                onClick={handleResetCount}
                className="py-2.5 px-3 bg-[#141626] hover:bg-[#1b1e32] border border-zinc-700/80 hover:border-red-500/50 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-inner"
                title="Reset counter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Visual statistics monitor under the mockup */}
          <div className="flex justify-between items-center text-xs text-zinc-300 bg-[#0f111e] p-3 rounded-xl border border-zinc-700/80 shadow-inner font-medium">
            <span>
              Ad Status:{" "}
              <b className={simulatingAd ? "text-amber-400" : adSkipped ? "text-emerald-400" : "text-zinc-400"}>
                {simulatingAd ? (accelerateAds ? "16x Fast-Forwarding" : "Running Ad") : adSkipped ? "Auto-Skipped" : "Standby"}
              </b>
            </span>
            <span>
              Total Skipped: <b className="font-sans text-white text-sm">{adsSkippedCount}</b>
            </span>
          </div>

          {/* Protection Verification Banner */}
          <div className="rounded-xl border border-zinc-700/80 bg-[#0f111e] p-3.5 flex items-center gap-3 shadow-inner">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">Native Player Integrity</p>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Preserves HTML5 buffering pipeline and avoids YouTube ad-blocker popups.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
