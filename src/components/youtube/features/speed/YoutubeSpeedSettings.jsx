import React, { useState, useEffect, useRef } from "react";

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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      {/* Configuration Column (7 cols) */}
      <div className="md:col-span-7 space-y-6">
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-xl relative overflow-hidden before:absolute before:inset-0 before:bg-linear-to-tr before:from-red-500/5 before:to-transparent before:pointer-events-none">
          
          {/* Header Section */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/10">⚡</span>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-200 uppercase tracking-widest">
                  Playback Speed Config
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Customize global speed hotkeys</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>

          {/* Toggle Option: Hold key for 2x */}
          <div className="flex items-center justify-between gap-6 py-2 hover:bg-zinc-850/10 rounded-lg p-2 -mx-2 transition-colors">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>🖱️</span> Hold Key Speed Boost
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Temporarily speed up playback rate while holding down a custom keyboard key.
              </p>
            </div>
            <button
              onClick={handleToggleHotkeyHold2x}
              className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 cursor-pointer ${
                hotkeyHold2x
                  ? "bg-linear-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.45)]"
                  : "bg-zinc-800 border border-zinc-700 hover:bg-zinc-750"
              }`}
            >
              <span
                className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-all duration-300 shadow-md ${
                  hotkeyHold2x ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Config options for Hold Speed Boost */}
          {hotkeyHold2x && (
            <div className="flex flex-col gap-4 pl-6 border-l-2 border-red-500/25 py-2 transition-all duration-300">
              {/* Trigger key selector */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold text-zinc-300">Boost Trigger Key</p>
                <select
                  value={holdKey}
                  onChange={handleHoldKeyChange}
                  className="bg-zinc-950/80 border border-zinc-850 rounded-xl px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-red-500/40 cursor-pointer"
                >
                  <option value="s">Key S (Recommended)</option>
                  <option value="d">Key D</option>
                  <option value="q">Key Q</option>
                  <option value=" ">Spacebar</option>
                </select>
              </div>

              {/* Multiplier Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold text-zinc-300">Boost Rate Multiplier</p>
                  <span className="text-xs font-mono font-extrabold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    {holdSpeedMult.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-600 font-mono">1.5x</span>
                  <input
                    type="range"
                    min="1.5"
                    max={allowOverdrive ? "16.0" : "4.0"}
                    step="0.25"
                    value={holdSpeedMult}
                    onChange={(e) => handleHoldSpeedMultChange(Number(e.target.value))}
                    className="flex-1 accent-red-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-red-400"
                  />
                  <span className="text-[10px] text-zinc-600 font-mono">{allowOverdrive ? "16.0x" : "4.0x"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Speed Increments Sensitivity Selector */}
          <div className="flex items-center justify-between gap-4 border-t border-zinc-850/50 pt-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>⏱️</span> Speed Step Increments
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Determine the rate of speed changes when adjusting with keyboard shortcuts.
              </p>
            </div>
            <select
              value={speedSensitivity}
              onChange={(e) => handleSpeedSensitivityChange(Number(e.target.value))}
              className="bg-zinc-950/80 border border-zinc-850 rounded-xl px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-red-500/40 cursor-pointer"
            >
              <option value={0.05}>0.05x (Fine)</option>
              <option value={0.1}>0.10x</option>
              <option value={0.25}>0.25x (Default)</option>
              <option value={0.5}>0.50x (Coarse)</option>
            </select>
          </div>

          {/* Toggle Option: Overdrive Mode */}
          <div className="flex items-center justify-between gap-6 py-2 border-t border-zinc-850/50 hover:bg-zinc-850/10 rounded-lg p-2 -mx-2 pt-4 transition-colors">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>🚀</span> Speed Overdrive Mode (Up to 16x)
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                Unlock speed options beyond the standard 2.0x limit, enabling speeds up to 16.0x.
              </p>
            </div>
            <button
              onClick={handleToggleAllowOverdrive}
              className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 cursor-pointer ${
                allowOverdrive
                  ? "bg-linear-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.45)]"
                  : "bg-zinc-800 border border-zinc-700 hover:bg-zinc-750"
              }`}
            >
              <span
                className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-all duration-300 shadow-md ${
                  allowOverdrive ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick Guide Block */}
        <div className="bg-red-500/2 border-l-4 border-l-red-500/80 border border-zinc-800/45 rounded-r-2xl p-5 flex gap-4 items-start shadow-md backdrop-blur-sm">
          <span className="text-xl bg-red-500/10 p-2.5 rounded-xl border border-red-500/10 select-none leading-none shrink-0 text-red-400">
            💡
          </span>
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-zinc-200 uppercase tracking-widest">
              Speed Control Shortcuts
            </h4>
            <ul className="text-xs text-zinc-400 space-y-2 mt-1 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                <span>Press <b>+</b> (or <b>Shift + Right Arrow</b>) to speed up video.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                <span>Press <b>-</b> (or <b>Shift + Left Arrow</b>) to slow down video.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                <span>Press <b>*</b> (or <b>Shift + R</b>) to reset back to normal 1.00x speed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                <span>Press and hold <b>{holdKey === " " ? "Space" : holdKey.toUpperCase()}</b> for temporary boost.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Speed Mock Player Test Pad Column (5 cols) */}
      <div className="md:col-span-5 space-y-6 md:sticky md:top-0">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4 shadow-2xl backdrop-blur-md">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/60 pb-2">
            Interactive Speed Pad
          </h3>
          <p className="text-xs text-zinc-400 leading-normal">
            Click on the mock video player below to focus, then press speed shortcuts (<b>+</b>, <b>-</b>, <b>*</b>) or hold your trigger key to preview.
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
            className={`w-full aspect-video rounded-lg bg-zinc-950 border relative overflow-hidden flex flex-col justify-between p-4 group cursor-pointer select-none transition-all duration-300 outline-none ${
              isFocused ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]" : "border-zinc-800"
            }`}
          >
            {/* Top Indicator bar */}
            <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white z-10">
              <span className="text-xs font-semibold truncate max-w-45">
                {isFocused ? "🔴 Interactive (Shortcuts active)" : "Click to test hotkeys"}
              </span>
              <span className="text-[11px] bg-red-655 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
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
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900/90 border rounded-xl p-3 flex flex-col items-center gap-1.5 text-white pointer-events-none transition-all duration-200 select-none w-22.5 shadow-2xl ${
                  mockSpeed > 8.0 ? "yt-hud-overdrive-active" : ""
                } ${
                  hudVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                } ${
                  mockSpeed > 8.0
                    ? "border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.75)] animate-pulse"
                    : "border-white/10"
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
                <span className="text-xs font-extrabold font-mono tracking-wide">
                  {mockSpeed.toFixed(2)}x
                </span>
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
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
                <span className="flex items-center gap-1 font-mono text-zinc-300">
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

          {/* Visual statistics */}
          <div className="flex justify-between items-center text-xs text-zinc-400 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900">
            <span>Status: <b>{isFocused ? "Listening" : "Inactive"}</b></span>
            <span>Multiplier: <b className="font-mono text-zinc-200">{mockSpeed.toFixed(2)}x</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}
