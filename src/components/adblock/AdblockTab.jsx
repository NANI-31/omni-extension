import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Video,
  BellOff,
  Cookie,
  Plus,
  Trash2,
  Check,
  Globe,
  Sliders,
  FileCode2,
} from "lucide-react";
import Toggle from "../ui/Toggle";

export default function AdblockTab() {
  // Core AdShield States
  const [enabled, setEnabled] = useState(true);
  const [blockedCount, setBlockedCount] = useState(0);
  const [ytBypass, setYtBypass] = useState(true);
  const [cookieBanner, setCookieBanner] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Whitelist State
  const [whitelist, setWhitelist] = useState([]);
  const [newDomain, setNewDomain] = useState("");

  // Custom Rules
  const [customRules, setCustomRules] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  // Load from chrome.storage.local on mount
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        [
          "adblockEnabled",
          "adblockBlockedCount",
          "adblockYtBypass",
          "adblockCookieBanner",
          "adblockNotifications",
          "adblockWhitelist",
          "adblockCustomRules",
        ],
        (res) => {
          if (res.adblockEnabled !== undefined) setEnabled(res.adblockEnabled);
          if (res.adblockBlockedCount !== undefined) setBlockedCount(res.adblockBlockedCount);
          if (res.adblockYtBypass !== undefined) setYtBypass(res.adblockYtBypass);
          if (res.adblockCookieBanner !== undefined) setCookieBanner(res.adblockCookieBanner);
          if (res.adblockNotifications !== undefined) setNotifications(res.adblockNotifications);
          if (Array.isArray(res.adblockWhitelist)) setWhitelist(res.adblockWhitelist);
          if (res.adblockCustomRules !== undefined) setCustomRules(res.adblockCustomRules);
        }
      );

      // Listen for background count increments in real time
      const storageListener = (changes, area) => {
        if (area !== "local") return;
        if (changes.adblockBlockedCount) {
          setBlockedCount(changes.adblockBlockedCount.newValue || 0);
        }
      };
      chrome.storage.onChanged.addListener(storageListener);
      return () => chrome.storage.onChanged.removeListener(storageListener);
    }
  }, []);

  const updateSetting = (key, val) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: val });
    }
  };

  const handleToggleEnabled = (val) => {
    const next = typeof val === "boolean" ? val : !enabled;
    setEnabled(next);
    updateSetting("adblockEnabled", next);
  };

  const handleToggleYtBypass = (val) => {
    const next = typeof val === "boolean" ? val : !ytBypass;
    setYtBypass(next);
    updateSetting("adblockYtBypass", next);
  };

  const handleToggleCookieBanner = (val) => {
    const next = typeof val === "boolean" ? val : !cookieBanner;
    setCookieBanner(next);
    updateSetting("adblockCookieBanner", next);
  };

  const handleToggleNotifications = (val) => {
    const next = typeof val === "boolean" ? val : !notifications;
    setNotifications(next);
    updateSetting("adblockNotifications", next);
  };

  const handleAddWhitelist = (e) => {
    e.preventDefault();
    const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!clean || whitelist.includes(clean)) return;
    const updated = [...whitelist, clean];
    setWhitelist(updated);
    setNewDomain("");
    updateSetting("adblockWhitelist", updated);
  };

  const handleRemoveWhitelist = (domainToRemove) => {
    const updated = whitelist.filter((d) => d !== domainToRemove);
    setWhitelist(updated);
    updateSetting("adblockWhitelist", updated);
  };

  const handleSaveCustomRules = () => {
    updateSetting("adblockCustomRules", customRules);
    setSaveStatus("Custom rules saved!");
    setTimeout(() => setSaveStatus(""), 2500);
  };

  return (
    <div className="space-y-6 text-zinc-100 font-sans pb-8">
      {/* ── 1. Top Stat Metrics Banner ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-cyan-500/40 hover:shadow-cyan-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Ads Blocked</p>
            <h4 className="text-xl font-black text-white tracking-tight tabular-nums">
              {blockedCount.toLocaleString()}
            </h4>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-cyan-500/40 hover:shadow-cyan-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm">
            {enabled ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-rose-400" />}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Shield Engine</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  enabled
                    ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <h4 className="text-sm font-extrabold text-zinc-100">
                {enabled ? "Active & Filtering" : "Shield Paused"}
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-4.5 flex items-center gap-4 shadow-xl shadow-black/60 hover:border-cyan-500/40 hover:shadow-cyan-950/20 transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Whitelisted Sites</p>
            <h4 className="text-xl font-black text-white tracking-tight tabular-nums">
              {whitelist.length}
            </h4>
          </div>
        </div>
      </div>

      {/* ── 2. Master Feature Control Card ────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-700/70">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Core Protection Filters
            </h3>
            <p className="text-xs text-zinc-300 font-normal">
              Toggle automatic blocking for ads, banners, video roadblocks, and annoying web popups.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-300">AdShield Status</span>
            <Toggle enabled={enabled} onChange={handleToggleEnabled} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* YouTube Defense */}
          <div className="rounded-xl border border-zinc-700/80 bg-[#0f111e] p-4 shadow-inner flex flex-col justify-between space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">YouTube Shield</h4>
                <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  Neutralizes anti-adblock enforcement walls and auto-skips playback roadblocks.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-400 font-semibold">Bypass Enabled</span>
              <Toggle enabled={ytBypass} onChange={handleToggleYtBypass} />
            </div>
          </div>

          {/* Cookie Banner Silencer */}
          <div className="rounded-xl border border-zinc-700/80 bg-[#0f111e] p-4 shadow-inner flex flex-col justify-between space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Cookie className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Cookie Banner Silencer</h4>
                <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  Auto-dismisses and collapses GDPR and cookie consent overlay popups across the web.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-400 font-semibold">Auto-Collapse</span>
              <Toggle enabled={cookieBanner} onChange={handleToggleCookieBanner} />
            </div>
          </div>

          {/* Push Notification Shield */}
          <div className="rounded-xl border border-zinc-700/80 bg-[#0f111e] p-4 shadow-inner flex flex-col justify-between space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <BellOff className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Spam Notification Shield</h4>
                <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  Silently denies web push notification permission dialogs without interruptions.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-400 font-semibold">Auto-Deny Prompts</span>
              <Toggle enabled={notifications} onChange={handleToggleNotifications} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Whitelist Manager ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Domain Whitelist
          </h3>
          <p className="text-xs text-zinc-300 font-normal">
            Sites added here will be completely exempted from AdShield and cosmetic filters.
          </p>
        </div>

        <form onSubmit={handleAddWhitelist} className="flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g. news-site.com or mydomain.org"
            className="flex-1 bg-[#0f111e] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 shadow-inner"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-bold hover:bg-cyan-500/30 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Site
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          {whitelist.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">No domains whitelisted. Protection is active everywhere.</p>
          ) : (
            whitelist.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f111e] border border-zinc-700/80 text-xs text-zinc-200 shadow-sm"
              >
                <span>{domain}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWhitelist(domain)}
                  className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove from whitelist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── 4. Custom CSS Rules Editor ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              Custom CSS Element Selectors
            </h3>
            <p className="text-xs text-zinc-300 font-normal">
              Inject custom CSS to hide specific ad containers or elements on any web page.
            </p>
          </div>
          {saveStatus && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-zinc-700/80 bg-[#0f111e] p-3 shadow-inner">
          <textarea
            rows={5}
            value={customRules}
            onChange={(e) => setCustomRules(e.target.value)}
            placeholder={"/* Example custom CSS rules: */\n.custom-sponsored-banner { display: none !important; }\n#floating-promo-box { display: none !important; }"}
            className="w-full bg-transparent border-0 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-y font-mono"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveCustomRules}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-bold hover:bg-cyan-500/30 transition-all cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4" />
            Save Custom Rules
          </button>
        </div>
      </div>
    </div>
  );
}
