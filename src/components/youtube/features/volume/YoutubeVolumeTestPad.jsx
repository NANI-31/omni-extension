import { Play, Sparkles } from "lucide-react";

export default function YoutubeVolumeTestPad({
  volumeControl,
  volumeStep,
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
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 space-y-4 shadow-xl shadow-black/60">
      <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>Interactive Test Pad</span>
        </h3>
        <span className="rounded-md border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-200 font-sans shadow-inner">
          Live Preview
        </span>
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed font-normal">
        Hover over the screen mockup below and scroll your mouse wheel (or middle-click) to test scroll volume control and HUD response.
      </p>

      {/* Interactive Player Mockup */}
      <div
        onWheel={handleMockWheel}
        onAuxClick={handleMockAuxClick}
        onMouseDown={handleMockMouseDown}
        className="w-full aspect-video rounded-xl bg-black border border-zinc-700/80 relative overflow-hidden flex flex-col justify-between p-4 group cursor-crosshair select-none shadow-inner"
      >
        {/* Player top title bar */}
        <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white z-10">
          <span className="text-xs font-semibold truncate max-w-45 text-zinc-200">
            Testing volume controls...
          </span>
          <span className="text-[10px] bg-red-500/30 text-red-200 border border-red-500/40 px-2 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
            Live Stream
          </span>
        </div>

        {/* Central Video Mock Elements */}
        <div className="absolute inset-0 bg-radial from-zinc-900 via-zinc-950 to-black flex items-center justify-center">
          {/* Play symbol placeholder */}
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:scale-110 group-hover:bg-white/15 group-hover:text-white transition-all duration-300 shadow-lg">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>

          {/* In-Player Volume HUD Mockup */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f111e]/95 border border-zinc-700/80 backdrop-blur-md rounded-2xl p-3.5 flex flex-col items-center gap-1.5 text-white pointer-events-none transition-all duration-200 select-none w-24 shadow-2xl ${
              hudVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <span className="text-xl leading-none">
              {getSpeakerIcon(mockVolume, mockMuted)}
            </span>
            <span className="text-xs font-extrabold font-sans tracking-wide">
              {displayVolume}%
            </span>
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-red-500 to-rose-600 shadow-[0_0_6px_rgba(239,68,68,0.7)] transition-all duration-75"
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
            <span className="flex items-center gap-1.5">
              <span>{getSpeakerIcon(mockVolume, mockMuted)}</span>
              <span className="font-sans text-xs font-bold text-white">{displayVolume}%</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-300">
            <span>CC</span>
            <span>⚙️</span>
            <span>📺</span>
          </div>
        </div>

        {/* Player Bottom ProgressBar Track */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div className="h-full bg-red-600" style={{ width: "35%" }} />
        </div>
      </div>

      {/* Visual statistics monitor under the mockup */}
      <div className="flex justify-between items-center text-xs text-zinc-300 bg-[#0f111e] p-3 rounded-xl border border-zinc-700/80 shadow-inner font-medium">
        <span>Audio Status: <b className={mockMuted ? "text-amber-400" : "text-emerald-400"}>{mockMuted ? "Muted" : "Active"}</b></span>
        <span>Mock Volume: <b className="font-sans text-white text-sm">{displayVolume}%</b></span>
      </div>
    </div>
  );
}
