import React from "react";
import { TYPOGRAPHY_TOKENS } from "../../../../config/tokens.js";
import { useExtensionState } from "../../../../context/ExtensionStateContext.jsx";
import { useHistoryDeleteLog } from "../../../../hooks/useHistoryDeleteLog.js";
import { useHistoryDeleteSettings } from "../../../../hooks/useHistoryDeleteSettings.js";

export default function YoutubeHistoryDeleteSettings(props) {
  // Try consuming global ExtensionStateContext if wrapped, else fallback to custom hooks
  let settingsHook;
  let logHook;
  try {
    const context = useExtensionState();
    settingsHook = context.historySettings;
    logHook      = context.historyLog;
  } catch (e) {
    settingsHook = useHistoryDeleteSettings();
    logHook      = useHistoryDeleteLog();
  }

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


  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

      {/* ── LEFT COLUMN: controls ─────────────────────────────────── */}
      <div className="md:col-span-7 space-y-6">

        {/* Main Toggle Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗑️</span>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                History Quick Delete
              </h3>
            </div>
            <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-md font-mono select-none uppercase font-bold tracking-wider">
              Active
            </span>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>⚡</span> Enable Quick Delete
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Click any video card on YouTube Watch History to instantly remove it — no menus, no confirmations.
              </p>
            </div>
            <button
              onClick={onToggleEnabled}
              className={`w-9 h-5 rounded-full transition-all relative shrink-0 cursor-pointer ${
                enabled
                  ? "bg-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.25)]"
                  : "bg-zinc-700 border border-zinc-650"
              }`}
              aria-label="Toggle History Quick Delete"
            >
              <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all ${
                enabled ? "right-1" : "left-1"
              }`} />
            </button>
          </div>

          {/* Debug toggle */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-zinc-800/40 py-1">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>🔍</span> Debug Console Logs
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Outputs verbose deletion events to the browser console for diagnosing issues.
              </p>
            </div>
            <button
              onClick={onToggleDebug}
              className={`w-9 h-5 rounded-full transition-all relative shrink-0 cursor-pointer ${
                debug
                  ? "bg-amber-500/70 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                  : "bg-zinc-700 border border-zinc-650"
              }`}
              aria-label="Toggle Debug Logs"
            >
              <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all ${
                debug ? "right-1" : "left-1"
              }`} />
            </button>
          </div>

          {/* Session counter */}
          <div className="pt-3 border-t border-zinc-800/40">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                  Deleted This Session
                </p>
                <p className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text">
                  {deletedCount}
                </p>
              </div>
              {deletedCount > 0 && (
                <button
                  onClick={onResetCount}
                  className="text-xs text-red-400/80 hover:text-red-400 font-semibold transition-colors duration-150 cursor-pointer py-1.5 px-3 hover:bg-red-500/10 rounded-lg border border-red-500/20 hover:border-red-500/40"
                >
                  Reset count
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page status indicator */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 flex gap-3.5 items-start">
          <div className="relative flex h-3 w-3 mt-0.5 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isOnHistoryPage ? "bg-green-400" : "bg-yellow-400"
            }`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              isOnHistoryPage ? "bg-green-500" : "bg-yellow-500"
            }`} />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Active State</h4>
            <p className="text-sm text-zinc-100">
              {isOnHistoryPage ? "Ready — on YouTube Watch History" : "Not on the History page"}
            </p>
            {!isOnHistoryPage && (
              <button
                onClick={handleOpenHistory}
                className="mt-2 w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30 text-red-300 hover:text-red-200 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
              >
                Open YouTube Watch History
              </button>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 flex gap-3.5 items-start">
          <span className="text-lg bg-zinc-950/60 p-2 rounded-lg border border-zinc-800 select-none leading-none shrink-0 text-red-400">
            💡
          </span>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">How It Works</h4>
            <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 mt-1 leading-relaxed">
              <li>Navigate to <strong className="text-zinc-300">youtube.com/feed/history</strong></li>
              <li>Click any video card to instantly remove it from watch history</li>
              <li>Hold <strong className="text-zinc-300">Shift + Click</strong> to multi-select video cards and delete in batch</li>
              <li>Red glow animation confirms each deletion in real-time</li>
              <li>Title and timestamp are logged in the review panel</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: delete log with title search ────────────── */}
      <div className="md:col-span-5 space-y-6">

        {/* Delete Log Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden">

          {/* Log header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Recently Deleted
              </h3>
              {deleteLog.length > 0 && (
                <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded font-bold font-mono">
                  {searchQuery.trim() ? `${filteredLog.length}/${deleteLog.length}` : deleteLog.length}
                </span>
              )}
            </div>
            {deleteLog.length > 0 && (
              <button
                onClick={clearLog}
                className="text-[10px] text-zinc-500 hover:text-red-400 font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer"
              >
                Clear log
              </button>
            )}
          </div>

          {/* Title Search / Filter Bar */}
          {deleteLog.length > 0 && (
            <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-950/40">
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-zinc-500 text-xs select-none">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter deleted titles..."
                  className={`${TYPOGRAPHY_TOKENS.inputField} pl-8 pr-7`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-zinc-500 hover:text-zinc-300 text-xs font-bold p-0.5 cursor-pointer"
                    title="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Log body */}
          {deleteLog.length === 0 ? (
            /* Empty log state */
            <div className="flex flex-col items-center justify-center py-10 px-5 gap-3">
              <div
                className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl select-none"
                style={{ boxShadow: "0 0 16px rgba(239,68,68,0.08)" }}
              >
                🗑️
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-zinc-400">No deletions yet</p>
                <p className="text-[11px] text-zinc-600 leading-relaxed max-w-[180px]">
                  Deleted videos will appear here as a safety log.
                </p>
              </div>
            </div>
          ) : filteredLog.length === 0 ? (
            /* Empty filter state */
            <div className="flex flex-col items-center justify-center py-8 px-5 gap-2 text-center">
              <span className="text-xl">🔍</span>
              <p className="text-xs font-semibold text-zinc-400">No titles match "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-[11px] text-red-400 hover:underline cursor-pointer font-medium"
              >
                Clear search filter
              </button>
            </div>
          ) : (
            /* Log list */
            <div className="max-h-[320px] overflow-y-auto divide-y divide-zinc-800/50">
              {filteredLog.map((entry, idx) => (
                <div
                  key={entry.id || idx}
                  className="px-4 py-3 flex items-start gap-3 group hover:bg-zinc-800/30 transition-colors duration-100"
                >
                  {/* Index badge */}
                  <span className="mt-0.5 text-[10px] text-zinc-600 font-mono w-4 shrink-0 select-none text-right">
                    {idx + 1}
                  </span>

                  {/* Title + time */}
                  <div className="flex-1 min-w-0">
                    {entry.title ? (
                      <p className="text-xs font-medium text-zinc-200 leading-snug truncate" title={entry.title}>
                        {entry.title}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-600 italic">Unknown title</p>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-0.5 tabular-nums">
                      {relativeTime(entry.timestamp)}
                    </p>
                  </div>

                  {/* Red dot */}
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500/50 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Log footer */}
          {deleteLog.length > 0 && (
            <div className="px-5 py-2.5 border-t border-zinc-800/60 flex items-center justify-between">
              <p className="text-[10px] text-zinc-600">
                Stored in session — clears on browser restart
              </p>
              <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
                max 30
              </span>
            </div>
          )}
        </div>

        {/* Compatibility */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Compatibility</h4>
          {[
            { label: "Standard Videos",        ok: true },
            { label: "YouTube Shorts",          ok: true },
            { label: "Playlist History Items",  ok: true },
            { label: "Shift+Click Batch Mode",  ok: true },
          ].map(({ label, ok }) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{label}</span>
              <span className={`font-bold ${ok ? "text-green-400" : "text-zinc-600"}`}>
                {ok ? "✓" : "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 space-y-1">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider">⚠ Note</p>
          <p className="text-xs text-red-300/70 leading-relaxed">
            Deletions are permanent. The log below is a review-only safety net — entries cannot be
            re-added to YouTube history through this extension.
          </p>
        </div>

      </div>
    </div>
  );
}