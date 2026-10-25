import React from "react";
import { Search, Trash2 } from "lucide-react";

export default function VideoGrabToolbar({
  searchQuery,
  setSearchQuery,
  formatFilter,
  setFormatFilter,
  onExpandAll,
  onCollapseAll,
  onClearCapturedMedia,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-3 shadow-xl shadow-black/60">
      {/* Search */}
      <div className="relative flex-1 min-w-50">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by website title, domain, or resolution..."
          className="w-full pl-9 pr-3 py-1.5 bg-[#0b0c16] border border-zinc-700/80 focus:border-purple-500/70 rounded-xl text-xs text-zinc-100 placeholder-zinc-400 outline-none transition-colors shadow-inner"
        />
      </div>

      {/* Format Filter Pills */}
      <div className="flex items-center gap-1.5 border border-zinc-700/80 rounded-xl p-1 bg-[#0f111e]">
        <button
          onClick={() => setFormatFilter("all")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            formatFilter === "all"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFormatFilter("hls")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            formatFilter === "hls"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          HLS (.m3u8)
        </button>
        <button
          onClick={() => setFormatFilter("mp4")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            formatFilter === "mp4"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          Direct MP4
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExpandAll}
          className="px-2.5 py-1.5 rounded-xl border border-zinc-700/80 bg-[#1d2036] text-zinc-200 hover:bg-[#252844] hover:border-zinc-600 hover:text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
          title="Expand All Tabs"
        >
          Expand All
        </button>
        <button
          onClick={onCollapseAll}
          className="px-2.5 py-1.5 rounded-xl border border-zinc-700/80 bg-[#1d2036] text-zinc-200 hover:bg-[#252844] hover:border-zinc-600 hover:text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
          title="Collapse All Tabs"
        >
          Collapse
        </button>
        <button
          onClick={onClearCapturedMedia}
          className="p-1.5 rounded-xl border border-zinc-700/80 bg-[#1d2036] text-zinc-300 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-300 transition-colors cursor-pointer shadow-sm"
          title="Clear All Captured Streams"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
