// JSON parsing and API endpoint scraper functions

// Helper to extract a matching JSON object block from a string
export function extractMatchingObject(str, startIndex) {
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') {
      depth++;
    } else if (str[i] === '}') {
      depth--;
      if (depth === 0) {
        return str.substring(startIndex, i + 1);
      }
    }
  }
  return null;
}

// Scans HTML content for Instagram JSON state scripts and parses them
export function extractJSONFromHTML(htmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const scripts = doc.querySelectorAll('script');
    
    for (let script of scripts) {
      const text = script.textContent.trim();
      if (!text) continue;
      
      // Try to find window._sharedData = ...
      if (text.startsWith('window._sharedData =')) {
        try {
          const jsonText = text.substring(text.indexOf('=') + 1, text.lastIndexOf(';'));
          return JSON.parse(jsonText);
        } catch (e) {}
      }
      
      // Try to find window.__additionalDataLoaded(...)
      if (text.includes('__additionalDataLoaded')) {
        try {
          const start = text.indexOf('{');
          const end = text.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            const jsonText = text.substring(start, end + 1);
            return JSON.parse(jsonText);
          }
        } catch (e) {}
      }
      
      // Try to parse raw JSON or shortcode_media block
      if (script.getAttribute('type') === 'application/json' || text.includes('shortcode_media')) {
        try {
          const json = JSON.parse(text);
          if (json.shortcode_media || json.graphql?.shortcode_media || json.items) {
            return json;
          }
        } catch (e) {
          try {
            const match = text.match(/"shortcode_media"\s*:\s*({.+})/);
            if (match) {
              const startIdx = match.index + match[0].indexOf('{');
              const jsonText = extractMatchingObject(text, startIdx);
              if (jsonText) {
                return { shortcode_media: JSON.parse(jsonText) };
              }
            }
          } catch (err) {}
        }
      }
    }
  } catch (err) {
  }
  return null;
}

