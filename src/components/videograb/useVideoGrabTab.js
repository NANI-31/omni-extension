import { useState, useEffect, useMemo, useCallback } from "react";
import { downloadHlsStream, isHlsUrl } from "../../utils/hlsDownloader";
import { downloadViaYtDlp, checkYtDlpCompanion, startYtDlpServer } from "../../utils/ytdlpClient";

export default function useVideoGrabTab() {
  const [tabsData, setTabsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("all"); // 'all' | 'hls' | 'mp4'
  const [expandedTabs, setExpandedTabs] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [ffmpegStatus] = useState("Ready (WASM Active)");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [downloadFolder, setDownloadFolder] = useState("OmniVideos");
  const [askWhereToSave, setAskWhereToSave] = useState(false);
  const [autoStopCompanion, setAutoStopCompanion] = useState(true);
  const [folderSaveStatus, setFolderSaveStatus] = useState("");
  const [isFolderSettingsOpen, setIsFolderSettingsOpen] = useState(false);

  // Load from chrome.storage.local
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(
        ["detectedMediaRegistry", "videograbFolder", "videograbSaveAs", "autoStopCompanion"],
        (result) => {
          if (
            result.detectedMediaRegistry &&
            Array.isArray(result.detectedMediaRegistry) &&
            result.detectedMediaRegistry.length > 0
          ) {
            setTabsData(result.detectedMediaRegistry);
            // Expand first tab by default
            setExpandedTabs({ [result.detectedMediaRegistry[0].tabId]: true });
          } else {
            setTabsData([]);
          }

          if (result.videograbFolder) {
            setDownloadFolder(result.videograbFolder);
          } else {
            chrome.storage.local.set({ videograbFolder: "OmniVideos" });
          }

          if (result.videograbSaveAs !== undefined) {
            setAskWhereToSave(result.videograbSaveAs);
          }

          if (result.autoStopCompanion !== undefined) {
            setAutoStopCompanion(result.autoStopCompanion);
          }
        }
      );

      // Listen for real-time background media discoveries
      const handleStorageChange = (changes, area) => {
        if (area === "local" && changes.detectedMediaRegistry) {
          if (changes.detectedMediaRegistry.newValue) {
            setTabsData(changes.detectedMediaRegistry.newValue);
          } else {
            setTabsData([]);
          }
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    } else {
      setTabsData([]);
    }
  }, []);

  const toggleTabExpand = useCallback((tabId) => {
    setExpandedTabs((prev) => ({
      ...prev,
      [tabId]: !prev[tabId],
    }));
  }, []);

  const expandAll = useCallback(() => {
    const all = {};
    tabsData.forEach((t) => (all[t.tabId] = true));
    setExpandedTabs(all);
  }, [tabsData]);

  const collapseAll = useCallback(() => {
    setExpandedTabs({});
  }, []);

  const clearCapturedMedia = useCallback(() => {
    setTabsData([]);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ detectedMediaRegistry: [] });
    }
  }, []);

  const getStreamName = useCallback((stream, tabTitle) => {
    if (stream.customName && stream.customName.trim()) {
      return stream.customName.trim();
    }
    if (stream.title && stream.title.trim()) {
      return stream.title.trim();
    }
    try {
      const parsed = new URL(stream.url);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1] || "";
      const urlName = decodeURIComponent(last)
        .replace(/\.hls/gi, "")
        .replace(/\.(mp4|m3u8|webm|ts|m4s|mpd)$/i, "");
      if (urlName && !/^(master|index|playlist|video|chunk_\d+|stream)$/i.test(urlName)) {
        return urlName.replace(/[_-]+/g, " ").trim();
      }
    } catch (_) {}
    return `${tabTitle} - ${stream.resolution || "Video"}`;
  }, []);

  const startEditingName = useCallback((stream, tabTitle, e) => {
    if (e) e.stopPropagation();
    setEditingId(stream.id);
    setEditValue(getStreamName(stream, tabTitle));
  }, [getStreamName]);

  const saveEditedName = useCallback((streamId) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }

    const updatedTabs = tabsData.map((tab) => ({
      ...tab,
      streams: tab.streams.map((s) => {
        if (s.id === streamId) {
          return { ...s, customName: trimmed, title: trimmed };
        }
        return s;
      }),
    }));

    setTabsData(updatedTabs);
    setEditingId(null);

    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ detectedMediaRegistry: updatedTabs });
    }
  }, [editValue, tabsData]);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  const saveFolder = useCallback((newFolder) => {
    const cleaned = newFolder.replace(/[\\/:*?"<>|]/g, "").trim() || "OmniVideos";
    setDownloadFolder(cleaned);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ videograbFolder: cleaned }, () => {
        setFolderSaveStatus(`Saved! Downloads will save to Downloads/${cleaned}/`);
        setTimeout(() => setFolderSaveStatus(""), 3000);
      });
    }
  }, []);

  const handleFolderInputChange = useCallback((e) => {
    const val = e.target.value;
    setDownloadFolder(val);
    const cleaned = val.replace(/[\\/:*?"<>|]/g, "").trim() || "OmniVideos";
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ videograbFolder: cleaned }, () => {
        setFolderSaveStatus(`Updated directory to Downloads/${cleaned}/`);
        setTimeout(() => setFolderSaveStatus(""), 2500);
      });
    }
  }, []);

  const handleChooseFolder = useCallback(async () => {
    try {
      if (window.showDirectoryPicker) {
        const handle = await window.showDirectoryPicker();
        const cleanedName = handle.name.replace(/[\\/:*?"<>|]/g, "").trim();
        if (cleanedName) saveFolder(cleanedName);
      } else {
        const name = prompt("Enter video download subfolder name:", downloadFolder);
        if (name !== null) {
          saveFolder(name);
        }
      }
    } catch (_) {
      // User cancelled picker
    }
  }, [downloadFolder, saveFolder]);

  const toggleAskWhereToSave = useCallback(() => {
    const nextVal = !askWhereToSave;
    setAskWhereToSave(nextVal);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ videograbSaveAs: nextVal }, () => {
        setFolderSaveStatus(
          nextVal
            ? "Prompting OS save dialog for each video."
            : `Auto-saving directly to Downloads/${downloadFolder}/`
        );
        setTimeout(() => setFolderSaveStatus(""), 3000);
      });
    }
  }, [askWhereToSave, downloadFolder]);

  const handleCopyLink = useCallback((stream) => {
    navigator.clipboard.writeText(stream.url);
    setCopiedId(stream.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleDownloadStream = useCallback(async (stream, tabTitle) => {
    const rawName = getStreamName(stream, tabTitle);
    const safeFilename = rawName
      .replace(/\.hls/gi, "")
      .replace(/\.(mp4|m3u8|webm|ts|m4s|mpd)$/i, "")
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim() || "video";
    const cleanFolder = (downloadFolder || "OmniVideos").replace(/[\\/:*?"<>|]/g, "").trim() || "OmniVideos";

    // If HLS (.m3u8) stream: download, decrypt, assemble chunks and save full video to PC
    if (isHlsUrl(stream.url, stream.format) || stream.needsFfmpeg) {
      setDownloadProgress((prev) => ({
        ...prev,
        [stream.id]: { percent: 0, stage: "Parsing .m3u8 playlist..." },
      }));

      try {
        await downloadHlsStream({
          streamUrl: stream.url,
          filename: safeFilename,
          folder: cleanFolder,
          saveAs: askWhereToSave,
          onProgress: ({ percent, stage }) => {
            setDownloadProgress((prev) => ({
              ...prev,
              [stream.id]: { percent, stage },
            }));
          },
        });

        setTimeout(() => {
          setDownloadProgress((prev) => {
            const copy = { ...prev };
            delete copy[stream.id];
            return copy;
          });
        }, 4000);
      } catch (err) {
        console.error("[HLS Download Error]:", err);
        setDownloadProgress((prev) => ({
          ...prev,
          [stream.id]: { percent: 100, stage: `Error: ${err.message}` },
        }));
        setTimeout(() => {
          setDownloadProgress((prev) => {
            const copy = { ...prev };
            delete copy[stream.id];
            return copy;
          });
        }, 4500);
      }
      return;
    }

    // YouTube video download via local yt-dlp companion
    if (stream.url.includes("youtube.com") || stream.url.includes("youtu.be")) {
      const health = await checkYtDlpCompanion();
      if (!health.online) {
        setDownloadProgress((prev) => ({
          ...prev,
          [stream.id]: { percent: 0, stage: "Starting companion server..." },
        }));
        const startResult = await startYtDlpServer();
        if (!startResult.success) {
          setDownloadProgress((prev) => ({
            ...prev,
            [stream.id]: { percent: 0, stage: `Companion offline: ${startResult.message}` },
          }));
          setTimeout(() => {
            setDownloadProgress((prev) => {
              const copy = { ...prev };
              delete copy[stream.id];
              return copy;
            });
          }, 4000);
          return;
        }
      }

      setDownloadProgress((prev) => ({
        ...prev,
        [stream.id]: { percent: 0, stage: "Connecting to video stream..." },
      }));

      try {
        await downloadViaYtDlp({
          url: stream.url,
          resolution: stream.resolution || "1080p",
          format: stream.format || "mp4",
          folder: cleanFolder,
          filename: safeFilename,
          stopServerOnFinish: autoStopCompanion,
          onProgress: ({ percent, stage }) => {
            setDownloadProgress((prev) => ({
              ...prev,
              [stream.id]: { percent, stage: stage || `yt-dlp: ${percent}%` },
            }));
          },
        });

        setTimeout(() => {
          setDownloadProgress((prev) => {
            const copy = { ...prev };
            delete copy[stream.id];
            return copy;
          });
        }, 4000);
      } catch (err) {
        setDownloadProgress((prev) => ({
          ...prev,
          [stream.id]: { percent: 100, stage: `yt-dlp: ${err.message}` },
        }));
        setTimeout(() => {
          setDownloadProgress((prev) => {
            const copy = { ...prev };
            delete copy[stream.id];
            return copy;
          });
        }, 5000);
      }
      return;
    }

    // Direct MP4/WebM file download
    const ext = stream.format === "webm" ? "webm" : "mp4";
    const downloadFilename = `${cleanFolder}/${safeFilename}.${ext}`;

    if (typeof chrome !== "undefined" && chrome.downloads) {
      chrome.downloads.download({
        url: stream.url,
        filename: downloadFilename,
        saveAs: askWhereToSave,
      });
    }
  }, [downloadFolder, askWhereToSave, autoStopCompanion, getStreamName]);

  // Filtered tabs calculation
  const filteredTabs = useMemo(() => {
    return tabsData
      .map((tab) => {
        const matchedStreams = tab.streams.filter((s) => {
          if (formatFilter === "hls" && s.format !== "hls") return false;
          if (formatFilter === "mp4" && s.format !== "mp4" && s.format !== "webm") return false;
          return true;
        });

        const searchLower = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !searchLower ||
          tab.title.toLowerCase().includes(searchLower) ||
          tab.domain.toLowerCase().includes(searchLower) ||
          matchedStreams.some(
            (s) =>
              s.resolution.toLowerCase().includes(searchLower) ||
              (s.customName && s.customName.toLowerCase().includes(searchLower)) ||
              (s.title && s.title.toLowerCase().includes(searchLower)) ||
              s.url.toLowerCase().includes(searchLower)
          );

        if (!matchesSearch || matchedStreams.length === 0) return null;
        return {
          ...tab,
          streams: matchedStreams,
        };
      })
      .filter(Boolean);
  }, [tabsData, searchQuery, formatFilter]);

  const totalCapturedStreams = useMemo(() => {
    return tabsData.reduce((acc, tab) => acc + tab.streams.length, 0);
  }, [tabsData]);

  return {
    tabsData,
    filteredTabs,
    totalCapturedStreams,
    ffmpegStatus,
    searchQuery,
    setSearchQuery,
    formatFilter,
    setFormatFilter,
    expandedTabs,
    toggleTabExpand,
    expandAll,
    collapseAll,
    clearCapturedMedia,
    getStreamName,
    editingId,
    editValue,
    setEditValue,
    startEditingName,
    saveEditedName,
    cancelEditing,
    downloadFolder,
    saveFolder,
    handleFolderInputChange,
    handleChooseFolder,
    askWhereToSave,
    toggleAskWhereToSave,
    folderSaveStatus,
    isFolderSettingsOpen,
    setIsFolderSettingsOpen,
    copiedId,
    handleCopyLink,
    downloadProgress,
    handleDownloadStream,
  };
}
