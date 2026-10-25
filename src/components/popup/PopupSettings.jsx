import React from "react";

export default function PopupSettings({
  downloadFolder,
  askWhereToSave,
  autoStopCompanion,
  ytdlpCompanion,
  onSetAskWhereToSave,
  onSetAutoStopCompanion,
  onStopCompanion,
}) {
  return (
    <div className="px-4 py-2.5 bg-[#12141d] border-b border-zinc-700/80 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-200">Save Directory:</span>
        <span className="font-sans text-[11px] text-sky-300 font-bold bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded">
          Downloads/{downloadFolder}/
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-zinc-300">Prompt Save As dialog:</span>
        <input
          type="checkbox"
          checked={askWhereToSave}
          onChange={(e) => onSetAskWhereToSave(e.target.checked)}
          className="accent-sky-500 cursor-pointer"
        />
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <div>
          <span className="text-zinc-300 block">Auto-stop server after download:</span>
          <span className="text-[10px] text-zinc-500">Terminates yt-dlp companion when download finishes</span>
        </div>
        <input
          type="checkbox"
          checked={autoStopCompanion}
          onChange={(e) => onSetAutoStopCompanion(e.target.checked)}
          className="accent-sky-500 cursor-pointer"
        />
      </div>
      {ytdlpCompanion?.online && (
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
          <span className="text-[11px] text-emerald-400 font-semibold">yt-dlp Companion is running</span>
          <button
            type="button"
            onClick={onStopCompanion}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer transition-colors"
          >
            Stop Server Now
          </button>
        </div>
      )}
    </div>
  );
}
