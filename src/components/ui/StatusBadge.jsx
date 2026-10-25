export default function StatusBadge({ active, text }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition-colors ${
        active
          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200 shadow-sm shadow-emerald-950/40"
          : "border-zinc-700/80 bg-[#0b0c16] text-zinc-300 font-medium"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
        }`}
      />
      {text || (active ? "Active" : "Disabled")}
    </div>
  );
}