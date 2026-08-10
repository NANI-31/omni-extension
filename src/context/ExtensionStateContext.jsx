import React, { createContext, useContext } from "react";
import { useHistoryDeleteSettings } from "../hooks/useHistoryDeleteSettings.js";
import { useHistoryDeleteLog } from "../hooks/useHistoryDeleteLog.js";

const ExtensionStateContext = createContext(null);

/**
 * Top-level ExtensionStateProvider component.
 * Unifies custom hooks and module settings into a single Context tree,
 * eliminating duplicate storage queries across parent and child components.
 */
export function ExtensionStateProvider({ children }) {
  const historySettings = useHistoryDeleteSettings();
  const historyLog      = useHistoryDeleteLog();

  const value = {
    historySettings,
    historyLog,
  };

  return (
    <ExtensionStateContext.Provider value={value}>
      {children}
    </ExtensionStateContext.Provider>
  );
}

/**
 * Custom hook to access global extension state
 */
export function useExtensionState() {
  const context = useContext(ExtensionStateContext);
  if (!context) {
    throw new Error("useExtensionState must be used within an ExtensionStateProvider");
  }
  return context;
}