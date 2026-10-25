export default function YoutubeFeatureList({
  features,
  selectedFeature,
  setSelectedFeature
}) {
  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 shadow-xl shadow-black/60 space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3 mb-2">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider select-none">
          YouTube Features
        </h3>
        <span className="rounded-md border border-zinc-700/80 bg-[#0f111e] px-2 py-0.5 text-[10px] font-bold text-zinc-300 font-sans shadow-inner">
          {features.length} Modules
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {features.map((feat) => {
          const isSelected = selectedFeature === feat.id;
          const isActive = feat.status === "Active";
          return (
            <button
              key={feat.id}
              onClick={() => setSelectedFeature(feat.id)}
              className={`w-full text-left py-2.5 px-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? "bg-linear-to-r from-red-500/25 to-red-500/10 border-red-500/50 border-l-4 border-l-red-500 text-white shadow-md shadow-red-950/40 font-bold"
                  : "bg-[#0f111e] border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white shadow-inner hover:bg-[#14172a]"
              }`}
            >
              <span className="text-xs font-bold flex items-center gap-2 truncate">
                <span className="text-base select-none">{feat.icon}</span>
                <span className="truncate">{feat.name}</span>
              </span>
              <span
                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                  isActive
                    ? "bg-red-500/20 text-red-200 border-red-500/40 shadow-sm"
                    : "bg-[#0b0c16] text-zinc-400 border-zinc-700/80 shadow-inner"
                }`}
              >
                {feat.status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
