import { ShieldCheck, Activity, Radio } from "lucide-react";
import { countryFlag } from "./constants";

export default function VpnMetricsCards({
  vpnConnected,
  vpnCustomMode,
  vpnSelectedServer,
  dlSpeed,
  ulSpeed,
  dataConsumed,
  vpnCustomConfigMode,
  vpnProtocol,
  serversListLength,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* Card 1: Proxy Shield Status */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-cyan-500/40 hover:shadow-cyan-950/20 transition-all">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Proxy Shield</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                vpnConnected
                  ? "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse"
                  : "bg-zinc-500"
              }`}
            />
            <h4 className="text-sm font-black text-white tracking-tight truncate">
              {vpnConnected ? "Protected Route" : "Direct / Exposed"}
            </h4>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans truncate mt-0.5">
            {vpnCustomMode
              ? "Custom Override Active"
              : vpnSelectedServer
              ? `${countryFlag(vpnSelectedServer.country)} ${
                  vpnSelectedServer.countryName || vpnSelectedServer.country || "Active"
                }`
              : "No proxy chosen"}
          </p>
        </div>
      </div>

      {/* Card 2: Bandwidth & Throughput */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-cyan-500/40 hover:shadow-cyan-950/20 transition-all">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm">
          <Activity className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Bandwidth & Traffic</p>
          <h4 className="text-sm font-black text-white tracking-tight">
            {(vpnConnected ? dlSpeed : 0).toFixed(1)} Mbps DL
          </h4>
          <p className="text-[11px] text-zinc-400 font-sans truncate mt-0.5">
            ⬆ {(vpnConnected ? ulSpeed : 0).toFixed(1)} Mbps · {dataConsumed.toFixed(2)} MB total
          </p>
        </div>
      </div>

      {/* Card 3: Protocol & Routing Status */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-cyan-500/40 hover:shadow-cyan-950/20 transition-all">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm">
          <Radio className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Routing Protocol</p>
          <h4 className="text-sm font-black text-white tracking-tight uppercase">
            {vpnCustomMode
              ? vpnCustomConfigMode === "pac"
                ? "PAC Script"
                : `${vpnProtocol} Custom`
              : vpnSelectedServer?.protocol
              ? `${vpnSelectedServer.protocol.toUpperCase()}`
              : "HTTP Pool"}
          </h4>
          <p className="text-[11px] text-zinc-400 font-sans truncate mt-0.5">
            {vpnSelectedServer
              ? `${vpnSelectedServer.host}:${vpnSelectedServer.port}`
              : `${serversListLength} Pool Servers`}
          </p>
        </div>
      </div>
    </div>
  );
}
