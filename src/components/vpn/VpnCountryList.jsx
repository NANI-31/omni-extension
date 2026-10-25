import { RefreshCw, Globe } from "lucide-react";
import { scoreDot, scoreColor } from "./constants";

export default function VpnCountryList({
  fetchProtocol,
  setFetchProtocol,
  fetchLiveProxies,
  isFetchingProxies,
  countries,
  handleCountryClick,
  connectBestInCountry,
  vpnConnected,
  vpnSelectedServer,
}) {
  return (
    <div className="space-y-3.5">
      {/* Fetch Controls */}
      <div className="flex gap-2">
        <select
          value={fetchProtocol}
          onChange={(e) => setFetchProtocol(e.target.value)}
          className="flex-1 bg-[#0f111e] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60 shadow-inner cursor-pointer"
        >
          <option value="http">HTTP Protocol</option>
          <option value="https">HTTPS Protocol</option>
          <option value="socks5">SOCKS5 Protocol</option>
          <option value="socks4">SOCKS4 Protocol</option>
        </select>
        <button
          onClick={fetchLiveProxies}
          disabled={isFetchingProxies}
          className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          {isFetchingProxies ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" /> Fetch Pool
            </>
          )}
        </button>
      </div>

      {countries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 border border-dashed border-zinc-700/80 bg-[#0f111e] rounded-xl p-4 shadow-inner">
          <Globe className="w-8 h-8 text-zinc-500 opacity-60" />
          <p className="text-sm font-bold text-zinc-300">No countries loaded</p>
          <p className="text-xs text-zinc-400 max-w-55 leading-relaxed font-normal">
            Click "Fetch Pool" above — proxies will automatically be geo-located and organized by country.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-105 overflow-y-auto pr-1 no-scrollbar">
          {countries.map((country) => {
            const bestScore = country.proxies[0]?.healthScore;
            const testedCount = country.proxies.filter((p) => p.healthScore !== null).length;
            return (
              <div
                key={country.code}
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-700/70 bg-[#0f111e] hover:border-cyan-500/40 hover:bg-[#14172a] transition-all group shadow-inner"
              >
                {/* Left: Flag + Info */}
                <button
                  onClick={() => handleCountryClick(country.code)}
                  className="flex items-center gap-3 text-left flex-1 cursor-pointer min-w-0"
                >
                  <span className="text-2xl select-none">{country.flag}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors truncate">
                      {country.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                      {country.proxies.length} server{country.proxies.length !== 1 ? "s" : ""}
                      {testedCount > 0 && ` · ${testedCount} tested`}
                    </p>
                  </div>
                </button>

                {/* Right: Score + Connect */}
                <div className="flex items-center gap-2 shrink-0">
                  {bestScore !== null && bestScore !== undefined ? (
                    <div className="flex items-center gap-1 font-sans">
                      <span className={`w-2 h-2 rounded-full ${scoreDot(bestScore)}`} />
                      <span className={`text-xs font-bold ${scoreColor(bestScore)}`}>{bestScore}%</span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">—</span>
                  )}
                  <button
                    onClick={() => connectBestInCountry(country.code)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    {vpnConnected && vpnSelectedServer?.country === country.code ? "✓ Active" : "Connect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
