import React from "react";
import { useHistory } from "../../context/HistoryContext.jsx";
import { motion, AnimatePresence } from "framer-motion";

export default function DownloadsTab() {
  const { history, clearHistory } = useHistory();

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Controls */}
      {history.length > 0 && (
        <div className="flex justify-between items-center text-sm text-zinc-400 mb-2 shrink-0">
          <span>Recent ({history.length})</span>
          <button
            onClick={clearHistory}
            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer font-medium border-none bg-transparent p-0 text-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear History
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-zinc-550 space-y-3">
          <svg className="w-12 h-12 text-zinc-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div className="space-y-1">
            <p className="text-zinc-300 font-semibold text-base">No downloads yet</p>
            <p className="text-sm max-w-[280px]">Open Instagram, hover over a Reel or feed post, and click the injected download button!</p>
          </div>
        </div>
      ) : (
        <motion.div className="space-y-2.5" layout>
          <AnimatePresence initial={false}>
            {history.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95, margin: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 flex items-center gap-3 hover:border-zinc-700 transition-all hover:bg-zinc-900/80 overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded bg-zinc-800 overflow-hidden relative shrink-0">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
                      {item.mediaType === "video" ? "📹" : "🖼️"}
                    </div>
                  )}
                  {/* Media type icon overlay */}
                  <span className="absolute bottom-0.5 right-0.5 bg-black/60 backdrop-blur-sm px-1 rounded text-[10px] font-bold tracking-wider text-white uppercase">
                    {item.mediaType}
                  </span>
                </div>

                {/* Metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://instagram.com/${item.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-pink-400 hover:underline truncate"
                    >
                      @{item.username}
                    </a>
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-0.5 font-mono">{item.filename}</p>
                  <p className="text-[10px] text-zinc-650 mt-1">{formatDate(item.timestamp)}</p>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {item.status === "downloading" ? (
                    <span className="flex items-center gap-1 text-xs text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                      </svg>
                      Saving...
                    </span>
                  ) : item.status === "success" ? (
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                      ✓ Done
                    </span>
                  ) : (
                    <span className="text-xs text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      ✕ Failed
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
