import React, { useState, useEffect } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./store/index.js";
import { navigateTo, toggleModule, setActiveModules } from "./store/featuresSlice.js";
import { extensionModules } from "./config/modules.js";
import ModuleCard from "./components/ModuleCard";
import DashboardHeader from "./components/DashboardHeader";
import SearchBar from "./components/SearchBar";
import FeaturePanel from "./components/FeaturePanel";
import SectionHeader from "./components/ui/SectionHeader";
import GlassButton from "./components/ui/GlassButton";
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
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const filteredModules = extensionModules.filter((mod) => {
    const matchesSearch =
      mod.name.toLowerCase().includes(search.toLowerCase()) ||
      mod.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || mod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-full px-6 py-6">
            <AnimatePresence mode="wait">
              {currentFeature === "dashboard" ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Hero */}
                  <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#131520] p-6 shadow-xl">
                    <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />
                    <div className="relative">
                      <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">
                        Browser Productivity Suite
                      </span>
                      <h1 className="mt-3 text-3xl font-extrabold tracking-tight leading-tight text-white">
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

                  {/* Stats */}
                  <section className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-4">
                    <div className="rounded-2xl border border-violet-500/25 bg-[#141624] p-4 backdrop-blur-xl flex flex-col justify-between shadow-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 text-sm font-bold">
                          🧩
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Modules</p>
                          <p className="text-[10px] text-zinc-400">Installed tools</p>
                        </div>
                      </div>
                      <h2 className="mt-3 text-2xl font-black text-white">
                        {extensionModules.length}
                      </h2>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-[#10221A] p-4 flex flex-col justify-between shadow-lg">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active</p>
                      <h2 className="mt-3 text-2xl font-black text-emerald-400">
                        {Object.values(activeModules).filter(Boolean).length}
                      </h2>
                    </div>

                    <div className="rounded-2xl border border-rose-500/30 bg-[#221217] p-4 flex flex-col justify-between shadow-lg">
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Disabled</p>
                      <h2 className="mt-3 text-2xl font-black text-rose-400">
                        {extensionModules.length -
                          Object.values(activeModules).filter(Boolean).length}
                      </h2>
                    </div>

                    <div className="rounded-2xl border border-cyan-500/30 bg-[#0F1E28] p-4 flex flex-col justify-between shadow-lg">
                      <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Workspace</p>
                      <h2 className="mt-3 text-2xl font-black text-cyan-300">Ready</h2>
                    </div>
                  </section>

                  {/* Search and Filters */}
                  <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SearchBar value={search} onChange={setSearch} />
                    <div className="flex flex-wrap gap-2">
                      {["All", "Media", "Productivity", "Downloads", "Utilities"].map(
                        (item) => (
                          <button
                            key={item}
                            onClick={() => setSelectedCategory(item)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                              selectedCategory === item
                                ? "border-violet-500 bg-violet-600/30 text-white shadow-md shadow-violet-600/20"
                                : "border-zinc-800 bg-[#141620] text-zinc-400 hover:border-zinc-700 hover:text-white"
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>
                  </section>

                  {/* Module Grid */}
                  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredModules.map((mod) => (
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Workspace Container */}
                {/* <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-linear-to-br from-zinc-900/90 via-zinc-900/70 to-black/80 shadow-2xl backdrop-blur-2xl"> */}
                  {/* Decorative Glow */}
                  <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-500/10 blur-[140px]" />
                  {/* Content */}
                  <div className="relative p-4">
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

                {/* </div> */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      {/* <footer className="border-t border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
          <div>
            <h3 className="font-semibold text-zinc-200">
              Omni Extension Hub
            </h3>
            <p className="text-sm text-zinc-500">
              Unified browser productivity workspace
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Build
              </p>
              <p className="mt-1 text-sm font-semibold">
                Local
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Version
              </p>
              <p className="mt-1 text-sm font-semibold">
                1.0.0
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer> */}
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
