import { Check, X } from "lucide-react";
import {
  countryFlag,
  scoreDot,
  scoreColor,
  scoreLabel,
  clientCalculateScore,
} from "./constants";

export default function VpnServerList({
  setSelectedCountry,
  setActiveRightTab,
  selectedCountry,
  countriesMap,
  connectBestInCountry,
  serversList,
  currentCountryProxies,
  proxyHealth,
  vpnSelectedServer,
  handleSelectProxy,
  markProxyStatus,
}) {
  const proxiesToRender = selectedCountry
    ? currentCountryProxies
    : serversList.map((p) => ({
        ...p,
        healthScore: clientCalculateScore(proxyHealth[`${p.host}:${p.port}`]),
      }));

  return (
    <div className="space-y-3.5">
      {/* Country header + back */}
      <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
        <button
          onClick={() => {
            setSelectedCountry(null);
            setActiveRightTab("countries");
          }}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-bold transition-colors cursor-pointer"
        >
          ← Back to Countries
        </button>
        {selectedCountry && (
          <div className="flex items-center gap-2">
            <span className="text-lg">{countryFlag(selectedCountry)}</span>
            <span className="text-sm font-bold text-white">
              {countriesMap[selectedCountry]?.name || selectedCountry}
            </span>
          </div>
        )}
        {selectedCountry && (
          <button
            onClick={() => connectBestInCountry(selectedCountry)}
            className="text-xs font-bold px-3 py-1 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 transition-colors cursor-pointer shadow-sm"
          >
            ⚡ Best Server
          </button>
        )}
      </div>

      {!selectedCountry && (
        <p className="text-xs text-zinc-400">
          Showing full pool of {serversList.length} proxies. Select a country to filter.
        </p>
      )}

      <div className="space-y-2 max-h-100 overflow-y-auto pr-1 no-scrollbar">
        {proxiesToRender.map((proxy) => {
          const key = `${proxy.host}:${proxy.port}`;
          const isActive =
            vpnSelectedServer?.host === proxy.host &&
            vpnSelectedServer?.port === proxy.port;
          const score = proxy.healthScore;
          const tested = score !== null && score !== undefined;

          return (
            <div
              key={key}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isActive
                  ? "bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-950/40"
                  : "bg-[#0f111e] border-zinc-700/70 hover:border-cyan-500/40 hover:bg-[#14172a]"
              }`}
            >
              {/* Proxy info */}
              <button
                onClick={() => handleSelectProxy(proxy)}
                className="flex items-center gap-2.5 text-left cursor-pointer flex-1 min-w-0"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    tested ? scoreDot(score) : "bg-zinc-600"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white font-sans truncate">{proxy.host}</p>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    :{proxy.port} · {proxy.protocol?.toUpperCase()}
                    {proxy.city && ` · ${proxy.city}`}
                  </p>
                </div>
              </button>

              {/* Health Score + Actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <p
                    className={`text-xs font-bold font-sans ${
                      tested ? scoreColor(score) : "text-zinc-500"
                    }`}
                  >
                    {tested ? `${score}%` : "—"}
                  </p>
                  <p className="text-[10px] text-zinc-400">{scoreLabel(score, tested)}</p>
                </div>

                {/* Manual vote buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => markProxyStatus(proxy, true)}
                    title="Mark as working"
                    className="w-5 h-5 rounded-md text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer text-xs flex items-center justify-center border border-zinc-700/60"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => markProxyStatus(proxy, false)}
                    title="Mark as broken"
                    className="w-5 h-5 rounded-md text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer text-xs flex items-center justify-center border border-zinc-700/60"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {isActive && <span className="text-cyan-400 text-xs font-bold">●</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
