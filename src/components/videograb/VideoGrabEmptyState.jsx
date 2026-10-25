import React from "react";
import { Film } from "lucide-react";

export default function VideoGrabEmptyState({ hasFilter }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] py-14 px-4 text-center shadow-xl shadow-black/60">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/35 mb-3 shadow-sm">
        <Film className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-white">No Video Streams Found</h3>
      <p className="mt-1 max-w-sm text-xs text-zinc-300">
        {hasFilter
          ? "No streams match your search or format filters."
          : "Browse any website with video content (Vimeo, news sites, courses) and click play. Detected media will automatically appear here."}
      </p>
    </div>
  );
}
