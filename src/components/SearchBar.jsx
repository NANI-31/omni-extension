export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full max-w-sm">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 select-none">
        🔍
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search extensions..."
        className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-xs text-white outline-none transition-all placeholder:text-zinc-500 focus:border-violet-500/50 focus:bg-white/8"
      />
    </div>
  );
}