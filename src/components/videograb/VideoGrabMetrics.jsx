import React from "react";
import { Film, Layers, Cpu } from "lucide-react";

export default function VideoGrabMetrics({ totalCapturedStreams, tabsCount, ffmpegStatus }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-purple-500/40 hover:shadow-purple-950/20 transition-all">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/35 shadow-sm">
          <Film className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Captured Streams</p>
          <h4 className="text-2xl font-black text-white tracking-tight">{totalCapturedStreams} Streams</h4>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-purple-500/40 hover:shadow-purple-950/20 transition-all">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/35 shadow-sm">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Open Tabs Monitored</p>
          <h4 className="text-2xl font-black text-white tracking-tight">{tabsCount} Websites</h4>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-purple-500/40 hover:shadow-purple-950/20 transition-all">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/35 shadow-sm">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">FFmpeg Engine</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.9)] animate-pulse" />
            <h4 className="text-sm font-extrabold text-zinc-100">{ffmpegStatus}</h4>
          </div>
        </div>
      </div>
    </div>
  );
}
