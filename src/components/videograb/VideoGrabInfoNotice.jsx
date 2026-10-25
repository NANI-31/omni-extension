import React from "react";
import { Info } from "lucide-react";

export default function VideoGrabInfoNotice() {
  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-start gap-3.5 text-xs text-zinc-200 shadow-xl shadow-black/60">
      <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
      <p className="leading-relaxed">
        <strong className="text-white">How Multi-Tab Detection Works:</strong> When you browse video websites, Omni-Extension's background sniffer detects media manifests (<code className="text-purple-200 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/35 font-sans text-[11px]">.m3u8</code>, <code className="text-purple-200 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/35 font-sans text-[11px]">.mpd</code>) and direct video files (<code className="text-purple-200 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/35 font-sans text-[11px]">.mp4</code>, <code className="text-purple-200 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/35 font-sans text-[11px]">.webm</code>). HLS video streams are automatically stitched and converted to single MP4 files using the local in-browser FFmpeg engine.
      </p>
    </div>
  );
}
