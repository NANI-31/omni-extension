import React, { useState, useEffect } from "react";

const DEFAULT_BYPASS_DOMAINS = [
  "arolinks.com",
  "deltastudy.site",
  "fc.lc",
  "fc-lc.xyz",
  "linkjust.com",
  "4download.net",
  "flightsim.to",
  "shr2.link",
  "nitro-link.com",
  "oii.la",
  "tpi.li",
  "cookiesceo.com",
  "fastdl.zip",
  "filepress",
  "hdhub4u",
  "hubcloud",
  "vcloud.zip",
  "skrresults.com",
  "teknoasian.com"
];

export default function TimersTab() {
  const [fastForward, setFastForward] = useState(true);
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Load from chrome.storage.local
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["bypassDomains"], (result) => {
        if (result.bypassDomains) {
          setDomains(result.bypassDomains);
        } else {
          setDomains(DEFAULT_BYPASS_DOMAINS);
          chrome.storage.local.set({ bypassDomains: DEFAULT_BYPASS_DOMAINS });
        }
      });
    } else {
      setDomains(DEFAULT_BYPASS_DOMAINS);
    }
  }, []);

  const handleAddDomain = (e) => {
    e.preventDefault();
    const clean = newDomain.trim().toLowerCase();
    if (!clean) return;

    // Validate simple domain structure
    if (clean.includes(" ") || !clean.includes(".")) {
      alert("Please enter a valid domain pattern (e.g. example.com)");
      return;
    }

    if (domains.includes(clean)) {
      setNewDomain("");
      return;
    }

    const updated = [clean, ...domains];
    setDomains(updated);
    setNewDomain("");

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ bypassDomains: updated });
    }
  };

  const handleRemoveDomain = (domainToRemove) => {
    const updated = domains.filter((d) => d !== domainToRemove);
    setDomains(updated);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ bypassDomains: updated });
    }
  };

  const filteredDomains = domains.filter((d) =>
    d.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-4 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
          Timer Bypass Settings
        </h3>

        {/* Acceleration Control */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-zinc-800/40 pb-4">
          <div>
            <p className="text-sm font-semibold text-zinc-200">Instant Redirect Bypasser</p>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              Forces timer structures (`setTimeout`, `setInterval`) on matched domains to complete instantly (0ms delay).
            </p>
          </div>
          <button
            onClick={() => setFastForward(!fastForward)}
            className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${
              fastForward ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-zinc-700"
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all ${
                fastForward ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Passive Bypass Info */}
        <div className="flex gap-3 items-start bg-zinc-950/40 rounded-lg p-3 border border-zinc-850">
          <span className="text-base select-none">⚡</span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-300">Automated Step Clicker</h4>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              Bypasses captcha verifications, triggers page scrolls, and clicks step progress buttons automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Domain Registry Manager */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
            Bypass Rules Registry
          </h3>
          <span className="text-xs text-zinc-500 bg-zinc-950/60 border border-zinc-850 px-2 py-0.5 rounded-md font-mono select-none">
            {domains.length} Domains Loaded
          </span>
        </div>

        {/* Add custom domain form */}
        <form onSubmit={handleAddDomain} className="flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="Add custom domain (e.g. shortlink.xyz)"
            className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-955 font-bold px-3.5 py-1.5 rounded-lg text-sm transition-colors shrink-0 shadow-lg"
          >
            Add Domain
          </button>
        </form>

        {/* Search filter input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matching domain patterns..."
            className="w-full bg-zinc-950/40 border border-zinc-850 rounded-lg pl-3 pr-8 py-1.5 text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-emerald-500/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 text-sm font-mono focus:outline-none select-none"
            >
              ×
            </button>
          )}
        </div>

        {/* List of active domains */}
        <div className="max-h-55 overflow-y-auto pr-1 space-y-1.5 border border-zinc-900 bg-zinc-950/20 p-2.5 rounded-lg custom-scrollbar">
          {filteredDomains.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-4 italic">
              No matching domain patterns found.
            </p>
          ) : (
            filteredDomains.map((domain) => {
              const isDefault = DEFAULT_BYPASS_DOMAINS.includes(domain);
              return (
                <div
                  key={domain}
                  className="flex items-center justify-between gap-3 bg-zinc-900/35 border border-zinc-850/60 rounded-md px-2.5 py-1.5 hover:border-zinc-800 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs select-none text-zinc-600">🌐</span>
                    <span className="text-sm text-zinc-300 truncate font-mono select-all">
                      {domain}
                    </span>
                    {isDefault && (
                      <span className="text-[10px] bg-zinc-800/80 text-zinc-550 px-1 py-0.2 rounded-sm select-none border border-zinc-800">
                        Default
                      </span>
                    )}
                  </div>
                  {!isDefault && (
                    <button
                      onClick={() => handleRemoveDomain(domain)}
                      className="text-xs text-zinc-600 hover:text-red-400 p-0.5 transition-colors focus:outline-none"
                      title="Remove custom rule"
                    >
                      Delete
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
