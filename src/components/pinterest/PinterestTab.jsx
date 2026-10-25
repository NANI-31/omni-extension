import { useState, useEffect } from "react";
import { Folder, FolderOpen, Sparkles, Check, Globe, HelpCircle, Layers, ShieldCheck } from "lucide-react";

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
    } catch {
      // User cancelled picker
    }
  };

  const handleResolutionChange = (resKey) => {
    setResolution(resKey);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ pinterestResolution: resKey });
    }
  };

  const presetFolders = ["pinterest", "Pinterest-Media", "Pins", "Wallpapers", "Inspiration"];

  return (
    <div className="space-y-6 text-zinc-100 font-sans pb-8">
      {/* Top Banner / Stat Metrics (Stream Sniffer Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-red-500/40 hover:shadow-red-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Target Resolution</p>
            <h4 className="text-xl font-black text-white tracking-tight capitalize">{resolution}</h4>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-red-500/40 hover:shadow-red-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
            <Folder className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Target Directory</p>
            <h4 className="text-sm font-black text-white tracking-tight font-sans truncate max-w-48">
              Downloads/{folder || "pinterest"}/
            </h4>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-red-500/40 hover:shadow-red-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Downloader Engine</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
              <h4 className="text-sm font-extrabold text-zinc-100">Injection Active</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Card: Download Directory */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 shadow-xl shadow-black/60 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-700/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/35 text-red-300 shadow-sm">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Download Directory
              </h4>
              <p className="text-xs text-zinc-300 font-normal">
                Select or customize the target subfolder inside your OS Downloads folder.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-sans font-bold text-red-200 bg-red-500/20 border border-red-500/40 px-2.5 py-1 rounded-lg shadow-sm">
            Default: pinterest
          </span>
        </div>

        {/* Input & Action */}
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={folder}
                onChange={handleInputChange}
                placeholder="e.g. pinterest"
                className="w-full bg-[#0b0c16] border border-zinc-700/90 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/40 rounded-xl px-3.5 py-2.5 text-xs font-sans text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner"
              />
            </div>
            <button
              type="button"
              onClick={handleChooseFolder}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-650 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 text-zinc-100 hover:text-white text-xs font-semibold shadow-md shadow-black/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <FolderOpen className="w-4 h-4 text-red-400" />
              <span>Choose Directory</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-zinc-300 font-semibold">Quick Presets:</span>
            {presetFolders.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => saveFolder(preset)}
                className={`text-[11px] font-sans px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  folder === preset
                    ? "bg-red-500/25 border-red-500/60 text-red-200 font-bold shadow-sm"
                    : "bg-[#181a2e] border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-[#20233d]"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Path Preview Banner */}
          <div className="p-3 rounded-xl bg-[#0f111e] border border-zinc-700/80 flex items-center justify-between text-xs shadow-inner">
            <span className="text-zinc-300 font-medium">Output Location:</span>
            <span className="font-sans text-pink-300 font-bold truncate max-w-72">
              Downloads/{folder || "pinterest"}/
            </span>
          </div>

          {/* Save feedback banner */}
          {saveStatus && (
            <div className="text-xs text-emerald-200 font-bold bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm shadow-emerald-950/40">
              <Check className="w-4 h-4 text-emerald-300" />
              <span>{saveStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Preference Card */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 shadow-xl shadow-black/60 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/35 text-purple-300 shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Media Quality Selection
            </h3>
            <p className="text-xs text-zinc-300 font-normal">
              Select the preferred asset resolution downloaded by the injected grab buttons.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            ["originals", "Original", "Maximum Available", "Uncompressed master image"],
            ["1200x", "1200px", "High Quality", "Standard high-def render"],
            ["736x", "736px", "Standard Size", "Compact and fast download"],
          ].map(([id, label, desc, sub]) => (
            <button
              key={id}
              type="button"
              onClick={() => handleResolutionChange(id)}
              className={`rounded-xl p-3.5 text-left border transition-all cursor-pointer ${
                resolution === id
                  ? "bg-red-500/20 border-red-500/70 text-white shadow-lg shadow-red-500/15 ring-1 ring-red-400/30"
                  : "bg-[#0f111e] border-zinc-700/80 text-zinc-300 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-white">{label}</span>
                {resolution === id && <Check className="w-4 h-4 text-red-300" />}
              </div>
              <div className="text-xs font-bold text-red-200 mt-1">{desc}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Guide & Instructions */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 shadow-xl shadow-black/60 space-y-3.5">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-300" />
          <span>How It Works & Quick Guide</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { icon: "🖼️", title: "Feed Hover Button", text: "Hover over any pin card in your Pinterest feed and click Save." },
            { icon: "📌", title: "Detail Page Grabber", text: "Pin detail pages display an elevated full Download button next to the media." },
            { icon: "⬆️", title: "Resolution Auto-Upgrade", text: "Injected scripts automatically rewrite image URLs to your preferred quality." },
            { icon: "📁", title: "Direct Folder Organization", text: "Files are directly saved to your designated subfolder inside Downloads." },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 bg-[#0f111e] border border-zinc-700/80 rounded-xl text-xs text-zinc-300 shadow-inner"
            >
              <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="text-xs font-bold text-white">{item.title}</p>
                <p className="leading-relaxed text-[11px] text-zinc-300 font-normal mt-0.5">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Regional Domains */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 space-y-2.5 shadow-xl shadow-black/60">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-zinc-300" />
          <p className="text-xs font-bold text-white uppercase tracking-wider">
            Supported Regional Domains
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
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
              className="text-[11px] font-sans bg-[#0f111e] border border-zinc-700/80 text-zinc-300 px-2.5 py-1 rounded-lg shadow-sm"
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
