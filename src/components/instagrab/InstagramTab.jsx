import { Folder, Film, ShieldCheck } from "lucide-react";
import { useSettings } from "../../context/SettingsContext.jsx";
import DownloadFolderSetting from "./settings/DownloadFolderSetting.jsx";
import UnsendSetting from "./settings/UnsendSetting.jsx";
import ClickToDownloadSetting from "./settings/ClickToDownloadSetting.jsx";
import SlideshowSetting from "./settings/SlideshowSetting.jsx";
import LoggingControlSetting from "./settings/LoggingControlSetting.jsx";
import DownloadTutorial from "./settings/DownloadTutorial.jsx";

export default function InstagramTab() {
  const { subdir, compileSlidesAsVideo } = useSettings();

  return (
    <div className="space-y-6 text-zinc-100 font-sans pb-8">
      {/* Top Banner / Stat Metrics (Stream Sniffer Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-fuchsia-500/40 hover:shadow-fuchsia-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/35 shadow-sm">
            <Folder className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Target Folder</p>
            <h4 className="text-sm font-black text-white tracking-tight font-sans truncate max-w-48">
              Downloads/{subdir || "Instagram-Downloads"}/
            </h4>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-fuchsia-500/40 hover:shadow-fuchsia-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/35 shadow-sm">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Carousel Mode</p>
            <h4 className="text-sm font-black text-white tracking-tight">
              {compileSlidesAsVideo ? "Video Slideshow" : "Direct Images"}
            </h4>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-fuchsia-500/40 hover:shadow-fuchsia-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/35 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Injection Engine</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
              <h4 className="text-sm font-extrabold text-zinc-100">Ready on Instagram</h4>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        {/* 1. Subfolder Path Input */}
        <DownloadFolderSetting />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 2. Chat Quick Unsend Toggle */}
          <UnsendSetting />

          {/* 3. Click to Download Toggle */}
          <ClickToDownloadSetting />
        </div>

        {/* 4. Console Logging Controls */}
        <LoggingControlSetting />

        {/* 5. Slideshow Video Compiler Settings */}
        <SlideshowSetting />
      </form>

      {/* 6. How to Download Tutorial */}
      <DownloadTutorial />
    </div>
  );
}

