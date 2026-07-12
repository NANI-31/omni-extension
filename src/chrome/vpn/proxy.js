// VPN Proxy Control Logic (Chrome Service Worker Context)

export function syncVpnProxy() {
  if (typeof chrome === "undefined" || !chrome.proxy || !chrome.proxy.settings) {
    console.warn("[VPN] chrome.proxy API not available.");
    return;
  }

  chrome.storage.local.get(
    [
      "vpnConnected",
      "vpnSelectedServer",
      "vpnProtocol",
      "vpnBypassList",
      "vpnCustomMode",
      "vpnCustomHost",
      "vpnCustomPort",
      "vpnCustomConfigMode",
      "vpnPacScript"
    ],
    (result) => {
      const connected = !!result.vpnConnected;

      // ── DISCONNECTED: clear all proxy rules ────────────────────────────────
      if (!connected) {
        chrome.proxy.settings.clear({ scope: "regular" }, () => {
          if (chrome.runtime.lastError) {
            console.error("[VPN] Error clearing proxy:", chrome.runtime.lastError.message);
          } else {
            console.log("[VPN] Proxy cleared — VPN disconnected.");
          }
        });
        return;
      }

      const customMode = !!result.vpnCustomMode;

      // ── CUSTOM MODE: user-defined host/port or PAC script ──────────────────
      if (customMode) {
        const configMode = result.vpnCustomConfigMode || "fixed";

        if (configMode === "pac") {
          const defaultPac = `function FindProxyForURL(url, host) {\n  return "DIRECT";\n}`;
          const pacData = result.vpnPacScript || defaultPac;
          const config = {
            mode: "pac_script",
            pacScript: { data: pacData }
          };
          chrome.proxy.settings.set({ value: config, scope: "regular" }, () => {
            if (chrome.runtime.lastError) {
              console.error("[VPN] Error setting PAC proxy:", chrome.runtime.lastError.message);
            } else {
              console.log("[VPN] Proxy set via custom PAC Script.");
            }
          });
          return;
        }

        // Fixed custom host
        const host = (result.vpnCustomHost || "").trim();
        const port = parseInt(result.vpnCustomPort || "8080", 10);
        const protocol = result.vpnProtocol || "http";

        if (!host) {
          console.warn("[VPN] Custom Mode is ON but no proxy host is configured. Enter a host IP in Proxy Rules.");
          return;
        }

        const bypassList = (result.vpnBypassList || "")
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);

        const config = {
          mode: "fixed_servers",
          rules: {
            singleProxy: { scheme: protocol, host, port },
            bypassList: bypassList.length > 0 ? bypassList : ["<local>"]
          }
        };

        chrome.proxy.settings.set({ value: config, scope: "regular" }, () => {
          if (chrome.runtime.lastError) {
            console.error("[VPN] Error setting custom proxy:", chrome.runtime.lastError.message);
          } else {
            console.log(`[VPN] ✅ Custom proxy active → ${protocol}://${host}:${port}`);
          }
        });
        return;
      }

      // ── SERVER LIST MODE: use the selected server's real host/port ─────────
      const server = result.vpnSelectedServer;

      if (!server || !server.host || !server.port) {
        console.warn("[VPN] Connected but no valid server selected. Fetch live proxies and select one first.");
        return;
      }

      const host = server.host.trim();
      const port = parseInt(String(server.port).trim(), 10);
      const protocol = (server.protocol || "http").toLowerCase();

      if (!host || isNaN(port)) {
        console.error("[VPN] Selected server has invalid host or port:", server);
        return;
      }

      const bypassList = (result.vpnBypassList || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

      const config = {
        mode: "fixed_servers",
        rules: {
          singleProxy: { scheme: protocol, host, port },
          bypassList: bypassList.length > 0 ? bypassList : ["<local>"]
        }
      };

      chrome.proxy.settings.set({ value: config, scope: "regular" }, () => {
        if (chrome.runtime.lastError) {
          console.error("[VPN] Error setting proxy for selected server:", chrome.runtime.lastError.message);
        } else {
          console.log(`[VPN] ✅ Proxy active → ${protocol}://${host}:${port} (${server.name || server.host})`);
        }
      });
    }
  );
}

export function initVpnListeners() {
  if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.onChanged) {
    return;
  }

  // Re-sync whenever any VPN storage key changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    const watched = [
      "vpnConnected", "vpnSelectedServer", "vpnProtocol", "vpnBypassList",
      "vpnCustomMode", "vpnCustomHost", "vpnCustomPort",
      "vpnCustomConfigMode", "vpnPacScript"
    ];
    if (watched.some((k) => changes[k] !== undefined)) {
      syncVpnProxy();
    }
  });

  // Restore proxy on browser/extension startup
  chrome.runtime.onStartup.addListener(() => {
    syncVpnProxy();
  });
}
