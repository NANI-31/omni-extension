import React from "react";

export default function YoutubeVolumeTestPad({
  volumeControl,
  volumeStep,
  showHUD,
  maxVolumeCap,
  mockVolume,
  setMockVolume,
  mockMuted,
  setMockMuted,
  hudVisible,
  triggerMockHUD,
  getSpeakerIcon,
  displayVolume
}) {
  // Mock Player Wheel Handler
  const handleMockWheel = (e) => {
    if (!volumeControl) return;
    e.preventDefault();
    e.stopPropagation();

    const limit = maxVolumeCap !== undefined ? maxVolumeCap : 100;

    setMockVolume((prev) => {
      let nextVol = prev;
      if (e.deltaY < 0) {
        nextVol = Math.min(limit, prev + volumeStep);
      } else if (e.deltaY > 0) {
        nextVol = Math.max(0, prev - volumeStep);
      }
      
      if (nextVol > 0) setMockMuted(false);
      return nextVol;
    });

    triggerMockHUD();
  };

  // Mock Player Middle Click Handler
  const handleMockAuxClick = (e) => {
    if (e.button !== 1) return; // Middle click only
    e.preventDefault();
    e.stopPropagation();

    setMockMuted((prev) => {
      const nextMuted = !prev;
      if (!nextMuted) {
        const limit = maxVolumeCap !== undefined ? maxVolumeCap : 100;
        if (mockVolume > limit) {
          setMockVolume(limit);
        }
      }
      return nextMuted;
    });
    triggerMockHUD();
  };

  // Mock Player Mouse Down Handler (Prevents middle click auto-scroll icon)
  const handleMockMouseDown = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4 shadow-2xl backdrop-blur-md">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/60 pb-2">
        Interactive Test Pad
      </h3>
      <p className="text-xs text-zinc-400 leading-normal">
        Hover over the screen mockup below and scroll your mouse wheel (or middle-click) to test the scroll volume control and HUD animation live.
      </p>

      {/* Interactive Player Mockup */}
      <div
        onWheel={handleMockWheel}
        onAuxClick={handleMockAuxClick}
        onMouseDown={handleMockMouseDown}
        className="w-full aspect-video rounded-lg bg-zinc-950 border border-zinc-800 relative overflow-hidden flex flex-col justify-between p-4 group cursor-crosshair select-none"
      >
        {/* Player top title bar */}
        <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white z-10">
          <span className="text-xs font-semibold truncate max-w-[180px]">
            Testing volume controls...
          </span>
          <span className="text-[11px] bg-red-655 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            Live Test
          </span>
        </div>

        {/* Central Video Mock Elements */}
        <div className="absolute inset-0 bg-radial from-zinc-900 via-zinc-950 to-black flex items-center justify-center">
          {/* Play symbol placeholder */}
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:scale-105 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
            ▶
          </div>

          {/* In-Player Volume HUD Mockup */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900/90 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-1.5 text-white pointer-events-none transition-all duration-200 select-none w-[90px] shadow-2xl ${
              hudVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <span className="text-xl leading-none">
              {getSpeakerIcon(mockVolume, mockMuted)}
            </span>
            <span className="text-xs font-extrabold font-mono tracking-wide">
              {displayVolume}%
            </span>
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-red-500 to-rose-600 shadow-[0_0_4px_rgba(239,68,68,0.5)] transition-all duration-75"
                style={{ width: `${displayVolume}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Controls Overlay */}
        <div className="w-full flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/80 text-xs z-10">
          <div className="flex items-center gap-3">
            <span>⏯</span>
            <span>⏭</span>
            {/* Volume icon indicator */}
            <span className="flex items-center gap-1">
              <span>{getSpeakerIcon(mockVolume, mockMuted)}</span>
              <span className="font-mono text-xs">{displayVolume}%</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>CC</span>
            <span>⚙️</span>
            <span>📺</span>
          </div>
        </div>

        {/* Player Bottom ProgressBar Track */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div className="h-full bg-red-600" style={{ width: "35%" }}></div>
        </div>
      </div>

      {/* Visual statistics monitor under the mockup */}
      <div className="flex justify-between items-center text-xs text-zinc-400 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900">
        <span>Audio Status: <b>{mockMuted ? "Muted" : "Active"}</b></span>
        <span>Mock Volume: <b className="font-mono text-zinc-200">{displayVolume}%</b></span>
      </div>
    </div>
  );
}
