import { useState, useEffect, useCallback } from "react";
import { storageAdapter } from "../utils/StorageAdapter.js";

/**
 * Custom hook to manage YouTube History Quick Delete settings with Optimistic UI updates
 * and StorageAdapter integration for sub-millisecond visual feedback.
 */
export function useHistoryDeleteSettings() {
  const [enabled, setEnabled]           = useState(() => storageAdapter.getSync("ytHistoryDeleteEnabled", true));
  const [deletedCount, setDeletedCount] = useState(() => storageAdapter.getSync("ytHistoryDeletedCount", 0));
  const [debug, setDebug]               = useState(() => storageAdapter.getSync("ytHistoryDeleteDebug", false));
  const [activeTabUrl, setActiveTabUrl] = useState("");

  // Load initial settings via storageAdapter
  useEffect(() => {
    storageAdapter.get({
      ytHistoryDeleteEnabled: true,
      ytHistoryDeletedCount: 0,
      ytHistoryDeleteDebug: false,
    }).then((result) => {
      if (result.ytHistoryDeleteEnabled !== undefined) setEnabled(result.ytHistoryDeleteEnabled);
      if (result.ytHistoryDeletedCount !== undefined)  setDeletedCount(Number(result.ytHistoryDeletedCount));
      if (result.ytHistoryDeleteDebug !== undefined)   setDebug(result.ytHistoryDeleteDebug);
    });
  }, []);

  // Detect active tab URL
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) setActiveTabUrl(tabs[0].url);
      });
    }
  }, []);

  // Subscribe to storageAdapter changes
  useEffect(() => {
    const unsubscribe = storageAdapter.subscribe((changes, ns) => {
      if (ns && ns !== "local") return;
      if (changes.ytHistoryDeleteEnabled) setEnabled(changes.ytHistoryDeleteEnabled.newValue);
      if (changes.ytHistoryDeletedCount)  setDeletedCount(changes.ytHistoryDeletedCount.newValue);
      if (changes.ytHistoryDeleteDebug)    setDebug(changes.ytHistoryDeleteDebug.newValue);
    });
    return unsubscribe;
  }, []);

  // Handlers with Optimistic UI Updates
  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      // Optimistic async persistence
      storageAdapter.set({ ytHistoryDeleteEnabled: next });
      return next;
    });
  }, []);

  const resetDeletedCount = useCallback(() => {
    // Optimistic UI update
    setDeletedCount(0);
    storageAdapter.set({ ytHistoryDeletedCount: 0 });
  }, []);

  const toggleDebug = useCallback(() => {
    setDebug((prev) => {
      const next = !prev;
      // Optimistic async persistence
      storageAdapter.set({ ytHistoryDeleteDebug: next });
      return next;
    });
  }, []);

  const openHistoryPage = useCallback(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: "https://www.youtube.com/feed/history" });
    } else {
      window.open("https://www.youtube.com/feed/history", "_blank");
    }
  }, []);

  const isOnHistoryPage = activeTabUrl.includes("youtube.com/feed/history");

  return {
    enabled,
    deletedCount,
    debug,
    isOnHistoryPage,
    toggleEnabled,
    resetDeletedCount,
    toggleDebug,
    openHistoryPage,
  };
}