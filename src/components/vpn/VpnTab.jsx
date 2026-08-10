import React, { useState, useEffect, useRef, useMemo } from "react";

// ─── Country code → flag emoji ─────────────────────────────────────────────
const countryFlag = (code) => {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
};

const COUNTRY_NAMES = {
  US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France",
  JP: "Japan", SG: "Singapore", NL: "Netherlands", CA: "Canada",
  AU: "Australia", BR: "Brazil", IN: "India", RU: "Russia",
  HK: "Hong Kong", KR: "South Korea", IT: "Italy", ES: "Spain",
  PL: "Poland", SE: "Sweden", NO: "Norway", FI: "Finland",
  CH: "Switzerland", TR: "Turkey", UA: "Ukraine", CN: "China",
};

// ─── Health score UI helpers ────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}
function scoreDot(score) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}
function scoreLabel(score, tested) {
  if (!tested) return "Untested";
  if (score >= 75) return "Healthy";
  if (score >= 50) return "Fair";
  return "Poor";
}

// Client-side score calculation mirrors health.js
function clientCalculateScore(h) {
  if (!h) return null; // null = untested
  const total = (h.successCount || 0) + (h.failureCount || 0);
  if (total === 0) return null;
  const rate = h.successCount / total;
  const hoursSince = (Date.now() - (h.lastChecked || 0)) / 3_600_000;
  const recency = Math.max(0.4, 1 - hoursSince / 48);
  return Math.round(rate * 100 * recency);
}

