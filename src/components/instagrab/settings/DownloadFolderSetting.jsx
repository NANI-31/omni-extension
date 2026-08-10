import React from "react";
import { useSettings } from "../../../context/SettingsContext.jsx";

export default function DownloadFolderSetting() {
  const { subdir, handleSaveSubdir, saveStatus } = useSettings();

  const handleChooseFolder = async () => {
    try {
      if (window.showDirectoryPicker) {
        const handle = await window.showDirectoryPicker();
        const cleanedName = handle.name.replace(/[\\/:\*\?"<>\|]/g, "").trim();
        handleSaveSubdir(cleanedName);
      } else {
        const name = prompt("Enter download subdirectory name:", subdir);
        if (name !== null) {
          const cleanedName = name.replace(/[\\/:\*\?"<>\|]/g, "").trim();
          if (cleanedName) handleSaveSubdir(cleanedName);
        }
      }
    } catch (err) {
      // User cancelled
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#161824] p-4.5 space-y-3 shadow-lg">
      <div className="space-y-1">
        <label className="text-xs font-bold text-white uppercase tracking-wider block">
          Download Subdirectory
        </label>
        <p className="text-xs text-zinc-400">
          Folder where Instagram media downloads will be organized.
        </p>
      </div>

      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={subdir}
            readOnly
            placeholder="Instagram-Downloads"
            className="w-full bg-[#1b1e2e] border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none cursor-default font-mono"
          />
        </div>

        <button
          type="button"
          onClick={handleChooseFolder}
          className="bg-linear-to-r from-fuchsia-600 to-rose-500 hover:from-fuchsia-500 hover:to-rose-400 active:scale-95 transition-all text-white px-4 py-2 text-xs font-bold rounded-xl cursor-pointer border-none shadow-md shadow-fuchsia-600/20 whitespace-nowrap flex items-center gap-1.5"
        >
          <span>📁</span>
          <span>Choose Folder...</span>
        </button>
      </div>

      <p className="text-xs text-zinc-400">
        All downloads will save to:{" "}
        <span className="text-fuchsia-400 font-mono font-semibold bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">
          Downloads/{subdir}/
        </span>
      </p>

      {saveStatus && (
        <div className="text-xs text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl flex items-center gap-2 mt-2">
          <span className="text-emerald-400 text-sm">✓</span> {saveStatus}
        </div>
      )}
    </div>
  );
}
