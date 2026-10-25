import { useState, useContext } from "react";
import {
  Trash2,
  Zap,
  Bug,
  RotateCcw,
  HelpCircle,
  ExternalLink,
  Search,
  Clock,
  ShieldCheck,
  AlertTriangle,
  X
} from "lucide-react";
import Toggle from "../../../ui/Toggle";
import {
  ExtensionStateContext,
  ExtensionStateProvider,
  useExtensionState,
} from "../../../../context/ExtensionStateContext.jsx";

function YoutubeHistoryDeleteSettingsInner(props) {
  const { historySettings, historyLog } = useExtensionState();
  const settingsHook = historySettings;
  const logHook      = historyLog;

  // Support controlled props or fallback to internal hook/context state
  const enabled          = props.enabled !== undefined ? props.enabled : settingsHook.enabled;
  const onToggleEnabled  = props.onToggleEnabled || settingsHook.toggleEnabled;
  const deletedCount     = props.deletedCount !== undefined ? props.deletedCount : settingsHook.deletedCount;
  const onResetCount     = props.onResetCount || settingsHook.resetDeletedCount;
  const debug            = props.debug !== undefined ? props.debug : settingsHook.debug;
  const onToggleDebug    = props.onToggleDebug || settingsHook.toggleDebug;

  const isOnHistoryPage  = settingsHook.isOnHistoryPage;
  const handleOpenHistory = settingsHook.openHistoryPage;

  const {
    deleteLog,
    filteredLog,
    searchQuery,
    setSearchQuery,
    clearLog,
    relativeTime,
  } = logHook;

  // Confirmation modal states
  const [showClearLogModal, setShowClearLogModal] = useState(false);
  const [showResetCountModal, setShowResetCountModal] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

      {/* ── LEFT COLUMN: controls ─────────────────────────────────── */}
      <div className="md:col-span-7 space-y-6">

        {/* Main Toggle Card */}
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-700/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
                <Trash2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  History Quick Delete Engine
                </h3>
                <p className="text-xs text-zinc-300 font-normal mt-0.5">
                  One-click instant removal of videos from your YouTube watch history
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${enabled ? "bg-red-400 opacity-75" : "bg-zinc-500"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${enabled ? "bg-red-500" : "bg-zinc-600"}`}></span>
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-200 border border-red-500/35 px-2.5 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider shadow-sm">
                {enabled ? "Active" : "Disabled"}
              </span>
            </div>
          </div>

          {/* Row 1: Enable toggle */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" />
                  <span>Enable Quick Delete</span>
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  enabled
                    ? "border-red-500/40 bg-red-500/20 text-red-300"
                    : "border-zinc-700/80 bg-[#141626] text-zinc-400"
                }`}>
                  {enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-sm">
                Click any video card on YouTube Watch History to instantly remove it without opening context menus.
              </p>
            </div>
            <Toggle enabled={enabled} onChange={onToggleEnabled} />
          </div>

          {/* Row 2: Debug toggle */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bug className="w-4 h-4 text-amber-400" />
                  <span>Debug Console Logs</span>
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  debug
                    ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                    : "border-zinc-700/80 bg-[#141626] text-zinc-400"
                }`}>
                  {debug ? "Verbose Logs" : "Off"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-normal leading-relaxed max-w-sm">
                Outputs verbose deletion events and DOM mutation logs to browser console for diagnosing issues.
              </p>
            </div>
            <Toggle enabled={debug} onChange={onToggleDebug} />
          </div>

          {/* Row 3: Session counter */}
          <div className="rounded-xl bg-[#0f111e] border border-zinc-700/80 p-4.5 flex items-center justify-between shadow-inner">
            <div className="space-y-0.5">
              <p className="text-xs text-zinc-300 font-bold uppercase tracking-wider">
                Deleted This Session
              </p>
              <p className="text-3xl font-black text-transparent bg-linear-to-r from-red-400 via-rose-300 to-amber-300 bg-clip-text font-sans">
                {deletedCount}
              </p>
            </div>
            {deletedCount > 0 && (
              <button
                type="button"
                onClick={() => setShowResetCountModal(true)}
                className="flex items-center gap-1.5 text-xs text-red-300 hover:text-white font-bold transition-all py-2 px-3.5 bg-red-500/15 hover:bg-red-500/25 rounded-xl border border-red-500/30 hover:border-red-500/50 shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Count</span>
              </button>
            )}
          </div>
        </div>

        {/* Page status indicator */}
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 shadow-xl shadow-black/60 flex gap-4 items-start">
          <div className="relative flex h-3.5 w-3.5 mt-1 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isOnHistoryPage ? "bg-emerald-400" : "bg-amber-400"
            }`} />
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
              isOnHistoryPage ? "bg-emerald-500" : "bg-amber-500"
            }`} />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Target Page Status
              </h4>
              <span className={`text-[10px] font-sans font-bold uppercase px-2 py-0.5 rounded-md border ${
                isOnHistoryPage
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/35"
                  : "bg-amber-500/20 text-amber-200 border-amber-500/35"
              }`}>
                {isOnHistoryPage ? "Connected" : "Standby"}
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-medium">
              {isOnHistoryPage ? "Ready — currently active on YouTube Watch History." : "Not on YouTube Watch History page."}
            </p>
            {!isOnHistoryPage && (
              <button
                type="button"
                onClick={handleOpenHistory}
                className="mt-2 w-full py-2.5 px-3.5 bg-[#141626] hover:bg-[#1b1e32] border border-zinc-700/80 hover:border-red-500/50 text-red-200 hover:text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-inner"
              >
                <span>Open YouTube Watch History</span>
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5.5 shadow-xl shadow-black/60 flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              How Quick Delete Works
            </h4>
            <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Navigate to <b className="text-white font-semibold">youtube.com/feed/history</b> in any browser tab.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Click any video thumbnail or row to instantly remove it from watch history.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>Hold <b className="text-white font-semibold">Shift + Click</b> to multi-select items and delete them in bulk.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                <span>A subtle glow animation confirms removal and writes the entry to the review log.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: delete log with title search ────────────── */}
      <div className="md:col-span-5 space-y-6 md:sticky md:top-0">

        {/* Delete Log Card */}
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] shadow-xl shadow-black/60 overflow-hidden">

          {/* Log header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700/70">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Recently Deleted Log
              </h3>
              {deleteLog.length > 0 && (
                <span className="text-[10px] bg-red-500/20 text-red-200 border border-red-500/35 px-2 py-0.5 rounded-md font-bold font-sans shadow-sm">
                  {searchQuery.trim() ? `${filteredLog.length}/${deleteLog.length}` : deleteLog.length}
                </span>
              )}
            </div>
            {deleteLog.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearLogModal(true)}
                className="text-xs text-zinc-400 hover:text-red-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Title Search / Filter Bar */}
          {deleteLog.length > 0 && (
            <div className="px-4 py-2.5 border-b border-zinc-700/70 bg-[#0f111e]/90">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 select-none pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter deleted video titles..."
                  className="w-full pl-9 pr-8 py-1.5 bg-[#141626] border border-zinc-700/80 focus:border-red-500/60 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-colors font-medium shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-zinc-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                    title="Clear filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Log body */}
          {deleteLog.length === 0 ? (
            /* Empty log state */
            <div className="flex flex-col items-center justify-center py-12 px-5 gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-sm">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-white">No deletions yet</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-50">
                  Deleted videos will appear here as a session review log.
                </p>
              </div>
            </div>
          ) : filteredLog.length === 0 ? (
            /* Empty filter state */
            <div className="flex flex-col items-center justify-center py-10 px-5 gap-2 text-center">
              <Search className="w-6 h-6 text-zinc-500" />
              <p className="text-xs font-bold text-white">No titles match "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs text-red-400 hover:underline cursor-pointer font-bold mt-1"
              >
                Clear search filter
              </button>
            </div>
          ) : (
            /* Log list */
            <div className="max-h-75 overflow-y-auto divide-y divide-zinc-700/60 scrollbar-youtube">
              {filteredLog.map((entry, idx) => (
                <div
                  key={entry.id || idx}
                  className="px-4 py-3 flex items-start gap-3 group hover:bg-[#141626]/80 transition-colors duration-100"
                >
                  {/* Index badge */}
                  <span className="mt-0.5 text-[10px] text-zinc-400 font-sans w-4 shrink-0 select-none text-right font-bold">
                    {idx + 1}
                  </span>

                  {/* Title + time */}
                  <div className="flex-1 min-w-0">
                    {entry.title ? (
                      <p className="text-xs font-semibold text-white leading-snug truncate" title={entry.title}>
                        {entry.title}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">Unknown title</p>
                    )}
                    <p className="text-[10px] text-zinc-400 mt-0.5 tabular-nums font-sans font-medium">
                      {relativeTime(entry.timestamp)}
                    </p>
                  </div>

                  {/* Red indicator dot */}
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 shadow-[0_0_6px_rgba(248,113,113,0.8)]" />
                </div>
              ))}
            </div>
          )}

          {/* Log footer */}
          {deleteLog.length > 0 && (
            <div className="px-5 py-3 border-t border-zinc-700/70 bg-[#0f111e]/90 flex items-center justify-between">
              <p className="text-[10px] text-zinc-400 font-medium">
                Stored in memory — resets on browser restart
              </p>
              <span className="text-[10px] text-zinc-400 font-sans font-bold tabular-nums">
                max 30
              </span>
            </div>
          )}
        </div>

        {/* Compatibility */}
        <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 space-y-3 shadow-xl shadow-black/60">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-700/70 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Compatibility & Targets</span>
          </h4>
          <div className="space-y-2.5">
            {[
              { label: "Standard YouTube Videos" },
              { label: "YouTube Shorts Feed" },
              { label: "Playlist History Items" },
              { label: "Shift + Click Multi-Select Batch" },
            ].map(({ label }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">{label}</span>
                <span className="font-bold font-sans text-emerald-400 flex items-center gap-1">
                  ✓ Verified
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Permanent Warning */}
        <div className="rounded-xl bg-red-950/20 border border-red-500/30 p-4 shadow-sm flex gap-3 items-start">
          <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-red-300 uppercase tracking-wider">Permanent Deletion Notice</p>
            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              Deletions are permanent on YouTube. The session log is for review purposes — deleted entries cannot be recovered through this extension.
            </p>
          </div>
        </div>

      </div>

      {/* ── Confirmation Modal: Clear Log ── */}
      {showClearLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-[#161826] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Clear Review Log?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClearLogModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              This will remove all <b className="text-white font-sans">{deleteLog.length}</b> recorded video entries from this session's review log. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearLogModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-zinc-700/80 bg-[#141626] hover:bg-[#1b1e32] text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearLog();
                  setShowClearLogModal(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-xs font-bold text-white shadow-md shadow-red-950/40 transition-all cursor-pointer"
              >
                Clear Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal: Reset Counter ── */}
      {showResetCountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-[#161826] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-700/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-300 border border-red-500/35 shadow-sm">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Reset Counter?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetCountModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              Are you sure you want to reset your session deletion counter from <b className="text-white font-sans">{deletedCount}</b> back to <b className="text-white font-sans">0</b>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetCountModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-zinc-700/80 bg-[#141626] hover:bg-[#1b1e32] text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetCount();
                  setShowResetCountModal(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-xs font-bold text-white shadow-md shadow-red-950/40 transition-all cursor-pointer"
              >
                Reset Count
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function YoutubeHistoryDeleteSettings(props) {
  const context = useContext(ExtensionStateContext);
  if (!context) {
    return (
      <ExtensionStateProvider>
        <YoutubeHistoryDeleteSettingsInner {...props} />
      </ExtensionStateProvider>
    );
  }
  return <YoutubeHistoryDeleteSettingsInner {...props} />;
}