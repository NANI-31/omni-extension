import Toggle from "../../ui/Toggle";

export default function ToggleCard({ title, description, checked, onChange }) {
  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 shadow-xl shadow-black/60 flex items-center justify-between gap-4 hover:border-zinc-500 transition-colors">
      <div className="space-y-1">
        <label className="text-xs font-bold text-white uppercase tracking-wider block">
          {title}
        </label>
        {description && (
          <p className="text-xs leading-relaxed text-zinc-300 font-normal">
            {description}
          </p>
        )}
      </div>
      <Toggle enabled={checked} onChange={() => onChange(!checked)} />
    </div>
  );
}

