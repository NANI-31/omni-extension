export default function StatusBadge({ active, text }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border-zinc-700 bg-zinc-800/60 text-zinc-500"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          active ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
        }`}
      />
      {text || (active ? "Active" : "Disabled")}
    </div>
  );
}