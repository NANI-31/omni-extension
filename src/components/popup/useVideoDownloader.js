import { useState, useEffect, useCallback } from "react";
import { downloadHlsStream, isHlsUrl } from "../../utils/hlsDownloader";
import {
  downloadViaYtDlp,
  checkYtDlpCompanion,
  generateYtDlpCommand,
  openYtDlpFolder,
  shutdownYtDlpCompanion,
  startYtDlpServer,
  getActiveYtDlpJobs,
} from "../../utils/ytdlpClient";

export default function useVideoDownloader({
  activeTab,
  downloadFolder,
  askWhereToSave,
  autoStopCompanion,
  consolidatedVideos,
  getActiveFormat,
}) {
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [ytdlpCompanion, setYtdlpCompanion] = useState({ online: false, version: null });
  const [ytdlpOfflineModal, setYtDlpOfflineModal] = useState(null);
  const [isStartingServer, setIsStartingServer] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Probe local yt-dlp companion server status on mount
  useEffect(() => {
    checkYtDlpCompanion().then(setYtdlpCompanion);
  }, []);

  // Restore any running download from storage on mount
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) return;
    chrome.storage.local.get(["activeYtDlpJob"], (res) => {
      if (res.activeYtDlpJob && res.activeYtDlpJob.cardId) {
        const age = Date.now() - (res.activeYtDlpJob.timestamp || 0);
        if (age < 3600000) {
          setDownloadingId(res.activeYtDlpJob.cardId);
          setDownloadProgress((prev) => ({
            ...prev,
            [res.activeYtDlpJob.cardId]: {
              percent: typeof res.activeYtDlpJob.percent === "number" ? res.activeYtDlpJob.percent : 0,
              stage: res.activeYtDlpJob.stage || "Connecting to stream...",
            },
          }));
        }
      }
    });
  }, []);

  // Synchronize active background downloads from companion server and storage across popup open/close
  useEffect(() => {
    let isMounted = true;

    const syncJobs = async () => {
      try {
        const jobs = await getActiveYtDlpJobs();
        if (!isMounted) return;

        // 1. Is there an active download currently running?
        const activeJob = jobs.find((j) => j.status === "downloading");
        if (activeJob) {
          const matchedVideo = (consolidatedVideos || []).find(
            (v) =>
              v.id === activeJob.id ||
              v.id === activeJob.videoId ||
              (v.videoId && activeJob.url?.includes(v.videoId)) ||
              (v.url && activeJob.url && v.url === activeJob.url)
          );
          const cardId = matchedVideo ? matchedVideo.id : (activeJob.videoId || activeJob.id);

          setDownloadingId(cardId);
          setDownloadProgress((prev) => ({
            ...prev,
            [cardId]: {
              percent: typeof activeJob.percent === "number" ? activeJob.percent : 0,
              stage: activeJob.stage || (activeJob.percent ? `Downloading: ${activeJob.percent}%` : "Connecting to stream..."),
              speed: activeJob.speed || "",
              eta: activeJob.eta || "",
            },
          }));

          chrome.storage?.local?.set({
            activeYtDlpJob: {
              cardId,
              videoId: activeJob.videoId,
              url: activeJob.url,
              percent: activeJob.percent,
              stage: activeJob.stage,
              timestamp: Date.now(),
            },
          });
          return;
        }

        // 2. No active download: check if a job completed recently
        const completedJob = jobs.find(
          (j) => j.status === "completed" && j.startTime && Date.now() - j.startTime < 45000
        );
        if (completedJob) {
          const matchedVideo = (consolidatedVideos || []).find(
            (v) =>
              v.id === completedJob.id ||
              v.id === completedJob.videoId ||
              (v.videoId && completedJob.url?.includes(v.videoId)) ||
              (v.url && completedJob.url && v.url === completedJob.url)
          );
          const cardId = matchedVideo ? matchedVideo.id : (completedJob.videoId || completedJob.id);

          setDownloadingId((cur) => (cur === cardId ? null : cur));
          setDownloadSuccessId(cardId);
          setDownloadProgress((prev) => ({
            ...prev,
            [cardId]: {
              percent: 100,
              stage: completedJob.stage || "Complete! Saved to PC.",
            },
          }));
          chrome.storage?.local?.remove(["activeYtDlpJob"]);
          setTimeout(() => {
            if (isMounted) setDownloadSuccessId(null);
          }, 3500);
          return;
        }

        // 3. Neither active nor recently completed: clear stale active state
        chrome.storage?.local?.get(["activeYtDlpJob"], (res) => {
          if (res?.activeYtDlpJob && Date.now() - (res.activeYtDlpJob.timestamp || 0) > 10000) {
            chrome.storage?.local?.remove(["activeYtDlpJob"]);
            setDownloadingId((cur) => (cur === res.activeYtDlpJob.cardId ? null : cur));
          }
        });
      } catch (_) {}
    };

    syncJobs();
    const interval = setInterval(syncJobs, 800);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [consolidatedVideos]);

  // Main download trigger: handles YouTube (yt-dlp), HLS streams, and direct media
  const handleDownload = useCallback(async (video) => {
    const activeFormat = getActiveFormat ? getActiveFormat(video) : video.selectedFormat || {};
    const rawTitle = video.customName || video.title || "video";
    const safeTitle = rawTitle
      .replace(/\.hls/gi, "")
      .replace(/\.(mp4|m3u8|webm|ts|m4s|mpd)$/i, "")
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim() || "video";
    const cleanFolder = (downloadFolder || "OmniVideos").replace(/[\\/:*?"<>|]/g, "").trim() || "OmniVideos";
    const directUrl = activeFormat.url || video.url;

    setDownloadingId(video.id);

    // 1. YouTube download via local yt-dlp companion
    if (video.isYouTube) {
      const targetUrl = activeTab?.url || `https://www.youtube.com/watch?v=${video.videoId}`;
      const chosenRes = activeFormat.resolution || "1080p";
      const chosenFmt = activeFormat.format || "mp4";

      chrome.storage?.local?.set({
        activeYtDlpJob: {
          cardId: video.id,
          videoId: video.videoId || video.id,
          url: targetUrl,
          title: video.title,
          stage: "Starting companion server...",
          percent: 0,
          timestamp: Date.now(),
        },
      });

      // If server is offline, auto-start it from extension
      let health = await checkYtDlpCompanion();
      if (!health.online) {
        setDownloadProgress((prev) => ({
          ...prev,
          [video.id]: { percent: 0, stage: "Starting companion server..." },
        }));
        const startResult = await startYtDlpServer();
        if (startResult.success) {
          setYtdlpCompanion({ online: true, version: startResult.version });
          health = { online: true };
        } else {
          chrome.storage?.local?.remove(["activeYtDlpJob"]);
          setDownloadingId(null);
          setDownloadProgress((prev) => {
            const next = { ...prev };
            delete next[video.id];
            return next;
          });
          setYtDlpOfflineModal({
            open: true,
            video,
            error: startResult.message || "Companion server is offline. Click 'Start Server from Extension' or run start-ytdlp.bat.",
            command: generateYtDlpCommand({
              url: targetUrl,
              resolution: chosenRes,
              format: chosenFmt,
              folder: cleanFolder,
              filename: safeTitle,
            }),
          });
          return;
        }
      }

      try {
        await downloadViaYtDlp({
          id: video.id,
          videoId: video.videoId || video.id,
          url: targetUrl,
          resolution: chosenRes,
          format: chosenFmt,
          folder: cleanFolder,
          filename: safeTitle,
          stopServerOnFinish: autoStopCompanion,
          onProgress: ({ percent, stage }) => {
            setDownloadProgress((prev) => ({
              ...prev,
              [video.id]: {
                percent: typeof percent === "number" ? percent : 0,
                stage: stage || (percent ? `Downloading: ${percent}%` : "Connecting to stream..."),
              },
            }));
            chrome.storage?.local?.set({
              activeYtDlpJob: {
                cardId: video.id,
                videoId: video.videoId || video.id,
                url: targetUrl,
                title: video.title,
                stage: stage || "Downloading...",
                percent: percent || 0,
                timestamp: Date.now(),
              },
            });
          },
        });

        chrome.storage?.local?.remove(["activeYtDlpJob"]);
        setDownloadingId(null);
        setDownloadSuccessId(video.id);
        setTimeout(() => setDownloadSuccessId(null), 3500);
      } catch (err) {
        chrome.storage?.local?.remove(["activeYtDlpJob"]);
        console.error("[yt-dlp error]:", err);
        setDownloadingId(null);
        const companionHealth = await checkYtDlpCompanion();
        if (!companionHealth.online) {
          setYtDlpOfflineModal({
            open: true,
            error: err.message,
            video,
            command: generateYtDlpCommand({
              url: targetUrl,
              resolution: chosenRes,
              format: chosenFmt,
              folder: cleanFolder,
              filename: safeTitle,
            }),
          });
        } else {
          setDownloadProgress((prev) => ({
            ...prev,
            [video.id]: { percent: 0, stage: `Download issue: ${err.message}. Click to retry.` },
          }));
        }
      }
      return;
    }

    // 2. Detect if this is an HLS (.m3u8) stream for other websites
    const isHls =
      isHlsUrl(directUrl, activeFormat.format) ||
      isHlsUrl(video.url, video.format) ||
      video.streamType === "HLS" ||
      activeFormat.format === "hls";

    if (isHls) {
      const streamTargetUrl = (directUrl && isHlsUrl(directUrl)) ? directUrl : video.url;
      try {
        await downloadHlsStream({
          streamUrl: streamTargetUrl,
          filename: safeTitle,
          folder: cleanFolder,
          saveAs: askWhereToSave,
          onProgress: ({ percent, stage }) => {
            setDownloadProgress((prev) => ({
              ...prev,
              [video.id]: { percent, stage },
            }));
          },
        });

        setDownloadingId(null);
        setDownloadSuccessId(video.id);
        setTimeout(() => setDownloadSuccessId(null), 3500);
      } catch (err) {
        console.error("[HLS Download Error]:", err);
        setDownloadingId(null);
        alert(`HLS Download failed: ${err.message}`);
      }
      return;
    }

    // 3. Direct downloadable MP4/WebM media URL
    if (!directUrl) {
      setDownloadingId(null);
      alert("No valid media stream URL detected for download.");
      return;
    }

    const ext =
      activeFormat.format === "webm"
        ? "webm"
        : activeFormat.format === "mp3"
        ? "mp3"
        : activeFormat.format === "m4a"
        ? "m4a"
        : "mp4";
    const filename = `${cleanFolder}/${safeTitle}.${ext}`;

    if (typeof chrome !== "undefined" && chrome.downloads) {
      chrome.downloads.download(
        {
          url: directUrl,
          filename,
          saveAs: askWhereToSave,
        },
        () => {
          if (chrome.runtime?.lastError) {
            console.error("[Download Error]:", chrome.runtime.lastError.message);
            setDownloadingId(null);
            alert(`Download failed: ${chrome.runtime.lastError.message}`);
            return;
          }
          setDownloadingId(null);
          setDownloadSuccessId(video.id);
          setTimeout(() => setDownloadSuccessId(null), 3000);
        }
      );
    }
  }, [activeTab, downloadFolder, askWhereToSave, autoStopCompanion, getActiveFormat]);

  const handleStartServer = useCallback(async () => {
    setIsStartingServer(true);
    const res = await startYtDlpServer();
    setIsStartingServer(false);
    if (res.success) {
      setYtdlpCompanion({ online: true, version: res.version });
      if (ytdlpOfflineModal?.video) {
        const v = ytdlpOfflineModal.video;
        setYtDlpOfflineModal(null);
        handleDownload(v);
      }
    } else {
      alert(res.message || "Failed to start companion automatically. Try running start-ytdlp.bat manually.");
    }
  }, [ytdlpOfflineModal, handleDownload]);

  const handleCheckAndDownload = useCallback(async () => {
    const res = await checkYtDlpCompanion();
    setYtdlpCompanion(res);
    if (res.online && ytdlpOfflineModal?.video) {
      const targetVideo = ytdlpOfflineModal.video;
      setYtDlpOfflineModal(null);
      handleDownload(targetVideo);
    }
  }, [ytdlpOfflineModal, handleDownload]);

  const handleCopyCommand = useCallback((cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  }, []);

  const handleStopCompanion = useCallback(async () => {
    await shutdownYtDlpCompanion(true);
    setYtdlpCompanion({ online: false, version: null });
  }, []);

  const handleDownloadNow = useCallback((targetVideo) => {
    setYtDlpOfflineModal(null);
    handleDownload(targetVideo);
  }, [handleDownload]);

  return {
    downloadingId,
    downloadSuccessId,
    downloadProgress,
    ytdlpCompanion,
    setYtdlpCompanion,
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
  };
}
