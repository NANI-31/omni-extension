import React, { useEffect } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./store/index.js";
import { navigateTo, toggleModule, setActiveModules } from "./store/featuresSlice.js";
import { extensionModules } from "./config/modules.js";
import ModuleCard from "./components/ModuleCard";
import DashboardHeader from "./components/DashboardHeader";
import FeaturePanel from "./components/FeaturePanel";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Lazy-loaded feature tab components (Code-Splitting for sub-200kB popup chunks)
const InstagramTab = React.lazy(() => import("./components/instagrab/InstagramTab.jsx"));
const TimersTab    = React.lazy(() => import("./components/timers/TimersTab.jsx"));
const YoutubeTab   = React.lazy(() => import("./components/youtube/YoutubeTab.jsx"));
const VpnTab       = React.lazy(() => import("./components/vpn/VpnTab.jsx"));
const PinterestTab = React.lazy(() => import("./components/pinterest/PinterestTab.jsx"));

import { SettingsProvider } from "./context/SettingsContext.jsx";
import { motion, AnimatePresence } from "framer-motion";

const TabLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
    <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500">Loading feature module...</span>
  </div>
);


function AppContent() {
  const dispatch = useDispatch();
  const { currentFeature, activeModules } = useSelector((state) => state.features);

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
    if (e) e.stopPropagation();
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
    <div className="relative min-h-screen overflow-hidden bg-[#0a0b10] text-zinc-100">

      {/* Background Ambient Layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-140 w-140 -translate-x-1/2 rounded-full bg-violet-600/8 blur-[140px]" />
        <div className="absolute right-0 top-40 h-100 w-100 rounded-full bg-cyan-500/6 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-120 w-120 rounded-full bg-fuchsia-500/6 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex h-screen flex-col">
        {/* Header */}
        <DashboardHeader
          currentFeature={currentFeature}
          onBack={() => dispatch(navigateTo("dashboard"))}
        />
        {/* Scroll Area */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="w-full h-full flex-1 flex flex-col min-h-0 px-0 py-0">
            <AnimatePresence mode="wait">
              {currentFeature === "dashboard" ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.05 }}
                  className="w-full flex-1 min-h-0 overflow-y-auto space-y-6 px-6 py-6"
                >
                  {/* Hero */}
                  <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#131520] p-4 shadow-xl">
                    <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />
                    <div className="relative">
                      <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-white">
                        Manage Every{" "}
                        <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                          Extension
                        </span>{" "}
                        From One Place
                      </h1>
                      <p className="mt-2 max-w-xl text-xs leading-relaxed text-zinc-400">
                        Configure every installed module, customize behaviors,
                        monitor running services and instantly switch between tools.
                      </p>
                    </div>
                  </section>

                  {/* Module Grid */}
                  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {extensionModules.map((mod) => (
                      <ModuleCard
                        key={mod.id}
                        mod={mod}
                        isEnabled={!!activeModules[mod.id]}
                        onNavigate={() => dispatch(navigateTo(mod.id))}
                        onToggle={() => handleToggleModule(mod.id)}
                      />
                    ))}
                  </section>
                </motion.div>
              ) : (
                <motion.div
                  key={currentFeature}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.05 }}
                  className="w-full h-full flex-1 flex flex-col min-h-0"
                >
                  {/* Decorative Glow */}
                  <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-500/10 blur-[140px] pointer-events-none" />
                  {/* Content */}
                  <div className="relative w-full h-full flex-1 flex flex-col min-h-0 p-0">
                    <ErrorBoundary name={currentFeature || "FeaturePanel"}>
                      <React.Suspense fallback={<TabLoadingFallback />}>
                        {currentFeature === "youtube" && (
                          <FeaturePanel
                            icon="🎬"
                            title="YouTube Toolkit"
                            description="Advanced playback controls and customization"
                            currentFeature={currentFeature}
                          >
                            <YoutubeTab />
                          </FeaturePanel>
                        )}
                        {currentFeature === "vpn" && (
                          <FeaturePanel
                            icon="🛡️"
                            title="VPN Manager"
                            description="Secure connections and privacy controls"
                            currentFeature={currentFeature}
                          >
                            <VpnTab />
                          </FeaturePanel>
                        )}
                        {currentFeature === "instagrab" && (
                          <FeaturePanel
                            icon="📸"
                            title="Instagram Downloader"
                            description="Download photos and videos from Instagram"
                            currentFeature={currentFeature}
                          >
                            <InstagramTab />
                          </FeaturePanel>
                        )}
                        {currentFeature === "timers" && (
                          <FeaturePanel
                            icon="⏱️"
                            title="Timers & Alarms"
                            description="Productivity timers and countdowns"
                            currentFeature={currentFeature}
                          >
                            <TimersTab />
                          </FeaturePanel>
                        )}
                        {currentFeature === "pinterest" && (
                          <FeaturePanel
                            icon="📌"
                            title="Pinterest"
                            description="Pinterest features"
                            currentFeature={currentFeature}
                          >
                            <PinterestTab />
                          </FeaturePanel>
                        )}
                      </React.Suspense>
                    </ErrorBoundary>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </Provider>
  );
}
