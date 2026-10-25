// ── HTML5 Video Player Adapter & Geometry Recognition ──────────────────────
// Provides unified volume/speed API abstraction and robust cursor-player hit testing
// across YouTube, Hotstar, and any universal HTML5 video website.

let activePlayer = null;

export function setActivePlayer(player) {
  activePlayer = player;
}

export function getActivePlayer() {
  if (activePlayer && document.body.contains(activePlayer)) {
    return activePlayer;
  }
  // Fallback: Find the first video element on the page
  const video = document.querySelector("video");
  if (video) {
    const ytPlayer = video.closest(".html5-video-player");
    return ytPlayer || video;
  }
  return null;
}

export function isTyping() {
  const active = document.activeElement;
  if (!active) return false;
  return (
    active.tagName === "INPUT" ||
    active.tagName === "TEXTAREA" ||
    active.isContentEditable
  );
}

export function getPlayerInfo(playerOrVideo) {
  if (!playerOrVideo) return null;

  // If it's a YouTube player wrapper
  if (
    playerOrVideo.classList &&
    playerOrVideo.classList.contains("html5-video-player")
  ) {
    const video = playerOrVideo.querySelector("video");
    return {
      getVolume: () => playerOrVideo.getVolume(),
      setVolume: (v) => {
        playerOrVideo.setVolume(v);
        if (playerOrVideo.isMuted() && v > 0) playerOrVideo.unMute();
      },
      isMuted: () => playerOrVideo.isMuted(),
      setMuted: (m) => {
        if (m) playerOrVideo.mute();
        else playerOrVideo.unMute();
      },
      getSpeed: () => {
        if (video) return video.playbackRate;
        return playerOrVideo.getPlaybackRate() || 1.0;
      },
      setSpeed: (s) => {
        // Clamp to browser's hard limit of 16.0 to prevent NotSupportedError in Chromium
        const clampedSpeed = Math.min(16.0, Math.max(0.0625, s));
        if (video) {
          try {
            video.playbackRate = clampedSpeed;
          } catch (err) {
            console.warn("Failed to set video.playbackRate:", err);
          }
        }
        if (typeof playerOrVideo.setPlaybackRate === "function") {
          try {
            playerOrVideo.setPlaybackRate(clampedSpeed);
          } catch (err) {}
        }
      },
      container: playerOrVideo,
    };
  }

  // If it's a standard video element or an ancestor container
  const video =
    playerOrVideo.tagName === "VIDEO"
      ? playerOrVideo
      : playerOrVideo.querySelector("video");
  if (video) {
    const container = (playerOrVideo.tagName === "VIDEO" && playerOrVideo.parentElement) ? playerOrVideo.parentElement : playerOrVideo;
    return {
      getVolume: () => Math.round(video.volume * 100),
      setVolume: (v) => {
        video.volume = Math.max(0, Math.min(1, v / 100));
        if (video.muted && v > 0) video.muted = false;
      },
      isMuted: () => video.muted,
      setMuted: (m) => {
        video.muted = m;
      },
      getSpeed: () => video.playbackRate,
      setSpeed: (s) => {
        // Clamp to browser's hard limit of 16.0 to prevent NotSupportedError in Chromium
        const clampedSpeed = Math.min(16.0, Math.max(0.0625, s));
        try {
          video.playbackRate = clampedSpeed;
        } catch (err) {
          console.warn("Failed to set video.playbackRate:", err);
        }
      },
      container: container,
    };
  }
  return null;
}

export function applyStartupVolume(playerOrVideo) {
  const startupEnabled =
    document.documentElement.getAttribute(
      "data-yt-startup-volume-enabled",
    ) === "true";
  if (!startupEnabled) return;

  const startupVolumeAttr = document.documentElement.getAttribute(
    "data-yt-startup-volume",
  );
  const startupVolume = parseInt(startupVolumeAttr || "30", 10);

  const info = getPlayerInfo(playerOrVideo);
  if (info) {
    info.setVolume(startupVolume);
    if (info.isMuted() && startupVolume > 0) {
      info.setMuted(false);
    }
  }
}

export function findVideoPlayerAtCursor(e) {
  const cx = e.clientX;
  const cy = e.clientY;
  const isYouTube =
    window.location.hostname.includes("youtube.com") ||
    window.location.hostname.includes("youtube-nocookie.com");

  const minW = isYouTube ? 320 : 120;
  const minH = isYouTube ? 180 : 80;

  for (const video of document.querySelectorAll("video")) {
    const rect = video.getBoundingClientRect();

    // Guard 1 — skip invisible / zero-size videos (preloaded, hidden, etc.)
    if (rect.width < 10 || rect.height < 10) continue;

    // Guard 2 — skip feed thumbnail preview videos (too small to be a real player)
    if (rect.width < minW || rect.height < minH)
      continue;

    // Guard 3 — on YouTube, only activate for the dedicated player wrapper.
    // Feed preview <video> elements are NOT inside .html5-video-player.
    const ytPlayer = video.closest(".html5-video-player");
    if (isYouTube && !ytPlayer) continue;

    // Guard 4 — cursor must be within the video's rendered area or container.
    const container = ytPlayer || (video.parentElement && video.parentElement !== document.body ? video.parentElement : video);
    const cRect = container ? container.getBoundingClientRect() : rect;

    const inVideo = (
      cx >= rect.left &&
      cx <= rect.right &&
      cy >= rect.top &&
      cy <= rect.bottom + 70
    );
    const inContainer = container && (
      cRect.width <= Math.max(window.innerWidth * 0.95, rect.width * 2) &&
      cRect.height <= Math.max(window.innerHeight * 0.95, rect.height + 150) &&
      cx >= cRect.left &&
      cx <= cRect.right &&
      cy >= cRect.top &&
      cy <= cRect.bottom
    );

    if (inVideo || inContainer) {
      return { video, container };
    }
  }

  return null;
}
