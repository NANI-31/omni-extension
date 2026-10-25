import Toggle from "./ui/Toggle";
import StatusBadge from "./ui/StatusBadge";
import ModuleIcon from "./ui/ModuleIcon";

export default function ModuleCard({
  mod,
  isEnabled,
  onNavigate,
  onToggle,
}) {
  return (
    <div
      onClick={onNavigate}
      style={{
        "--mod-glow": mod.glowColor || "rgba(139, 92, 246, 0.35)",
        "--mod-accent": mod.accentColor || "#8b5cf6",
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 shadow-xl shadow-black/60 hover:border-zinc-500 hover:shadow-black/80 transition-[border-color,box-shadow] duration-200 module-card-hover"
    >
      {/* Top Accent Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-200"
        style={{
          background: `linear-gradient(90deg, ${mod.accentColor || "#8b5cf6"}, transparent)`,
          opacity: isEnabled ? 1 : 0.25,
        }}
      />

      {/* Dynamic Ambient Glow (Native Radial Gradient - 100x faster than blur) */}
      <div
        className={`absolute -right-12 -top-12 h-36 w-36 rounded-full pointer-events-none transition-opacity duration-200 ${
          isEnabled ? "opacity-35" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(circle, ${mod.accentColor || "#8b5cf6"} 0%, transparent 70%)`,
        }}
      />

      {/* Top Section */}
      <div className="relative flex items-center justify-between">
        {/* Icon */}
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${mod.color} text-white shadow-md shadow-black/50 border border-white/20`}
        >
          <ModuleIcon moduleId={mod.id} fallbackIcon={mod.icon} className="w-6 h-6 text-white drop-shadow" />
        </div>

        {/* Active/Offline Pill */}
        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${
            isEnabled
              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200 shadow-emerald-950/40"
              : "border-zinc-700/80 bg-[#0f111e] text-zinc-300 font-medium"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isEnabled ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
            }`}
          />
          {isEnabled ? "Active" : "Offline"}
        </div>
      </div>

      {/* Content */}
      <div className="relative mt-4.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="card-title text-base font-extrabold tracking-tight text-white group-hover:text-purple-200 transition-colors duration-200">
            {mod.name}
          </h3>
          {mod.category && (
            <span className="rounded-md border border-zinc-700/80 bg-[#0f111e] px-2 py-0.5 text-[10px] font-bold text-zinc-300 font-sans shadow-inner">
              {mod.category}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-300 font-normal line-clamp-2 min-h-9">
          {mod.description}
        </p>
      </div>

      {/* Inner Control Well */}
      <div className="relative mt-4.5 rounded-xl bg-[#0f111e] border border-zinc-700/80 p-2.5 flex items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-2.5">
          <Toggle enabled={isEnabled} onChange={onToggle} />
          <StatusBadge
            active={isEnabled}
            text={isEnabled ? "Running" : "Disabled"}
          />
        </div>

        {/* Configure Button */}
        <div className="card-config-btn flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-white px-3 py-1.5 text-xs font-bold transition-all shadow-sm">
          <span>Configure</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </div>
  );
}