import { motion } from "framer-motion";

export default function DashboardHeader({ currentFeature, onBack }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {currentFeature !== "dashboard" && (
            <motion.button
              whileHover={{ x: -2 }}
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white"
            >
              <span>←</span>
              Dashboard
            </motion.button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 text-base shadow-md shadow-violet-600/30">
              🧩
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                Omni Extension Hub
              </h1>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Browser Productivity Workspace
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-300">
              Connected
            </span>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            v1.0.0
          </span>
        </div>
      </div>
    </header>
  );
}