import React from "react";
import { useSettings } from "../../../context/SettingsContext.jsx";

export default function DownloadFolderSetting() {
  const { subdir, setSubdir, handleSaveSubdir, saveStatus, isChromeExtension } = useSettings();

  const handleChooseFolder = async () => {
    try {
      if (window.showDirectoryPicker) {
        const handle = await window.showDirectoryPicker();
        const cleanedName = handle.name.replace(/[\\/:\*\?"<>\|]/g, "").trim();
        handleSaveSubdir(cleanedName);
      } else {
        // Fallback if the browser environment doesn't support directory picker (e.g. some sandboxes)
        const name = prompt("Enter download subdirectory name:", subdir);
        if (name !== null) {
          const cleanedName = name.replace(/[\\/:\*\?"<>\|]/g, "").trim();
          if (cleanedName) handleSaveSubdir(cleanedName);
        }
      }
    } catch (err) {
      // Ignored
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
        Download Subdirectory
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={subdir}
          readOnly
          placeholder="No folder selected"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none cursor-default"
        />
        <button
          type="button"
          onClick={handleChooseFolder}
          className="bg-linear-to-r from-purple-600 to-pink-500 hover:opacity-90 active:scale-95 transition-all text-white px-4 py-2 text-xs font-bold rounded cursor-pointer border-none whitespace-nowrap"
        >
          Choose Folder...
        </button>
      </div>

      <p className="text-[10px] text-zinc-500">
        All downloads will save to: <span className="text-pink-400 font-mono">Downloads/{subdir}/</span>
      </p>

      {saveStatus && (
        <div className="text-xs text-emerald-400 font-medium bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1.5 rounded flex items-center gap-1.5 mt-2">
          <span className="text-emerald-500 text-base leading-none">✓</span> {saveStatus}
        </div>
      )}
    </div>
  );
}
