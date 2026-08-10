import React, { useState, useEffect } from "react";

export default function PinterestTab() {
  const [folder, setFolder] = useState("pinterest");
  const [saveStatus, setSaveStatus] = useState("");
  const [resolution, setResolution] = useState("originals");

  // Load folder and resolution from chrome.storage.local
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ["pinterestFolder", "pinterestResolution"],
        (result) => {
          if (result.pinterestFolder !== undefined) {
            setFolder(result.pinterestFolder);
          } else {
            // Default to "pinterest"
            setFolder("pinterest");
            chrome.storage.local.set({ pinterestFolder: "pinterest" });
          }

          if (result.pinterestResolution) {
            setResolution(result.pinterestResolution);
          }
        }
      );
    }
  }, []);

  const saveFolder = (newFolder) => {
    const cleaned = newFolder.replace(/[\\/:*?"<>|]/g, "").trim() || "pinterest";
    setFolder(cleaned);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ pinterestFolder: cleaned }, () => {
        setSaveStatus(`Saved! Downloads will save to Downloads/${cleaned}/`);
        setTimeout(() => setSaveStatus(""), 3000);
      });
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setFolder(val);
    const cleaned = val.replace(/[\\/:*?"<>|]/g, "").trim() || "pinterest";
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ pinterestFolder: cleaned }, () => {
        setSaveStatus(`Updated directory to Downloads/${cleaned}/`);
        setTimeout(() => setSaveStatus(""), 2500);
      });
    }
  };

  const handleChooseFolder = async () => {
    try {
      if (window.showDirectoryPicker) {
        const handle = await window.showDirectoryPicker();
        const cleanedName = handle.name.replace(/[\\/:*?"<>|]/g, "").trim();
        if (cleanedName) saveFolder(cleanedName);
      } else {
        const name = prompt("Enter Pinterest download folder name:", folder);
        if (name !== null) {
          saveFolder(name);
        }
      }
    } catch (err) {
      // User cancelled picker
    }
  };

  const handleResolutionChange = (resKey) => {
    setResolution(resKey);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ pinterestResolution: resKey });
    }
  };

  const presetFolders = ["pinterest", "Pinterest-Media", "Pins", "Wallpapers"];

  return (
    <div className="space-y-6 text-zinc-200 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden p-4 rounded-xl bg-linear-to-r from-red-950/60 via-pink-950/40 to-zinc-900 border border-red-900/40 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-red-500 to-pink-600 flex items-center justify-center text-2xl shadow-lg shadow-red-500/20">
              📌
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base tracking-tight">
                  PinterestGrab
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Download photos, carousel slides & videos from Pinterest pins.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-3">

      
      {/* Main Settings Card: Folder Selection */}
      <div className="p-5 flex-1 rounded-xl bg-zinc-900/40 border border-zinc-800/80 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📁</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Download Directory
              </h4>
              <p className="text-[11px] text-zinc-500">
                Select or customize the target subfolder inside Downloads.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-red-400 bg-red-950/40 border border-red-900/50 px-2.5 py-1 rounded-lg">
            Default: pinterest
          </span>
        </div>

        {/* Input & Action */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={folder}
                onChange={handleInputChange}
                placeholder="e.g. pinterest"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/40 transition-all font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleChooseFolder}
              className="bg-linear-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 active:scale-95 text-white px-4 py-2 text-xs font-bold rounded-lg cursor-pointer border-none shadow-md shadow-red-600/20 transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              <span>📂</span> Choose Directory
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[11px] text-zinc-500 font-medium">Quick Presets:</span>
            {presetFolders.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => saveFolder(preset)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                  folder === preset
                    ? "bg-red-500/20 border-red-500/60 text-red-300 font-bold"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Path Preview Banner */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-850 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Output Location:</span>
            <span className="font-mono text-pink-400 font-medium truncate max-w-65">
              Downloads/{folder || "pinterest"}/
            </span>
          </div>

          {/* Save feedback banner */}
          {saveStatus && (
            <div className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-in">
              <span className="text-emerald-400 text-sm">✓</span> {saveStatus}
            </div>
          )}
        </div>
      </div>

        <section className="group relative overflow-hidden rounded-2xl 
    bg-gradient-to-br from-zinc-900/80 to-zinc-950/60
    border border-zinc-800/80 p-5 shadow-xl">

    {/* Glow */}
    <div className="absolute -top-20 -right-20 w-40 h-40 
      bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition" />

    <div className="relative space-y-4">

      <div className="flex justify-between items-start">

        <div className="flex gap-3">
          <div className="
            w-10 h-10 rounded-xl
            bg-red-500/10
            border border-red-500/20
            flex items-center justify-center
            text-xl">
            📁
          </div>

          <div>
            <h3 className="
              text-sm font-bold text-zinc-100">
              Download Directory
            </h3>

            <p className="
              text-xs text-zinc-500 mt-1">
              Choose where your Pinterest media is stored.
            </p>
          </div>
        </div>


        <span className="
          text-[10px]
          px-3 py-1
          rounded-full
          bg-red-500/10
          border border-red-500/20
          text-red-300
          font-mono">
          DEFAULT / pinterest
        </span>

      </div>


      {/* Input */}
      <div className="flex gap-2">

        <input
          type="text"
          value={folder}
          onChange={handleInputChange}
          placeholder="Folder name"
          className="
          flex-1
          h-10
          rounded-xl
          bg-black/40
          border border-zinc-800
          px-4
          text-sm
          text-white
          placeholder:text-zinc-600
          focus:border-red-500
          focus:ring-2
          focus:ring-red-500/20
          outline-none
          transition"
        />


        <button
          onClick={handleChooseFolder}
          className="
          h-10
          px-4
          rounded-xl
          bg-gradient-to-r
          from-red-600
          to-pink-600
          text-white
          text-xs
          font-bold
          shadow-lg
          shadow-red-500/20
          hover:brightness-110
          active:scale-95
          transition">
          📂 Choose
        </button>

      </div>



      {/* Preview */}
      <div className="
        flex items-center justify-between
        rounded-xl
        bg-black/30
        border border-zinc-800
        px-4 py-3">

        <span className="text-xs text-zinc-500">
          Saving to
        </span>

        <span className="
          text-xs
          font-mono
          text-pink-400">
          Downloads/{folder || "pinterest"}
        </span>

      </div>

    </div>

  </section>

      {/* Resolution Preference Card */}
 {/* Quality */}
      <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 flex-1">

        <div className="flex items-center gap-3 mb-4">

          <div className="
            w-9 h-9 rounded-xl
            bg-purple-500/10
            border border-purple-500/20
            flex items-center justify-center">
            💎
          </div>


          <div>
            <h3 className="
              text-sm font-bold text-white">
              Media Quality
            </h3>

            <p className="
              text-xs text-zinc-500">
              Select download resolution
            </p>
          </div>

        </div>


        <div className="grid grid-cols-3 gap-3">

          {[
            ["originals","Original","Maximum"],
            ["1200x","1200px","High"],
            ["736x","736px","Standard"]
          ].map(([id,label,desc])=>(
            
            <button
              key={id}
              onClick={()=>handleResolutionChange(id)}
              className={`
              rounded-xl
              p-3
              text-left
              border
              transition-all

              ${
                resolution===id
                ?
                "bg-red-500/15 border-red-500 text-red-300 shadow-lg shadow-red-500/10"
                :
                "bg-black/20 border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }
              `}>

              <div className="text-sm font-bold">
                {label}
              </div>

              <div className="text-[10px] mt-1 opacity-70">
                {desc}
              </div>

            </button>

          ))}

        </div>

      </section>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg text-red-400">
            💎
          </div>
          <div>
            <div className="text-sm font-extrabold text-white capitalize">{resolution}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Target Resolution
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-lg text-pink-400">
            ⚡
          </div>
          <div>
            <div className="text-sm font-extrabold text-emerald-400">Active</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Injection Ready
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
          Quick Guide
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "🖼️", text: "Hover over any pin card — click Save." },
            { icon: "📌", text: "Detail pages get a full Download button." },
            { icon: "⬆️", text: "Auto-upgrades URLs to highest resolution." },
            { icon: "📁", text: "Saves straight to your configured folder." },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 bg-zinc-900/30 border border-zinc-800/40 rounded-lg text-xs text-zinc-400"
            >
              <span className="text-sm shrink-0">{item.icon}</span>
              <span className="leading-snug text-[11px]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Domains */}
      <div className="p-3 rounded-xl bg-zinc-900/20 border border-zinc-800/40 space-y-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          Supported Domains
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[
            "pinterest.com",
            "pinterest.co.uk",
            "pinterest.ca",
            "pinterest.de",
            "pinterest.fr",
            "pinterest.es",
            "pinterest.it",
            "pinterest.jp",
          ].map((d) => (
            <span
              key={d}
              className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full"
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
