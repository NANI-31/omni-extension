import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Returns the correct storage object for the delete log.
 * Prefers chrome.storage.session (ephemeral) with local as fallback.
 */
function getLogStore() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    return chrome.storage.session || chrome.storage.local;
  }
  return null;
}

/** Human-readable relative time label (e.g. "just now", "2 min ago") */
export function relativeTime(timestamp) {
  const delta = Math.floor((Date.now() - timestamp) / 1000);
  if (delta < 10)   return "just now";
  if (delta < 60)   return `${delta}s ago`;
  if (delta < 3600)  return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

/**
 * Custom hook to manage YouTube History Quick Delete ephemeral log.
 * Provides live storage sync, client-side title search filtering, and log clearing.
 */
export function useHistoryDeleteLog() {
  const [deleteLog, setDeleteLog]     = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setNow]                    = useState(Date.now());

  // Refresh relative timestamps ticker every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fetch initial delete log from storage
  useEffect(() => {
    const store = getLogStore();
    if (!store) return;
    store.get({ ytHistoryDeleteLog: [] }, (data) => {
      if (Array.isArray(data.ytHistoryDeleteLog)) {
        setDeleteLog(data.ytHistoryDeleteLog);
      }
    });
  }, []);

  // Listen to live storage changes from background worker
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;
    const handler = (changes, ns) => {
      if (ns !== "session" && ns !== "local") return;
      if (changes.ytHistoryDeleteLog) {
        setDeleteLog(changes.ytHistoryDeleteLog.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  // Clear delete log
  const clearLog = useCallback(() => {
    setDeleteLog([]);
    const store = getLogStore();
    if (store) store.set({ ytHistoryDeleteLog: [] });
  }, []);

  // Filtered log based on search query
  const filteredLog = useMemo(() => {
    if (!searchQuery.trim()) return deleteLog;
    const q = searchQuery.toLowerCase().trim();
    return deleteLog.filter((entry) =>
      (entry.title || "").toLowerCase().includes(q)
    );
  }, [deleteLog, searchQuery]);

  return {
    deleteLog,
    filteredLog,
    searchQuery,
    setSearchQuery,
    clearLog,
    relativeTime,
  };
}