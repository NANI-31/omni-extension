import React from "react";
import { Film, RefreshCw, Settings, Maximize2 } from "lucide-react";

export default function PopupHeader({
  activeTab,
  videoCount,
  isScanning,
  isSettingsOpen,
  onScan,
  onToggleSettings,
  onOpenDashboard,
}) {
  return (
    <header className="flex items-center justify-between px-3.5 py-2.5 bg-[#161922] border-b border-zinc-700/80 shadow-md shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 shadow-sm">
          <Film className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-black tracking-wider uppercase text-white truncate">Omni Extension</h1>
            {videoCount > 0 && (
              <span className="rounded-full bg-sky-500/20 border border-sky-500/35 text-[10px] font-bold text-sky-200 px-2 py-0.2 shadow-sm shrink-0">
                {videoCount} {videoCount === 1 ? "Video" : "Videos"}
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 truncate max-w-52">
            {activeTab ? activeTab.title : "Ready"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Refresh / Rescan */}
        <button
          onClick={onScan}
          disabled={isScanning}
          className="p-1.5 rounded-lg border border-zinc-700/80 bg-[#1e222e] text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
          title="Rescan current page"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-sky-400" : ""}`} />
        </button>

        {/* Settings Toggle */}
        <button
          onClick={onToggleSettings}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isSettingsOpen
              ? "bg-sky-500/25 border-sky-400 text-sky-200"
              : "border-zinc-700/80 bg-[#1e222e] text-zinc-300 hover:text-white hover:border-zinc-500"
          }`}
          title="Download Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Open Full Dashboard Button */}
        <button
          onClick={onOpenDashboard}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-purple-500/40 bg-purple-600/20 hover:bg-purple-600 hover:border-purple-400 text-purple-200 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
          title="Open Full Omni Dashboard in a new tab"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
      </div>
    </header>
  );
}
