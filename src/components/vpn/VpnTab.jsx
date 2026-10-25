import { useVpnState } from "./useVpnState";
import VpnMetricsCards from "./VpnMetricsCards";
import VpnMonitorCard from "./VpnMonitorCard";
import VpnCountryList from "./VpnCountryList";
import VpnServerList from "./VpnServerList";
import VpnCustomProxy from "./VpnCustomProxy";

export default function VpnTab() {
  const {
    // Core state
    vpnConnected,
    vpnSelectedServer,
    vpnCustomMode,
    vpnProtocol,
    setVpnProtocol,
    vpnCustomHost,
    setVpnCustomHost,
    vpnCustomPort,
    setVpnCustomPort,
    vpnBypassList,
    setVpnBypassList,
    activeRightTab,
    setActiveRightTab,
    vpnCustomConfigMode,
    setVpnCustomConfigMode,
    vpnPacScript,
    setVpnPacScript,
    serversList,
    isFetchingProxies,
    fetchError,
    fetchProtocol,
    setFetchProtocol,
    selectedCountry,
    setSelectedCountry,
    proxyHealth,
    autoRotateNotif,

    // Stats & Refs
    duration,
    dlSpeed,
    ulSpeed,
    dataConsumed,
    canvasRef,
    proxyDiagnostics,

    // Computed
    countriesMap,
    countries,
    currentCountryProxies,
    canConnect,

    // Actions
    toggleConnection,
    handleSelectProxy,
    connectBestInCountry,
    handleCountryClick,
    fetchLiveProxies,
    markProxyStatus,
    handleCustomModeToggle,
  } = useVpnState();

  return (
    <div className="space-y-6 text-zinc-100 font-sans pb-8">
      {/* ── Top Metric Stat Cards ── */}
      <VpnMetricsCards
        vpnConnected={vpnConnected}
        vpnCustomMode={vpnCustomMode}
        vpnSelectedServer={vpnSelectedServer}
        dlSpeed={dlSpeed}
        ulSpeed={ulSpeed}
        dataConsumed={dataConsumed}
        vpnCustomConfigMode={vpnCustomConfigMode}
        vpnProtocol={vpnProtocol}
        serversListLength={serversList.length}
      />

      {/* ── Main VPN Controls Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT: Monitor & Power ── */}
        <div className="lg:col-span-7 space-y-5">
          <VpnMonitorCard
            vpnConnected={vpnConnected}
            vpnCustomMode={vpnCustomMode}
            vpnSelectedServer={vpnSelectedServer}
            autoRotateNotif={autoRotateNotif}
            toggleConnection={toggleConnection}
            canConnect={canConnect}
            duration={duration}
            fetchError={fetchError}
            dlSpeed={dlSpeed}
            ulSpeed={ulSpeed}
            dataConsumed={dataConsumed}
            canvasRef={canvasRef}
            proxyDiagnostics={proxyDiagnostics}
          />
        </div>

        {/* ── RIGHT: Country / Proxy / Custom Tabs ── */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-0">
          <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 shadow-xl shadow-black/60 space-y-4">
            {/* Tab Bar */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0f111e] rounded-xl border border-zinc-700/80 select-none shadow-inner">
              {[
                ["countries", "🌍 Countries"],
                ["proxies", "📡 Servers"],
                ["custom", "⚙️ Custom"],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveRightTab(tab)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeRightTab === tab
                      ? "bg-linear-to-b from-[#1b1e32] to-[#141626] text-white border border-cyan-500/40 shadow-sm text-cyan-200"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* TAB: Countries */}
            {activeRightTab === "countries" && (
              <VpnCountryList
                fetchProtocol={fetchProtocol}
                setFetchProtocol={setFetchProtocol}
                fetchLiveProxies={fetchLiveProxies}
                isFetchingProxies={isFetchingProxies}
                countries={countries}
                handleCountryClick={handleCountryClick}
                connectBestInCountry={connectBestInCountry}
                vpnConnected={vpnConnected}
                vpnSelectedServer={vpnSelectedServer}
              />
            )}

            {/* TAB: Proxy Servers (for selected country) */}
            {activeRightTab === "proxies" && (
              <VpnServerList
                setSelectedCountry={setSelectedCountry}
                setActiveRightTab={setActiveRightTab}
                selectedCountry={selectedCountry}
                countriesMap={countriesMap}
                connectBestInCountry={connectBestInCountry}
                serversList={serversList}
                currentCountryProxies={currentCountryProxies}
                proxyHealth={proxyHealth}
                vpnSelectedServer={vpnSelectedServer}
                handleSelectProxy={handleSelectProxy}
                markProxyStatus={markProxyStatus}
              />
            )}

            {/* TAB: Custom Proxy */}
            {activeRightTab === "custom" && (
              <VpnCustomProxy
                vpnCustomMode={vpnCustomMode}
                handleCustomModeToggle={handleCustomModeToggle}
                vpnCustomConfigMode={vpnCustomConfigMode}
                setVpnCustomConfigMode={setVpnCustomConfigMode}
                vpnPacScript={vpnPacScript}
                setVpnPacScript={setVpnPacScript}
                vpnProtocol={vpnProtocol}
                setVpnProtocol={setVpnProtocol}
                vpnCustomHost={vpnCustomHost}
                setVpnCustomHost={setVpnCustomHost}
                vpnCustomPort={vpnCustomPort}
                setVpnCustomPort={setVpnCustomPort}
                vpnBypassList={vpnBypassList}
                setVpnBypassList={setVpnBypassList}
                toggleConnection={toggleConnection}
                vpnConnected={vpnConnected}
              />
            )}
          </div>

          {/* Setup / Diagnostics Notice */}
          <div className="rounded-xl border border-zinc-700/80 bg-[#0f111e] p-4 text-xs text-zinc-300 leading-relaxed shadow-inner">
            <p className="font-bold text-white uppercase text-[11px] mb-1">
              📌 Chrome Proxy Notice
            </p>
            Network permissions apply globally to Chrome tabs. If another extension controls proxies, Chrome grants control based on extension priority.
          </div>
        </div>
      </div>
    </div>
  );
}
