import React from "react";

export default function ToggleCard({ title, description, checked, onChange, activeColorClass = "peer-checked:bg-pink-500" }) {
  return (
    <div className="border-t border-zinc-800 pt-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            {title}
          </label>
          {description && (
            <p className="text-[10px] text-zinc-500 max-w-[260px] mt-0.5">
              {description}
            </p>
          )}
        </div>
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className={`w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${activeColorClass} peer-checked:after:bg-white`}></div>
        </label>
      </div>
    </div>
  );
}
