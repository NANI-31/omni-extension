import React from "react";
import { Film, Download, Check, Pencil, X, ChevronsUpDown, Copy, RefreshCw } from "lucide-react";

export default function VideoCard({
  video,
  activeFormat,
  displayFormat,
  isEditing,
  editValue,
  setEditValue,
  isDownloading,
  isSuccess,
  isDropdownOpen,
  downloadProgress,
  copiedId,
  selectedItemRef,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDismissVideo,
  onCopyUrl,
  onToggleDropdown,
  onSelectFormat,
  onDownload,
}) {
  const formatOptions = video.availableFormats || [];

  return (
    <div className="rounded-xl border border-zinc-700/80 bg-[#181b24] hover:border-zinc-500/70 p-3 shadow-lg shadow-black/50 transition-all relative">
      <div className="flex items-start gap-3 w-full">
        {/* Left: Thumbnail with Duration Badge */}
        <div className="relative w-28 h-16 shrink-0 rounded-lg overflow-hidden bg-black/90 border border-zinc-700/80 shadow-md">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt="Thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <Film className="w-5 h-5 text-zinc-500" />
            </div>
          )}

          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-md backdrop-blur-xs font-sans">
              {video.duration}
            </div>
          )}
        </div>

        {/* Right: Content Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-16">
          {/* Row 1: Stream Badge + Title + Close Button */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span
                className={`rounded text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide shrink-0 ${
                  video.streamType === "FMT"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                }`}
              >
                {video.streamType || activeFormat.format?.toUpperCase() || "MP4"}
              </span>

              {isEditing ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <input
                    type="text"
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveRename(video);
                      if (e.key === "Escape") onCancelRename();
                    }}
                    className="flex-1 px-1.5 py-0.5 bg-zinc-950 border border-sky-500 rounded text-xs text-white outline-none font-semibold"
                  />
                  <button
                    onClick={() => onSaveRename(video)}
                    className="p-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 cursor-pointer"
                    title="Save"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <h4
                  onClick={(e) => onStartRename(video, e)}
                  className="text-xs font-bold text-white hover:text-sky-300 truncate cursor-pointer max-w-52.5"
                  title={video.customName || video.title}
                >
                  {video.customName || video.title || "video.mp4"}
                </h4>
              )}
            </div>

            <button
              onClick={(e) => onDismissVideo(video, e)}
              className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Dismiss video"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Row 2: Rename + Copy + Quality Selector Pill + Download Button */}
          <div className="flex items-center gap-1.5 mt-auto relative">
            {/* Rename icon button */}
            <button
              type="button"
              onClick={(e) => onStartRename(video, e)}
              className="p-1.5 rounded-md border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Rename video"
            >
              <Pencil className="w-3 h-3" />
            </button>

            {/* Copy URL icon button */}
            <button
              type="button"
              onClick={(e) => onCopyUrl(video, e)}
              className="p-1.5 rounded-md border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title={copiedId === video.id ? "Copied URL!" : "Copy Stream URL"}
            >
              {copiedId === video.id ? (
                <Check className="w-3 h-3 text-sky-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>

            {/* Quality Selector Pill Button & Downwards Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => onToggleDropdown(video, e)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-600 bg-[#222530] hover:bg-[#2c3140] hover:border-sky-400 text-zinc-100 text-xs font-medium shadow-sm transition-all cursor-pointer group shrink-0"
                title="Choose video quality / format"
              >
                <span className="font-bold text-[10px] text-sky-400 uppercase tracking-wide">
                  {displayFormat.format}
                </span>
                <span className="text-[11px] text-zinc-200 font-semibold">
                  {displayFormat.resolution}
                </span>
                <ChevronsUpDown className="w-3 h-3 text-zinc-400 group-hover:text-sky-300 transition-colors" />
              </button>

              {/* Floating Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 z-50 w-76 max-h-60 overflow-y-auto rounded-lg border border-zinc-600 bg-[#161822] shadow-2xl shadow-black/95 p-1 space-y-0.5"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-700/80 mb-1 flex items-center justify-between">
                    <span>Select Quality & Format</span>
                    <span className="text-sky-400 font-sans text-[9px]">{formatOptions.length} available</span>
                  </div>
                  {formatOptions.map((opt, idx) => {
                    const isSelected = activeFormat.label === opt.label;
                    return (
                      <button
                        key={idx}
                        ref={isSelected ? selectedItemRef : null}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFormat(video, opt);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-sans transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-sky-500 text-white font-bold shadow-sm"
                            : "text-zinc-200 hover:bg-sky-500/20 hover:text-sky-200"
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={() => onDownload(video)}
              disabled={isDownloading}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all cursor-pointer active:scale-95 shrink-0 ${
                isSuccess
                  ? "bg-emerald-600"
                  : isDownloading
                  ? "bg-sky-700 opacity-80 cursor-wait"
                  : "bg-sky-500 hover:bg-sky-400"
              }`}
              title={downloadProgress?.stage || "Download full video"}
            >
              {isSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : isDownloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {downloadProgress?.percent > 0
                      ? `${downloadProgress.percent}%`
                      : downloadProgress?.stage?.includes("Starting")
                      ? "Starting..."
                      : downloadProgress?.stage?.includes("Connecting")
                      ? "Connecting..."
                      : downloadProgress?.stage?.includes("Merging")
                      ? "Merging..."
                      : "Preparing..."}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Download Status & Progress */}
      {isDownloading && downloadProgress && (
        <div className="mt-2.5 pt-2 border-t border-zinc-700/60 flex items-center justify-between text-[11px] text-sky-300 font-sans">
          <div className="flex items-center gap-1.5 truncate">
            <RefreshCw className="w-3 h-3 animate-spin text-sky-400 shrink-0" />
            <span className="truncate">{downloadProgress?.stage || "Preparing download..."}</span>
          </div>
          {downloadProgress?.percent > 0 && (
            <span className="font-bold text-sky-400 shrink-0 ml-2">
              {downloadProgress.percent}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
