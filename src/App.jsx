import React, { useState, useEffect } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./store/index.js";
import { navigateTo, toggleModule, setActiveModules } from "./store/featuresSlice.js";
import { extensionModules } from "./config/modules.js";

// InstaGrab Components
import Header from "./components/instagrab/Header.jsx";
import TabSwitcher from "./components/instagrab/TabSwitcher.jsx";
import DownloadsTab from "./components/instagrab/DownloadsTab.jsx";
import SettingsTab from "./components/instagrab/SettingsTab.jsx";

// Other Idea Components
import TimersTab from "./components/timers/TimersTab.jsx";
import YoutubeTab from "./components/youtube/YoutubeTab.jsx";
import VpnTab from "./components/vpn/VpnTab.jsx";

import { SettingsProvider } from "./context/SettingsContext.jsx";
import { HistoryProvider } from "./context/HistoryContext.jsx";
import { motion, AnimatePresence } from "framer-motion";

function AppContent() {
  const dispatch = useDispatch();
  const { currentFeature, activeModules } = useSelector((state) => state.features);
  const [activeTab, setActiveTab] = useState("downloads");

  // Sync activeModules with chrome storage on load
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["activeModules"], (result) => {
        if (result.activeModules) {
          dispatch(setActiveModules(result.activeModules));
        }
      });
    }
  }, [dispatch]);

  const handleToggleModule = (moduleId, e) => {
    e.stopPropagation();
    const updated = {
      ...activeModules,
      [moduleId]: !activeModules[moduleId]
    };
    dispatch(toggleModule(moduleId));
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ activeModules: updated });
    }
  };

  return (
    <div className="w-full h-screen bg-black-900 text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Header Area */}
      <div className="border-b border-zinc-900/50 bg-black/60 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentFeature !== "dashboard" && (
              <button
                onClick={() => dispatch(navigateTo("dashboard"))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all text-sm font-semibold cursor-pointer"
              >
                <span>←</span> Launcher Dashboard
              </button>
            )}
            {currentFeature === "instagrab" ? (
              <Header />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg">🛠️</span>
                <span className="font-bold text-zinc-200 text-base tracking-tight">Omni Extension Hub</span>
              </div>
            )}
          </div>
          <span className="text-xs text-zinc-650 bg-zinc-900/60 px-2.5 py-1 rounded-full border border-zinc-900/80 font-mono uppercase tracking-wider">
            Multi-Extension Mode
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-full w-full mx-auto p-6 md:py-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentFeature === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
            >
               {/* Dashboard Jumbotron */}
              <div className="text-center py-4 space-y-2">
                <h2 className="text-2xl font-bold bg-linear-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                  Extension Script Hub
                </h2>
                <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Manage and customize active extension modules. Toggle modules on/off globally or click configure to adjust granular options.
                </p>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {extensionModules.map((mod) => {
                  const isEnabled = !!activeModules[mod.id];
                  return (
                    <div
                      key={mod.id}
                      onClick={() => dispatch(navigateTo(mod.id))}
                      className="group relative bg-black/60 hover:bg-black/40 border border-black rounded-xl p-5 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Upper row: Icon and switch */}
                        <div className="flex justify-between items-start">
                          <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${mod.color} flex items-center justify-center text-lg shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                            {mod.icon}
                          </div>
                          
                          {/* Enable/Disable Switch */}
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isEnabled ? "text-emerald-400" : "text-zinc-650"}`}>
                              {isEnabled ? "Active" : "Disabled"}
                            </span>
                            <button
                              onClick={(e) => handleToggleModule(mod.id, e)}
                              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                                isEnabled ? "bg-emerald-500" : "bg-zinc-800 border border-zinc-700/50"
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                                  isEnabled ? "right-0.5" : "left-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Title & Desc */}
                        <div>
                          <h3 className="text-base font-bold text-zinc-200 group-hover:text-white transition-colors">
                            {mod.name}
                          </h3>
                          <p className="text-xs text-zinc-555 mt-1 leading-normal">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 pt-3 border-t border-zinc-900/60 flex justify-between items-center text-xs font-bold text-zinc-450 group-hover:text-zinc-300">
                        <span>Status: {isEnabled ? "Injected" : "Inactive"}</span>
                        <span className="text-purple-400 group-hover:translate-x-0.5 transition-transform">
                          Configure →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentFeature}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Feature Panel View */}
              {currentFeature === "instagrab" && (
                <div className="space-y-6">
                  {/* Desktop Dual-Pane Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-8 items-start">
                    {/* Left Pane: Settings */}
                    <div className="col-span-7 space-y-4 bg-zinc-900/20 border border-zinc-900 rounded-xl p-6 shadow-2xl backdrop-blur-md">
                      <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3 mb-2">
                        <span className="text-base">⚙️</span>
                        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          InstaGrab Settings
                        </h2>
                      </div>
                      <SettingsTab />
                    </div>

                    {/* Right Pane: Downloads */}
                    <div className="col-span-5 space-y-4 bg-zinc-900/20 border border-zinc-900 rounded-xl p-6 shadow-2xl backdrop-blur-md">
                      <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3 mb-2">
                        <span className="text-base">📥</span>
                        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          Download History
                        </h2>
                      </div>
                      <DownloadsTab />
                    </div>
                  </div>

                  {/* Mobile Single-Pane Tab Content */}
                  <div className="md:hidden space-y-4">
                    <div className="border-b border-zinc-900/30 bg-zinc-900/10">
                      <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                    {activeTab === "downloads" ? <DownloadsTab /> : <SettingsTab />}
                  </div>
                </div>
              )}



              {currentFeature === "timers" && (
                <div className="max-w-xl mx-auto bg-zinc-900/20 border border-zinc-900 rounded-xl p-6 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3 mb-4">
                    <span className="text-base">⏳</span>
                    <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      Bypass Timers
                    </h2>
                  </div>
                  <TimersTab />
                </div>
              )}

              {currentFeature === "youtube" && (
                <div className="space-y-6">
                  <YoutubeTab />
                </div>
              )}

              {currentFeature === "vpn" && (
                <div className="space-y-6">
                  <VpnTab />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {/* <footer className="py-4 border-t border-black/60 bg-black/60 text-center text-[10px] text-zinc-500 font-medium shrink-0">
        Developed for local use • Version 1.0.0
      </footer> */}
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SettingsProvider>
        <HistoryProvider>
          <AppContent />
        </HistoryProvider>
      </SettingsProvider>
    </Provider>
  );
}
