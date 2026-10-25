import { useState, useEffect } from "react";
import { Zap, Globe, ShieldCheck, Search, Plus, Trash2, RotateCcw, Check, Sparkles, HelpCircle } from "lucide-react";
import Toggle from "../ui/Toggle";

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
  const [copiedDomain, setCopiedDomain] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Load configuration from chrome.storage.local
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["bypassDomains", "timerFastForward"], (result) => {
        if (result.bypassDomains && Array.isArray(result.bypassDomains)) {
          setDomains(result.bypassDomains);
        } else {
          setDomains(DEFAULT_BYPASS_DOMAINS);
          chrome.storage.local.set({ bypassDomains: DEFAULT_BYPASS_DOMAINS });
        }

        if (result.timerFastForward !== undefined) {
          setFastForward(result.timerFastForward);
        }
      });
    } else {
      setDomains(DEFAULT_BYPASS_DOMAINS);
    }
  }, []);

  const handleToggleFastForward = () => {
    const nextVal = !fastForward;
    setFastForward(nextVal);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ timerFastForward: nextVal });
    }
    showToast(nextVal ? "Instant Redirect Bypasser activated" : "Instant Redirect Bypasser paused");
  };

  const showToast = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 2800);
  };

  const handleAddDomain = (e) => {
    e.preventDefault();
    const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!clean) return;

    if (clean.includes(" ") || !clean.includes(".")) {
      showToast("Please enter a valid domain (e.g. shortlink.xyz)");
      return;
    }

    if (domains.includes(clean)) {
      showToast("Domain already exists in registry");
      setNewDomain("");
      return;
    }

    const updated = [clean, ...domains];
    setDomains(updated);
    setNewDomain("");

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ bypassDomains: updated });
    }
    showToast(`Added ${clean} to bypass registry`);
  };

  const handleRemoveDomain = (domainToRemove) => {
    const updated = domains.filter((d) => d !== domainToRemove);
    setDomains(updated);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ bypassDomains: updated });
    }
    showToast(`Removed ${domainToRemove}`);
  };

  const handleResetDefaults = () => {
    setDomains(DEFAULT_BYPASS_DOMAINS);
    setSearchQuery("");
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ bypassDomains: DEFAULT_BYPASS_DOMAINS });
    }
    showToast("Reset registry to default domains");
  };

  const handleCopyDomain = (domain) => {
    navigator.clipboard.writeText(domain);
    setCopiedDomain(domain);
    setTimeout(() => setCopiedDomain(null), 1800);
  };

  const filteredDomains = domains.filter((d) =>
    d.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const customDomainsCount = domains.filter((d) => !DEFAULT_BYPASS_DOMAINS.includes(d)).length;

  return (
    <div className="space-y-6 text-zinc-100 font-sans pb-8">
      {/* Top Banner / Stat Metrics (Unified Stream Sniffer Contrast Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-emerald-500/40 hover:shadow-emerald-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Bypass Accelerator</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`h-2.5 w-2.5 rounded-full ${fastForward ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" : "bg-zinc-500"}`} />
              <h4 className="text-sm font-black text-white tracking-tight">
                {fastForward ? "0ms Zero-Delay" : "Bypass Paused"}
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-emerald-500/40 hover:shadow-emerald-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Rule Coverage</p>
            <h4 className="text-base font-black text-white tracking-tight">
              {domains.length} Domains Active
            </h4>
            <p className="text-[11px] text-zinc-400 font-sans">
              {customDomainsCount} custom {customDomainsCount === 1 ? "rule" : "rules"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-emerald-500/40 hover:shadow-emerald-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Injection Engine</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
              <h4 className="text-sm font-extrabold text-white">Auto Step-Clicker</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Status Notification */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/80 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-emerald-200 shadow-xl shadow-black/60 transition-all">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Primary Section: Bypass & Timing Control System */}
      <section className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-700/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Timing Engine & Fast-Forward
              </h3>
              <p className="text-xs text-zinc-300 font-normal">
                Autonomous delay cancellation and progression clickers
              </p>
            </div>
          </div>
          <span className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold font-sans text-emerald-200 shadow-sm">
            Core Module
          </span>
        </div>

        {/* Toggle Control Well */}
        <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Instant Redirect Bypasser</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                fastForward
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                  : "border-zinc-700/80 bg-[#141626] text-zinc-400"
              }`}>
                {fastForward ? "Enabled (0ms)" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-xl">
              Forces timer callback structures (<code className="text-emerald-300 font-sans">setTimeout</code>, <code className="text-emerald-300 font-sans">setInterval</code>) on matched domains to resolve instantly without countdown wait screens.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Toggle enabled={fastForward} onChange={handleToggleFastForward} />
          </div>
        </div>

        {/* Automated Step Progression Well */}
        <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex items-start gap-3.5 shadow-inner">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/35 shadow-sm mt-0.5">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Autonomous Step Clicker</h4>
              <span className="rounded-md border border-purple-500/40 bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-200 font-sans shadow-inner">
                Active Loop
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-normal leading-relaxed">
              Monitors matched pages on an 800ms cadence. Automatically executes verification buttons (<code className="text-purple-300 font-sans">I'm not a robot</code>, <code className="text-purple-300 font-sans">Verify</code>), emulates human scroll-to-bottom detection, and triggers <code className="text-purple-300 font-sans">Continue</code> / <code className="text-purple-300 font-sans">Get Link</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Secondary Section: Domain Registry Manager */}
      <section className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-700/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm">
              <Globe className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Bypass Rules Registry
              </h3>
              <p className="text-xs text-zinc-300 font-normal">
                Target domains where timer acceleration and automated clicking operate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-zinc-700/80 bg-[#0f111e] px-2.5 py-1 text-xs font-sans font-bold text-zinc-300 shadow-inner">
              {filteredDomains.length} of {domains.length} Matched
            </span>
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-[#0f111e] hover:border-zinc-600 hover:text-white px-2.5 py-1 text-xs font-bold text-zinc-300 transition-colors shadow-inner cursor-pointer"
              title="Reset to default domain list"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Add Domain Form */}
        <form onSubmit={handleAddDomain} className="flex gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="Add custom domain (e.g. shortlink.xyz or download.net)"
              className="w-full rounded-xl border border-zinc-700/80 bg-[#0f111e] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 shadow-inner transition-colors font-sans"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 hover:text-white px-4.5 py-2.5 text-sm font-bold transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Domain</span>
          </button>
        </form>

        {/* Search Filter Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domain registry by name or suffix..."
            className="w-full rounded-xl border border-zinc-700/80 bg-[#0f111e] pl-10 pr-9 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 shadow-inner transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-white text-xs font-sans font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Domain List Registry */}
        <div className="rounded-xl border border-zinc-700/80 bg-[#0f111e] p-3 shadow-inner max-h-72 overflow-y-auto space-y-2">
          {filteredDomains.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Globe className="w-8 h-8 mx-auto text-zinc-600 opacity-60" />
              <p className="text-xs text-zinc-400 font-medium">
                No matching domain patterns found in registry.
              </p>
              <button
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
              >
                Restore {DEFAULT_BYPASS_DOMAINS.length} default domains
              </button>
            </div>
          ) : (
            filteredDomains.map((domain) => {
              const isDefault = DEFAULT_BYPASS_DOMAINS.includes(domain);
              const isCopied = copiedDomain === domain;
              return (
                <div
                  key={domain}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700/70 bg-[#141626] px-3.5 py-2.5 hover:border-emerald-500/40 hover:bg-[#1b1e32] transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                      🌐
                    </span>
                    <span className="text-sm font-sans text-zinc-200 group-hover:text-white font-medium truncate">
                      {domain}
                    </span>
                    {isDefault ? (
                      <span className="rounded-md border border-zinc-700/80 bg-[#0f111e] px-2 py-0.5 text-[10px] font-bold text-zinc-400 font-sans shadow-inner">
                        Default
                      </span>
                    ) : (
                      <span className="rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 font-sans shadow-inner">
                        Custom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyDomain(domain)}
                      className="rounded-md border border-zinc-700/60 bg-[#0f111e] px-2 py-1 text-[11px] font-bold text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
                      title="Copy domain name"
                    >
                      {isCopied ? "Copied!" : "Copy"}
                    </button>
                    {!isDefault && (
                      <button
                        onClick={() => handleRemoveDomain(domain)}
                        className="rounded-md border border-red-500/30 bg-red-500/10 hover:bg-red-500/25 text-red-300 hover:text-white p-1 text-xs transition-colors cursor-pointer"
                        title="Remove custom rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Tertiary Section: Architecture & Security Overview */}
      <section className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/35 shadow-sm">
            <HelpCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Bypass Security & Operation
            </h3>
            <p className="text-xs text-zinc-300 font-normal">
              How Omni Extension bypasses countdowns and human verification gates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4 space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Targeted Scope</span>
            </div>
            <p className="text-xs text-zinc-300 font-normal leading-relaxed">
              Bypass code exclusively executes on tabs that match URLs listed in your active registry. Non-matching sites are never inspected.
            </p>
          </div>

          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4 space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Scroll Emulation</span>
            </div>
            <p className="text-xs text-zinc-300 font-normal leading-relaxed">
              Emulates instantaneous viewport scrolling to bottom coordinates, satisfying anti-bot scripts that check user engagement before unlocking links.
            </p>
          </div>

          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4 space-y-2 shadow-inner">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
              <Globe className="w-4 h-4" />
              <span>100% Offline Rules</span>
            </div>
            <p className="text-xs text-zinc-300 font-normal leading-relaxed">
              All domain lookups, timing overrides, and click triggers execute entirely within your browser runtime without external tracking servers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
