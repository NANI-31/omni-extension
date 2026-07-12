import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setHistory } from "../store/instagrab/historySlice.js";

const isChromeExtension = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

export function HistoryProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (isChromeExtension) {
      // Fetch history from Extension Storage
      chrome.storage.local.get(["downloadHistory"], (result) => {
        if (result.downloadHistory) {
          dispatch(setHistory(result.downloadHistory));
        }
      });

      // Listen for history changes dynamically
      const handleStorageChange = (changes, areaName) => {
        if (areaName === "local" && changes.downloadHistory) {
          dispatch(setHistory(changes.downloadHistory.newValue || []));
        }
      };
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function useHistory() {
  const dispatch = useDispatch();
  const history = useSelector((state) => state.history.history);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your download history?")) {
      if (isChromeExtension) {
        chrome.storage.local.set({ downloadHistory: [] }, () => {
          dispatch(setHistory([]));
        });
      } else {
        dispatch(setHistory([]));
      }
    }
  };

  return {
    history,
    clearHistory: handleClearHistory
  };
}
