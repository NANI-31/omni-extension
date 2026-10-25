import { useState } from "react";
import { Terminal, Download } from "lucide-react";
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
    { value: "silent", label: "Silent", desc: "No logs recorded" },
    { value: "errors", label: "Errors Only", desc: "Failures only" },
    { value: "verbose", label: "Verbose Debug", desc: "Full trace output" }
  ];

  return (
    <div className="rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-5 space-y-4 shadow-xl shadow-black/60">
      <div className="flex items-center gap-3 border-b border-zinc-700/80 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/35 text-purple-300 shadow-sm">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <label className="text-xs font-bold text-white uppercase tracking-wider block">
            Console Debug Logging
          </label>
          <span className="text-xs text-zinc-300 block leading-relaxed font-normal">
            Configure console prints or export session logs directly to a text file for troubleshooting.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {levels.map((lvl) => (
          <button
            key={lvl.value}
            type="button"
            onClick={() => setLogLevel(lvl.value)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              logLevel === lvl.value
                ? "border-fuchsia-500/70 bg-fuchsia-500/25 text-white shadow-md shadow-fuchsia-950/40 ring-1 ring-fuchsia-400/30"
                : "border-zinc-700/80 bg-[#0f111e] text-zinc-300 hover:border-zinc-600 hover:text-white"
            }`}
          >
            <span>{lvl.label}</span>
            <span className="text-[10px] font-medium opacity-80">{lvl.desc}</span>
          </button>
        ))}
      </div>

      <div className="pt-3 border-t border-zinc-700/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <span className="text-xs text-zinc-300 font-medium">
          Session logs are kept strictly in-memory.
        </span>
        <button
          type="button"
          onClick={handleExportLogs}
          disabled={exporting}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-zinc-650 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 text-zinc-100 hover:text-white text-xs font-semibold shadow-md shadow-black/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Download className="w-4 h-4 text-fuchsia-400" />
          <span>{exporting ? "Exporting..." : "Export Session Logs"}</span>
        </button>
      </div>
    </div>
  );
}

