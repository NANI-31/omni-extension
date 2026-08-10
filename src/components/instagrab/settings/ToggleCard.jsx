import React from "react";
import Toggle from "../../ui/Toggle";

export default function ToggleCard({ title, description, checked, onChange }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#161824] p-4 shadow-lg flex items-center justify-between gap-4">
      <div className="space-y-1">
        <label className="text-xs font-bold text-white uppercase tracking-wider block">
          {title}
        </label>
        {description && (
          <p className="text-xs leading-relaxed text-zinc-400">
            {description}
          </p>
        )}
      </div>
      <Toggle enabled={checked} onChange={() => onChange(!checked)} />
    </div>
  );
}
