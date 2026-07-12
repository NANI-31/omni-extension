import React from "react";

export default function YoutubeFeatureList({
  features,
  selectedFeature,
  setSelectedFeature
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 shadow-2xl backdrop-blur-md">
      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-850 pb-2.5 mb-3 select-none">
        YouTube Features List
      </h3>
      <div className="flex flex-col gap-2">
        {features.map((feat) => {
          const isSelected = selectedFeature === feat.id;
          const isActive = feat.status === "Active";
          return (
            <button
              key={feat.id}
              onClick={() => setSelectedFeature(feat.id)}
              className={`w-full text-left py-2.5 px-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 border-l-4 ${
                isSelected
                  ? "bg-red-500/10 border-red-500/30 border-l-red-500 shadow-md shadow-red-500/5 text-zinc-100"
                  : "bg-transparent border-transparent border-l-transparent hover:border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="text-sm font-bold flex items-center gap-1.5 truncate">
                <span className="text-base select-none">{feat.icon}</span>
                {feat.name}
              </span>
              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-sm border shrink-0 ${
                isActive
                  ? "bg-red-500/10 text-red-400 border-red-500/25"
                  : "bg-zinc-900/80 text-zinc-550 border-zinc-800"
              }`}>
                {feat.status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
