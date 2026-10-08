import React from "react";

export default function FeaturePanel({ icon, title, description, currentFeature, children }) {
  const isYouTube = currentFeature === "youtube";

  return (
    <div className="relative overflow-hidden w-full h-full flex-1 flex flex-col min-h-0 bg-[#12141D] shadow-2xl border-y border-zinc-800 rounded-none border-x-0">
      {/* Background Glow */}
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="shrink-0 relative flex items-center justify-between gap-4 border-b border-zinc-800 px-6 py-3.5 bg-[#161824]">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-xl text-white shadow-md shadow-violet-600/30">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {description}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="rounded-xl border border-emerald-500/30 bg-[#10221A] px-3.5 py-1.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Status</p>
              <p className="text-xs font-bold text-emerald-300">Running</p>
            </div>
          </div>

          {currentFeature && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-1.5">
              <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Module</p>
              <p className="text-xs font-bold text-zinc-200">{currentFeature}</p>
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