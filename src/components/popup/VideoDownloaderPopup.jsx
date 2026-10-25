import React, { useState, useEffect, useMemo, useRef } from "react";
import { Folder, ExternalLink } from "lucide-react";
import { isHlsUrl, extractHlsVariants } from "../../utils/hlsDownloader";
import { generateYtDlpCommand } from "../../utils/ytdlpClient";

import {
  YOUTUBE_FMT_QUALITIES,
  YOUTUBE_HLS_QUALITIES,
  getFormatDisplay,
} from "./constants";
import PopupHeader from "./PopupHeader";
import PopupSettings from "./PopupSettings";
import PopupTabs from "./PopupTabs";
import ModulesView from "./ModulesView";
import VideoCard from "./VideoCard";
import EmptyVideosView from "./EmptyVideosView";
import YtDlpModal from "./YtDlpModal";
import useVideoDownloader from "./useVideoDownloader";

export default function VideoDownloaderPopup() {
  const [activeTab, setActiveTab] = useState(null);
  const [detectedVideos, setDetectedVideos] = useState([]);
  const [downloadFolder, setDownloadFolder] = useState("OmniVideos");
  const [askWhereToSave, setAskWhereToSave] = useState(false);
  const [autoStopCompanion, setAutoStopCompanion] = useState(true);

  const [selectedFormats, setSelectedFormats] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [popupView, setPopupView] = useState("videos"); // "videos" | "modules"

  // AdShield & Modules Management State
  const [adblockEnabled, setAdblockEnabled] = useState(true);
  const [adblockBlockedCount, setAdblockBlockedCount] = useState(0);
  const [adblockYtBypass, setAdblockYtBypass] = useState(true);
  const [adblockCookieBanner, setAdblockCookieBanner] = useState(true);
  const [adblockNotifications, setAdblockNotifications] = useState(true);
  const [activeModules, setActiveModulesState] = useState({
    instagrab: true,
    timers: true,
    youtube: true,
    vpn: true,
    pinterest: true,
    videograb: true,
    adblock: true,
  });

  const selectedItemRef = useRef(null);

  // Load AdShield and modules states
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(
        [
          "activeModules",
          "adblockEnabled",
          "adblockBlockedCount",
          "adblockYtBypass",
          "adblockCookieBanner",
          "adblockNotifications",
        ],
        (res) => {
          if (res.activeModules) setActiveModulesState(res.activeModules);
          if (res.adblockEnabled !== undefined) setAdblockEnabled(res.adblockEnabled);
          if (res.adblockBlockedCount !== undefined) setAdblockBlockedCount(res.adblockBlockedCount);
          if (res.adblockYtBypass !== undefined) setAdblockYtBypass(res.adblockYtBypass);
          if (res.adblockCookieBanner !== undefined) setAdblockCookieBanner(res.adblockCookieBanner);
          if (res.adblockNotifications !== undefined) setAdblockNotifications(res.adblockNotifications);
        }
      );

      const storageListener = (changes, area) => {
        if (area !== "local") return;
        if (changes.activeModules) setActiveModulesState(changes.activeModules.newValue || {});
        if (changes.adblockEnabled) setAdblockEnabled(changes.adblockEnabled.newValue !== false);
        if (changes.adblockBlockedCount) setAdblockBlockedCount(changes.adblockBlockedCount.newValue || 0);
      };
      chrome.storage.onChanged.addListener(storageListener);
      return () => chrome.storage.onChanged.removeListener(storageListener);
    }
  }, []);

  const handleToggleAdblock = (val) => {
    const next = typeof val === "boolean" ? val : !adblockEnabled;
    setAdblockEnabled(next);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ adblockEnabled: next });
    }
  };

  const handleToggleSubSetting = (key, currentVal) => {
    const next = !currentVal;
    if (key === "adblockYtBypass") setAdblockYtBypass(next);
    if (key === "adblockCookieBanner") setAdblockCookieBanner(next);
    if (key === "adblockNotifications") setAdblockNotifications(next);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ [key]: next });
    }
  };

  const handleToggleModule = (modId) => {
    const next = { ...activeModules, [modId]: !activeModules[modId] };
    setActiveModulesState(next);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ activeModules: next });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdownId]);

  // Smoothly scroll selected item into view when dropdown opens
  useEffect(() => {
    if (openDropdownId && selectedItemRef.current) {
      setTimeout(() => {
        selectedItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }, 50);
    }
  }, [openDropdownId]);

  // Load active tab and media registry on mount
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.tabs) return;

    chrome.storage.local.get(
      ["videograbFolder", "videograbSaveAs", "detectedMediaRegistry", "autoStopCompanion"],
      (res) => {
        if (res.videograbFolder) setDownloadFolder(res.videograbFolder);
        if (res.videograbSaveAs !== undefined) setAskWhereToSave(res.videograbSaveAs);
        if (res.autoStopCompanion !== undefined) setAutoStopCompanion(res.autoStopCompanion);

        // Query active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs || tabs.length === 0) return;
          const cur = tabs[0];
          setActiveTab(cur);

          let foundMedia = [];
          if (Array.isArray(res.detectedMediaRegistry)) {
            const tabEntry = res.detectedMediaRegistry.find((t) => t.tabId === cur.id);
            if (tabEntry && Array.isArray(tabEntry.streams)) {
              foundMedia = tabEntry.streams;
            }
          }

          if (foundMedia.length > 0) {
            setDetectedVideos(foundMedia);
          } else {
            scanCurrentTab(cur.id);
          }
        });
      }
    );

    const handleStorageChange = (changes, area) => {
      if (area === "local" && changes.detectedMediaRegistry && activeTab) {
        const reg = changes.detectedMediaRegistry.newValue;
        if (Array.isArray(reg)) {
          const tabEntry = reg.find((t) => t.tabId === activeTab.id);
          if (tabEntry && Array.isArray(tabEntry.streams)) {
            setDetectedVideos(tabEntry.streams);
          }
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [activeTab?.id]);

  // Discover multi-quality variants for detected HLS streams
  useEffect(() => {
    if (!detectedVideos || detectedVideos.length === 0) return;

    detectedVideos.forEach((v) => {
      const isHls = isHlsUrl(v.url, v.format);
      if (isHls && (!v.availableFormats || v.availableFormats.length <= 1)) {
        extractHlsVariants(v.url).then((variants) => {
          if (variants && variants.length > 0) {
            setDetectedVideos((prev) =>
              prev.map((item) => {
                if (item.id === v.id || item.url === v.url) {
                  const masterOption = {
                    label: "HLS - Best Quality (Adaptive)",
                    resolution: "Adaptive",
                    format: "hls",
                    bitrate: "Auto",
                    url: v.url,
                  };
                  return {
                    ...item,
                    availableFormats: [masterOption, ...variants],
                  };
                }
                return item;
              })
            );
          }
        });
      }
    });
  }, [detectedVideos.length]);

  const scanCurrentTab = (tabId) => {
    if (!tabId || typeof chrome === "undefined" || !chrome.tabs) return;
    setIsScanning(true);
    chrome.tabs.sendMessage(tabId, { action: "SCAN_PAGE_VIDEOS" }, (response) => {
      setIsScanning(false);
      if (chrome.runtime?.lastError || !response) return;
      if (Array.isArray(response.media) && response.media.length > 0) {
        setDetectedVideos(response.media);
      }
    });
  };

  const openFullDashboard = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL("index.html?mode=tab") });
      window.close();
    }
  };

  // Consolidate detected video streams matching original extension layout
  const consolidatedVideos = useMemo(() => {
    const isYt = activeTab?.url?.includes("youtube.com");
    const ytMatch = activeTab?.url?.match(/(?:v=|shorts\/|embed\/)([a-zA-Z0-9_-]{11})/);
    const activeYtId = ytMatch ? ytMatch[1] : null;

    if (isYt && activeYtId) {
      const directPlaybackStream = detectedVideos.find(
        (v) => v.url && v.url.includes("videoplayback")
      );
      const hlsStream = detectedVideos.find(
        (v) => v.url && (v.url.includes(".m3u8") || v.format === "hls")
      );

      const detectedYt = detectedVideos.find(
        (v) => v.isYouTube || v.videoId === activeYtId || (v.duration && v.duration.trim())
      );
      const ytDuration = detectedYt?.duration || "";

      const baseTitle = (activeTab?.title || detectedYt?.title || "YouTube Video")
        .replace(/ - YouTube$/, "")
        .replace(/\.mp4$/i, "")
        .trim();

      const fmtCard = {
        id: `yt_${activeYtId}_fmt`,
        streamType: "FMT",
        isYouTube: true,
        videoId: activeYtId,
        title: `${baseTitle}.mp4`,
        customName: `${baseTitle}.mp4`,
        thumbnail: `https://i.ytimg.com/vi/${activeYtId}/hqdefault.jpg`,
        duration: ytDuration,
        format: "mp4",
        resolution: "1080p",
        selectedFormat: YOUTUBE_FMT_QUALITIES[4],
        availableFormats: YOUTUBE_FMT_QUALITIES,
        url: directPlaybackStream?.url || activeTab?.url,
      };

      const hlsCard = {
        id: `yt_${activeYtId}_hls`,
        streamType: "HLS",
        isYouTube: true,
        videoId: activeYtId,
        title: `${baseTitle}.mp4`,
        customName: `${baseTitle}.mp4`,
        thumbnail: `https://i.ytimg.com/vi/${activeYtId}/hqdefault.jpg`,
        duration: ytDuration,
        format: "hls",
        resolution: "Adaptive Stream",
        selectedFormat: YOUTUBE_HLS_QUALITIES[0],
        availableFormats: YOUTUBE_HLS_QUALITIES,
        url: hlsStream?.url || activeTab?.url,
      };

      return [fmtCard, hlsCard];
    }

    if (!detectedVideos || detectedVideos.length === 0) return [];

    const map = new Map();
    detectedVideos.forEach((v) => {
      const key = v.id || v.url || v.title || "video";
      if (!map.has(key)) {
        const cleanTitle = (v.customName || v.title || activeTab?.title || "Video")
          .replace(/\.hls/gi, "")
          .replace(/\.(mp4|m3u8|webm|ts|m4s|mpd)$/i, "")
          .trim();
        map.set(key, {
          ...v,
          id: key,
          streamType: v.format === "hls" || v.url?.includes(".m3u8") ? "HLS" : "MP4",
          title: cleanTitle,
          customName: cleanTitle,
          thumbnail: v.thumbnail || "",
          duration: v.duration || "",
          format: v.format || "mp4",
          resolution: v.resolution || "Standard",
          availableFormats: v.availableFormats?.length
            ? v.availableFormats
            : [
                {
                  label: `${v.format?.toUpperCase() || "MP4"} - ${v.resolution || "Direct Video"}`,
                  resolution: v.resolution || "Standard",
                  format: v.format || "mp4",
                  bitrate: v.sizeEstimate || "",
                  url: v.url,
                },
              ],
          url: v.url,
        });
      }
    });

    return Array.from(map.values());
  }, [detectedVideos, activeTab]);

  const getActiveFormat = (video) => {
    return (
      selectedFormats[video.id] ||
      video.selectedFormat ||
      (video.availableFormats && video.availableFormats[0]) || {
        label: `${video.format?.toUpperCase() || "MP4"} - ${video.resolution || "1080p"}`,
        format: video.format || "mp4",
        resolution: video.resolution || "1080p",
      }
    );
  };

  const handleSelectFormat = (video, formatOption) => {
    setSelectedFormats((prev) => ({
      ...prev,
      [video.id]: formatOption,
    }));
    setOpenDropdownId(null);
  };

  // Custom hook encapsulating HLS, yt-dlp, and direct download execution
  const {
    downloadingId,
    downloadSuccessId,
    downloadProgress,
    ytdlpCompanion,
    ytdlpOfflineModal,
    setYtDlpOfflineModal,
    isStartingServer,
    copiedCmd,
    handleDownload,
    handleStartServer,
    handleCheckAndDownload,
    handleCopyCommand,
    handleStopCompanion,
    handleDownloadNow,
    openYtDlpFolder,
  } = useVideoDownloader({
    activeTab,
    downloadFolder,
    askWhereToSave,
    autoStopCompanion,
    consolidatedVideos,
    getActiveFormat,
  });

  const handleStartRename = (video, e) => {
    if (e) e.stopPropagation();
    setEditingId(video.id);
    setEditValue(video.customName || video.title || "video.mp4");
  };

  const handleSaveRename = (video) => {
    const trimmed = editValue.trim() || video.title || "video.mp4";
    setDetectedVideos((prev) =>
      prev.map((v) => (v.id === video.id || v.videoId === video.videoId ? { ...v, customName: trimmed, title: trimmed } : v))
    );
    setEditingId(null);

    if (typeof chrome !== "undefined" && chrome.storage && activeTab) {
      chrome.storage.local.get({ detectedMediaRegistry: [] }, (res) => {
        const reg = (res.detectedMediaRegistry || []).map((tab) => {
          if (tab.tabId === activeTab.id) {
            return {
              ...tab,
              streams: tab.streams.map((s) =>
                s.id === video.id || s.videoId === video.videoId
                  ? { ...s, customName: trimmed, title: trimmed }
                  : s
              ),
            };
          }
          return tab;
        });
        chrome.storage.local.set({ detectedMediaRegistry: reg });
      });
    }
  };

  const handleDismissVideo = (video, e) => {
    if (e) e.stopPropagation();
    setDetectedVideos((prev) => prev.filter((v) => v.id !== video.id && v.videoId !== video.videoId));
  };

  const handleCopyUrl = (video, e) => {
    if (e) e.stopPropagation();
    const activeFormat = getActiveFormat(video);
    const downloadUrl = activeFormat.url || video.url;
    navigator.clipboard.writeText(downloadUrl);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isYouTube = activeTab?.url?.includes("youtube.com");

  return (
    <div className="w-115 min-w-115 max-w-115 h-145 min-h-145 max-h-145 flex flex-col bg-[#0e1017] text-zinc-100 select-none overflow-hidden font-sans border border-zinc-700/80 shadow-2xl">
      {/* Top Header */}
      <PopupHeader
        activeTab={activeTab}
        videoCount={consolidatedVideos.length}
        isScanning={isScanning}
        isSettingsOpen={isSettingsOpen}
        onScan={() => activeTab && scanCurrentTab(activeTab.id)}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        onOpenDashboard={openFullDashboard}
      />

      {/* View Switcher Tabs */}
      <PopupTabs
        popupView={popupView}
        setPopupView={setPopupView}
        videoCount={consolidatedVideos.length}
        isYouTube={isYouTube}
        ytdlpCompanion={ytdlpCompanion}
        onOpenCliModal={() =>
          setYtDlpOfflineModal({
            open: true,
            video: consolidatedVideos[0] || null,
            command: generateYtDlpCommand({
              url: activeTab?.url || "https://www.youtube.com/watch?v=...",
              folder: downloadFolder,
            }),
          })
        }
      />

      {/* Settings Bar (Collapsible) */}
      {isSettingsOpen && (
        <PopupSettings
          downloadFolder={downloadFolder}
          askWhereToSave={askWhereToSave}
          autoStopCompanion={autoStopCompanion}
          ytdlpCompanion={ytdlpCompanion}
          onSetAskWhereToSave={(nextVal) => {
            setAskWhereToSave(nextVal);
            if (typeof chrome !== "undefined" && chrome.storage) {
              chrome.storage.local.set({ videograbSaveAs: nextVal });
            }
          }}
          onSetAutoStopCompanion={(nextVal) => {
            setAutoStopCompanion(nextVal);
            if (typeof chrome !== "undefined" && chrome.storage) {
              chrome.storage.local.set({ autoStopCompanion: nextVal });
            }
          }}
          onStopCompanion={handleStopCompanion}
        />
      )}

      {/* Main Content Area: Modules or Videos */}
      {popupView === "modules" ? (
        <ModulesView
          adblockEnabled={adblockEnabled}
          adblockBlockedCount={adblockBlockedCount}
          adblockYtBypass={adblockYtBypass}
          adblockCookieBanner={adblockCookieBanner}
          adblockNotifications={adblockNotifications}
          activeModules={activeModules}
          onToggleAdblock={handleToggleAdblock}
          onToggleSubSetting={handleToggleSubSetting}
          onToggleModule={handleToggleModule}
          onOpenDashboard={openFullDashboard}
        />
      ) : (
        /* Main Detected Videos List */
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-75 max-h-115 pb-36 bg-[#0a0c12]">
          {consolidatedVideos.length === 0 ? (
            <EmptyVideosView
              isYouTube={isYouTube}
              onScanTab={() => activeTab && scanCurrentTab(activeTab.id)}
              onOpenDashboard={openFullDashboard}
            />
          ) : (
            consolidatedVideos.map((video) => {
              const activeFormat = getActiveFormat(video);
              const displayFormat = getFormatDisplay(activeFormat);

              return (
                <VideoCard
                  key={video.id}
                  video={video}
                  activeFormat={activeFormat}
                  displayFormat={displayFormat}
                  isEditing={editingId === video.id}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  isDownloading={downloadingId === video.id}
                  isSuccess={downloadSuccessId === video.id}
                  isDropdownOpen={openDropdownId === video.id}
                  downloadProgress={downloadProgress[video.id]}
                  copiedId={copiedId}
                  selectedItemRef={selectedItemRef}
                  onStartRename={handleStartRename}
                  onSaveRename={handleSaveRename}
                  onCancelRename={() => setEditingId(null)}
                  onDismissVideo={handleDismissVideo}
                  onCopyUrl={handleCopyUrl}
                  onToggleDropdown={(v, e) => {
                    e.stopPropagation();
                    setOpenDropdownId((prev) => (prev === v.id ? null : v.id));
                  }}
                  onSelectFormat={handleSelectFormat}
                  onDownload={handleDownload}
                />
              );
            })
          )}
        </div>
      )}

      {/* Footer Bar */}
      <footer className="flex items-center justify-between px-3.5 py-2 bg-[#12141c] border-t border-zinc-800 text-xs text-zinc-400">
        <button
          type="button"
          onClick={() => openYtDlpFolder(downloadFolder)}
          className="flex items-center gap-1.5 text-zinc-300 hover:text-sky-300 transition-colors cursor-pointer group"
          title="Click to open OmniVideos folder in File Explorer"
        >
          <Folder className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          <span className="font-sans text-zinc-300 group-hover:text-sky-200">Downloads/{downloadFolder}/</span>
        </button>

        <button
          onClick={openFullDashboard}
          className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Open Full Workspace</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </footer>

      {/* yt-dlp Companion Modal & Terminal Fallback */}
      <YtDlpModal
        modalData={ytdlpOfflineModal}
        companion={ytdlpCompanion}
        isStartingServer={isStartingServer}
        downloadFolder={downloadFolder}
        copiedCmd={copiedCmd}
        onClose={() => setYtDlpOfflineModal(null)}
        onStartServer={handleStartServer}
        onCheckAndDownload={handleCheckAndDownload}
        onOpenFolder={openYtDlpFolder}
        onCopyCommand={handleCopyCommand}
        onDownloadNow={handleDownloadNow}
      />
    </div>
  );
}
