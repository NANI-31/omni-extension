import React, { useState } from "react";
import { useSettings } from "../../../context/SettingsContext.jsx";

export default function LoggingControlSetting() {
  const { logLevel, setLogLevel } = useSettings();
  const [exporting, setExporting] = useState(false);

  const handleExportLogs = async () => {
    setExporting(true);
    let contentLogs = [];
    let bgLogs = [];

    // 1. Fetch active tab content script logs
    try {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const resp = await chrome.tabs.sendMessage(tab.id, { type: "GET_CONTENT_LOGS" });
          if (resp && resp.logs) {
            contentLogs = resp.logs;
          }
        }
      } else {
        contentLogs = ["(Mock) Content script log 1", "(Mock) Content script log 2"];
      }
    } catch (e) {
      contentLogs = [`[Logs Collector Error] Failed to fetch active tab logs: ${e.message || e}`];
    }

    // 2. Fetch background service worker logs
    try {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        const resp = await chrome.runtime.sendMessage({ type: "GET_BACKGROUND_LOGS" });
        if (resp && resp.logs) {
          bgLogs = resp.logs;
        }
      } else {
        bgLogs = ["(Mock) Background log 1", "(Mock) Background log 2"];
      }
    } catch (e) {
      bgLogs = [`[Logs Collector Error] Failed to fetch background logs: ${e.message || e}`];
    }

    // 3. Assemble full text log file
    const timestamp = new Date().toISOString().replace("T", " ").replace(/\..+/, "");
    const header = `=========================================\nInstaGrab Session Logs — ${timestamp}\n=========================================\n\n`;
    
    const backgroundSection = `--- Background Service Worker Logs ---\n${bgLogs.length > 0 ? bgLogs.join("\n") : "(No background logs recorded)"}\n\n`;
    const contentSection = `--- Active Page Context Logs ---\n${contentLogs.length > 0 ? contentLogs.join("\n") : "(No page logs recorded)"}\n\n`;
    
    const fullLogText = header + backgroundSection + contentSection;

    // 4. Trigger download
    const blob = new Blob([fullLogText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instagrab-logs-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const levels = [
    { value: "silent", label: "Silent", desc: "No logs" },
    { value: "errors", label: "Errors Only", desc: "Errors" },
    { value: "verbose", label: "Verbose Debug", desc: "Full debug" }
  ];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-300 block">
          Console Debug Logging
        </label>
        <span className="text-[10px] text-zinc-500 block leading-relaxed">
          Configure console prints or export session logs directly to a text file for troubleshooting.
        </span>
      </div>

      <div className="flex gap-2">
        {levels.map((lvl) => (
          <button
            key={lvl.value}
            type="button"
            onClick={() => setLogLevel(lvl.value)}
            className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md border text-[10px] font-semibold transition-all cursor-pointer ${
              logLevel === lvl.value
                ? "border-purple-500 bg-purple-500/10 text-purple-300"
                : "border-zinc-800 bg-zinc-800/40 text-zinc-500 hover:border-zinc-700"
            }`}
          >
            <span>{lvl.label}</span>
            <span className="text-[7.5px] font-normal opacity-60">{lvl.desc}</span>
          </button>
        ))}
      </div>

      <div className="pt-2 border-t border-zinc-800/40 flex justify-between items-center gap-2">
        <span className="text-[9px] text-zinc-500">
          Session logs are kept in-memory.
        </span>
        <button
          type="button"
          onClick={handleExportLogs}
          disabled={exporting}
          className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 px-3 py-1.5 text-[10px] font-bold rounded cursor-pointer border border-zinc-700 transition-all flex items-center gap-1"
        >
          <span>📥</span>
          <span>{exporting ? "Exporting..." : "Export Session Logs"}</span>
        </button>
      </div>
    </div>
  );
}
