// React fiber extraction bridge (communicates with injected.js in the main world)

/**
 * Communicates with injected script in MAIN world to extract direct media URLs from React internal props.
 * @param {string} postId The shortcode or 'chat_click' identifier.
 * @param {number} slideIndex Current slide being shown.
 * @param {boolean} isVideo Whether active media is checked to be video.
 * @param {number} timeoutMs Custom timeout (e.g. higher for chat_click which does a live api fetch).
 */
export function requestDirectMediaFromReact(postId, slideIndex, isVideo, timeoutMs = 800) {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      window.removeEventListener("INSTAGRAB_RESPONSE_URL", handleResponse);
      resolve(null);
    }, timeoutMs);

    function handleResponse(event) {
      if (event.detail && (event.detail.postId === postId || event.detail.realPostId === postId)) {
        clearTimeout(timeoutId);
        window.removeEventListener("INSTAGRAB_RESPONSE_URL", handleResponse);
        if (event.detail.success && event.detail.mediaList) {
          resolve({
            mediaList: event.detail.mediaList,
            realPostId: event.detail.realPostId,
            caption: event.detail.caption,
            username: event.detail.username
          });
        } else {
          resolve(null);
        }
      }
    }

    window.addEventListener("INSTAGRAB_RESPONSE_URL", handleResponse);
    window.dispatchEvent(new CustomEvent("INSTAGRAB_REQUEST_URL", {
      detail: { postId, slideIndex, isVideo }
    }));
  });
}
