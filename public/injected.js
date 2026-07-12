// InstaGrab Injected Script (Runs in the MAIN world context)
(function() {
  // ---- Singleton guard (DOM-attribute based) ----
  // content.js injects a new <script> tag on every initializeDownloader() call.
  // A DOM attribute is used instead of window.* because the attribute is visible
  // to BOTH the MAIN world (injected.js) and the ISOLATED world (content.js),
  // allowing content.js to skip injection if already loaded.
  const ATTR = 'data-instagrab-injected';
  if (document.documentElement.getAttribute(ATTR) === '1') {
    return;
  }
  document.documentElement.setAttribute(ATTR, '1');
  // -------------------------------------------------

  const logger = {
    log: (msg, ...args) => {
      const levelAttr = document.documentElement.getAttribute('data-instagrab-logging') || 'verbose';
      if (levelAttr === 'verbose') {
        console.log('[InstaGrab Injected]', msg, ...args);
      }
      try {
        const fullMsg = `[Injected] ${msg} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
        window.dispatchEvent(new CustomEvent('INSTAGRAB_LOG', {
          detail: { level: 'info', msg: fullMsg }
        }));
      } catch (e) {}
    },
    warn: (msg, ...args) => {
      const levelAttr = document.documentElement.getAttribute('data-instagrab-logging') || 'verbose';
      if (levelAttr === 'verbose') {
        console.warn('[InstaGrab Injected]', msg, ...args);
      }
      try {
        const fullMsg = `[Injected] ${msg} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
        window.dispatchEvent(new CustomEvent('INSTAGRAB_LOG', {
          detail: { level: 'warn', msg: fullMsg }
        }));
      } catch (e) {}
    },
    error: (msg, ...args) => {
      const levelAttr = document.documentElement.getAttribute('data-instagrab-logging') || 'verbose';
      if (levelAttr === 'verbose' || levelAttr === 'errors') {
        console.error('[InstaGrab Injected]', msg, ...args);
      }
      try {
        const fullMsg = `[Injected] ${msg} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
        window.dispatchEvent(new CustomEvent('INSTAGRAB_LOG', {
          detail: { level: 'error', msg: fullMsg }
        }));
      } catch (e) {}
    }
  };


  const BLOCKED_KEYS = new Set([
    'return', 'alternate', 'child', 'sibling', 'stateNode', 
    '_owner', '_currentValue', '_context', 'dependencies', 
    'firstEffect', 'lastEffect', 'nextEffect', 'events', 
    'subscribers', 'parent', 'owner', 'self', 'window', 
    'document', 'view', 'history', 'location'
  ]);

  // Instagram shortcodes: 9-16 alphanumeric + underscore/dash chars (e.g. DZwDTPqDUEq)
  const isShortcode = (s) => s && typeof s === 'string' && s.length >= 9 && s.length <= 16 && /^[A-Za-z0-9_-]+$/.test(s);

  // Traverses React properties recursively to find the raw Instagram post model or media object
  function findMediaObjectInProps(obj, targetType, postId, depth = 0, visited = new Set()) {
    if (depth > 20) return null;
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return null;
    visited.add(obj);

    // Only prune if we have a valid shortcode that belongs to a DIFFERENT post
    const objCode = obj.code || obj.shortcode;
    const codeVal = isShortcode(objCode) ? objCode : null;
    if (codeVal && postId && !postId.startsWith('fallback_') && codeVal !== postId) {
      return null;
    }

    // Carousel or sidecar matching MUST be checked first
    if (obj.hasOwnProperty('carousel_media') || obj.hasOwnProperty('edge_sidecar_to_children')) {
      return obj;
    }

    if (targetType === 'video') {
      // Strictly look for video signatures
      if (obj.hasOwnProperty('video_url') || 
          obj.hasOwnProperty('video_versions')) {
        return obj;
      }
    } else {
      // Look for image or general signatures
      if (obj.hasOwnProperty('image_versions2') || 
          obj.hasOwnProperty('display_resources') ||
          (obj.hasOwnProperty('display_url') && typeof obj.display_url === 'string' && obj.display_url.startsWith('http'))) {
        return obj;
      }
    }

    const keys = Object.keys(obj);
    for (let key of keys) {
      if (BLOCKED_KEYS.has(key)) continue;

      try {
        const val = obj[key];
        if (typeof val === 'object' && val !== null) {
          const found = findMediaObjectInProps(val, targetType, postId, depth + 1, visited);
          if (found) return found;
        }
      } catch (e) {}
    }
    return null;
  }

  // Recursively scans properties to find a carousel object specifically
  // If requireCode is true, the carousel object (or its ancestor) must have code/shortcode matching postId.
  function findCarouselObjectInProps(obj, postId, depth = 0, visited = new Set(), requireCode = false) {
    if (depth > 20) return null;
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return null;
    visited.add(obj);

    const objCode = obj.code || obj.shortcode;
    const codeVal = isShortcode(objCode) ? objCode : null;
    // Only prune if we have a valid shortcode that belongs to a DIFFERENT post
    if (codeVal && postId && !postId.startsWith('fallback_') && codeVal !== postId) {
      return null;
    }

    const isCarousel = ('carousel_media' in obj) || ('edge_sidecar_to_children' in obj) || ('sidecarChildren' in obj);
    if (isCarousel) {
      const hasCorrectCode = !postId || postId.startsWith('fallback_') || (codeVal && codeVal === postId);
      if (hasCorrectCode || !requireCode) {
        return obj;
      }
    }

    const keys = Object.keys(obj);
    for (let key of keys) {
      if (BLOCKED_KEYS.has(key)) continue;
      try {
        const val = obj[key];
        if (typeof val === 'object' && val !== null) {
          const found = findCarouselObjectInProps(val, postId, depth + 1, visited, requireCode);
          if (found) return found;
        }
      } catch (e) {}
    }
    return null;
  }

  // Recursively scans properties to find a video object specifically
  function findVideoObjectInProps(obj, postId, depth = 0, visited = new Set(), requireCode = false) {
    if (depth > 20) return null;
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return null;
    visited.add(obj);

    const objCode = obj.code || obj.shortcode;
    const codeVal = isShortcode(objCode) ? objCode : null;
    // Only prune if we have a valid shortcode that belongs to a DIFFERENT post
    if (codeVal && postId && !postId.startsWith('fallback_') && codeVal !== postId) {
      return null;
    }

    const hasVideoUrl = (obj.video_url && typeof obj.video_url === 'string') ||
                         (obj.videoUrl && typeof obj.videoUrl === 'string') ||
                         (obj.video_versions && obj.video_versions.length > 0) ||
                         (obj.videoVersions && obj.videoVersions.length > 0) ||
                         (obj.video_resources && obj.video_resources.length > 0) ||
                         (obj.videoResources && obj.videoResources.length > 0) ||
                         (obj.media_type === 2) || (obj.mediaType === 2);

    if (hasVideoUrl) {
      // Only return if this object has the correct postId code, OR postId unknown, OR requireCode=false
      const hasCorrectCode = !postId || postId.startsWith('fallback_') || (codeVal && codeVal === postId);
      if (hasCorrectCode || !requireCode) return obj;
    }

    const keys = Object.keys(obj);
    for (let key of keys) {
      if (BLOCKED_KEYS.has(key)) continue;
      try {
        const val = obj[key];
        if (typeof val === 'object' && val !== null) {
          const found = findVideoObjectInProps(val, postId, depth + 1, visited, requireCode);
          if (found) return found;
        }
      } catch (e) {}
    }
    return null;
  }

  // Recursively scans properties to find an image object specifically
  // REQUIRES: the image object (or its ancestor) must have code/shortcode matching postId
  function findImageObjectInProps(obj, postId, depth = 0, visited = new Set(), requireCode = false) {
    if (depth > 20) return null;
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return null;
    visited.add(obj);

    const objCode = obj.code || obj.shortcode;
    const codeVal = isShortcode(objCode) ? objCode : null;
    // Only prune if we have a valid shortcode that belongs to a DIFFERENT post
    if (codeVal && postId && !postId.startsWith('fallback_') && codeVal !== postId) {
      return null;
    }

    const hasImageUrl = (obj.image_versions2?.candidates && obj.image_versions2.candidates.length > 0) ||
                         (obj.imageVersions2?.candidates && obj.imageVersions2.candidates.length > 0) ||
                         (obj.display_resources && obj.display_resources.length > 0) ||
                         (obj.displayResources && obj.displayResources.length > 0) ||
                         (obj.display_url && typeof obj.display_url === 'string') ||
                         (obj.displayUrl && typeof obj.displayUrl === 'string') ||
                         (obj.src && typeof obj.src === 'string' && obj.src.startsWith('http')) ||
                         (obj.media_type === 1) || (obj.mediaType === 1);

    // IMPORTANT: Do not match objects that are actually video posts
    const isVideoObject = (obj.video_url && typeof obj.video_url === 'string') ||
                           (obj.videoUrl && typeof obj.videoUrl === 'string') ||
                           (obj.video_versions && obj.video_versions.length > 0) ||
                           (obj.videoVersions && obj.videoVersions.length > 0) ||
                           (obj.media_type === 2) || (obj.mediaType === 2);

    if (hasImageUrl && !isVideoObject) {
      // Only return if this object has the correct postId code, OR if postId is unknown,
      // OR if requireCode is false (permissive mode for when called from within a validated parent)
      const hasCorrectCode = !postId || postId.startsWith('fallback_') || (codeVal && codeVal === postId);
      if (hasCorrectCode || !requireCode) return obj;
    }

    const keys = Object.keys(obj);
    for (let key of keys) {
      if (BLOCKED_KEYS.has(key)) continue;
      try {
        const val = obj[key];
        if (typeof val === 'object' && val !== null) {
          const found = findImageObjectInProps(val, postId, depth + 1, visited, requireCode);
          if (found) return found;
        }
      } catch (e) {}
    }
    return null;
  }

  // Finds the top-level post object that has code/shortcode === postId.
  // This is the most reliable anchor — once we find the post object, we extract all media from it.
  function findPostObjectByCode(obj, postId, depth = 0, visited = new Set()) {
    if (depth > 35 || !postId || postId.startsWith('fallback_')) return null;
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return null;
    visited.add(obj);

    const objCode = obj.code || obj.shortcode;
    const codeVal = isShortcode(objCode) ? objCode : null;

    if (codeVal === postId) {
      const hasMedia = ('carousel_media' in obj) || ('edge_sidecar_to_children' in obj) || ('sidecarChildren' in obj) ||
                        ('image_versions2' in obj) || ('imageVersions2' in obj) || 
                        ('video_url' in obj) || ('videoUrl' in obj) ||
                        ('video_versions' in obj) || ('videoVersions' in obj) ||
                        ('display_resources' in obj) || ('displayResources' in obj) ||
                        ('display_url' in obj) || ('displayUrl' in obj) || ('src' in obj);
      if (hasMedia) {
        return obj;
      }
    }

    // Only prune branches confirmed to be OTHER posts (shortcode-format code that is NOT postId)
    if (codeVal && codeVal !== postId) {
      return null;
    }

    const keys = Object.keys(obj);
    for (let key of keys) {
      if (BLOCKED_KEYS.has(key)) continue;
      try {
        const val = obj[key];
        if (typeof val === 'object' && val !== null) {
          const found = findPostObjectByCode(val, postId, depth + 1, visited);
          if (found) return found;
        }
      } catch (e) {}
    }
    return null;
  }

  // Recursively scans an object for any string containing a specific media URL signature
  function scanPropsForRawUrls(obj, isVideo, depth = 0, visited = new Set(), results = []) {
    if (depth > 15) return;
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
    visited.add(obj);

    // If it's a string, check if it matches the signature
    if (typeof obj === 'string') {
      if (obj.startsWith('http://') || obj.startsWith('https://')) {
        const isMp4 = obj.includes('.mp4');
        const isJpg = obj.includes('.jpg') || obj.includes('.jpeg') || obj.includes('.webp') || obj.includes('.heic') || obj.includes('_n.jpg');
        
        if (isVideo && isMp4) {
          results.push({ url: obj, type: 'video', priority: obj.includes('efg=') ? 1 : 2 });
        } else if (!isVideo && isJpg) {
          let priority = 10000;
          const dimMatch = obj.match(/_([0-9]+)x([0-9]+)_/);
          if (dimMatch) {
            priority = 5000000 - (parseInt(dimMatch[1]) * parseInt(dimMatch[2]));
          } else {
            const sizeMatch = obj.match(/\/s([0-9]+)x([0-9]+)\//);
            if (sizeMatch) {
              priority = 5000000 - (parseInt(sizeMatch[1]) * parseInt(sizeMatch[2]));
            }
          }
          results.push({ url: obj, type: 'image', priority });
        }
      }
      return;
    }

    const keys = Object.keys(obj);
    for (let key of keys) {
      if (BLOCKED_KEYS.has(key)) continue;
      try {
        scanPropsForRawUrls(obj[key], isVideo, depth + 1, visited, results);
      } catch (e) {}
    }
  }

  // Extracts the highest resolution image URL from candidates or display_resources
  function getHighestResImageUrl(node) {
    if (!node) return null;
    
    // Check image_versions2 / imageVersions2 candidates
    const imgVersions = node.image_versions2 || node.imageVersions2;
    if (imgVersions?.candidates && imgVersions.candidates.length > 0) {
      let maxCandidate = imgVersions.candidates[0];
      for (let cand of imgVersions.candidates) {
        const candArea = (cand.width || 0) * (cand.height || 0);
        const maxArea = (maxCandidate.width || 0) * (maxCandidate.height || 0);
        if (candArea > maxArea) {
          maxCandidate = cand;
        } else if (cand.width && !cand.height && cand.width > maxCandidate.width) {
          maxCandidate = cand;
        }
      }
      if (maxCandidate?.url) return maxCandidate.url;
    }
    
    // Check display_resources / displayResources (GraphQL config)
    const dispRes = node.display_resources || node.displayResources;
    if (dispRes && dispRes.length > 0) {
      let maxResource = dispRes[0];
      for (let res of dispRes) {
        const width = res.config_width || res.configWidth || 0;
        const height = res.config_height || res.configHeight || 0;
        const resArea = width * height;
        
        const maxWidth = maxResource.config_width || maxResource.configWidth || 0;
        const maxHeight = maxResource.config_height || maxResource.configHeight || 0;
        const maxArea = maxWidth * maxHeight;
        
        if (resArea > maxArea) {
          maxResource = res;
        } else if (width && !height && width > maxWidth) {
          maxResource = res;
        }
      }
      const src = maxResource?.src || maxResource?.url;
      if (src) return src;
    }
    
    return node.display_url || node.displayUrl || node.src || node.url || null;
  }

  // Parses the matched media object to extract video or image properties for ALL slides/media items
  function parseAllMediaFromObject(mediaObject) {
    if (!mediaObject) return [];
    
    // 0. Carousel check (sidecarChildren) — camelCase Client structure
    if (mediaObject.sidecarChildren && mediaObject.sidecarChildren.length > 0) {
      return mediaObject.sidecarChildren.map((rawItem, idx) => {
        const item = rawItem.node || rawItem;
        
        const isVideo = item.isVideo === true || 
                        (typeof item.videoUrl === 'string' && item.videoUrl.length > 0) ||
                        (typeof item.video_url === 'string' && item.video_url.length > 0) ||
                        (item.videoResources && item.videoResources.length > 0) ||
                        (item.video_resources && item.video_resources.length > 0) ||
                        item.mediaType === 2 || item.media_type === 2;
                        
        if (isVideo) {
          // Check videoResources (highest quality)
          let videoUrl = item.video_url || item.videoUrl;
          const vidRes = item.videoResources || item.video_resources;
          if (vidRes && vidRes.length > 0) {
            let maxVid = vidRes[0];
            for (let vid of vidRes) {
              const vidArea = (vid.config_width || vid.configWidth || 0) * (vid.config_height || vid.configHeight || 0);
              const maxArea = (maxVid.config_width || maxVid.configWidth || 0) * (maxVid.config_height || maxVid.configHeight || 0);
              if (vidArea > maxArea) maxVid = vid;
            }
            videoUrl = maxVid.src || maxVid.url || videoUrl;
          }
          return { url: videoUrl, type: 'video', slideIndex: idx };
        } else {
          const url = getHighestResImageUrl(item) || item.src || item.display_url || item.displayUrl;
          return { url: url, type: 'image', slideIndex: idx };
        }
      }).filter(item => item && item.url);
    }

    // 1. Carousel check (edge_sidecar_to_children) — GraphQL structure
    if (mediaObject.edge_sidecar_to_children?.edges && mediaObject.edge_sidecar_to_children.edges.length > 0) {
      const edges = mediaObject.edge_sidecar_to_children.edges;
      return edges.map((edge, idx) => {
        const node = edge.node;
        if (node.is_video) {
          const videoUrl = node.video_url || null;
          return {
            url: videoUrl,
            type: 'video',
            slideIndex: idx
          };
        } else {
          const url = getHighestResImageUrl(node) || node.display_url;
          return {
            url: url,
            type: 'image',
            slideIndex: idx
          };
        }
      }).filter(item => item && item.url);
    }
    
    // 2. Carousel check (carousel_media) — Native/App API structure
    if (mediaObject.carousel_media && mediaObject.carousel_media.length > 0) {
      return mediaObject.carousel_media.map((mediaItem, idx) => {
        if (mediaItem.video_versions && mediaItem.video_versions.length > 0) {
          let maxVideo = mediaItem.video_versions[0];
          for (let vid of mediaItem.video_versions) {
            const vidArea = (vid.width || 0) * (vid.height || 0);
            const maxArea = (maxVideo.width || 0) * (maxVideo.height || 0);
            if (vidArea > maxArea) maxVideo = vid;
          }
          return { url: maxVideo.url, type: 'video', slideIndex: idx };
        }
        if (mediaItem.is_video && mediaItem.video_url) {
          return { url: mediaItem.video_url, type: 'video', slideIndex: idx };
        }
        if (mediaItem.media_type === 2 && mediaItem.video_url) {
          return { url: mediaItem.video_url, type: 'video', slideIndex: idx };
        }
        const url = getHighestResImageUrl(mediaItem);
        return { url: url, type: 'image', slideIndex: idx };
      }).filter(item => item && item.url);
    }

    // 3. Single Video
    const isSingleVideo = mediaObject.isVideo || mediaObject.video_url || mediaObject.videoUrl ||
                          (mediaObject.video_versions && mediaObject.video_versions.length > 0) ||
                          (mediaObject.videoVersions && mediaObject.videoVersions.length > 0) ||
                          (mediaObject.video_resources && mediaObject.video_resources.length > 0) ||
                          (mediaObject.videoResources && mediaObject.videoResources.length > 0) ||
                          mediaObject.media_type === 2 || mediaObject.mediaType === 2;

    if (isSingleVideo) {
      let url = mediaObject.video_url || mediaObject.videoUrl;
      const vidVersions = mediaObject.video_versions || mediaObject.videoVersions;
      if (vidVersions && vidVersions.length > 0) {
        let maxVideo = vidVersions[0];
        for (let vid of vidVersions) {
          const vidArea = (vid.width || 0) * (vid.height || 0);
          const maxArea = (maxVideo.width || 0) * (maxVideo.height || 0);
          if (vidArea > maxArea) maxVideo = vid;
        }
        url = maxVideo.url || url;
      } else {
        const vidRes = mediaObject.video_resources || mediaObject.videoResources;
        if (vidRes && vidRes.length > 0) {
          let maxVideo = vidRes[0];
          for (let vid of vidRes) {
            const width = vid.config_width || vid.configWidth || 0;
            const height = vid.config_height || vid.configHeight || 0;
            const vidArea = width * height;
            
            const maxWidth = maxVideo.config_width || maxVideo.configWidth || 0;
            const maxHeight = maxVideo.config_height || maxVideo.configHeight || 0;
            const maxArea = maxWidth * maxHeight;
            if (vidArea > maxArea) maxVideo = vid;
          }
          url = maxVideo.src || maxVideo.url || url;
        }
      }
      if (url) {
        return [{ url, type: 'video', slideIndex: 0 }];
      }
    }

    // 4. Single Image
    const imageUrl = getHighestResImageUrl(mediaObject);
    if (imageUrl) {
      return [{ url: imageUrl, type: 'image', slideIndex: 0 }];
    }
    
    return [];
  }

  // Extracts the caption text from a matched media object
  function getCaptionFromMediaObject(mediaObject) {
    if (!mediaObject) return '';
    try {
      if (mediaObject.edge_media_to_caption?.edges?.[0]?.node?.text) {
        return mediaObject.edge_media_to_caption.edges[0].node.text;
      }
      if (mediaObject.caption?.text) {
        return mediaObject.caption.text;
      }
      if (typeof mediaObject.caption === 'string') {
        return mediaObject.caption;
      }
    } catch (e) {}
    return '';
  }

  // Extracts the author's username from a matched media object
  function getUsernameFromMediaObject(mediaObject) {
    if (!mediaObject) return '';
    try {
      if (mediaObject.owner?.username) {
        return mediaObject.owner.username;
      }
      if (mediaObject.user?.username) {
        return mediaObject.user.username;
      }
      if (mediaObject.owner_username) {
        return mediaObject.owner_username;
      }
    } catch (e) {}
    return '';
  }

  // Scans an object recursively for properties that look like Instagram shortcodes or post URLs
  function scanForPostId(obj, visited = new Set()) {
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return null;
    visited.add(obj);
    
    // Check direct properties first
    const keys = Object.keys(obj);
    const candidates = ['code', 'shortcode', 'postId', 'mediaId', 'id'];
    for (let key of candidates) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key];
        if (typeof val === 'string') {
          if (val.length >= 9 && val.length <= 16 && /^[A-Za-z0-9_-]+$/.test(val)) {
            logger.log(`Found direct match in key "${key}":`, val);
            return val;
          }
        } else if (typeof val === 'number') {
          const str = String(val);
          if (str.length >= 9 && str.length <= 25 && /^\d+$/.test(str)) {
            logger.log(`Found direct numeric match in key "${key}":`, str);
            return str;
          }
        }
      }
    }
    
    // Scan all string properties for URL patterns
    for (let key of keys) {
      if (BLOCKED_KEYS.has(key)) continue;
      try {
        const val = obj[key];
        if (typeof val === 'string') {
          const m = val.match(/\/(?:p|reel|reels)\/([A-Za-z0-9_-]{9,15})(?:\/|\?|$)/);
          if (m && m[1]) {
            logger.log(`Found URL match in key "${key}":`, m[1], "value:", val);
            return m[1];
          }
        }
      } catch (e) {}
    }
    
    // Recursive check
    for (let key of keys) {
      if (BLOCKED_KEYS.has(key)) continue;
      try {
        const val = obj[key];
        if (typeof val === 'object' && val !== null) {
          const found = scanForPostId(val, visited);
          if (found) return found;
        }
      } catch (e) {}
    }
    return null;
  }

  // Walks up the React Fiber tree of starting element to find any prop/state containing a real shortcode
  function findRealPostIdInFiber(startElement) {
    let current = startElement;
    logger.log(`findRealPostIdInFiber starting from:`, startElement.tagName, startElement.className);
    while (current) {
      const keys = Object.keys(current);
      const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
      if (fiberKey) {
        logger.log(`  Found fiber key: "${fiberKey}" on element:`, current.tagName);
        let fiber = current[fiberKey];
        let depth = 0;
        const visited = new Set();
        
        while (fiber && depth < 40) {
          const propsList = [];
          if (fiber.memoizedProps) propsList.push(fiber.memoizedProps);
          if (fiber.pendingProps) propsList.push(fiber.pendingProps);
          
          for (let props of propsList) {
            const found = scanForPostId(props, visited);
            if (found) {
              logger.log(`  Successfully resolved postId: "${found}" at fiber depth: ${depth}`);
              return found;
            }
          }
          fiber = fiber.return;
          depth++;
        }
        logger.log(`  Reached max fiber depth 40 on element:`, current.tagName, "without matching shortcode.");
      }
      current = current.parentElement;
    }
    logger.log(`  Finished walking up DOM tree. React Fiber did not yield any shortcode.`);
    return null;
  }

  // Like findRealPostIdInFiber but returns the FULL Instagram URL (e.g. https://www.instagram.com/reel/DaVAn7jRb6e/?id=...)
  // Used to extract the numeric media ID from the ?id= query param for the API fallback.
  function findTargetUrlFromFiber(startElement) {
    const instagramUrlRe = /https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels)\/[A-Za-z0-9_-]{9,15}/;
    function scanForUrl(obj, visited) {
      if (!obj || typeof obj !== 'object' || visited.has(obj)) return null;
      visited.add(obj);
      const keys = Object.keys(obj);
      for (const key of keys) {
        if (BLOCKED_KEYS.has(key)) continue;
        try {
          const val = obj[key];
          if (typeof val === 'string' && instagramUrlRe.test(val)) return val;
          if (val && typeof val === 'object') {
            const found = scanForUrl(val, visited);
            if (found) return found;
          }
        } catch(e) {}
      }
      return null;
    }
    let current = startElement;
    while (current) {
      const keys = Object.keys(current);
      const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
      if (fiberKey) {
        let fiber = current[fiberKey];
        let depth = 0;
        const visited = new Set();
        while (fiber && depth < 40) {
          const propsList = [];
          try { if (fiber.memoizedProps) propsList.push(fiber.memoizedProps); } catch(e) {}
          try { if (fiber.pendingProps) propsList.push(fiber.pendingProps); } catch(e) {}
          for (const props of propsList) {
            const found = scanForUrl(props, visited);
            if (found) return found;
          }
          fiber = fiber.return;
          depth++;
        }
      }
      current = current.parentElement;
    }
    return null;
  }

  // Walks up the React Fiber tree to extract props from functional and intermediate components
  function getMediaFromReactFiber(startElement, targetType, postId) {
    const keys = Object.keys(startElement);
    const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
    if (!fiberKey) return null;

    const rootFiber = startElement[fiberKey];
    if (!rootFiber) return null;

    const MAX_SAFETY_DEPTH = 50;
    const allProps = [];
    let fiber = rootFiber;
    let depth = 0;

    while (fiber && depth < MAX_SAFETY_DEPTH) {
      try { if (fiber.memoizedProps && typeof fiber.memoizedProps === 'object') allProps.push(fiber.memoizedProps); } catch(e) {}
      try { if (fiber.pendingProps && typeof fiber.pendingProps === 'object') allProps.push(fiber.pendingProps); } catch(e) {}
      try {
        let s = fiber.memoizedState;
        let sd = 0;
        while (s && sd < 10) {
          if (s.memoizedState && typeof s.memoizedState === 'object') allProps.push(s.memoizedState);
          s = s.next; sd++;
        }
      } catch(e) {}

      fiber = fiber.return;
      depth++;
    }

    if (postId && !postId.startsWith('fallback_')) {
      for (const props of allProps) {
        if (!props || typeof props !== 'object') continue;
        const postObj = findPostObjectByCode(props, postId, 0, new Set());
        if (postObj) {
          const mediaList = parseAllMediaFromObject(postObj);
          if (mediaList && mediaList.length > 0) {
            return { mediaList, caption: getCaptionFromMediaObject(postObj), username: getUsernameFromMediaObject(postObj) };
          }
        }
      }
    }

    for (const props of allProps) {
      if (!props || typeof props !== 'object') continue;
      const carousel = findCarouselObjectInProps(props, postId, 0, new Set(), true);
      if (carousel) {
        const mediaList = parseAllMediaFromObject(carousel);
        if (mediaList && mediaList.length > 0) {
          return { mediaList, caption: getCaptionFromMediaObject(carousel), username: getUsernameFromMediaObject(carousel) };
        }
      }
    }

    for (const props of allProps) {
      if (!props || typeof props !== 'object') continue;
      const videoObj = findVideoObjectInProps(props, postId, 0, new Set(), true);
      if (videoObj) {
        const mediaList = parseAllMediaFromObject(videoObj);
        if (mediaList && mediaList.length > 0) {
          return { mediaList, caption: getCaptionFromMediaObject(videoObj), username: getUsernameFromMediaObject(videoObj) };
        }
      }
    }

    for (const props of allProps) {
      if (!props || typeof props !== 'object') continue;
      const imageObj = findImageObjectInProps(props, postId, 0, new Set(), true);
      if (imageObj) {
        const mediaList = parseAllMediaFromObject(imageObj);
        if (mediaList && mediaList.length > 0) {
          return { mediaList, caption: getCaptionFromMediaObject(imageObj), username: getUsernameFromMediaObject(imageObj) };
        }
      }
    }

    // Fallback: requireCode=false — for DM context where video objects lack shortcode on them
    for (const props of allProps) {
      if (!props || typeof props !== 'object') continue;
      const videoObj = findVideoObjectInProps(props, postId, 0, new Set(), false);
      if (videoObj) {
        const mediaList = parseAllMediaFromObject(videoObj);
        if (mediaList && mediaList.length > 0) {
          return { mediaList, caption: getCaptionFromMediaObject(videoObj), username: getUsernameFromMediaObject(videoObj) };
        }
      }
    }

    for (const props of allProps) {
      if (!props || typeof props !== 'object') continue;
      const imageObj = findImageObjectInProps(props, postId, 0, new Set(), false);
      if (imageObj) {
        const mediaList = parseAllMediaFromObject(imageObj);
        if (mediaList && mediaList.length > 0) {
          return { mediaList, caption: getCaptionFromMediaObject(imageObj), username: getUsernameFromMediaObject(imageObj) };
        }
      }
    }

    // Last resort: scan for raw .mp4 / .jpg URLs in the collected props
    const isVideo = targetType === 'video';
    const rawResults = [];
    for (const props of allProps) {
      if (!props || typeof props !== 'object') continue;
      scanPropsForRawUrls(props, isVideo, 0, new Set(), rawResults);
    }
    if (rawResults.length > 0) {
      rawResults.sort((a, b) => a.priority - b.priority);
      return {
        mediaList: [{ url: rawResults[0].url, type: rawResults[0].type, slideIndex: 0 }],
        caption: "",
        username: ""
      };
    }

    return null;
  }

  function getMediaFromArticleFiber(articleElement, postId) {
    const keys = Object.keys(articleElement);
    const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
    if (!fiberKey) return null;

    const rootFiber = articleElement[fiberKey];
    if (!rootFiber) return null;

    const allProps = [];
    const MAX_NODES = 500;
    let nodeCount = 0;

    function collectSingleFiberProps(fiber) {
      try { if (fiber.memoizedProps && typeof fiber.memoizedProps === 'object') allProps.push(fiber.memoizedProps); } catch(e) {}
      try { if (fiber.pendingProps && typeof fiber.pendingProps === 'object') allProps.push(fiber.pendingProps); } catch(e) {}
      try {
        let s = fiber.memoizedState;
        let sd = 0;
        while (s && sd < 10) {
          if (s.memoizedState && typeof s.memoizedState === 'object') {
            allProps.push(s.memoizedState);
          }
          s = s.next;
          sd++;
        }
      } catch(e) {}
    }

    function walkFiberSubtree(fiber, depth) {
      if (!fiber || nodeCount >= MAX_NODES || depth > 60) return;
      nodeCount++;
      collectSingleFiberProps(fiber);
      walkFiberSubtree(fiber.child, depth + 1);
      walkFiberSubtree(fiber.sibling, depth);
    }

    collectSingleFiberProps(rootFiber);
    walkFiberSubtree(rootFiber.child, 1);

    if (postId && !postId.startsWith('fallback_')) {
      for (const props of allProps) {
        if (!props || typeof props !== 'object') continue;
        const postObj = findPostObjectByCode(props, postId, 0, new Set());
        if (postObj) {
          const mediaList = parseAllMediaFromObject(postObj);
          if (mediaList && mediaList.length > 0) {
            return { mediaList, caption: getCaptionFromMediaObject(postObj), username: getUsernameFromMediaObject(postObj) };
          }
        }
      }
    }

    for (const props of allProps) {
      if (!props || typeof props !== 'object') continue;
      const carousel = findCarouselObjectInProps(props, postId, 0, new Set(), false);
      if (carousel) {
        const mediaList = parseAllMediaFromObject(carousel);
        if (mediaList && mediaList.length > 0) {
          return { mediaList, caption: getCaptionFromMediaObject(carousel), username: getUsernameFromMediaObject(carousel) };
        }
      }

      const videoObj = findVideoObjectInProps(props, postId, 0, new Set(), false);
      if (videoObj) {
        const mediaList = parseAllMediaFromObject(videoObj);
        if (mediaList && mediaList.length > 0) {
          return { mediaList, caption: getCaptionFromMediaObject(videoObj), username: getUsernameFromMediaObject(videoObj) };
        }
      }

      const imageObj = findImageObjectInProps(props, postId, 0, new Set(), false);
      if (imageObj) {
        const mediaList = parseAllMediaFromObject(imageObj);
        if (mediaList && mediaList.length > 0) {
          return { mediaList, caption: getCaptionFromMediaObject(imageObj), username: getUsernameFromMediaObject(imageObj) };
        }
      }
    }

    return null;
  }

  function getMediaFromReactProps(startElement, targetType, postId) {
    const isVideo = targetType === 'video';
    
    try {
      let current = startElement;
      while (current) {
        const keys = Object.keys(current);
        const fiberKey = keys.find(k => k.startsWith('__reactFiber$'));
        if (fiberKey) {
          const result = getMediaFromReactFiber(current, targetType, postId);
          if (result && result.mediaList && result.mediaList.length > 0) {
            return result;
          }
        }
        current = current.parentElement;
      }
    } catch (e) {}

    let current = startElement;
    let depth = 0;
    
    while (current && depth < 30) {
      const keys = Object.keys(current);
      const reactKey = keys.find(k => k.startsWith('__reactProps$') || k.startsWith('__reactFiber$'));
      if (reactKey) {
        const value = current[reactKey];
        let propsList = [];
        if (reactKey.startsWith('__reactFiber$') && value) {
          if (value.memoizedProps) propsList.push(value.memoizedProps);
          if (value.pendingProps) propsList.push(value.pendingProps);
          if (value.memoizedState) propsList.push(value.memoizedState);
        } else if (value) {
          propsList.push(value);
        }
        for (let props of propsList) {
          let carouselObject = findCarouselObjectInProps(props, postId, 0, new Set(), true);
          if (carouselObject) {
            const mediaList = parseAllMediaFromObject(carouselObject);
            if (mediaList && mediaList.length > 0) {
              const caption = getCaptionFromMediaObject(carouselObject);
              const username = getUsernameFromMediaObject(carouselObject);
              return { mediaList, caption, username };
            }
          }
        }
      }
      current = current.parentElement;
      depth++;
    }

    current = startElement;
    depth = 0;
    while (current && depth < 30) {
      const keys = Object.keys(current);
      const reactKey = keys.find(k => k.startsWith('__reactProps$') || k.startsWith('__reactFiber$'));
      if (reactKey) {
        const value = current[reactKey];
        let propsList = [];
        if (reactKey.startsWith('__reactFiber$') && value) {
          if (value.memoizedProps) propsList.push(value.memoizedProps);
          if (value.pendingProps) propsList.push(value.pendingProps);
          if (value.memoizedState) propsList.push(value.memoizedState);
        } else if (value) {
          propsList.push(value);
        }
        for (let props of propsList) {
          let videoObject = findVideoObjectInProps(props, postId, 0, new Set(), true);
          if (videoObject) {
            const mediaList = parseAllMediaFromObject(videoObject);
            if (mediaList && mediaList.length > 0) {
              const caption = getCaptionFromMediaObject(videoObject);
              const username = getUsernameFromMediaObject(videoObject);
              return { mediaList, caption, username };
            }
          }
        }
      }
      current = current.parentElement;
      depth++;
    }

    current = startElement;
    depth = 0;
    while (current && depth < 30) {
      const keys = Object.keys(current);
      const reactKey = keys.find(k => k.startsWith('__reactProps$') || k.startsWith('__reactFiber$'));
      if (reactKey) {
        const value = current[reactKey];
        let propsList = [];
        if (reactKey.startsWith('__reactFiber$') && value) {
          if (value.memoizedProps) propsList.push(value.memoizedProps);
          if (value.pendingProps) propsList.push(value.pendingProps);
          if (value.memoizedState) propsList.push(value.memoizedState);
        } else if (value) {
          propsList.push(value);
        }
        for (let props of propsList) {
          let imageObject = findImageObjectInProps(props, postId, 0, new Set(), true);
          if (imageObject) {
            const mediaList = parseAllMediaFromObject(imageObject);
            if (mediaList && mediaList.length > 0) {
              const caption = getCaptionFromMediaObject(imageObject);
              const username = getUsernameFromMediaObject(imageObject);
              return { mediaList, caption, username };
            }
          }
        }
      }
      current = current.parentElement;
      depth++;
    }

    current = startElement;
    depth = 0;
    while (current && depth < 30) {
      const keys = Object.keys(current);
      const reactKey = keys.find(k => k.startsWith('__reactProps$') || k.startsWith('__reactFiber$'));
      if (reactKey) {
        const value = current[reactKey];
        let propsList = [];
        if (reactKey.startsWith('__reactFiber$') && value) {
          if (value.memoizedProps) propsList.push(value.memoizedProps);
          if (value.pendingProps) propsList.push(value.pendingProps);
          if (value.memoizedState) propsList.push(value.memoizedState);
        } else if (value) {
          propsList.push(value);
        }
        for (let props of propsList) {
          const rawResults = [];
          scanPropsForRawUrls(props, isVideo, 0, new Set(), rawResults);
          if (rawResults.length > 0) {
            rawResults.sort((a, b) => a.priority - b.priority);
            return {
              mediaList: [{
                url: rawResults[0].url,
                type: rawResults[0].type,
                slideIndex: 0
              }],
              caption: "",
              username: ""
            };
          }
        }
      }
      current = current.parentElement;
      depth++;
    }
    return null;
  }

  // ============================================================
  // Network Intercept Cache
  // Intercepts fetch + XHR in the MAIN world to pre-populate a
  // shortcode → mediaList cache from Instagram API responses.
  // This runs passively in the background; when the user clicks,
  // the cache is checked first (O(1)) before any fiber traversal.
  // ============================================================
  const _networkCache = new Map(); // shortcode -> { mediaList, caption, username }

  function _cacheMediaItem(item) {
    if (!item || typeof item !== 'object') return;
    const code = item.code || item.shortcode;
    if (!code || !isShortcode(code)) return;
    if (_networkCache.has(code)) return;
    const mediaList = parseAllMediaFromObject(item);
    if (mediaList && mediaList.length > 0) {
      const caption = getCaptionFromMediaObject(item);
      const username = getUsernameFromMediaObject(item);
      _networkCache.set(code, { mediaList, caption, username });
    }
  }

  function _scanAndCacheObj(obj, depth, visited) {
    if (depth > 15 || !obj || typeof obj !== 'object' || Array.isArray(obj) && obj.length > 500) return;
    if (visited.has(obj)) return;
    visited.add(obj);

    // If this object looks like a post/media node, try caching it
    const code = obj.code || obj.shortcode;
    if (code && isShortcode(code)) {
      _cacheMediaItem(obj);
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < Math.min(obj.length, 100); i++) {
        _scanAndCacheObj(obj[i], depth + 1, visited);
      }
      return;
    }

    const keys = Object.keys(obj);
    for (const key of keys) {
      if (BLOCKED_KEYS.has(key)) continue;
      try {
        const val = obj[key];
        if (val && typeof val === 'object') {
          _scanAndCacheObj(val, depth + 1, visited);
        }
      } catch(e) {}
    }
  }

  function _tryParseAndCache(text, url) {
    if (!text || typeof text !== 'string' || text.length < 10) return;
    if (text[0] !== '{' && text[0] !== '[') return;
    try {
      const data = JSON.parse(text);
      _scanAndCacheObj(data, 0, new Set());
    } catch(e) {}
  }

  // --- fetch intercept ---
  const _origFetch = window.fetch;
  window.fetch = function(...args) {
    const url = (args[0] instanceof Request ? args[0].url : String(args[0] || ''));
    const isInstaReq = url.includes('instagram.com') || url.includes('graph.facebook.com');
    const promise = _origFetch.apply(this, args);
    if (isInstaReq) {
      promise.then(response => {
        try {
          const cloned = response.clone();
          cloned.text().then(text => _tryParseAndCache(text, url)).catch(() => {});
        } catch(e) {}
      }).catch(() => {});
    }
    return promise;
  };

  // --- XHR intercept ---
  const _origXhrOpen = XMLHttpRequest.prototype.open;
  const _origXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._igUrl = String(url || '');
    return _origXhrOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const url = this._igUrl || '';
    const isInstaReq = url.includes('instagram.com') || url.includes('graph.facebook.com');
    if (isInstaReq) {
      this.addEventListener('load', () => {
        try {
          if (this.status >= 200 && this.status < 300) {
            _tryParseAndCache(this.responseText, url);
          }
        } catch(e) {}
      });
    }
    return _origXhrSend.apply(this, args);
  };

  // ============================================================
  // API Fallback: /api/v1/media/{mediaId}/info/
  // Used when the video URL is not cached and not in the fiber
  // (Instagram lazy-loads the video URL until playback starts).
  // Runs with the page's session cookies — same-origin, no CORS.
  // ============================================================
  async function _fetchMediaInfoFromAPI(chatTarget, resolvedPostId) {
    try {
      // Extract the full targetUrl from the fiber
      const targetUrl = findTargetUrlFromFiber(chatTarget);
      if (!targetUrl) return null;

      // ---- Step 1: resolve numeric mediaId ----
      let mediaId = null;
      try {
        const parsedUrl = new URL(targetUrl);
        const idParam = parsedUrl.searchParams.get('id');
        if (idParam) {
          // Reel / single post: ?id={mediaId}_{userId}
          mediaId = idParam.split('_')[0];
        }
      } catch(e) {}

      if (!mediaId && resolvedPostId) {
        // Carousel DM share: URL has no '?id=' param, only '?carousel_share_child_media_id='.
        // Decode the shortcode (resolvedPostId) → numeric media ID using Instagram's
        // standard base-64 alphabet: A-Z (0-25) a-z (26-51) 0-9 (52-61) - (62) _ (63)
        const IG_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        try {
          let id = BigInt(0);
          let valid = true;
          for (const ch of resolvedPostId) {
            const idx = IG_ALPHA.indexOf(ch);
            if (idx < 0) { valid = false; break; }
            id = id * BigInt(64) + BigInt(idx);
          }
          if (valid) mediaId = id.toString();
        } catch(e) {}
      }

      if (!mediaId) {
        return null;
      }

      // ---- Step 2: CSRF token ----
      const csrfToken = document.cookie.split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('csrftoken='))
        ?.split('=')[1] || '';

      const headers = {
        'x-ig-app-id': '936619743392459',
        'Accept': 'application/json',
        ...(csrfToken ? { 'x-csrftoken': csrfToken } : {})
      };

      // ---- Step 3: fetch media info ----
      const resp = await _origFetch(
        `https://www.instagram.com/api/v1/media/${mediaId}/info/`,
        { credentials: 'include', headers }
      );

      if (!resp.ok) {
        return null;
      }

      const data = await resp.json();

      if (data.items && data.items.length > 0) {
        let item = data.items[0];

        // ---- Step 4: carousel child detection ----
        // If we fetched a CHILD slide (media_type=1 with carousel_parent_id), the response
        // won't have carousel_media. We need to re-fetch the PARENT ALBUM to get all slides.
        if (item.media_type !== 8 && item.carousel_parent_id) {
          const parentId = item.carousel_parent_id.split('_')[0];
          try {
            const parentResp = await _origFetch(
              `https://www.instagram.com/api/v1/media/${parentId}/info/`,
              { credentials: 'include', headers }
            );
            if (parentResp.ok) {
              const parentData = await parentResp.json();
              if (parentData.items && parentData.items.length > 0) {
                item = parentData.items[0];
              }
            }
          } catch(pe) {
          }
        }

        if (item.carousel_media) {
        }

        // Cache and parse
        _cacheMediaItem(item);
        const mediaList = parseAllMediaFromObject(item);
        if (mediaList && mediaList.length > 0) {
          return { mediaList, caption: getCaptionFromMediaObject(item), username: getUsernameFromMediaObject(item) };
        }
      }
    } catch(e) {
    }
    return null;
  }

  window.addEventListener("INSTAGRAB_REQUEST_URL", async (event) => {
    let { postId, slideIndex, isVideo } = event.detail;
    const originalPostId = postId;
    logger.log(`REQUEST RECEIVED. postId: "${postId}"`);
    
    let chatTarget = null;
    if (postId === 'chat_click') {
      chatTarget = document.querySelector('.instagrab-chat-target');
      logger.log(`  chat_click target element:`, chatTarget);
      if (chatTarget) {
        const resolvedId = findRealPostIdInFiber(chatTarget);
        logger.log(`  Resolved ID from fiber: "${resolvedId}"`);
        if (resolvedId) {
          postId = resolvedId;  // mutate postId to resolved shortcode for internal use
        } else {
          logger.error(`  ❌ FAILED: Could not resolve ID from chatTarget fiber tree`);
          window.dispatchEvent(new CustomEvent("INSTAGRAB_RESPONSE_URL", {
            detail: { postId: originalPostId, success: false, error: "Could not resolve post ID from fiber" }
          }));
          return;
        }
      }
    }

    const targetType = isVideo ? 'video' : 'image';
    let strategyUsed = "";
    
    let targetArticle = document.querySelector('.instagrab-active-target');
    if (targetArticle) strategyUsed = "Strategy 1 (.instagrab-active-target)";
    
    if (!targetArticle && chatTarget) {
      targetArticle = chatTarget.closest('div[role="button"]') || chatTarget;
      strategyUsed = "Strategy Chat (.instagrab-chat-target)";
    }

    if (!targetArticle && postId && !postId.startsWith('fallback_')) {
      targetArticle = document.querySelector(`[data-instagrab-post-id="${postId}"]`);
      if (targetArticle) strategyUsed = `Strategy 2 ([data-instagrab-post-id="${postId}"])`;
    }

    if (!targetArticle) {
      const buttons = document.querySelectorAll('.instagrab-download-btn');
      for (let btn of buttons) {
        if (btn.getAttribute('data-post-id') === postId) {
          targetArticle = btn.closest('article') ||
                          btn.closest('div[role="dialog"]') ||
                          btn.closest('div[role="presentation"]');
          if (targetArticle) {
            strategyUsed = "Strategy 3 (closest article of matching button)";
            break;
          }
        }
      }
    }

    if (!targetArticle) {
      targetArticle = document.querySelector('div[role="dialog"] article') ||
                      document.querySelector('div[role="presentation"] article');
      if (targetArticle) strategyUsed = "Strategy 4 (dialog/presentation modal article)";
    }

    if (targetArticle) {
    } else {
      window.dispatchEvent(new CustomEvent("INSTAGRAB_RESPONSE_URL", {
        detail: { postId, success: false, error: "Post container not found" }
      }));
      return;
    }

    const video = targetArticle.querySelector('video');
    const allImgs = Array.from(targetArticle.querySelectorAll('img'));
    const contentImg = allImgs.find(el => {
      if (el.closest('header')) return false;
      const heightAttr = parseInt(el.getAttribute('height') || '0');
      const widthAttr  = parseInt(el.getAttribute('width') || '0');
      if ((heightAttr > 0 && heightAttr < 100) || (widthAttr > 0 && widthAttr < 100)) return false;
      return el.hasAttribute('srcset');
    }) || null;

    const startElem = video || contentImg || targetArticle;

    let resolvedPostId = postId;
    if (postId && (postId.startsWith('fallback_') || postId.length < 5)) {
      if (startElem) {
        const realId = findRealPostIdInFiber(startElem);
        if (realId) {
          resolvedPostId = realId;
        }
      }
    }

    let result = null;

    // ---- Strategy 0: Network Cache (instant O(1) path) ----
    // Populated passively by fetch/XHR intercept as Instagram loads content.
    if (resolvedPostId && _networkCache.has(resolvedPostId)) {
      result = _networkCache.get(resolvedPostId);
    }

    // ---- DM Strategy: API fetch first, fiber as last resort ----
    // For DM chat clicks the fiber tree only holds the thumbnail IMG src.
    // Running getMediaFromReactFiber here returns type:"image" thumbnail URL
    // for reels, and only the first slide for carousels — both wrong.
    // The API fetch (/api/v1/media/{id}/info/) returns the real video_url AND
    // all carousel slides in one call, so we prioritise it for DM context.
    if (chatTarget && !result) {
      result = await _fetchMediaInfoFromAPI(chatTarget, resolvedPostId);

      // API failed: fall back to fiber as last resort (will give thumbnail for videos)
      if (!result) {
        result = getMediaFromReactFiber(chatTarget, targetType, resolvedPostId);
        if (!result) result = getMediaFromReactProps(chatTarget, targetType, resolvedPostId);
      }
    }

    // ---- Feed/Modal strategies (skipped for DM — chatTarget context) ----
    if (!chatTarget) {
      if (!result && video) {
        result = getMediaFromReactFiber(video, targetType, resolvedPostId);
        if (!result) result = getMediaFromReactProps(video, targetType, resolvedPostId);
      }
      if (!result && contentImg) {
        result = getMediaFromReactFiber(contentImg, targetType, resolvedPostId);
        if (!result) result = getMediaFromReactProps(contentImg, targetType, resolvedPostId);
      }
      if (!result) {
        result = getMediaFromArticleFiber(targetArticle, resolvedPostId);
      }
      if (!result) {
        result = getMediaFromReactProps(targetArticle, targetType, resolvedPostId);
      }
    }

    if (result && result.mediaList && result.mediaList.length > 0) {
      window.dispatchEvent(new CustomEvent("INSTAGRAB_RESPONSE_URL", {
        detail: { 
          postId: originalPostId,    // use original so content.js can match 'chat_click'
          realPostId: resolvedPostId,
          success: true, 
          mediaList: result.mediaList,
          caption: result.caption || "",
          username: result.username || ""
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent("INSTAGRAB_RESPONSE_URL", {
        detail: { postId: originalPostId, realPostId: resolvedPostId, success: false, error: "Direct URL not found in React properties" }
      }));
    }
  });

})();
