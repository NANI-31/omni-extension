import { Shield, Zap, ArrowDown, ArrowUp, HardDrive } from "lucide-react";
import { countryFlag, formatDuration } from "./constants";

export default function VpnMonitorCard({
  vpnConnected,
  vpnCustomMode,
  vpnSelectedServer,
  autoRotateNotif,
  toggleConnection,
  canConnect,
  duration,
  fetchError,
  dlSpeed,
  ulSpeed,
  dataConsumed,
  canvasRef,
  proxyDiagnostics,
}) {
  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 relative overflow-hidden flex flex-col items-center py-8">
      {/* ── Header ── */}
      <div className="w-full flex items-center justify-between border-b border-zinc-700/70 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              VPN Proxy Shield
            </h3>
            <p className="text-xs text-zinc-300 font-sans mt-0.5 truncate max-w-72">
              {vpnCustomMode
                ? "Custom Proxy Mode"
                : vpnSelectedServer
                ? `${countryFlag(vpnSelectedServer.country)} ${
                    vpnSelectedServer.country || "Unknown"
                  } · ${vpnSelectedServer.host}:${vpnSelectedServer.port}`
                : "No server selected"}
            </p>
          </div>
        </div>
        <span
          className={`text-xs border px-3 py-1 rounded-lg font-sans font-bold uppercase shadow-sm ${
            vpnConnected
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-950/40"
              : "bg-[#0f111e] text-zinc-400 border-zinc-700/80 shadow-inner"
          }`}
        >
          {vpnConnected ? "🟢 Protected" : "⚫ Exposed"}
        </span>
      </div>

      {/* ── Auto-Rotate Notification ── */}
      {autoRotateNotif && (
        <div className="w-full mb-4 bg-amber-950/40 border border-amber-500/40 rounded-xl px-4 py-3 text-xs text-amber-200 animate-pulse shadow-lg">
          <div className="flex items-center gap-2 font-bold mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Auto-Rotated Proxy</span>
          </div>
          <p className="text-[11px] text-amber-300/80 font-sans">
            {autoRotateNotif.from} →{" "}
            <span className="text-emerald-300 font-bold">{autoRotateNotif.to}</span>
          </p>
          <p className="text-[10px] text-amber-400/60 mt-0.5 truncate">
            Reason: {autoRotateNotif.reason}
          </p>
        </div>
      )}

      {/* ── Power Button ── */}
      <div className="relative my-4">
        {vpnConnected && (
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping opacity-75 scale-125 pointer-events-none" />
        )}
        <button
          onClick={toggleConnection}
          disabled={!canConnect && !vpnConnected}
          className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 cursor-pointer transition-all duration-500 shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed ${
            vpnConnected
              ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_45px_rgba(6,182,212,0.4)]"
              : "bg-[#0f111e] border-zinc-700/80 text-zinc-400 hover:border-zinc-500 hover:text-white"
          }`}
        >
          <span className="text-3xl leading-none select-none">{vpnConnected ? "🛡️" : "⚡"}</span>
          <span className="text-xs font-black uppercase tracking-widest mt-2 select-none">
            {vpnConnected ? "Disconnect" : "Connect"}
          </span>
        </button>
      </div>

      {/* ── Timer & Location ── */}
      <div className="text-center mt-4 space-y-1 min-h-12">
        <p
          className={`text-2xl font-black font-sans tracking-wider ${
            vpnConnected ? "text-cyan-400" : "text-zinc-500"
          }`}
        >
          {vpnConnected ? formatDuration(duration) : "00:00"}
        </p>
        <p className="text-xs text-zinc-300 font-medium">
          {vpnConnected && vpnSelectedServer
            ? `${countryFlag(vpnSelectedServer.country)} ${
                vpnSelectedServer.countryName || vpnSelectedServer.country || "Unknown"
              } · ${vpnSelectedServer.city || ""}`
            : "Select a proxy server or custom route to connect"}
        </p>
      </div>

      {/* ── Error Banner ── */}
      {fetchError && (
        <div className="w-full mt-4 bg-rose-950/40 border border-rose-500/40 rounded-xl px-4 py-2.5 text-xs text-rose-300 font-sans shadow-md">
          {fetchError}
        </div>
      )}

      {/* ── Speed Indicators ── */}
      <div className="grid grid-cols-3 gap-3 w-full mt-6 border-t border-zinc-700/70 pt-5">
        <div className="bg-[#0f111e] rounded-xl p-3 border border-zinc-700/80 flex items-center gap-2.5 shadow-inner">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <ArrowDown className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Download
            </p>
            <p className="text-xs font-bold font-sans text-white mt-0.5 truncate">
              {(vpnConnected ? dlSpeed : 0).toFixed(1)} Mbps
            </p>
          </div>
        </div>

        <div className="bg-[#0f111e] rounded-xl p-3 border border-zinc-700/80 flex items-center gap-2.5 shadow-inner">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <ArrowUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Upload</p>
            <p className="text-xs font-bold font-sans text-white mt-0.5 truncate">
              {(vpnConnected ? ulSpeed : 0).toFixed(1)} Mbps
            </p>
          </div>
        </div>

        <div className="bg-[#0f111e] rounded-xl p-3 border border-zinc-700/80 flex items-center gap-2.5 shadow-inner">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Used</p>
            <p className="text-xs font-bold font-sans text-white mt-0.5 truncate">
              {dataConsumed.toFixed(2)} MB
            </p>
          </div>
        </div>
      </div>

      {/* ── Canvas Graph ── */}
      <div className="w-full mt-5 space-y-2">
        <div className="flex justify-between items-center text-xs text-zinc-300 px-1 font-medium">
          <span>Traffic Activity Graph</span>
          <span
            className={`text-[10px] font-bold font-sans ${
              vpnConnected ? "text-cyan-400" : "text-zinc-500"
            }`}
          >
            {vpnConnected ? "● LIVE STREAM" : "● IDLE"}
          </span>
        </div>
        <div className="w-full h-20 bg-[#0f111e] rounded-xl border border-zinc-700/80 overflow-hidden shadow-inner">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </div>

      {/* ── Diagnostics Well ── */}
      <div className="w-full mt-5 bg-[#0f111e] rounded-xl border border-zinc-700/80 p-4 space-y-2.5 shadow-inner">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
            Chrome Proxy Route Status
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              proxyDiagnostics.mode === "error"
                ? "bg-rose-500 animate-pulse"
                : proxyDiagnostics.mode === "direct"
                ? "bg-zinc-600"
                : "bg-cyan-400 animate-pulse"
            }`}
          />
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Mode:</span>
            <span
              className={`font-sans uppercase font-bold ${
                proxyDiagnostics.mode === "direct" ? "text-zinc-400" : "text-cyan-300"
              }`}
            >
              {proxyDiagnostics.mode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Control Level:</span>
            <span className="text-zinc-300 font-sans text-[11px]">
              {proxyDiagnostics.levelOfControl}
            </span>
          </div>
          <div
            className={`text-xs font-sans px-3 py-2 rounded-lg mt-1 break-all ${
              proxyDiagnostics.mode !== "direct"
                ? "text-cyan-200 bg-cyan-950/40 border border-cyan-800/40"
                : "text-zinc-400 bg-[#141626] border border-zinc-800"
            }`}
          >
            {proxyDiagnostics.details}
          </div>
        </div>
        {proxyDiagnostics.mode === "direct" && vpnConnected && (
          <p className="text-[11px] text-amber-300 leading-relaxed pt-1.5 border-t border-zinc-800">
            ⚠️ Mode is "direct" — proxy setting may take 2–3s to propagate into Chrome network service.
          </p>
        )}
        {proxyDiagnostics.mode === "fixed_servers" && (
          <p className="text-[11px] text-emerald-300 leading-relaxed pt-1.5 border-t border-zinc-800">
            ✅ Browser traffic is routed through proxy. Verify at{" "}
            <span className="text-cyan-300 font-sans">ipinfo.io</span>
          </p>
        )}
      </div>
    </div>
  );
}
