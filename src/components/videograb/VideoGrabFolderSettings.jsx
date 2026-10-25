import React from "react";
import { Folder, FolderOpen, ChevronDown, ChevronUp, Check } from "lucide-react";
import Toggle from "../ui/Toggle";

export default function VideoGrabFolderSettings({
  downloadFolder,
  askWhereToSave,
  isFolderSettingsOpen,
  folderSaveStatus,
  onToggleOpen,
  onFolderInputChange,
  onChooseFolder,
  onSelectPreset,
  onToggleAskWhereToSave,
}) {
  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] overflow-hidden shadow-xl shadow-black/60">
      <div
        onClick={onToggleOpen}
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5 select-none transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/35 text-purple-300 shadow-sm">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-white">Download Destination</h4>
              <span className="font-sans text-xs text-purple-200 font-semibold bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 rounded-md shadow-sm">
                Downloads/{downloadFolder || "OmniVideos"}/
              </span>
              {askWhereToSave && (
                <span className="text-[10px] font-bold text-purple-200 bg-purple-500/30 border border-purple-500/50 px-2 py-0.5 rounded shadow-sm">
                  Ask on Save
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 mt-0.5 font-normal">
              {askWhereToSave
                ? "Prompting OS file picker on each download"
                : `Saving directly to Downloads/${downloadFolder || "OmniVideos"}/ without prompting`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors">
            {isFolderSettingsOpen ? "Hide Settings" : "Configure Folder"}
          </span>
          <div className="text-zinc-400">
            {isFolderSettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isFolderSettingsOpen && (
        <div className="p-5 border-t border-zinc-700/80 bg-[#101220] space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={downloadFolder}
                onChange={onFolderInputChange}
                placeholder="e.g. OmniVideos"
                className="w-full bg-[#0b0c16] border border-zinc-700/90 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/40 rounded-xl px-3.5 py-2 text-xs font-sans text-zinc-100 placeholder-zinc-400 outline-none transition-all shadow-inner"
              />
            </div>
            <button
              type="button"
              onClick={onChooseFolder}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-zinc-650 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 text-zinc-100 hover:text-white text-xs font-semibold shadow-md shadow-black/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <FolderOpen className="w-4 h-4 text-purple-400" />
              Choose Directory
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-zinc-300 font-semibold">Quick Presets:</span>
            {["OmniVideos", "Videos", "Courses", "Clips", "Recordings"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`text-[11px] font-sans px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  downloadFolder === preset
                    ? "bg-purple-600/30 border-purple-500/70 text-purple-200 font-bold shadow-sm"
                    : "bg-[#181a2e] border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-[#20233d]"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Always ask where to save toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-700/80">
            <div>
              <p className="text-xs font-bold text-white">Always ask where to save each file</p>
              <p className="text-xs text-zinc-300 mt-0.5">Open OS Save As dialog to choose location for every video</p>
            </div>
            <Toggle enabled={askWhereToSave} onChange={onToggleAskWhereToSave} />
          </div>

          {/* Save feedback indicator */}
          {folderSaveStatus && (
            <div className="text-xs text-purple-200 font-medium bg-purple-500/20 border border-purple-500/40 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm">
              <Check className="w-3.5 h-3.5 text-purple-300" /> {folderSaveStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
