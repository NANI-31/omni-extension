import { motion } from "framer-motion";

export default function DashboardHeader({ currentFeature, onBack }) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-700/80 bg-[#131627]/95 backdrop-blur-xl shadow-lg shadow-black/50 ring-1 ring-white/10">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {currentFeature !== "dashboard" && (
            <motion.button
              whileHover={{ x: -2 }}
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-[#1b1e32] px-3.5 py-1.5 text-xs font-bold text-zinc-200 ring-1 ring-white/10 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 hover:text-white shadow-sm cursor-pointer"
            >
              <span>←</span>
              Dashboard
            </motion.button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/35 shadow-sm text-base">
              🧩
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white leading-none">
                Omni Extension Hub
              </h1>
              <p className="text-[11px] font-medium text-zinc-300 mt-1">
                Browser Productivity Workspace
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 shadow-sm shadow-emerald-950/40">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-200">
              Connected
            </span>
          </div>
          <span className="rounded-full border border-zinc-700/80 bg-[#1b1e32] px-3 py-1 text-[10px] font-sans font-bold tracking-wider text-zinc-200 ring-1 ring-white/10 shadow-sm">
            v1.0.0
          </span>
        </div>
      </div>
    </header>
  );
}