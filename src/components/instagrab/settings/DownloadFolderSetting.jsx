import { Folder, FolderOpen, Check } from "lucide-react";
import { useSettings } from "../../../context/SettingsContext.jsx";

export default function DownloadFolderSetting() {
  const { subdir, handleSaveSubdir, saveStatus } = useSettings();

  const handleChooseFolder = async () => {
    try {
      if (window.showDirectoryPicker) {
        const handle = await window.showDirectoryPicker();
        const cleanedName = handle.name.replace(/[\\/:*?"<>|]/g, "").trim();
        handleSaveSubdir(cleanedName);
      } else {
        const name = prompt("Enter download subdirectory name:", subdir);
        if (name !== null) {
          const cleanedName = name.replace(/[\\/:*?"<>|]/g, "").trim();
          if (cleanedName) handleSaveSubdir(cleanedName);
        }
      }
    } catch {
      // User cancelled
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 space-y-4 shadow-xl shadow-black/60">
      <div className="flex items-center justify-between border-b border-zinc-700/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/35 text-fuchsia-300 shadow-sm">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Download Subdirectory
            </label>
            <p className="text-xs text-zinc-300 font-normal">
              Designated folder inside Downloads where Instagram media is saved.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-sans font-bold text-fuchsia-200 bg-fuchsia-500/20 border border-fuchsia-500/40 px-2.5 py-1 rounded-lg shadow-sm">
          Target: {subdir || "Instagram-Downloads"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={subdir}
            readOnly
            placeholder="Instagram-Downloads"
            className="w-full bg-[#0b0c16] border border-zinc-700/90 rounded-xl px-3.5 py-2.5 text-xs font-sans font-semibold text-zinc-100 placeholder-zinc-500 focus:outline-none cursor-default shadow-inner"
          />
        </div>

        <button
          type="button"
          onClick={handleChooseFolder}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-650 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 text-zinc-100 hover:text-white text-xs font-semibold shadow-md shadow-black/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <FolderOpen className="w-4 h-4 text-fuchsia-400" />
          <span>Choose Folder...</span>
        </button>
      </div>

      {/* Path preview well */}
      <div className="p-3 rounded-xl bg-[#0f111e] border border-zinc-700/80 flex items-center justify-between text-xs shadow-inner">
        <span className="text-zinc-300 font-medium">All media downloads will save to:</span>
        <span className="font-sans text-fuchsia-300 font-bold truncate max-w-72">
          Downloads/{subdir || "Instagram-Downloads"}/
        </span>
      </div>

      {saveStatus && (
        <div className="text-xs text-emerald-200 font-bold bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm shadow-emerald-950/40">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{saveStatus}</span>
        </div>
      )}
    </div>
  );
}

