import React, { useState, useEffect } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./store/index.js";
import { navigateTo, toggleModule, setActiveModules } from "./store/featuresSlice.js";
import { extensionModules } from "./config/modules.js";
import ModuleCard from "./components/ModuleCard";
import DashboardHeader from "./components/DashboardHeader";
import SearchBar from "./components/SearchBar";
import FeaturePanel from "./components/FeaturePanel";

// InstaGrab Components
import Header from "./components/instagrab/Header.jsx";
import SettingsTab from "./components/instagrab/SettingsTab.jsx";

// Other Idea Components
import TimersTab from "./components/timers/TimersTab.jsx";
import YoutubeTab from "./components/youtube/YoutubeTab.jsx";
import VpnTab from "./components/vpn/VpnTab.jsx";
import PinterestTab from "./components/pinterest/PinterestTab.jsx";

import { SettingsProvider } from "./context/SettingsContext.jsx";
import { motion, AnimatePresence } from "framer-motion";

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

  // return (
  //   <div className="w-full h-screen bg-black-900 text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
  //     {/* Header Area */}
  //     <div className="border-b border-zinc-900/50 bg-black/60 backdrop-blur-md sticky top-0 z-50 shrink-0">
  //       <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
  //         <div className="flex items-center gap-4">
  //           {currentFeature !== "dashboard" && (
  //             <button
  //               onClick={() => dispatch(navigateTo("dashboard"))}
  //               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all text-sm font-semibold cursor-pointer"
  //             >
  //               <span>←</span> Launcher Dashboard
  //             </button>
  //           )}
  //           {currentFeature === "instagrab" ? (
  //             <Header />
  //           ) : (
  //             <div className="flex items-center gap-2">
  //               <span className="text-lg">🛠️</span>
  //               <span className="font-bold text-zinc-200 text-base tracking-tight">Omni Extension Hub</span>
  //             </div>
  //           )}
  //         </div>
  //         <span className="text-xs text-zinc-650 bg-zinc-900/60 px-2.5 py-1 rounded-full border border-zinc-900/80 font-mono uppercase tracking-wider">
  //           Multi-Extension Mode
  //         </span>
  //       </div>
  //     </div>

  //     {/* Main Content Area */}
  //     <div className="flex-1 max-w-full w-full mx-auto p-6 md:py-8 overflow-y-auto">
  //       <AnimatePresence mode="wait">
  //         {currentFeature === "dashboard" ? (
  //           <motion.div
  //             key="dashboard"
  //             initial={{ opacity: 0, y: 12 }}
  //             animate={{ opacity: 1, y: 0 }}
  //             exit={{ opacity: 0, y: -12 }}
  //             transition={{ duration: 0.2, ease: "easeOut" }}
  //             className="space-y-6"
  //           >
  //              {/* Dashboard Jumbotron */}
  //             <div className="text-center py-4 space-y-2">
  //               <h2 className="text-2xl font-bold bg-linear-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
  //                 Extension Script Hub
  //               </h2>
  //               <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
  //                 Manage and customize active extension modules. Toggle modules on/off globally or click configure to adjust granular options.
  //               </p>
  //             </div>

  //             {/* Grid Layout */}
  //             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
  //               {extensionModules.map((mod) => {
  //                 const isEnabled = !!activeModules[mod.id];
  //                 return (
  //                   <div
  //                     key={mod.id}
  //                     onClick={() => dispatch(navigateTo(mod.id))}
  //                     className="group relative bg-black/60 hover:bg-black/40 border border-black rounded-xl p-5 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col justify-between"
  //                   >
  //                     <div className="space-y-3">
  //                       {/* Upper row: Icon and switch */}
  //                       <div className="flex justify-between items-start">
  //                         <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${mod.color} flex items-center justify-center text-lg shadow-lg group-hover:scale-105 transition-transform duration-300`}>
  //                           {mod.icon}
  //                         </div>
                          
  //                         {/* Enable/Disable Switch */}
  //                         <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
  //                           <span className={`text-xs font-bold uppercase tracking-wider ${isEnabled ? "text-emerald-400" : "text-zinc-650"}`}>
  //                             {isEnabled ? "Active" : "Disabled"}
  //                           </span>
  //                           <button
  //                             onClick={(e) => handleToggleModule(mod.id, e)}
  //                             className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
  //                               isEnabled ? "bg-emerald-500" : "bg-zinc-800 border border-zinc-700/50"
  //                             }`}
  //                           >
  //                             <span
  //                               className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
  //                                 isEnabled ? "right-0.5" : "left-0.5"
  //                               }`}
  //                             />
  //                           </button>
  //                         </div>
  //                       </div>

  //                       {/* Title & Desc */}
  //                       <div>
  //                         <h3 className="text-base font-bold text-zinc-200 group-hover:text-white transition-colors">
  //                           {mod.name}
  //                         </h3>
  //                         <p className="text-xs text-zinc-555 mt-1 leading-normal">
  //                           {mod.description}
  //                         </p>
  //                       </div>
  //                     </div>

  //                     {/* Footer Actions */}
  //                     <div className="mt-5 pt-3 border-t border-zinc-900/60 flex justify-between items-center text-xs font-bold text-zinc-450 group-hover:text-zinc-300">
  //                       <span>Status: {isEnabled ? "Injected" : "Inactive"}</span>
  //                       <span className="text-purple-400 group-hover:translate-x-0.5 transition-transform">
  //                         Configure →
  //                       </span>
  //                     </div>
  //                   </div>
  //                 );
  //               })}
  //             </div>
  //           </motion.div>
  //         ) : (
  //           <motion.div
  //             key={currentFeature}
  //             initial={{ opacity: 0, y: 12 }}
  //             animate={{ opacity: 1, y: 0 }}
  //             exit={{ opacity: 0, y: -12 }}
  //             transition={{ duration: 0.2, ease: "easeOut" }}
  //           >
  //             {/* Feature Panel View */}
  //             {currentFeature === "instagrab" && (
  //               <div className="w-full space-y-6 bg-zinc-900/20 border border-zinc-900 rounded-xl p-6 shadow-2xl backdrop-blur-md">
  //                 <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3 mb-4">
  //                   <span className="text-base">⚙️</span>
  //                   <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
  //                     InstaGrab Settings
  //                   </h2>
  //                 </div>
  //                 <SettingsTab />
  //               </div>
  //             )}



  //             {currentFeature === "timers" && (
  //               <div className="w-full space-y-6 bg-zinc-900/20 border border-zinc-900 rounded-xl p-6 shadow-2xl backdrop-blur-md">
  //                 <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3 mb-4">
  //                   <span className="text-base">⏳</span>
  //                   <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
  //                     Bypass Timers
  //                   </h2>
  //                 </div>
  //                 <TimersTab />
  //               </div>
  //             )}

  //             {currentFeature === "youtube" && (
  //               <div className="space-y-6">
  //                 <YoutubeTab />
  //               </div>
  //             )}

  //             {currentFeature === "vpn" && (
  //               <div className="space-y-6">
  //                 <VpnTab />
  //               </div>
  //             )}

  //             {currentFeature === "pinterest" && (
  //               <div>
  //                 <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3 mb-4">
  //                   <span className="text-base">📌</span>
  //                   <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
  //                     PinterestGrab Configuration
  //                   </h2>
  //                 </div>
  //                 <PinterestTab />
  //               </div>
  //             )}
  //           </motion.div>
  //         )}
  //       </AnimatePresence>
  //     </div>

  //     {/* Footer */}
  //     <footer className="py-4 border-t border-black/60 bg-black/60 text-center text-[10px] text-zinc-500 font-medium shrink-0">
  //       Developed for local use • Version 1.0.0
  //     </footer>
  //   </div>
  // );
 return (
  <div className="relative min-h-screen overflow-hidden bg-[#09090B] text-zinc-100">

    {/* Background */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-150 w-150 -translate-x-1/2 rounded-full bg-violet-600/10 blur-[140px]" />
      <div className="absolute right-0 top-40 h-112.5 w-112.5 rounded-full bg-cyan-500/10 blur-[130px]" />
      <div className="absolute bottom-0 left-0 h-125 w-125 rounded-full bg-fuchsia-500/10 blur-[150px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>

    {/* Main Content */}
    <div className="relative z-10 flex h-screen flex-col">
      {/* Header */}
      {/* <header className="sticky top-0 z-50 border-b border-white/5 bg-black/30 backdrop-blur-2xl">

        <div className="mx-auto flex h-20 items-center justify-between px-8">

          <div className="flex items-center gap-5">

            {currentFeature !== "dashboard" && (

              <button
                onClick={() => dispatch(navigateTo("dashboard"))}
                className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-all hover:border-violet-500/40 hover:bg-violet-500/10"
              >
                <span className="transition-transform group-hover:-translate-x-1">
                  ←
                </span>

                Dashboard
              </button>

            )}

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-600/30">

                🧩

              </div>

              <div>

                <h1 className="text-2xl font-bold tracking-tight">

                  Omni Extension Hub

                </h1>

                <p className="text-sm text-zinc-400">

                  Unified Browser Workspace

                </p>

              </div>

            </div>

          </div>

          <div className="flex items-center gap-4">

            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">

              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

              <span className="text-xs font-semibold text-emerald-300">

                Running

              </span>

            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-zinc-400">

              Version 1.0.0

            </div>

          </div>

        </div>

      </header> */}
      <DashboardHeader
        currentFeature={currentFeature}
        onBack={() =>
          dispatch(navigateTo("dashboard"))
        }
      />
      {/* Scroll Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-8 py-10">
          <AnimatePresence mode="wait">
            {currentFeature === "dashboard" ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: .25 }}
                className="space-y-10"
              >
                {/* Hero */}
                <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-linear-to-br from-zinc-900/80 via-zinc-900/60 to-black/70 p-10 backdrop-blur-xl">
                  <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-500/10 blur-[120px]" />
                  <div className="relative">
                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
                      Browser Productivity Suite
                    </span>
                    <h1 className="mt-6 text-5xl font-black leading-tight">
                      Manage Every
                      <br />
                      <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                        Extension
                      </span>
                      {" "}From One Place
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
                      Configure every installed module, customize behaviors,
                      monitor running services and instantly switch between tools.
                    </p>
                  </div>
                </section>

                {/* Stats */}
                <section className="grid gap-5 md:grid-cols-4">
                  <div className="rounded-3xl border border-white/5 bg-white/3 p-6 backdrop-blur-xl">
                    <p className="text-sm text-zinc-500">
                      Installed Modules
                    </p>
                    <h2 className="mt-3 text-4xl font-black">
                      {extensionModules.length}
                    </h2>
                  </div>
                  <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-6">
                    <p className="text-sm text-zinc-500">
                      Active
                    </p>
                    <h2 className="mt-3 text-4xl font-black text-emerald-400">
                      {Object.values(activeModules).filter(Boolean).length}
                    </h2>
                  </div>
                  <div className="rounded-3xl border border-red-500/10 bg-red-500/4 p-6">
                    <p className="text-sm text-zinc-500">
                      Disabled
                    </p>
                    <h2 className="mt-3 text-4xl font-black text-red-400">
                      {extensionModules.length -
                        Object.values(activeModules).filter(Boolean).length}
                    </h2>
                  </div>
                  <div className="rounded-3xl border border-cyan-500/10 bg-cyan-500/5 p-6">
                    <p className="text-sm text-zinc-500">
                      Workspace
                    </p>
                    <h2 className="mt-3 text-4xl font-black text-cyan-400">
                      Ready
                    </h2>
                  </div>
                </section>
                {/* Search */}
                {/* <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  <div className="relative w-full max-w-lg">

                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500">

                      🔍

                    </span>

                    <input
                      placeholder="Search modules..."
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-14 pr-5 text-sm outline-none transition-all placeholder:text-zinc-600 focus:border-violet-500/50 focus:bg-white/[0.06]"
                    />

                  </div>

                  <div className="flex flex-wrap gap-3">

                    {[
                      "All",
                      "Media",
                      "Productivity",
                      "Downloads",
                      "Utilities",
                    ].map((item) => (

                      <button
                        key={item}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm transition-all hover:border-violet-500/40 hover:bg-violet-500/10"
                      >
                        {item}
                      </button>

                    ))}

                  </div>

                </section> */}
                <SearchBar
                  value={search}
                  onChange={setSearch}
                />
                {/* Module Grid starts here */}
                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {extensionModules.map((mod) => {
                // const isEnabled = !!activeModules[mod.id];
                // return (
                //   <motion.div
                //     key={mod.id}
                //     layout
                //     whileHover={{ y: -8, scale: 1.015 }}
                //     whileTap={{ scale: 0.98 }}
                //     transition={{ duration: 0.25 }}
                //     onClick={() => dispatch(navigateTo(mod.id))}
                //     className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/8 bg-linear-to-br from-zinc-900/80 via-zinc-900/60 to-black/80 p-6 backdrop-blur-xl transition-all hover:border-violet-500/30 hover:shadow-[0_20px_60px_rgba(124,58,237,0.18)]"
                //   >
                //     {/* Background Glow */}
                //     <div
                //       className={`absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl transition-opacity duration-500 ${
                //         isEnabled
                //           ? "bg-violet-500/15 opacity-100"
                //           : "bg-zinc-700/10 opacity-40"
                //       }`}
                //     />

                //     {/* Active Badge */}
                //     <div className="absolute right-5 top-5">
                //       <div
                //         className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${
                //           isEnabled
                //             ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                //             : "bg-zinc-800/70 text-zinc-500 border border-zinc-700"
                //         }`}
                //       >
                //         <span
                //           className={`h-2 w-2 rounded-full ${
                //             isEnabled
                //               ? "bg-emerald-400 animate-pulse"
                //               : "bg-zinc-600"
                //           }`}
                //         />

                //         {isEnabled ? "Running" : "Disabled"}
                //       </div>
                //     </div>

                //     {/* Icon */}
                //     <div
                //       className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${mod.color} text-3xl shadow-xl transition-all duration-300 group-hover:rotate-3 group-hover:scale-110`}
                //     >
                //       {mod.icon}
                //     </div>

                //     {/* Content */}
                //     <div className="mt-7">

                //       <h3 className="text-xl font-bold tracking-tight text-white transition group-hover:text-violet-300">
                //         {mod.name}
                //       </h3>

                //       <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-400">
                //         {mod.description}
                //       </p>

                //     </div>

                //     {/* Divider */}
                //     <div className="my-6 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                //     {/* Footer */}
                //     <div className="flex items-center justify-between">

                //       <div className="space-y-1">

                //         <p className="text-xs uppercase tracking-widest text-zinc-500">
                //           Status
                //         </p>

                //         <p
                //           className={`text-sm font-semibold ${
                //             isEnabled
                //               ? "text-emerald-400"
                //               : "text-zinc-500"
                //           }`}
                //         >
                //           {isEnabled ? "Injected" : "Inactive"}
                //         </p>

                //       </div>

                //       {/* Switch */}
                //       <button
                //         onClick={(e) => handleToggleModule(mod.id, e)}
                //         className={`relative h-8 w-16 rounded-full transition-all duration-300 ${
                //           isEnabled
                //             ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                //             : "bg-zinc-800"
                //         }`}
                //       >
                //         <motion.span
                //           layout
                //           transition={{
                //             type: "spring",
                //             stiffness: 500,
                //             damping: 35,
                //           }}
                //           className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg ${
                //             isEnabled ? "left-9" : "left-1"
                //           }`}
                //         />
                //       </button>

                //     </div>

                //     {/* Bottom Action */}
                //     <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 transition-all group-hover:border-violet-500/20 group-hover:bg-violet-500/[0.05]">

                //       <div>

                //         <p className="text-xs uppercase tracking-widest text-zinc-500">
                //           Open Settings
                //         </p>

                //         <p className="mt-1 text-sm font-medium text-zinc-300">
                //           Configure Module
                //         </p>

                //       </div>

                //       <motion.div
                //         animate={{ x: isEnabled ? 4 : 0 }}
                //         transition={{
                //           repeat: Infinity,
                //           repeatType: "reverse",
                //           duration: 1.4,
                //         }}
                //         className="text-xl text-violet-400"
                //       >
                //         →
                //       </motion.div>

                //     </div>
                //   </motion.div>
                // );
                  <ModuleCard
                    key={mod.id}
                    mod={mod}
                    isEnabled={!!activeModules[mod.id]}
                    onNavigate={() =>
                      dispatch(navigateTo(mod.id))
                    }
                    onToggle={() =>
                      handleToggleModule(mod.id)
                    }
                  />
                })}
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
                <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-linear-to-br from-zinc-900/90 via-zinc-900/70 to-black/80 shadow-2xl backdrop-blur-2xl">
                  {/* Decorative Glow */}
                  <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-500/10 blur-[140px]" />
                  {/* Header */}
                  <div className="relative border-b border-white/5 px-8 py-7">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-3xl shadow-xl shadow-violet-600/30">
                          {currentFeature === "youtube" && "🎬"}
                          {currentFeature === "instagrab" && "📸"}
                          {currentFeature === "vpn" && "🛡️"}
                          {currentFeature === "timers" && "⏱️"}
                          {currentFeature === "pinterest" && "📌"}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-violet-400">
                            Workspace
                          </p>
                          <h2 className="mt-2 text-3xl font-black">
                            {currentFeature === "youtube" &&
                              "YouTube Toolkit"}
                            {currentFeature === "instagrab" &&
                              "InstaGrab"}
                            {currentFeature === "vpn" &&
                              "VPN Manager"}
                            {currentFeature === "timers" &&
                              "Timer Bypass"}
                            {currentFeature === "pinterest" &&
                              "Pinterest Grab"}
                          </h2>
                          <p className="mt-2 text-zinc-400">
                            Configure every option for this module from a single workspace.
                          </p>
                        </div>
                      </div>
                      <div className="hidden lg:flex items-center gap-4">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3">
                          <p className="text-xs uppercase tracking-widest text-zinc-500">
                            Status
                          </p>
                          <p className="mt-1 font-semibold text-emerald-300">
                            Running
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
                          <p className="text-xs uppercase tracking-widest text-zinc-500">
                            Module
                          </p>
                          <p className="mt-1 font-semibold">
                            {currentFeature}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative p-8">
                    {currentFeature === "youtube" && (
                      <YoutubeTab />
                    )}
                    {currentFeature === "vpn" && (
                      <VpnTab />
                    )}
                    {currentFeature === "instagrab" && (
                      <SettingsTab />
                    )}
                    {currentFeature === "timers" && (
                      <TimersTab />
                    )}
                    {currentFeature === "pinterest" && (
                      <PinterestTab />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/20 backdrop-blur-xl">
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
      </footer>
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
