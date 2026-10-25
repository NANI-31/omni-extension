import React from "react";
import { Terminal, X, RefreshCw, Play, Download, Check, Copy } from "lucide-react";

export default function YtDlpModal({
  modalData,
  companion,
  isStartingServer,
  downloadFolder,
  copiedCmd,
  onClose,
  onStartServer,
  onCheckAndDownload,
  onOpenFolder,
  onCopyCommand,
  onDownloadNow,
}) {
  if (!modalData?.open) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3.5">
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-[#161822] p-4 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-700/80 pb-2">
          <div className="flex items-center gap-2 text-sky-400">
            <Terminal className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">yt-dlp Companion</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-zinc-300 leading-relaxed">
          Omni Extension connects to your local <span className="text-sky-300 font-sans font-bold">yt-dlp</span> to download YouTube videos at full speed without third-party web restrictions.
        </p>

        {/* Companion Server Status */}
        <div className="rounded-lg bg-zinc-950/80 border border-zinc-800 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-sans">
            <span>Companion Server</span>
            <span className={companion?.online ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {companion?.online ? `ONLINE (v${companion.version})` : "OFFLINE"}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400">
            Run in terminal: <code className="text-sky-300 font-sans font-bold">npm run ytdlp</code> or double-click <code className="text-sky-300 font-sans font-bold">start-ytdlp.bat</code>.
          </p>
        </div>

        {/* Start Server Directly from Extension Button */}
        {!companion?.online && (
          <button
            type="button"
            disabled={isStartingServer}
            onClick={onStartServer}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isStartingServer ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Starting Server in Background...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Server from Extension</span>
              </>
            )}
          </button>
        )}

        {/* Immediate Download Button if Companion is Online */}
        {companion?.online && modalData.video && (
          <button
            type="button"
            onClick={() => onDownloadNow(modalData.video)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Now with yt-dlp</span>
          </button>
        )}

        {/* Terminal Fallback Command */}
        <div className="rounded-lg bg-zinc-950/80 border border-zinc-800 p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-sans">
            <span>Direct Terminal Command</span>
          </div>
          <div className="text-[10px] font-sans text-zinc-300 break-all bg-black/60 p-2 rounded border border-zinc-800/80 select-all max-h-16 overflow-y-auto">
            {modalData.command}
          </div>
          <button
            type="button"
            onClick={() => onCopyCommand(modalData.command)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            {copiedCmd ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied Command!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Terminal Command</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onCheckAndDownload}
            className="flex-1 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Check & Download
          </button>
          <button
            type="button"
            onClick={() => onOpenFolder(downloadFolder)}
            className="py-1.5 px-3 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Open OmniVideos folder in File Explorer"
          >
            Open Folder
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
