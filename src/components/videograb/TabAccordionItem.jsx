import React from "react";
import { Globe, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import StreamRow from "./StreamRow";

export default function TabAccordionItem({
  tab,
  isExpanded,
  onToggleExpand,
  getStreamName,
  editingId,
  editValue,
  setEditValue,
  copiedId,
  downloadProgress,
  onStartEditingName,
  onSaveEditedName,
  onCancelEditing,
  onCopyLink,
  onDownloadStream,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] shadow-xl shadow-black/60 transition-all duration-200">
      {/* Website Tab Accordion Header */}
      <div
        onClick={onToggleExpand}
        className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-white/5 select-none transition-colors border-b border-zinc-700/80"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Favicon or fallback */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f111e] border border-zinc-700/80 overflow-hidden shadow-inner">
            {tab.favicon ? (
              <img
                src={tab.favicon}
                alt=""
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <Globe className="w-4 h-4 text-zinc-400" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white truncate max-w-md">
                {tab.title}
              </h4>
              {tab.isActive && (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/25 text-purple-200 border border-purple-500/40 shadow-sm">
                  Current Tab
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-zinc-300 font-sans">{tab.domain}</span>
              <span className="text-zinc-500">•</span>
              <a
                href={tab.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-purple-300 hover:text-purple-200 font-medium flex items-center gap-1 transition-colors"
              >
                Visit Site <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="rounded-full border border-purple-500/40 bg-purple-500/20 px-2.5 py-1 text-[11px] font-bold text-purple-200 shadow-sm">
            {tab.streams.length} {tab.streams.length === 1 ? "stream" : "streams"}
          </span>
          <div className="text-zinc-400 hover:text-zinc-200 p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Collapsible Stream Items */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-[#0d0f1b] border-t border-zinc-700/80">
          {tab.streams.map((stream) => (
            <StreamRow
              key={stream.id}
              stream={stream}
              streamName={getStreamName(stream, tab.title)}
              isEditing={editingId === stream.id}
              editValue={editValue}
              setEditValue={setEditValue}
              copiedId={copiedId}
              progress={downloadProgress[stream.id]}
              onStartEditing={(e) => onStartEditingName(stream, tab.title, e)}
              onSaveEditing={onSaveEditedName}
              onCancelEditing={onCancelEditing}
              onCopyLink={() => onCopyLink(stream)}
              onDownload={() => onDownloadStream(stream, tab.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
