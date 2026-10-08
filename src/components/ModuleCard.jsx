import Toggle from "./ui/Toggle";
import StatusBadge from "./ui/StatusBadge";
import ModuleIcon from "./ui/ModuleIcon";

export default function ModuleCard({
  mod,
  isEnabled,
  onNavigate,
  onToggle,
}) {
  const borderColor = mod.borderColor || "border-zinc-800 hover:border-zinc-700";

  return (
    <div
      onClick={onNavigate}
      style={{
        "--mod-glow": mod.glowColor || "rgba(139, 92, 246, 0.35)",
        "--mod-accent": mod.accentColor || "#8b5cf6",
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border ${borderColor} bg-[#141620] p-5 shadow-sm module-card-hover`}
    >
      {/* Top Accent Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-200"
        style={{
          background: `linear-gradient(90deg, ${mod.accentColor || "#8b5cf6"}, transparent)`,
          opacity: isEnabled ? 0.9 : 0.2,
        }}
      />

      {/* Dynamic Ambient Glow */}
      <div
        className={`absolute -right-12 -top-12 h-36 w-36 rounded-full blur-[60px] pointer-events-none transition-opacity duration-300 ${
          isEnabled ? "opacity-25" : "opacity-0"
        }`}
        style={{
          background: mod.accentColor || "#8b5cf6",
        }}
      />

      {/* Top Section */}
      <div className="relative flex items-center justify-between">
        {/* Icon */}
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${mod.color} text-white shadow-md shadow-black/40 ring-1 ring-white/20`}
        >
          <ModuleIcon moduleId={mod.id} fallbackIcon={mod.icon} className="w-5.5 h-5.5 text-white drop-shadow" />
        </div>

        {/* Active/Offline Pill */}
        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
            isEnabled
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : "border-zinc-700/60 bg-zinc-800/80 text-zinc-400"
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
      <div className="relative mt-4">
        <div className="flex items-center gap-2">
          <h3 className="card-title text-base font-bold tracking-tight text-white transition-colors duration-200">
            {mod.name}
          </h3>
          {mod.category && (
            <span className="rounded-md border border-zinc-700/50 bg-zinc-800/60 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400">
              {mod.category}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400 line-clamp-2 min-h-9">
          {mod.description}
        </p>
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-zinc-800" />

      {/* Bottom */}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Toggle enabled={isEnabled} onChange={onToggle} />
          <StatusBadge
            active={isEnabled}
            text={isEnabled ? "Running" : "Disabled"}
          />
        </div>

        {/* Configure Button */}
        <div className="card-config-btn flex items-center gap-1.5 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-all duration-200">
          Configure
          <span>→</span>
        </div>
      </div>
    </div>
  );
}