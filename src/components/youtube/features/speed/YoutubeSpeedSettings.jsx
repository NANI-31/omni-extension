import { useState, useEffect, useRef } from "react";
import { Zap, Sliders, Rocket, Keyboard, KeyRound, Gauge, HelpCircle, Sparkles } from "lucide-react";
import Toggle from "../../../ui/Toggle";

export default function YoutubeSpeedSettings({
  speedSensitivity,
  handleSpeedSensitivityChange,
  allowOverdrive,
  handleToggleAllowOverdrive,
  hotkeyHold2x,
  handleToggleHotkeyHold2x,
  holdSpeedMult,
  handleHoldSpeedMultChange,
  holdKey,
  handleHoldKeyChange
}) {
  const [mockSpeed, setMockSpeed] = useState(1.0);
  const [hudVisible, setHudVisible] = useState(false);
  const hudTimeoutRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const originalMockSpeedRef = useRef(1.0);

  const triggerMockHUD = () => {
    setHudVisible(true);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setHudVisible(false);
    }, 1000);
  };

  // Keyboard shortcut listener for the mock player area
  const handleKeyDown = (e) => {
    if (!isFocused) return;
    
    // Disable spacebar page scroll
    if (e.key === " ") e.preventDefault();

    const maxLimit = allowOverdrive ? 16.0 : 2.0;

    // 1. Plus (+), Equal (=), or Shift + Right Arrow (Speed Up)
    if (
      (e.key === "+" || e.key === "=" || (e.shiftKey && e.key === "ArrowRight")) &&
      !e.ctrlKey && !e.metaKey && !e.altKey
    ) {
      e.preventDefault();
      setMockSpeed((prev) => {
        const next = Math.min(maxLimit, prev + speedSensitivity);
        triggerMockHUD();
        return next;
      });
    }
    // 2. Minus (-), Underscore (_), or Shift + Left Arrow (Speed Down)
    else if (
      (e.key === "-" || e.key === "_" || (e.shiftKey && e.key === "ArrowLeft")) &&
      !e.ctrlKey && !e.metaKey && !e.altKey
    ) {
      e.preventDefault();
      setMockSpeed((prev) => {
        const next = Math.max(0.25, prev - speedSensitivity);
        triggerMockHUD();
        return next;
      });
    }
    // 3. Asterisk (*) or Shift + R (Reset Speed)
    else if (
      (e.key === "*" || (e.shiftKey && e.key.toLowerCase() === "r")) &&
      !e.ctrlKey && !e.metaKey && !e.altKey
    ) {
      e.preventDefault();
      setMockSpeed(1.0);
      triggerMockHUD();
    }
    // 4. Hold Boost Action
    else if (
      hotkeyHold2x && e.key.toLowerCase() === holdKey.toLowerCase() && !isBoosting &&
      !e.ctrlKey && !e.metaKey && !e.altKey
    ) {
      setIsBoosting(true);
      originalMockSpeedRef.current = mockSpeed;
      setMockSpeed(Math.min(maxLimit, holdSpeedMult));
      triggerMockHUD();
    }
  };

  const handleKeyUp = (e) => {
    if (!isFocused) return;
    if (hotkeyHold2x && e.key.toLowerCase() === holdKey.toLowerCase() && isBoosting) {
      setMockSpeed(originalMockSpeedRef.current);
      triggerMockHUD();
      setIsBoosting(false);
    }
  };

  // Clean up timers
  useEffect(() => {
    return () => {
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Configuration Column (7 cols) */}
      <div className="md:col-span-7 space-y-6">
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-6">
          
          {/* Header Section */}
          <div className="flex items-center justify-between border-b border-zinc-700/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Playback Speed Engine
                </h3>
                <p className="text-xs text-zinc-300 font-normal mt-0.5">
                  Global speed hotkeys, custom boost multiplier, and overdrive limits
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-200 border border-red-500/35 px-2.5 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
                Active
              </span>
            </div>
          </div>

          {/* Row 1: Hold key for 2x Toggle */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-red-400" />
                  <span>Hold Key Speed Boost</span>
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  hotkeyHold2x
                    ? "border-red-500/40 bg-red-500/20 text-red-300"
                    : "border-zinc-700/80 bg-[#141626] text-zinc-400"
                }`}>
                  {hotkeyHold2x ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-sm">
                Temporarily accelerate video playback rate while holding down a designated hotkey.
              </p>
            </div>
            <Toggle enabled={hotkeyHold2x} onChange={handleToggleHotkeyHold2x} />
          </div>

          {/* Config options for Hold Speed Boost (Nested Well) */}
          {hotkeyHold2x && (
            <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 space-y-4 shadow-inner">
              {/* Trigger key selector */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-red-400" />
                    <span>Boost Trigger Key</span>
                  </p>
                  <p className="text-xs text-zinc-300 font-normal">
                    Hold this key during video playback to temporarily boost speed.
                  </p>
                </div>
                <select
                  value={holdKey}
                  onChange={handleHoldKeyChange}
                  className="bg-[#141626] border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500/60 cursor-pointer shadow-inner font-sans font-medium"
                >
                  <option value="s">Key S (Recommended)</option>
                  <option value="d">Key D</option>
                  <option value="q">Key Q</option>
                  <option value=" ">Spacebar</option>
                </select>
              </div>

              {/* Multiplier Slider */}
              <div className="space-y-2 pt-2 border-t border-zinc-700/60">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-red-400" />
                      <span>Boost Rate Multiplier</span>
                    </p>
                    <p className="text-xs text-zinc-300 font-normal">
                      Target playback speed multiplier while key is held down.
                    </p>
                  </div>
                  <span className="text-xs font-sans font-extrabold text-red-200 bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/35 shadow-sm">
                    {holdSpeedMult.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] text-zinc-400 font-sans">1.5x</span>
                  <input
                    type="range"
                    min="1.5"
                    max={allowOverdrive ? "16.0" : "4.0"}
                    step="0.25"
                    value={holdSpeedMult}
                    onChange={(e) => handleHoldSpeedMultChange(Number(e.target.value))}
                    className="flex-1 accent-red-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-red-400 transition-colors"
                  />
                  <span className="text-[10px] text-zinc-400 font-sans">{allowOverdrive ? "16.0x" : "4.0x"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Row 2: Speed Increments Sensitivity Selector */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-red-400" />
                  <span>Speed Step Increments</span>
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-500/40 bg-red-500/20 text-red-300 font-sans">
                  ±{speedSensitivity}x
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-sm">
                Rate of speed adjustment applied per keyboard shortcut trigger (+/-).
              </p>
            </div>
            <select
              value={speedSensitivity}
              onChange={(e) => handleSpeedSensitivityChange(Number(e.target.value))}
              className="bg-[#141626] border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500/60 cursor-pointer shadow-inner font-sans font-medium"
            >
              <option value={0.05}>0.05x (Fine)</option>
              <option value={0.1}>0.10x</option>
              <option value={0.25}>0.25x (Default)</option>
              <option value={0.5}>0.50x (Coarse)</option>
            </select>
          </div>

          {/* Row 3: Toggle Option: Overdrive Mode */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-red-400" />
                  <span>Speed Overdrive Mode (Up to 16x)</span>
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  allowOverdrive
                    ? "border-red-500/40 bg-red-500/20 text-red-300"
                    : "border-zinc-700/80 bg-[#141626] text-zinc-400"
                }`}>
                  {allowOverdrive ? "Up to 16.0x" : "Capped at 2.0x"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-md">
                Unlock extreme playback options beyond YouTube's standard 2.0x limit, enabling speeds up to 16.0x.
              </p>
            </div>
            <Toggle enabled={allowOverdrive} onChange={handleToggleAllowOverdrive} />
          </div>
        </div>

        {/* Quick User Guide Block */}
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5.5 shadow-xl shadow-black/60 flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Speed Control Shortcuts
            </h4>
            <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Press <b className="text-white font-semibold">+</b> (or <b className="text-white font-semibold">Shift + Right Arrow</b>) to speed up video.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Press <b className="text-white font-semibold">-</b> (or <b className="text-white font-semibold">Shift + Left Arrow</b>) to slow down video.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Press <b className="text-white font-semibold">*</b> (or <b className="text-white font-semibold">Shift + R</b>) to reset back to normal 1.00x speed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Press and hold <b className="text-white font-semibold">{holdKey === " " ? "Spacebar" : holdKey.toUpperCase()}</b> for temporary speed boost.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Speed Mock Player Test Pad Column (5 cols) */}
      <div className="md:col-span-5 space-y-6 md:sticky md:top-0">
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 space-y-4 shadow-xl shadow-black/60">
          <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>Interactive Speed Pad</span>
            </h3>
            <span className="rounded-md border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-200 font-sans shadow-inner">
              Live Mock
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
            Click on the mock video player below to focus, then press speed shortcuts (<b className="text-white font-semibold">+</b>, <b className="text-white font-semibold">-</b>, <b className="text-white font-semibold">*</b>) or hold your trigger key to preview.
          </p>

          <div
            tabIndex="0"
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setIsBoosting(false);
              setMockSpeed(1.0);
            }}
            className={`w-full aspect-video rounded-xl bg-black border relative overflow-hidden flex flex-col justify-between p-4 group cursor-pointer select-none transition-all duration-300 outline-none shadow-inner ${
              isFocused ? "border-red-500 ring-2 ring-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "border-zinc-700/80"
            }`}
          >
            {/* Top Indicator bar */}
            <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white z-10">
              <span className="text-xs font-semibold truncate max-w-45 text-zinc-200">
                {isFocused ? "🔴 Interactive (Shortcuts active)" : "Click to test hotkeys"}
              </span>
              <span className="text-[10px] bg-red-500/30 text-red-200 border border-red-500/40 px-2 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
                Live Test
              </span>
            </div>

            {/* Central Spinning Indicator Mockup */}
            <div className="absolute inset-0 bg-radial from-zinc-900 via-zinc-950 to-black flex items-center justify-center">
              {/* Rotating loader that scales speed depending on mockSpeed */}
              <div 
                className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-red-500 animate-spin"
                style={{ animationDuration: `${0.85 / mockSpeed}s` }}
              />

              {/* Speed HUD Overlay */}
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f111e]/95 border backdrop-blur-md rounded-2xl p-3.5 flex flex-col items-center gap-1.5 text-white pointer-events-none transition-all duration-200 select-none w-24 shadow-2xl ${
                  mockSpeed > 8.0 ? "yt-hud-overdrive-active" : ""
                } ${
                  hudVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                } ${
                  mockSpeed > 8.0
                    ? "border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.75)] animate-pulse"
                    : "border-zinc-700/80"
                }`}
              >
                <style>{`
                  .yt-hud-spark-mock {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    pointer-events: none;
                    opacity: 0;
                    z-index: -1;
                    filter: blur(0.5px);
                    box-shadow: 0 0 6px currentColor;
                    display: none;
                  }
                  .yt-hud-overdrive-active .yt-hud-spark-mock {
                    display: block;
                  }
                `}</style>
                <div className="yt-hud-spark-mock" style={{ bottom: "10px", left: "15%", animation: "yt-hud-spark-float-1 1s infinite ease-in", color: "#ff3b30" }}></div>
                <div className="yt-hud-spark-mock" style={{ bottom: "15px", left: "40%", animation: "yt-hud-spark-float-2 1.2s infinite ease-in 0.2s", color: "#ff9500" }}></div>
                <div className="yt-hud-spark-mock" style={{ bottom: "8px", left: "60%", animation: "yt-hud-spark-float-3 0.9s infinite ease-in 0.4s", color: "#ffcc00" }}></div>
                <div className="yt-hud-spark-mock" style={{ bottom: "12px", left: "85%", animation: "yt-hud-spark-float-4 1.1s infinite ease-in 0.1s", color: "#ff3b30" }}></div>

                <span className={`text-xl leading-none transition-transform duration-200 ${mockSpeed > 8.0 ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.85)] scale-110" : ""}`}>
                  {mockSpeed > 8.0 ? "🔥" : "⚡"}
                </span>
                <span className="text-xs font-extrabold font-sans tracking-wide">
                  {mockSpeed.toFixed(2)}x
                </span>
                <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      mockSpeed > 8.0
                        ? "bg-linear-to-r from-red-500 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                        : "bg-linear-to-r from-red-500 to-rose-600 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                    }`}
                    style={{ width: `${Math.min(100, (mockSpeed / (allowOverdrive ? 16.0 : 2.0)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Controls Overlay */}
            <div className="w-full flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/80 text-xs z-10">
              <div className="flex items-center gap-3">
                <span>⏯</span>
                <span>⏭</span>
                <span className="flex items-center gap-1 font-sans text-zinc-300">
                  ⚡ {mockSpeed.toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span>CC</span>
                <span>⚙️</span>
                <span>📺</span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div 
                className="h-full bg-red-600 shadow-[0_0_4px_rgba(220,38,38,0.5)]" 
                style={{ 
                  width: "55%",
                  transition: `width ${0.05 / mockSpeed}s linear`
                }} 
              />
            </div>
          </div>

          {/* Visual statistics monitor under the mockup */}
          <div className="flex justify-between items-center text-xs text-zinc-300 bg-[#0f111e] p-3 rounded-xl border border-zinc-700/80 shadow-inner font-medium">
            <span>Status: <b className={isFocused ? "text-emerald-400" : "text-zinc-400"}>{isFocused ? "Listening (Hotkeys Active)" : "Inactive (Click to focus)"}</b></span>
            <span>Speed Multiplier: <b className="font-sans text-white text-sm">{mockSpeed.toFixed(2)}x</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}
