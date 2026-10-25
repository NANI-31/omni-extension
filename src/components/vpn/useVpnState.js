import { useState, useEffect, useRef, useMemo } from "react";
import {
  COUNTRY_NAMES,
  countryFlag,
  clientCalculateScore,
  updateSetting,
} from "./constants";

export function useVpnState() {
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
        if (!changes.vpnConnected.newValue) {
          setDuration(0);
          setDlSpeed(0);
          setUlSpeed(0);
        }
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
    if (!vpnConnected) return;

    const t0 = Date.now();
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - t0) / 1000));
    }, 1000);

    statsIntervalRef.current = setInterval(() => {
      const dl = +(Math.random() * 4 + 1.5).toFixed(1);
      const ul = +(Math.random() * 1 + 0.4).toFixed(1);
      setDlSpeed(dl);
      setUlSpeed(ul);
      setDataConsumed((p) => {
        const t = p + ((dl / 8) * 1.5) / 1024;
        updateSetting("vpnDataConsumed", t);
        return t;
      });
    }, 1500);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(statsIntervalRef.current);
    };
  }, [vpnConnected]);

  // ── Canvas Graph ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
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

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(canvasAnimationIdRef.current);
    };
  }, [vpnConnected, dlSpeed]);

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
    if (!next) {
      setDuration(0);
      setDlSpeed(0);
      setUlSpeed(0);
    } else {
      setFetchError("");
    }
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

  return {
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
  };
}
