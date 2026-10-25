import React from "react";
import { Film, Shield, Terminal } from "lucide-react";

export default function PopupTabs({
  popupView,
  setPopupView,
  videoCount,
  isYouTube,
  ytdlpCompanion,
  onOpenCliModal,
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-700/80 bg-[#12141d] px-3 py-1.5 shrink-0">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPopupView("videos")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            popupView === "videos"
              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 border border-transparent"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Media Grabber {videoCount > 0 ? `(${videoCount})` : ""}</span>
        </button>

        <button
          onClick={() => setPopupView("modules")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            popupView === "modules"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 border border-transparent"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>AdShield & Modules</span>
        </button>
      </div>

      {popupView === "videos" && isYouTube && (
        <button
          type="button"
          onClick={onOpenCliModal}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-sans border transition-all cursor-pointer ${
            ytdlpCompanion?.online
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"
              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
          }`}
          title={
            ytdlpCompanion?.online
              ? `yt-dlp Companion v${ytdlpCompanion.version} Online`
              : "yt-dlp Companion Offline — Click to configure"
          }
        >
          <Terminal className="w-2.5 h-2.5" />
          <span>{ytdlpCompanion?.online ? "yt-dlp Active" : "CLI"}</span>
        </button>
      )}
    </div>
  );
}
