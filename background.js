/**
 * X Video Downloader - Background Service Worker
 * Supports dual-engine fetching (vxTwitter + FxTwitter fallback),
 * custom filename templating, author subfolders, and robust downloads.
 */

// Default configuration settings
const DEFAULT_SETTINGS = {
  downloadFolder: 'twitter_download',
  filenameTemplate: '[@{username}] {id}',
  organizeByAuthor: false,
  saveAs: false,
  preferredApi: 'auto' // 'auto' | 'vxtwitter' | 'fxtwitter'
};

// Open options page when extension action icon is clicked in toolbar
chrome.action?.onClicked?.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// Sanitize filename & folder strings for filesystem compatibility (Windows, macOS, Linux)
function sanitizePathSegment(segment) {
  if (!segment) return '';
  // Remove/replace characters that are invalid in Windows and Unix filesystems: < > : " / \ | ? *
  return segment
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

// Format a date object or timestamp to YYYY-MM-DD
function formatDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate the final filename based on template and metadata
function generateFilename(template, meta) {
  let name = template || '[@{username}] {id}';

  const cleanUsername = sanitizePathSegment(meta.username || 'unknown');
  const cleanId = sanitizePathSegment(meta.statusId || 'video');
  const cleanDate = sanitizePathSegment(meta.date || formatDate());
  const cleanText = sanitizePathSegment((meta.text || '').slice(0, 30));

  name = name.replace(/\{username\}/gi, cleanUsername);
  name = name.replace(/\{id\}/gi, cleanId);
  name = name.replace(/\{date\}/gi, cleanDate);
  name = name.replace(/\{text\}/gi, cleanText || cleanId);

  // Fallback if template produced an empty string
  name = sanitizePathSegment(name);
  if (!name) {
    name = `[@${cleanUsername}]_${cleanId}`;
  }

  return `${name}.mp4`;
}

// Fetch video media from vxTwitter API
async function fetchFromVxTwitter(username, statusId) {
  const targetPath = `/${username || 'i'}/status/${statusId}`;
  const apiUrl = `https://api.vxtwitter.com${targetPath}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`vxTwitter responded with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('vxTwitter did not return JSON');
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.media_extended) || data.media_extended.length === 0) {
      throw new Error('No media found in vxTwitter response');
    }

    const videoMedia = data.media_extended.find(m => m.type === 'video' || m.type === 'gif');
    if (!videoMedia || !videoMedia.url) {
      throw new Error('No video or GIF media found in tweet');
    }

    return {
      videoUrl: videoMedia.url,
      username: data.user_screen_name || username || 'unknown',
      statusId: String(data.tweetID || statusId),
      date: formatDate(data.date),
      text: data.text || ''
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Fetch video media from FxTwitter API
async function fetchFromFxTwitter(username, statusId) {
  const apiUrl = `https://api.fxtwitter.com/${username || 'i'}/status/${statusId}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(apiUrl, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'X-Video-Downloader/2.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`FxTwitter responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.tweet) {
      throw new Error('Tweet not found in FxTwitter response');
    }

    const tweet = data.tweet;
    let videoUrl = null;

    if (tweet.media?.videos && tweet.media.videos.length > 0) {
      videoUrl = tweet.media.videos[0].url;
    } else if (tweet.media?.all && Array.isArray(tweet.media.all)) {
      const vid = tweet.media.all.find(m => m.type === 'video' || m.type === 'gif');
      if (vid) videoUrl = vid.url;
    }

    if (!videoUrl) {
      throw new Error('No video or GIF stream found in FxTwitter response');
    }

    return {
      videoUrl: videoUrl,
      username: tweet.author?.screen_name || username || 'unknown',
      statusId: String(tweet.id || statusId),
      date: formatDate(tweet.created_at || (tweet.created_timestamp ? tweet.created_timestamp * 1000 : null)),
      text: tweet.text || ''
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Main fetch coordinator with engine fallback
async function fetchTweetMedia(username, statusId, preferredApi) {
  let lastError = null;

  if (preferredApi === 'vxtwitter') {
    return await fetchFromVxTwitter(username, statusId);
  }

  if (preferredApi === 'fxtwitter') {
    return await fetchFromFxTwitter(username, statusId);
  }

  // Auto engine: Try vxTwitter first, fallback to FxTwitter
  try {
    return await fetchFromVxTwitter(username, statusId);
  } catch (err) {
    console.warn('vxTwitter fetch failed, trying FxTwitter fallback:', err.message);
    lastError = err;
  }

  try {
    return await fetchFromFxTwitter(username, statusId);
  } catch (err) {
    console.error('FxTwitter fallback also failed:', err.message);
    throw new Error(lastError ? `${lastError.message} | Fallback: ${err.message}` : err.message);
  }
}

// Parse status ID and username from tweet URL or pathname
function parseTweetUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const pathname = url.pathname;

    const statusMatch = pathname.match(/(?:status|statuses)\/(\d+)/i);
    const statusId = statusMatch ? statusMatch[1] : null;

    const userMatch = pathname.match(/^\/([A-Za-z0-9_]+)\/(?:status|statuses)/i);
    const username = (userMatch && userMatch[1].toLowerCase() !== 'i') ? userMatch[1] : null;

    return { username, statusId };
  } catch (e) {
    const match = String(rawUrl).match(/(\d{10,})/);
    return { username: null, statusId: match ? match[1] : null };
  }
}

// Message listener for downloads
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadVideo') {
    handleDownload(request.url)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => {
        console.error('Download error:', error);
        sendResponse({ success: false, error: error.message || 'Download failed' });
      });
    return true; // Keep message channel open for async response
  }
});

async function handleDownload(tweetUrl) {
  if (!tweetUrl) {
    throw new Error('No tweet URL provided');
  }

  const { username, statusId } = parseTweetUrl(tweetUrl);
  if (!statusId) {
    throw new Error('Could not identify a valid Tweet ID from URL');
  }

  // Load user settings
  const settings = await new Promise(resolve => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, items => resolve(items));
  });

  // Fetch video data from preferred or fallback API
  const meta = await fetchTweetMedia(username, statusId, settings.preferredApi);

  // Build target folder path
  const folderParts = [];
  if (settings.downloadFolder && settings.downloadFolder.trim()) {
    const cleanFolder = settings.downloadFolder
      .split(/[\\/]+/)
      .map(part => sanitizePathSegment(part))
      .filter(Boolean)
      .join('/');
    if (cleanFolder) folderParts.push(cleanFolder);
  }

  if (settings.organizeByAuthor) {
    const authorFolder = sanitizePathSegment(meta.username || username || 'unknown');
    if (authorFolder) folderParts.push(authorFolder);
  }

  const fileName = generateFilename(settings.filenameTemplate, meta);
  const finalFilename = folderParts.length > 0 ? `${folderParts.join('/')}/${fileName}` : fileName;

  // Trigger Chrome download
  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url: meta.videoUrl,
      filename: finalFilename,
      saveAs: Boolean(settings.saveAs)
    }, downloadId => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (downloadId === undefined) {
        return reject(new Error('Download failed to start'));
      }
      resolve({ downloadId, filename: finalFilename });
    });
  });
}