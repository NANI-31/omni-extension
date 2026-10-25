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
const VideoGrabTab = React.lazy(() => import("./components/videograb/VideoGrabTab.jsx"));
const AdblockTab   = React.lazy(() => import("./components/adblock/AdblockTab.jsx"));
import VideoDownloaderPopup from "./components/popup/VideoDownloaderPopup.jsx";

import { SettingsProvider } from "./context/SettingsContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const TabLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
    <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500">Loading feature module...</span>
  </div>
);


function AppContent() {
  const dispatch = useDispatch();
  const { currentFeature, activeModules } = useSelector((state) => state.features);

  const isTabMode = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "tab" || params.get("mode") === "dashboard";
  }, []);

  // Sync body class for responsive sizing between popup (fixed 460px) and tab (100% full screen)
  useEffect(() => {
    if (isTabMode) {
      document.body.classList.add("tab-mode");
    } else {
      document.body.classList.remove("tab-mode");
    }
  }, [isTabMode]);

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

  const activeModulesCount = React.useMemo(() => {
    return extensionModules.filter((m) => !!activeModules[m.id]).length;
  }, [activeModules]);

  if (!isTabMode) {
    return <VideoDownloaderPopup />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0c16] text-zinc-100">

      {/* Background Ambient Layers (Native Radial Gradients for 100x faster GPU rasterization) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 h-140 w-140 -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute right-0 top-40 h-100 w-100 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 h-120 w-120 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(217, 70, 239, 0.08) 0%, transparent 70%)",
          }}
        />
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
        {/* Header - Only displayed on Main Dashboard */}
        {currentFeature === "dashboard" && (
          <DashboardHeader
            currentFeature={currentFeature}
            onBack={() => dispatch(navigateTo("dashboard"))}
          />
        )}
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
                  style={{
                    transform: "translateZ(0)",
                    willChange: "scroll-position",
                    overscrollBehaviorY: "contain",
                  }}
                  className="w-full flex-1 min-h-0 overflow-y-auto scroll-smooth space-y-6 px-6 py-6"
                >
                  {/* Hero Banner */}
                  <section className="relative overflow-hidden rounded-2xl border border-zinc-700/80 ring-1 ring-white/10 bg-linear-to-b from-[#1b1e32] to-[#141626] p-6 shadow-xl shadow-black/60">
                    <div
                      className="absolute right-0 top-0 h-48 w-48 rounded-full pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)",
                      }}
                    />
                    <div className="relative">
                      <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-200 mb-3 shadow-sm shadow-purple-950/40">
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                        <span>Unified Browser Productivity Workspace</span>
                      </div>
                      <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-white">
                        Manage Every{" "}
                        <span className="bg-linear-to-r from-purple-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent">
                          Extension
                        </span>{" "}
                        From One Place
                      </h1>
                      <p className="mt-2 max-w-2xl text-xs md:text-sm leading-relaxed text-zinc-300 font-normal">
                        Configure your installed modules, toggle background workers, download streaming video,
                        and customize browser controls with complete privacy.
                      </p>
                    </div>
                  </section>

                  {/* Section Header */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h2 className="text-base font-extrabold tracking-tight text-white">Installed Modules</h2>
                      <p className="text-xs text-zinc-300 font-medium">Click any card to open its dedicated configuration panel</p>
                    </div>
                    <span className="text-xs font-sans font-bold text-purple-200 bg-purple-500/20 border border-purple-500/35 px-2.5 py-1 rounded-lg shadow-sm">
                      {activeModulesCount}/{extensionModules.length} Active
                    </span>
                  </div>

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
                  <div
                    className="absolute right-0 top-0 h-80 w-80 rounded-full pointer-events-none"
                    style={{
                      background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)",
                    }}
                  />
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
                        {currentFeature === "videograb" && (
                          <FeaturePanel
                            icon="🎬"
                            title="Stream Sniffer & Downloader"
                            description="Detect, organize, and download HLS streams (.m3u8) and direct MP4 videos across all open tabs"
                            currentFeature={currentFeature}
                          >
                            <VideoGrabTab />
                          </FeaturePanel>
                        )}
                        {currentFeature === "adblock" && (
                          <FeaturePanel
                            icon="🛡️"
                            title="AdShield Protection"
                            description="Block ads, banners, video blockers, and protect your privacy"
                            currentFeature={currentFeature}
                          >
                            <AdblockTab />
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
