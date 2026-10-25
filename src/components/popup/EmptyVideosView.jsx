import React from "react";
import { Film } from "lucide-react";

export default function EmptyVideosView({
  isYouTube,
  onScanTab,
  onOpenDashboard,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3 shadow-sm">
        <Film className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-white">No Videos Detected on this Tab</h3>
      <p className="mt-1 text-xs text-zinc-400 max-w-xs leading-relaxed">
        {isYouTube
          ? "Click Play on the YouTube video to capture all streaming formats, or wait a moment for player initialization."
          : "Browse any website with video content and click play. Video streams will appear here automatically."}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onScanTab}
          className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
        >
          Scan Tab Now
        </button>
        <button
          onClick={onOpenDashboard}
          className="px-3 py-1.5 rounded-xl border border-sky-500/50 bg-sky-600/30 hover:bg-sky-600 text-xs font-bold text-sky-200 hover:text-white shadow-sm transition-all cursor-pointer"
        >
          Open Dashboard
        </button>
      </div>
    </div>
  );
}