// Extracts the highest resolution image URL from candidates or display_resources
export function getHighestResImageUrl(node) {
  if (!node) return null;
  
  if (node.image_versions2?.candidates && node.image_versions2.candidates.length > 0) {
    let maxCandidate = node.image_versions2.candidates[0];
    for (let cand of node.image_versions2.candidates) {
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
  
  if (node.display_resources && node.display_resources.length > 0) {
    let maxResource = node.display_resources[0];
    for (let res of node.display_resources) {
      const resArea = (res.config_width || 0) * (res.config_height || 0);
      const maxArea = (maxResource.config_width || 0) * (maxResource.config_height || 0);
      if (resArea > maxArea) {
        maxResource = res;
      } else if (res.config_width && !res.config_height && res.config_width > maxResource.config_width) {
        maxResource = res;
      }
    }
    if (maxResource?.src) return maxResource.src;
  }
  
  return node.display_url || node.url || null;
}

// Parses media details from extracted JSON tree for ALL slides/media items
export function parseAllMediaFromJSON(data) {
  try {
    let item = null;
    if (data.shortcode_media) {
      item = data.shortcode_media;
    } else if (data.graphql && data.graphql.shortcode_media) {
      item = data.graphql.shortcode_media;
    } else if (data.items && data.items.length > 0) {
      item = data.items[0];
    } else if (data.entry_data?.PostPage?.[0]?.graphql?.shortcode_media) {
      item = data.entry_data.PostPage[0].graphql.shortcode_media;
    }
    
    if (!item) return [];

    // 1. Carousel check (edge_sidecar_to_children)
    if (item.edge_sidecar_to_children?.edges && item.edge_sidecar_to_children.edges.length > 0) {
      const edges = item.edge_sidecar_to_children.edges;
      return edges.map((edge, idx) => {
        const node = edge.node;
        if (node.is_video) {
          return {
            url: node.video_url,
            type: 'video',
            thumbnail: node.display_url || '',
            slideIndex: idx
          };
        } else {
          const url = getHighestResImageUrl(node);
          return {
            url: url,
            type: 'image',
            thumbnail: url,
            slideIndex: idx
          };
        }
      }).filter(item => item && item.url);
    }
    
    // 2. Carousel check (carousel_media)
    if (item.carousel_media && item.carousel_media.length > 0) {
      return item.carousel_media.map((mediaItem, idx) => {
        if (mediaItem.video_versions && mediaItem.video_versions.length > 0) {
          return {
            url: mediaItem.video_versions[0].url,
            type: 'video',
            thumbnail: mediaItem.image_versions2?.candidates?.[0]?.url || '',
            slideIndex: idx
          };
        }
        if ((mediaItem.is_video || mediaItem.media_type === 2) && mediaItem.video_url) {
          return {
            url: mediaItem.video_url,
            type: 'video',
            thumbnail: mediaItem.image_versions2?.candidates?.[0]?.url || '',
            slideIndex: idx
          };
        }
        const url = getHighestResImageUrl(mediaItem);
        return {
          url: url,
          type: 'image',
          thumbnail: url,
          slideIndex: idx
        };
      }).filter(item => item && item.url);
    }

    // 3. Single Video
    if (item.is_video || (item.video_versions && item.video_versions.length > 0)) {
      const url = item.video_url || item.video_versions?.[0]?.url;
      const thumbnail = item.display_url || item.image_versions2?.candidates?.[0]?.url || '';
      if (url) {
        return [{ url, type: 'video', thumbnail, slideIndex: 0 }];
      }
    }

    // 4. Single Image
    const imageUrl = getHighestResImageUrl(item);
    if (imageUrl) {
      return [{ url: imageUrl, type: 'image', thumbnail: imageUrl, slideIndex: 0 }];
    }
  } catch (err) {
  }
  return [];
}

// Extracts the caption from the parsed JSON data tree
export function getCaptionFromJSON(data) {
  if (!data) return '';
  try {
    let item = null;
    if (data.shortcode_media) {
      item = data.shortcode_media;
    } else if (data.graphql && data.graphql.shortcode_media) {
      item = data.graphql.shortcode_media;
    } else if (data.items && data.items.length > 0) {
      item = data.items[0];
    } else if (data.entry_data?.PostPage?.[0]?.graphql?.shortcode_media) {
      item = data.entry_data.PostPage[0].graphql.shortcode_media;
    }
    if (item) {
      return item.edge_media_to_caption?.edges?.[0]?.node?.text || item.caption?.text || '';
    }
  } catch (e) {}
  return '';
}

// Extracts the author's username from the parsed JSON data tree
export function getUsernameFromJSON(data) {
  if (!data) return '';
  try {
    let item = null;
    if (data.shortcode_media) {
      item = data.shortcode_media;
    } else if (data.graphql && data.graphql.shortcode_media) {
      item = data.graphql.shortcode_media;
    } else if (data.items && data.items.length > 0) {
      item = data.items[0];
    } else if (data.entry_data?.PostPage?.[0]?.graphql?.shortcode_media) {
      item = data.entry_data.PostPage[0].graphql.shortcode_media;
    }
    if (item) {
      return item.owner?.username || item.user?.username || '';
    }
  } catch (e) {}
  return '';
}

// Fetch direct high-res media URLs and caption for all items/slides
export async function fetchDirectUrls(postId) {
  // ATTEMPT 1: Instagram's JSON API (?__a=1)
  try {
    const apiResponse = await fetch(`https://www.instagram.com/p/${postId}/?__a=1&__d=dis`, {
      headers: { 'Accept': 'application/json' }
    });
    if (apiResponse.ok) {
      const json = await apiResponse.json();
      const mediaList = parseAllMediaFromJSON(json);
      const caption = getCaptionFromJSON(json);
      const username = getUsernameFromJSON(json);
      if (mediaList && mediaList.length > 0) return { mediaList, caption, username };
    }
  } catch (e) {
  }

  // ATTEMPT 2: Fetch the HTML page and try to extract embedded JSON state
  try {
    const response = await fetch(`https://www.instagram.com/p/${postId}/`);
    if (response.ok) {
      const htmlText = await response.text();
      const jsonData = extractJSONFromHTML(htmlText);
      if (jsonData) {
        const mediaList = parseAllMediaFromJSON(jsonData);
        const caption = getCaptionFromJSON(jsonData);
        const username = getUsernameFromJSON(jsonData);
        if (mediaList && mediaList.length > 0) return { mediaList, caption, username };
      }

      // Last resort: Open Graph meta tags
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const ogDesc = doc.querySelector('meta[property="og:description"]')?.content ||
                     doc.querySelector('meta[name="description"]')?.content || "";

      const ogVideo = doc.querySelector('meta[property="og:video"]');
      if (ogVideo?.content) {
        return {
          mediaList: [{ url: ogVideo.content, type: 'video', thumbnail: doc.querySelector('meta[property="og:image"]')?.content || '', slideIndex: 0 }],
          caption: ogDesc,
          username: ""
        };
      }

      const ogImage = doc.querySelector('meta[property="og:image"]');
      if (ogImage?.content) {
        return {
          mediaList: [{ url: ogImage.content, type: 'image', thumbnail: ogImage.content, slideIndex: 0 }],
          caption: ogDesc,
          username: ""
        };
      }
    }
  } catch (e) {
  }

  return { mediaList: [], caption: "", username: "" };
}
