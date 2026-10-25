import Toggle from "../ui/Toggle";
import { updateSetting } from "./constants";

export default function VpnCustomProxy({
  vpnCustomMode,
  handleCustomModeToggle,
  vpnCustomConfigMode,
  setVpnCustomConfigMode,
  vpnPacScript,
  setVpnPacScript,
  vpnProtocol,
  setVpnProtocol,
  vpnCustomHost,
  setVpnCustomHost,
  vpnCustomPort,
  setVpnCustomPort,
  vpnBypassList,
  setVpnBypassList,
  toggleConnection,
  vpnConnected,
}) {
  return (
    <div className="space-y-4">
      {/* Toggle Well */}
      <div className="flex items-center justify-between bg-[#0f111e] p-3.5 rounded-xl border border-zinc-700/80 shadow-inner">
        <div>
          <p className="text-xs font-bold text-white">Custom Proxy Override</p>
          <p className="text-[11px] text-zinc-300 font-normal mt-0.5">
            Use your dedicated proxy server instead of pool.
          </p>
        </div>
        <Toggle enabled={vpnCustomMode} onChange={handleCustomModeToggle} />
      </div>

      {vpnCustomMode ? (
        <div className="space-y-3.5">
          {/* Fixed vs PAC toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#0f111e] rounded-xl border border-zinc-700/80 select-none shadow-inner">
            {[
              ["fixed", "🔗 Fixed Host"],
              ["pac", "📜 PAC Script"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => {
                  setVpnCustomConfigMode(val);
                  updateSetting("vpnCustomConfigMode", val);
                }}
                className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  vpnCustomConfigMode === val
                    ? "bg-linear-to-b from-[#1b1e32] to-[#141626] text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {vpnCustomConfigMode === "pac" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                PAC Script Contents
              </label>
              <textarea
                rows="8"
                value={vpnPacScript}
                onChange={(e) => {
                  setVpnPacScript(e.target.value);
                  updateSetting("vpnPacScript", e.target.value);
                }}
                className="w-full bg-[#0f111e] border border-zinc-700/80 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500/60 font-sans leading-relaxed no-scrollbar resize-none shadow-inner"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300 uppercase">Protocol</label>
                <select
                  value={vpnProtocol}
                  onChange={(e) => {
                    setVpnProtocol(e.target.value);
                    updateSetting("vpnProtocol", e.target.value);
                  }}
                  className="bg-[#0f111e] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500/60 shadow-inner cursor-pointer"
                >
                  <option value="http">HTTP Protocol</option>
                  <option value="https">HTTPS Protocol</option>
                  <option value="socks5">SOCKS5 Protocol</option>
                  <option value="socks4">SOCKS4 Protocol</option>
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase">
                    Proxy IP / Host
                  </label>
                  <input
                    type="text"
                    placeholder="185.201.80.100"
                    value={vpnCustomHost}
                    onChange={(e) => {
                      setVpnCustomHost(e.target.value);
                      updateSetting("vpnCustomHost", e.target.value);
                    }}
                    className="bg-[#0f111e] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 font-sans shadow-inner"
                  />
                </div>
                <div className="flex flex-col gap-1 w-24">
                  <label className="text-xs font-bold text-zinc-300 uppercase">Port</label>
                  <input
                    type="text"
                    placeholder="8080"
                    value={vpnCustomPort}
                    onChange={(e) => {
                      setVpnCustomPort(e.target.value);
                      updateSetting("vpnCustomPort", e.target.value);
                    }}
                    className="bg-[#0f111e] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 font-sans shadow-inner"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-300 uppercase">
                  Bypass Domains (One per line)
                </label>
                <textarea
                  rows="3"
                  value={vpnBypassList}
                  onChange={(e) => {
                    setVpnBypassList(e.target.value);
                    updateSetting("vpnBypassList", e.target.value);
                  }}
                  className="w-full bg-[#0f111e] border border-zinc-700/80 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 font-sans no-scrollbar resize-none shadow-inner"
                />
              </div>

              <button
                onClick={toggleConnection}
                disabled={!vpnCustomHost.trim()}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-40 ${
                  vpnConnected
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                    : "bg-cyan-500 text-black hover:bg-cyan-400"
                }`}
              >
                {vpnConnected ? "⏹ Disconnect Proxy" : "▶ Connect via Custom Proxy"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0f111e] border border-zinc-700/80 rounded-xl p-5 text-center text-xs text-zinc-400 shadow-inner">
          Enable Custom Override above to enter your private proxy or PAC URL.
        </div>
      )}
    </div>
  );
}
