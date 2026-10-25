import { useDispatch } from "react-redux";
import { ArrowLeft } from "lucide-react";
import { navigateTo } from "../store/featuresSlice.js";

export default function FeaturePanel({
  icon,
  title,
  description,
  currentFeature,
  onBack,
  children,
}) {
  const isYouTube = currentFeature === "youtube";
  const dispatch = useDispatch();
  const handleBack = onBack || (() => dispatch(navigateTo("dashboard")));

  return (
    <div className="relative overflow-hidden w-full h-full flex-1 flex flex-col min-h-0 bg-[#0e101c] shadow-2xl border-y border-zinc-700/80 rounded-none border-x-0">
      {/* Background Glow */}
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="shrink-0 relative flex items-center justify-between gap-4 border-b border-zinc-700/80 px-6 py-3.5 bg-[#131627]">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-[#1b1e32] px-3.5 py-2 text-xs font-bold text-zinc-200 ring-1 ring-white/10 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 hover:text-white shadow-sm cursor-pointer mr-1 select-none"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-xl text-white shadow-md shadow-violet-600/30 border border-white/20 select-none">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-300 font-normal">
              {description}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-1.5 flex items-center gap-2 shadow-sm shadow-emerald-950/40">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-emerald-200 font-bold">Status</p>
              <p className="text-xs font-black text-emerald-100">Running</p>
            </div>
          </div>

          {currentFeature && (
            <div className="rounded-xl border border-zinc-700/80 bg-[#1b1e32] px-3.5 py-1.5 ring-1 ring-white/10 shadow-sm">
              <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Module</p>
              <p className="text-xs font-bold text-zinc-100 font-sans">{currentFeature}</p>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={`relative flex-1 min-h-0 ${isYouTube ? "overflow-hidden px-6 py-4" : "overflow-y-auto px-6 py-6"}`}>
        {children}
      </div>
    </div>
  );
}