export default function VpnTab() {
  // ── Core VPN State ─────────────────────────────────────────────────────────
  const [vpnConnected, setVpnConnected] = useState(false);
  const [vpnSelectedServer, setVpnSelectedServer] = useState(null);
  const [vpnCustomMode, setVpnCustomMode] = useState(false);
  const [vpnProtocol, setVpnProtocol] = useState("http");
  const [vpnCustomHost, setVpnCustomHost] = useState("");
  const [vpnCustomPort, setVpnCustomPort] = useState("8080");
  const [vpnBypassList, setVpnBypassList] = useState("localhost\n127.0.0.1\n*.local");
  const [activeRightTab, setActiveRightTab] = useState("countries");
  const [vpnCustomConfigMode, setVpnCustomConfigMode] = useState("fixed");
  const [vpnPacScript, setVpnPacScript] = useState(
    `function FindProxyForURL(url, host) {\n  return "PROXY 127.0.0.1:8080; DIRECT";\n}`
  );

  // ── Proxy Pool State ────────────────────────────────────────────────────────
  const [serversList, setServersList] = useState([]);
  const [isFetchingProxies, setIsFetchingProxies] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchProtocol, setFetchProtocol] = useState("http");

  // ── Country Navigation ─────────────────────────────────────────────────────
  const [selectedCountry, setSelectedCountry] = useState(null); // country code
  const [proxyHealth, setProxyHealth] = useState({}); // { "ip:port": { score, ... } }
  const [autoRotateNotif, setAutoRotateNotif] = useState(null);

  // ── Simulated Stats ────────────────────────────────────────────────────────
  const [duration, setDuration] = useState(0);
  const [dlSpeed, setDlSpeed] = useState(0.0);
  const [ulSpeed, setUlSpeed] = useState(0.0);
  const [dataConsumed, setDataConsumed] = useState(0.0);

  const timerRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasAnimationIdRef = useRef(null);
  const dataPointsRef = useRef([]);

  // ── Load persisted state ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) return;
    chrome.storage.local.get(
      [
        "vpnConnected", "vpnSelectedServer", "vpnCustomMode", "vpnProtocol",
        "vpnCustomHost", "vpnCustomPort", "vpnBypassList", "vpnDataConsumed",
        "vpnCustomConfigMode", "vpnPacScript", "vpnFetchedProxies", "vpnSelectedCountry",
        "vpnAutoRotateNotif",
      ],
      (r) => {
        if (r.vpnConnected !== undefined) setVpnConnected(r.vpnConnected);
        if (r.vpnSelectedServer) setVpnSelectedServer(r.vpnSelectedServer);
        if (r.vpnCustomMode !== undefined) setVpnCustomMode(r.vpnCustomMode);
        if (r.vpnProtocol) setVpnProtocol(r.vpnProtocol);
        if (r.vpnCustomHost !== undefined) setVpnCustomHost(r.vpnCustomHost);
        if (r.vpnCustomPort !== undefined) setVpnCustomPort(r.vpnCustomPort);
        if (r.vpnBypassList !== undefined) setVpnBypassList(r.vpnBypassList);
        if (r.vpnDataConsumed !== undefined) setDataConsumed(Number(r.vpnDataConsumed));
        if (r.vpnCustomConfigMode) setVpnCustomConfigMode(r.vpnCustomConfigMode);
        if (r.vpnPacScript) setVpnPacScript(r.vpnPacScript);
        if (r.vpnFetchedProxies?.length) setServersList(r.vpnFetchedProxies);
        if (r.vpnSelectedCountry) setSelectedCountry(r.vpnSelectedCountry);
        if (r.vpnAutoRotateNotif) setAutoRotateNotif(r.vpnAutoRotateNotif);
      }
    );
  }, []);

  // ── Load and sync health scores ────────────────────────────────────────────
  const loadHealthScores = () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "GET_PROXY_HEALTH" }, (resp) => {
        if (chrome.runtime.lastError) return;
        if (resp?.success) setProxyHealth(resp.health || {});
      });
    }
  };

  useEffect(() => {
    loadHealthScores();
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) return;
    const listener = (changes, area) => {
      if (area !== "local") return;
      if (changes.vpnProxyHealth) loadHealthScores();
      if (changes.vpnAutoRotateNotif?.newValue) {
        setAutoRotateNotif(changes.vpnAutoRotateNotif.newValue);
        setTimeout(() => setAutoRotateNotif(null), 6000);
      }
      if (changes.vpnSelectedServer?.newValue) {
        setVpnSelectedServer(changes.vpnSelectedServer.newValue);
      }
      if (changes.vpnConnected !== undefined) {
        setVpnConnected(changes.vpnConnected.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // ── Proxy Diagnostics ─────────────────────────────────────────────────────
  const [proxyDiagnostics, setProxyDiagnostics] = useState({
    levelOfControl: "loading", mode: "direct", details: "Initializing...",
  });
  useEffect(() => {
    const check = () => {
      if (typeof chrome !== "undefined" && chrome.proxy?.settings) {
        chrome.proxy.settings.get({ incognito: false }, (d) => {
          if (chrome.runtime.lastError) {
            setProxyDiagnostics({ levelOfControl: "error", mode: "error", details: chrome.runtime.lastError.message });
            return;
          }
          const mode = d.value?.mode || "direct";
          let details = "Direct connection — no proxy active";
          if (mode === "fixed_servers") {
            const sp = d.value?.rules?.singleProxy;
            details = sp ? `✅ Routing via: ${sp.scheme}://${sp.host}:${sp.port}` : "Fixed server active";
          } else if (mode === "pac_script") {
            details = "🔄 PAC script routing active";
          }
          setProxyDiagnostics({ levelOfControl: d.levelOfControl, mode, details });
        });
      }
    };
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, [vpnConnected]);

  // ── Timer & Simulated Stats ────────────────────────────────────────────────
  useEffect(() => {
    if (vpnConnected) {
      const t0 = Date.now() - duration * 1000;
      timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - t0) / 1000)), 1000);
      statsIntervalRef.current = setInterval(() => {
        const dl = +(Math.random() * 4 + 1.5).toFixed(1);
        const ul = +(Math.random() * 1 + 0.4).toFixed(1);
        setDlSpeed(dl);
        setUlSpeed(ul);
        setDataConsumed((p) => {
          const t = p + (dl / 8) * 1.5 / 1024;
          updateSetting("vpnDataConsumed", t);
          return t;
        });
      }, 1500);
    } else {
      clearInterval(timerRef.current);
      clearInterval(statsIntervalRef.current);
      setDuration(0); setDlSpeed(0); setUlSpeed(0);
    }
    return () => { clearInterval(timerRef.current); clearInterval(statsIntervalRef.current); };
  }, [vpnConnected]);

  // ── Canvas Graph ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const onResize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };
    window.addEventListener("resize", onResize);
    const render = () => {
      if (!vpnConnected) {
        ctx.clearRect(0, 0, w, h);
        canvasAnimationIdRef.current = requestAnimationFrame(render);
        return;
      }
      dataPointsRef.current.push(dlSpeed + (Math.random() * 2 - 1));
      if (dataPointsRef.current.length > w) dataPointsRef.current.shift();
      ctx.clearRect(0, 0, w, h);
      const mx = Math.max(...dataPointsRef.current, 1);
      ctx.beginPath();
      dataPointsRef.current.forEach((v, i) => {
        const x = (i / dataPointsRef.current.length) * w;
        const y = h - (v / mx) * (h * 0.85);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      const glow = "rgba(6,182,212,0.85)";
      ctx.strokeStyle = glow; ctx.lineWidth = 2.5; ctx.shadowBlur = 8; ctx.shadowColor = glow; ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      const fg = ctx.createLinearGradient(0, 0, 0, h);
      fg.addColorStop(0, "rgba(6,182,212,0.12)"); fg.addColorStop(1, "transparent");
      ctx.fillStyle = fg; ctx.fill();
      canvasAnimationIdRef.current = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(canvasAnimationIdRef.current); };
  }, [vpnConnected, dlSpeed]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateSetting = (key, val) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) chrome.storage.local.set({ [key]: val });
  };

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h > 0 ? String(h).padStart(2, "0") : null, String(m).padStart(2, "0"), String(sec).padStart(2, "0")]
      .filter(Boolean).join(":");
  };

  // ── Country grouping ───────────────────────────────────────────────────────
  const countriesMap = useMemo(() => {
    const map = {};
    serversList.forEach((proxy) => {
      const cc = proxy.country || "__";
      if (!map[cc]) map[cc] = {
        code: cc,
        name: proxy.countryName || COUNTRY_NAMES[cc] || "Unknown",
        flag: countryFlag(cc),
        proxies: [],
      };
      const score = clientCalculateScore(proxyHealth[`${proxy.host}:${proxy.port}`]);
      map[cc].proxies.push({ ...proxy, healthScore: score });
    });
    // Sort proxies within each country: healthy first
    Object.values(map).forEach((c) => {
      c.proxies.sort((a, b) => (b.healthScore ?? 50) - (a.healthScore ?? 50));
    });
    return map;
  }, [serversList, proxyHealth]);

  const countries = useMemo(() =>
    Object.values(countriesMap).sort((a, b) => b.proxies.length - a.proxies.length),
    [countriesMap]
  );

  // ── Connection Actions ─────────────────────────────────────────────────────
  const toggleConnection = () => {
    if (!vpnConnected && !vpnCustomMode && !vpnSelectedServer?.host) {
      setFetchError("⚠️ Select a proxy from a country list, or enable Custom Proxy.");
      setActiveRightTab("countries");
      return;
    }
    const next = !vpnConnected;
    setVpnConnected(next);
    updateSetting("vpnConnected", next);
    if (next) setFetchError("");
  };

  const handleSelectProxy = (proxy) => {
    setVpnSelectedServer(proxy);
    updateSetting("vpnSelectedServer", proxy);
    if (vpnConnected) {
      setVpnConnected(false);
      updateSetting("vpnConnected", false);
      setTimeout(() => { setVpnConnected(true); updateSetting("vpnConnected", true); }, 500);
    }
  };

  const connectBestInCountry = (countryCode) => {
    const country = countriesMap[countryCode];
    if (!country?.proxies.length) return;
    const best = country.proxies[0]; // already sorted by health score
    setVpnSelectedServer(best);
    updateSetting("vpnSelectedServer", best);
    updateSetting("vpnSelectedCountry", countryCode);
    setSelectedCountry(countryCode);
    if (!vpnConnected) {
      setVpnConnected(true);
      updateSetting("vpnConnected", true);
    } else {
      setVpnConnected(false);
      updateSetting("vpnConnected", false);
      setTimeout(() => { setVpnConnected(true); updateSetting("vpnConnected", true); }, 500);
    }
  };

  const handleCountryClick = (countryCode) => {
    setSelectedCountry(countryCode);
    setActiveRightTab("proxies");
  };

  // ── Fetch Live Proxies ─────────────────────────────────────────────────────
  const fetchLiveProxies = () => {
    if (isFetchingProxies) return;
    setIsFetchingProxies(true);
    setFetchError("");
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      setIsFetchingProxies(false);
      setFetchError("chrome.runtime not available. Reload the extension.");
      return;
    }
    chrome.runtime.sendMessage({ type: "FETCH_PROXIES", protocol: fetchProtocol }, (resp) => {
      setIsFetchingProxies(false);
      if (chrome.runtime.lastError) {
        setFetchError("Extension error: " + chrome.runtime.lastError.message);
        return;
      }
      if (resp?.success && resp.proxies?.length > 0) {
        setServersList(resp.proxies);
        updateSetting("vpnFetchedProxies", resp.proxies);
        loadHealthScores();
        // Navigate to country view
        setSelectedCountry(null);
        setActiveRightTab("countries");
      } else {
        setFetchError(resp?.error || "No proxies returned. Try again.");
      }
    });
  };

  const markProxyStatus = (proxy, success) => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: "REPORT_PROXY_STATUS",
        host: proxy.host, port: proxy.port, success,
        reason: success ? "" : "manual user report",
      }, () => loadHealthScores());
    }
  };

  const handleCustomModeToggle = () => {
    const next = !vpnCustomMode;
    setVpnCustomMode(next);
    updateSetting("vpnCustomMode", next);
  };

  const currentCountryProxies = selectedCountry ? (countriesMap[selectedCountry]?.proxies || []) : [];
  const canConnect = vpnCustomMode
    ? (vpnCustomConfigMode === "pac" || !!vpnCustomHost.trim())
    : !!vpnSelectedServer?.host;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* ── LEFT: Monitor & Power ─────────────────────────────────────────── */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col items-center py-10 before:absolute before:inset-0 before:bg-linear-to-br before:from-cyan-500/5 before:to-transparent before:pointer-events-none">

          {/* ── Header ── */}
          <div className="w-full flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-8">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔒</span>
              <div>
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">VPN Proxy Shield</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {vpnCustomMode ? "Custom Proxy Mode" : vpnSelectedServer
                    ? `${countryFlag(vpnSelectedServer.country)} ${vpnSelectedServer.country || "Unknown"} · ${vpnSelectedServer.host}:${vpnSelectedServer.port}`
                    : "No server selected"}
                </p>
              </div>
            </div>
            <span className={`text-[10px] border px-2.5 py-0.5 rounded font-mono font-bold uppercase ${
              vpnConnected ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-zinc-800/50 text-zinc-500 border-zinc-800"
            }`}>
              {vpnConnected ? "🟢 Protected" : "⚫ Exposed"}
            </span>
          </div>

          {/* ── Auto-Rotate Notification ── */}
          {autoRotateNotif && (
            <div className="w-full mb-4 bg-amber-950/30 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-300 animate-pulse">
              <p className="font-bold mb-0.5">⚡ Auto-Rotated Proxy</p>
              <p className="text-[10px] text-amber-400/70 font-mono">
                {autoRotateNotif.from} → <span className="text-emerald-400">{autoRotateNotif.to}</span>
              </p>
              <p className="text-[9px] text-amber-500/60 mt-0.5 truncate">Reason: {autoRotateNotif.reason}</p>
            </div>
          )}

          {/* ── Power Button ── */}
          <div className="relative my-4">
            {vpnConnected && <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping opacity-60 scale-125 pointer-events-none" />}
            <button
              onClick={toggleConnection}
              disabled={!canConnect && !vpnConnected}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 cursor-pointer transition-all duration-500 shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed ${
                vpnConnected
                  ? "bg-cyan-950/20 border-cyan-500 text-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.35)]"
                  : "bg-zinc-950 border-zinc-700 text-zinc-500 hover:border-zinc-500"
              }`}
            >
              <span className="text-4xl leading-none select-none">{vpnConnected ? "🔵" : "⚫"}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest mt-2 select-none">
                {vpnConnected ? "Disconnect" : "Connect"}
              </span>
            </button>
          </div>

          {/* ── Timer ── */}
          <div className="text-center mt-6 space-y-1.5 min-h-12">
            <p className={`text-xl font-bold font-mono tracking-wider ${vpnConnected ? "text-cyan-400" : "text-zinc-600"}`}>
              {vpnConnected ? formatDuration(duration) : "00:00"}
            </p>
            <p className="text-xs text-zinc-500">
              {vpnConnected && vpnSelectedServer
                ? `${countryFlag(vpnSelectedServer.country)} ${vpnSelectedServer.countryName || vpnSelectedServer.country || "Unknown"} · ${vpnSelectedServer.city || ""}`
                : "Select a proxy to connect"}
            </p>
          </div>

          {/* ── Error Banner ── */}
          {fetchError && (
            <div className="w-full mt-4 bg-rose-950/30 border border-rose-500/30 rounded-xl px-4 py-2.5 text-xs text-rose-400 font-mono">
              {fetchError}
            </div>
          )}

          {/* ── Speed Indicators ── */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-8 border-t border-zinc-800/60 pt-6">
            {[["⬇️", "Download", `${dlSpeed.toFixed(1)} Mbps`], ["⬆️", "Upload", `${ulSpeed.toFixed(1)} Mbps`], ["📊", "Used", `${dataConsumed.toFixed(2)} MB`]].map(([icon, label, val]) => (
              <div key={label} className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-900/60 flex items-center gap-2">
                <span className="text-lg shrink-0">{icon}</span>
                <div>
                  <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-bold font-mono text-zinc-200 mt-0.5">{val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Canvas Graph ── */}
          <div className="w-full mt-5 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-zinc-500 px-1">
              <span>Traffic Graph</span>
              <span className={`text-[10px] font-semibold ${vpnConnected ? "text-cyan-400" : "text-zinc-600"}`}>
                {vpnConnected ? "● LIVE" : "● IDLE"}
              </span>
            </div>
            <div className="w-full h-20 bg-zinc-950 rounded-xl border border-zinc-900/80 overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
          </div>

          {/* ── Diagnostics ── */}
          <div className="w-full mt-5 bg-zinc-950/65 rounded-xl border border-zinc-900 p-3.5 space-y-2">
            <div className="flex justify-between items-center border-b border-zinc-900/80 pb-1.5">
              <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Chrome Proxy Route</span>
              <span className={`w-2 h-2 rounded-full ${
                proxyDiagnostics.mode === "error" ? "bg-rose-500 animate-pulse"
                : proxyDiagnostics.mode === "direct" ? "bg-zinc-600"
                : "bg-cyan-500 animate-pulse"
              }`} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">Mode:</span>
                <span className={`font-mono uppercase font-bold ${proxyDiagnostics.mode === "direct" ? "text-zinc-500" : "text-cyan-400"}`}>
                  {proxyDiagnostics.mode}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">Control:</span>
                <span className="text-zinc-400 font-mono text-[9px]">{proxyDiagnostics.levelOfControl}</span>
              </div>
              <div className={`text-[10px] font-mono px-2 py-1.5 rounded mt-1 break-all ${
                proxyDiagnostics.mode !== "direct" ? "text-cyan-300 bg-cyan-950/20 border border-cyan-900/30" : "text-zinc-500 bg-zinc-900/30"
              }`}>
                {proxyDiagnostics.details}
              </div>
            </div>
            {proxyDiagnostics.mode === "direct" && vpnConnected && (
              <p className="text-[9px] text-amber-400/80 leading-relaxed pt-1 border-t border-zinc-900/60">
                ⚠️ Mode is "direct" — proxy may not be set yet. Wait 2–3 s or check the extension service worker logs.
              </p>
            )}
            {proxyDiagnostics.mode === "fixed_servers" && (
              <p className="text-[9px] text-emerald-400/80 leading-relaxed pt-1 border-t border-zinc-900/60">
                ✅ Browser traffic is routed through the proxy. Verify at <span className="text-cyan-400">ipinfo.io</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Country / Proxy / Custom ─────────────────────────────────── */}
      <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-0">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">

          {/* Tab Bar */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-900/85 mb-5 select-none">
            {[["countries", "🌍 Countries"], ["proxies", "📡 Servers"], ["custom", "⚙️ Custom"]].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveRightTab(tab)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeRightTab === tab ? "bg-zinc-800 text-white shadow-md border border-zinc-700/60" : "text-zinc-500 hover:text-zinc-350"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB: Countries ──────────────────────────────────────────────── */}
          {activeRightTab === "countries" && (
            <div className="space-y-3">
              {/* Fetch Controls */}
              <div className="flex gap-2">
                <select
                  value={fetchProtocol}
                  onChange={(e) => setFetchProtocol(e.target.value)}
                  className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks5">SOCKS5</option>
                  <option value="socks4">SOCKS4</option>
                </select>
                <button
                  onClick={fetchLiveProxies}
                  disabled={isFetchingProxies}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isFetchingProxies ? <><span className="animate-spin">⟳</span> Fetching...</> : <>🔄 Fetch Proxies</>}
                </button>
              </div>

              {countries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 border border-dashed border-zinc-800 rounded-xl">
                  <span className="text-4xl">🌍</span>
                  <p className="text-sm font-semibold text-zinc-400">No countries loaded</p>
                  <p className="text-xs text-zinc-600 max-w-55 leading-relaxed">
                    Fetch proxies above — they'll automatically be geo-located and grouped by country.
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
                        className="flex items-center justify-between p-3 rounded-xl border border-zinc-900 bg-zinc-950/30 hover:bg-zinc-800/30 transition-all group"
                      >
                        {/* Left: Flag + Info */}
                        <button
                          onClick={() => handleCountryClick(country.code)}
                          className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                        >
                          <span className="text-2xl select-none">{country.flag}</span>
                          <div>
                            <p className="text-sm font-bold text-zinc-200">{country.name}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {country.proxies.length} server{country.proxies.length !== 1 ? "s" : ""}
                              {testedCount > 0 && ` · ${testedCount} tested`}
                            </p>
                          </div>
                        </button>

                        {/* Right: Score + Connect */}
                        <div className="flex items-center gap-2 shrink-0">
                          {bestScore !== null && bestScore !== undefined ? (
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${scoreDot(bestScore)}`} />
                              <span className={`text-[10px] font-bold font-mono ${scoreColor(bestScore)}`}>{bestScore}%</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-600">—</span>
                          )}
                          <button
                            onClick={() => connectBestInCountry(country.code)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/25 transition-colors cursor-pointer whitespace-nowrap"
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
          )}

          {/* ── TAB: Proxy Servers (for selected country) ───────────────────── */}
          {activeRightTab === "proxies" && (
            <div className="space-y-3">
              {/* Country header + back */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setSelectedCountry(null); setActiveRightTab("countries"); }}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                {selectedCountry && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{countryFlag(selectedCountry)}</span>
                    <span className="text-sm font-bold text-zinc-200">
                      {countriesMap[selectedCountry]?.name || selectedCountry}
                    </span>
                  </div>
                )}
                {selectedCountry && (
                  <button
                    onClick={() => connectBestInCountry(selectedCountry)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 transition-colors cursor-pointer"
                  >
                    ⚡ Best
                  </button>
                )}
              </div>

              {/* Show all proxies / full pool if no country selected */}
              {!selectedCountry && (
                <p className="text-xs text-zinc-500">Showing all {serversList.length} proxies. Select a country to filter.</p>
              )}

              <div className="space-y-2 max-h-100 overflow-y-auto pr-1 no-scrollbar">
                {(selectedCountry ? currentCountryProxies : serversList.map((p) => ({
                  ...p,
                  healthScore: clientCalculateScore(proxyHealth[`${p.host}:${p.port}`])
                }))).map((proxy) => {
                  const key = `${proxy.host}:${proxy.port}`;
                  const isActive = vpnSelectedServer?.host === proxy.host && vpnSelectedServer?.port === proxy.port;
                  const score = proxy.healthScore;
                  const tested = score !== null && score !== undefined;
                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isActive ? "bg-cyan-500/10 border-cyan-500/30" : "bg-zinc-950/30 border-zinc-900 hover:bg-zinc-800/30"
                      }`}
                    >
                      {/* Proxy info */}
                      <button
                        onClick={() => handleSelectProxy(proxy)}
                        className="flex items-center gap-2.5 text-left cursor-pointer flex-1 min-w-0"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${tested ? scoreDot(score) : "bg-zinc-600"}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-200 font-mono truncate">{proxy.host}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            :{proxy.port} · {proxy.protocol?.toUpperCase()}
                            {proxy.city && ` · ${proxy.city}`}
                          </p>
                        </div>
                      </button>

                      {/* Health Score + Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className={`text-[10px] font-bold ${tested ? scoreColor(score) : "text-zinc-600"}`}>
                            {tested ? `${score}%` : "—"}
                          </p>
                          <p className="text-[9px] text-zinc-600">{scoreLabel(score, tested)}</p>
                        </div>
                        {/* Manual good/bad buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => markProxyStatus(proxy, true)}
                            title="Mark as working"
                            className="w-5 h-5 rounded text-emerald-500 hover:bg-emerald-950/40 transition-colors cursor-pointer text-[11px] flex items-center justify-center"
                          >✓</button>
                          <button
                            onClick={() => markProxyStatus(proxy, false)}
                            title="Mark as broken"
                            className="w-5 h-5 rounded text-rose-500 hover:bg-rose-950/40 transition-colors cursor-pointer text-[11px] flex items-center justify-center"
                          >✕</button>
                        </div>
                        {isActive && <span className="text-cyan-400 text-xs font-bold">●</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB: Custom Proxy ───────────────────────────────────────────── */}
          {activeRightTab === "custom" && (
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between bg-zinc-950/40 p-3 rounded-xl border border-zinc-800">
                <div>
                  <p className="text-xs font-bold text-zinc-200">Custom Proxy Override</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Use your own proxy instead of the pool.</p>
                </div>
                <button
                  onClick={handleCustomModeToggle}
                  className={`w-9 h-5 rounded-full relative cursor-pointer shrink-0 transition-colors ${vpnCustomMode ? "bg-cyan-500" : "bg-zinc-700"}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${vpnCustomMode ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>

              {vpnCustomMode ? (
                <div className="space-y-3.5">
                  {/* Fixed vs PAC toggle */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-900 select-none">
                    {[["fixed", "🔗 Fixed Host"], ["pac", "📜 PAC Script"]].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => { setVpnCustomConfigMode(val); updateSetting("vpnCustomConfigMode", val); }}
                        className={`py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          vpnCustomConfigMode === val ? "bg-zinc-900 text-cyan-400 border border-zinc-800" : "text-zinc-500 hover:text-zinc-400"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {vpnCustomConfigMode === "pac" ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">PAC Script</label>
                      <textarea
                        rows="8"
                        value={vpnPacScript}
                        onChange={(e) => { setVpnPacScript(e.target.value); updateSetting("vpnPacScript", e.target.value); }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/40 font-mono leading-relaxed no-scrollbar resize-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Protocol</label>
                        <select
                          value={vpnProtocol}
                          onChange={(e) => { setVpnProtocol(e.target.value); updateSetting("vpnProtocol", e.target.value); }}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
                        >
                          <option value="http">HTTP</option>
                          <option value="https">HTTPS</option>
                          <option value="socks5">SOCKS5</option>
                          <option value="socks4">SOCKS4</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Proxy IP / Host</label>
                          <input
                            type="text"
                            placeholder="185.201.80.100"
                            value={vpnCustomHost}
                            onChange={(e) => { setVpnCustomHost(e.target.value); updateSetting("vpnCustomHost", e.target.value); }}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1 w-20">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Port</label>
                          <input
                            type="text"
                            placeholder="8080"
                            value={vpnCustomPort}
                            onChange={(e) => { setVpnCustomPort(e.target.value); updateSetting("vpnCustomPort", e.target.value); }}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Bypass List</label>
                        <textarea
                          rows="3"
                          value={vpnBypassList}
                          onChange={(e) => { setVpnBypassList(e.target.value); updateSetting("vpnBypassList", e.target.value); }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none font-mono no-scrollbar resize-none"
                        />
                      </div>
                      <button
                        onClick={toggleConnection}
                        disabled={!vpnCustomHost.trim()}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                          vpnConnected ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-cyan-500 text-black hover:bg-cyan-400"
                        }`}
                      >
                        {vpnConnected ? "⏹ Disconnect" : "▶ Connect via Custom Proxy"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 text-center py-6 text-xs text-zinc-500">
                  Enable Custom Override to enter your own proxy credentials.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reload notice */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 text-[10px] text-zinc-500 leading-relaxed">
          <p className="font-bold text-zinc-400 uppercase text-[9px] mb-1">📌 First Time Setup</p>
          After installing, reload at <code className="text-cyan-400 bg-zinc-900 px-1 rounded">chrome://extensions</code> to activate the proxy permission.
        </div>
      </div>
    </div>
  );
}
