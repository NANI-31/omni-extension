import React, { useState } from "react";
import { useSettings } from "../../../context/SettingsContext.jsx";

export default function LoggingControlSetting() {
  const { logLevel, setLogLevel } = useSettings();
  const [exporting, setExporting] = useState(false);

  const handleExportLogs = async () => {
    setExporting(true);
    let contentLogs = [];
    let bgLogs = [];

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

    const timestamp = new Date().toISOString().replace("T", " ").replace(/\..+/, "");
    const header = `=========================================\nInstaGrab Session Logs — ${timestamp}\n=========================================\n\n`;
    
    const backgroundSection = `--- Background Service Worker Logs ---\n${bgLogs.length > 0 ? bgLogs.join("\n") : "(No background logs recorded)"}\n\n`;
    const contentSection = `--- Active Page Context Logs ---\n${contentLogs.length > 0 ? contentLogs.join("\n") : "(No page logs recorded)"}\n\n`;
    
    const fullLogText = header + backgroundSection + contentSection;

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
    <div className="rounded-xl border border-zinc-800 bg-[#161824] p-4.5 space-y-3.5 shadow-lg">
      <div className="space-y-1">
        <label className="text-xs font-bold text-white uppercase tracking-wider block">
          Console Debug Logging
        </label>
        <span className="text-xs text-zinc-400 block leading-relaxed">
          Configure console prints or export session logs directly to a text file for troubleshooting.
        </span>
      </div>

      <div className="flex gap-2.5">
        {levels.map((lvl) => (
          <button
            key={lvl.value}
            type="button"
            onClick={() => setLogLevel(lvl.value)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              logLevel === lvl.value
                ? "border-fuchsia-500 bg-fuchsia-600/25 text-white shadow-md shadow-fuchsia-600/20"
                : "border-zinc-700/80 bg-[#1b1e2e] text-zinc-300 hover:border-zinc-600 hover:text-white"
            }`}
          >
            <span>{lvl.label}</span>
            <span className="text-[10px] font-medium opacity-75">{lvl.desc}</span>
          </button>
        ))}
      </div>

      <div className="pt-2.5 border-t border-zinc-800 flex justify-between items-center gap-3">
        <span className="text-xs text-zinc-400">
          Session logs are kept in-memory.
        </span>
        <button
          type="button"
          onClick={handleExportLogs}
          disabled={exporting}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 active:scale-95 text-white px-3.5 py-1.5 text-xs font-bold rounded-xl cursor-pointer border-none transition-all shadow-md shadow-fuchsia-600/20 flex items-center gap-1.5"
        >
          <span>📥</span>
          <span>{exporting ? "Exporting..." : "Export Session Logs"}</span>
        </button>
      </div>
    </div>
  );
}
