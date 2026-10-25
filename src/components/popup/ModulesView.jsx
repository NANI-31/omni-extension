import React from "react";
import { ShieldCheck, ShieldAlert, Maximize2 } from "lucide-react";
import Toggle from "../ui/Toggle";
import ModuleIcon from "../ui/ModuleIcon";
import { extensionModules } from "../../config/modules";

export default function ModulesView({
  adblockEnabled,
  adblockBlockedCount,
  adblockYtBypass,
  adblockCookieBanner,
  adblockNotifications,
  activeModules,
  onToggleAdblock,
  onToggleSubSetting,
  onToggleModule,
  onOpenDashboard,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 min-h-75 max-h-115 pb-24 bg-[#0a0c12]">
      {/* AdShield Master Card */}
      <div className="rounded-2xl border border-cyan-500/40 bg-linear-to-b from-[#101e2b] to-[#0c141d] p-4 shadow-xl shadow-cyan-950/20 ring-1 ring-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm">
              {adblockEnabled ? <ShieldCheck className="w-5 h-5 text-cyan-300" /> : <ShieldAlert className="w-5 h-5 text-zinc-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">AdShield Engine</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  adblockEnabled 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/35"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}>
                  {adblockEnabled ? "Active" : "Disabled"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {adblockBlockedCount > 0 ? `${adblockBlockedCount} Ads & trackers neutralized` : "Ad & tracker protection active"}
              </p>
            </div>
          </div>
          <Toggle enabled={adblockEnabled} onChange={onToggleAdblock} />
        </div>

        {/* AdShield Quick Sub-Toggles */}
        <div className="mt-3.5 pt-3 border-t border-zinc-700/60 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onToggleSubSetting("adblockYtBypass", adblockYtBypass)}
            className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all cursor-pointer ${
              adblockYtBypass ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200" : "bg-zinc-800/40 border-zinc-700/50 text-zinc-400"
            }`}
          >
            <span className="text-[10px] font-bold">YouTube Ads</span>
            <span className="text-[9px] opacity-75">{adblockYtBypass ? "Auto-Skip" : "Off"}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSubSetting("adblockCookieBanner", adblockCookieBanner)}
            className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all cursor-pointer ${
              adblockCookieBanner ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200" : "bg-zinc-800/40 border-zinc-700/50 text-zinc-400"
            }`}
          >
            <span className="text-[10px] font-bold">Cookie Banners</span>
            <span className="text-[9px] opacity-75">{adblockCookieBanner ? "Blocked" : "Off"}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSubSetting("adblockNotifications", adblockNotifications)}
            className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all cursor-pointer ${
              adblockNotifications ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200" : "bg-zinc-800/40 border-zinc-700/50 text-zinc-400"
            }`}
          >
            <span className="text-[10px] font-bold">Push Spams</span>
            <span className="text-[9px] opacity-75">{adblockNotifications ? "Silenced" : "Off"}</span>
          </button>
        </div>
      </div>

      {/* Installed Modules Quick Toggles */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-zinc-300">Installed Modules</span>
          <span className="text-[10px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
            {Object.values(activeModules).filter(Boolean).length}/{extensionModules.length} Active
          </span>
        </div>

        <div className="space-y-2">
          {extensionModules.map((mod) => (
            <div
              key={mod.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-700/80 bg-[#161824] hover:border-zinc-600 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${mod.color} text-white shadow-sm border border-white/10 text-sm`}>
                  <ModuleIcon moduleId={mod.id} fallbackIcon={mod.icon} className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{mod.name}</span>
                    {mod.category && (
                      <span className="text-[9px] font-semibold text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700/60">
                        {mod.category}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate max-w-56">{mod.description}</p>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                <Toggle
                  enabled={!!activeModules[mod.id]}
                  onChange={() => onToggleModule(mod.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Dashboard Link */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenDashboard}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-500/40 bg-linear-to-r from-purple-600/30 to-sky-600/30 hover:from-purple-600/40 hover:to-sky-600/40 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-purple-300" />
          <span>Open Full Desktop Dashboard & Detailed Settings</span>
        </button>
      </div>
    </div>
  );
}
