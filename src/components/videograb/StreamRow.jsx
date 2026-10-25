import React from "react";
import { Check, X, Pencil, Copy, ExternalLink, Download } from "lucide-react";

export default function StreamRow({
  stream,
  streamName,
  isEditing,
  editValue,
  setEditValue,
  copiedId,
  progress,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  onCopyLink,
  onDownload,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-xl border border-zinc-700/90 ring-1 ring-white/10 bg-linear-to-r from-[#1c1f36] to-[#181a2e] p-4 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-950/20 shadow-md shadow-black/40">
      {/* Left: Format Badge & Editable Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/35 text-purple-300 font-bold text-xs shadow-sm">
          {stream.format.toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          {/* Editable Filename Row */}
          {isEditing ? (
            <div className="flex items-center gap-1.5 py-0.5 mb-1.5">
              <input
                type="text"
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEditing(stream.id);
                  if (e.key === "Escape") onCancelEditing();
                }}
                placeholder="Enter video filename..."
                className="flex-1 max-w-sm px-2.5 py-1 bg-zinc-950 border border-purple-500/80 rounded-lg text-xs font-semibold text-white outline-none ring-1 ring-purple-500/40 shadow-inner"
              />
              <button
                type="button"
                onClick={() => onSaveEditing(stream.id)}
                className="p-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 transition-colors shadow-sm cursor-pointer"
                title="Save Name (Enter)"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onCancelEditing}
                className="p-1 rounded-lg bg-zinc-800/90 text-zinc-300 hover:text-white border border-zinc-700/80 transition-colors shadow-sm cursor-pointer"
                title="Cancel (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/title mb-1.5">
              <span
                onClick={onStartEditing}
                className="text-xs font-bold text-white hover:text-purple-300 transition-colors truncate cursor-pointer max-w-sm sm:max-w-md"
                title="Click to edit video filename"
              >
                {streamName}
              </span>
              <button
                type="button"
                onClick={onStartEditing}
                className="opacity-60 group-hover/title:opacity-100 text-zinc-400 hover:text-purple-400 p-0.5 transition-all cursor-pointer"
                title="Rename video"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Badges / Tech Specs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md border border-purple-500/40 bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-200 shadow-sm">
              {stream.resolution}
            </span>
            <span className="rounded-md border border-zinc-650 bg-[#262942] px-2 py-0.5 text-[10px] font-sans text-zinc-200 shadow-sm">
              {stream.codec}
            </span>
            {stream.sizeEstimate && (
              <span className="text-[11px] text-zinc-300 font-medium">
                {stream.sizeEstimate}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-[11px] text-zinc-300 truncate font-sans max-w-xs sm:max-w-md bg-[#0f111e]/70 px-2 py-0.5 rounded border border-zinc-800">
            {stream.url}
          </p>
        </div>
      </div>

      {/* Right: Icon-Only Actions */}
      <div className="flex items-center gap-2 shrink-0 self-center">
        {/* Copy URL */}
        <button
          type="button"
          onClick={onCopyLink}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-650 bg-[#262942] text-zinc-200 hover:border-purple-500/60 hover:text-purple-300 hover:bg-[#2f3352] transition-all shadow-md active:scale-95 cursor-pointer"
          title={copiedId === stream.id ? "Copied to clipboard!" : "Copy Stream URL"}
        >
          {copiedId === stream.id ? (
            <Check className="w-4 h-4 text-purple-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* Open / Preview in New Tab */}
        <button
          type="button"
          onClick={() => window.open(stream.url, "_blank")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-650 bg-[#262942] text-zinc-200 hover:border-purple-500/60 hover:text-purple-300 hover:bg-[#2f3352] transition-all shadow-md active:scale-95 cursor-pointer"
          title="Open / Play Video in New Tab"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Download */}
        <button
          type="button"
          onClick={onDownload}
          disabled={!!progress}
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-white transition-all shadow-md shadow-purple-600/30 bg-purple-600 hover:bg-purple-500 active:scale-95 cursor-pointer ${
            progress ? "opacity-75 cursor-not-allowed" : ""
          }`}
          title={
            stream.needsFfmpeg
              ? "Download via FFmpeg (.m3u8 remux)"
              : "Direct Download (MP4)"
          }
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* In-Flight Download Progress Bar */}
      {progress && (
        <div className="w-full mt-2 pt-2 border-t border-zinc-700/80">
          <div className="flex items-center justify-between text-[11px] text-purple-200 mb-1">
            <span>{progress.stage}</span>
            {progress.percent > 0 && (
              <span className="font-sans font-bold">{progress.percent}%</span>
            )}
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-linear-to-r from-purple-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
