/**
 * X Video Downloader - Content Script
 * Injects a native-feeling download button into Twitter/X action bars.
 * Supports timeline feeds, status pages, quote tweets, and full-screen media modals.
 */

(function () {
  'use strict';

  // Prevent multiple injections of content script
  if (window.__X_VIDEO_DL_INJECTED__) return;
  window.__X_VIDEO_DL_INJECTED__ = true;

  // Inject unified stylesheet for high-performance animations and native aesthetics
  function injectStyles() {
    if (document.getElementById('x-video-dl-styles')) return;

    const style = document.createElement('style');
    style.id = 'x-video-dl-styles';
    style.textContent = `
      .x-dl-btn-container {
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
        user-select: none;
      }

      .x-dl-icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34.75px;
        height: 34.75px;
        border-radius: 9999px;
        cursor: pointer;
        color: rgb(113, 118, 123);
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
      }

      .x-dl-icon-button:hover:not([disabled]) {
        color: rgb(29, 155, 240);
        background-color: rgba(29, 155, 240, 0.1);
      }

      .x-dl-icon-button:active:not([disabled]) {
        transform: scale(0.92);
      }

      .x-dl-icon-button[disabled] {
        cursor: default;
      }

      .x-dl-icon-button.is-loading {
        color: #f5a623 !important;
        background-color: rgba(245, 166, 35, 0.1) !important;
        cursor: wait !important;
      }

      .x-dl-icon-button.is-success {
        color: #00ba7c !important;
        background-color: rgba(0, 186, 124, 0.1) !important;
        animation: x-dl-pop 0.35s ease;
      }

      .x-dl-icon-button.is-error {
        color: #f4212e !important;
        background-color: rgba(244, 33, 46, 0.1) !important;
        animation: x-dl-shake 0.4s ease;
      }

      .x-dl-spinner {
        transform-origin: center;
        animation: x-dl-spin 0.9s linear infinite;
      }

      @keyframes x-dl-spin {
        100% { transform: rotate(360deg); }
      }

      @keyframes x-dl-pop {
        0% { transform: scale(0.8); }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }

      @keyframes x-dl-shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-3px); }
        40%, 80% { transform: translateX(3px); }
      }

      /* Notification toast */
      .x-dl-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: #1d9bf0;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        padding: 10px 20px;
        border-radius: 9999px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        z-index: 999999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease, transform 0.25s ease;
      }

      .x-dl-toast.is-visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      .x-dl-toast.is-error {
        background: #f4212e;
      }

      .x-dl-toast.is-success {
        background: #00ba7c;
      }
    `;
    document.head.appendChild(style);
  }

  // Toast notification helper
  let activeToastTimeout = null;
  function showToast(message, type = 'info') {
    let toast = document.getElementById('x-dl-global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'x-dl-global-toast';
      toast.className = 'x-dl-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `x-dl-toast is-${type} is-visible`;

    if (activeToastTimeout) clearTimeout(activeToastTimeout);
    activeToastTimeout = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3500);
  }

  // SVG Icon Templates
  const SVG_ICONS = {
    download: `
      <svg viewBox="0 0 24 24" width="18.75" height="18.75" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    `,
    loading: `
      <svg viewBox="0 0 24 24" width="18.75" height="18.75" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="x-dl-spinner" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25" stroke="currentColor"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"/>
      </svg>
    `,
    success: `
      <svg viewBox="0 0 24 24" width="18.75" height="18.75" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `,
    error: `
      <svg viewBox="0 0 24 24" width="18.75" height="18.75" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    `
  };

  // Find exact permalink for a tweet (handles feeds, quote tweets, and modals)
  function getTweetUrl(container) {
    // 1. If in modal/dialog, check if window URL is the video status
    if (window.location.pathname.includes('/status/')) {
      const match = window.location.pathname.match(/(?:x\.com|twitter\.com)?\/[^/]+\/status\/\d+/i);
      if (match) {
        return window.location.origin + match[0];
      }
    }

    if (container) {
      // 2. Primary timestamp link (excludes quote tweets)
      const timeElements = container.querySelectorAll('time');
      for (const timeEl of timeElements) {
        if (!timeEl.closest('[data-testid="quoteTweet"]')) {
          const anchor = timeEl.closest('a');
          if (anchor && anchor.href && anchor.href.includes('/status/')) {
            return anchor.href;
          }
        }
      }

      // 3. Any status permalink not inside a quote tweet
      const statusLinks = container.querySelectorAll('a[href*="/status/"]');
      for (const link of statusLinks) {
        if (!link.closest('[data-testid="quoteTweet"]') && !link.closest('[data-testid="tweetPhoto"]')) {
          return link.href;
        }
      }

      if (statusLinks.length > 0) {
        return statusLinks[0].href;
      }
    }

    return window.location.href;
  }

  // Attach download button to a video element's associated action bar
  function addDownloadButtonToVideo(video) {
    if (!video || !document.contains(video)) return;

    // Find parent container: article, modal dialog, or cell
    const container = video.closest('article') ||
                          video.closest('div[aria-modal="true"]') ||
                          video.closest('div[role="dialog"]');
    if (!container) return;

    // Find Twitter's action bar: div[role="group"]
    const actionBar = container.querySelector('div[role="group"]');
    if (!actionBar) return;

    // Avoid duplicate buttons in this action bar
    if (actionBar.querySelector('.x-dl-btn-container')) return;

    // Create wrapper matching Twitter's action items
    const btnContainer = document.createElement('div');
    btnContainer.className = 'x-dl-btn-container';

    const button = document.createElement('button');
    button.className = 'x-dl-icon-button';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Download Video');
    button.setAttribute('title', 'Download Video');
    button.innerHTML = SVG_ICONS.download;

    btnContainer.appendChild(button);

    // Place before Share or Bookmark button if available, or append cleanly
    const bookmarkOrShare = actionBar.querySelector('[data-testid="bookmark"], [data-testid="share"], [aria-label*="Share"], [aria-label*="Bookmark"]');
    const directChild = bookmarkOrShare ? bookmarkOrShare.closest('div[role="group"] > div') : null;

    if (directChild && directChild.parentElement === actionBar) {
      actionBar.insertBefore(btnContainer, directChild);
    } else {
      actionBar.appendChild(btnContainer);
    }

    // Click handling
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (button.disabled) return;

      const tweetUrl = getTweetUrl(container);
      if (!tweetUrl || !tweetUrl.includes('/status/')) {
        showToast('Could not find tweet link', 'error');
        return;
      }

      // Enter Loading State
      button.disabled = true;
      button.className = 'x-dl-icon-button is-loading';
      button.setAttribute('title', 'Fetching video link...');
      button.innerHTML = SVG_ICONS.loading;

      chrome.runtime.sendMessage({ action: 'downloadVideo', url: tweetUrl }, (response) => {
        // Handle runtime connection issues
        if (chrome.runtime.lastError) {
          console.error('X Video DL:', chrome.runtime.lastError.message);
          setButtonState('error', 'Extension error: ' + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          setButtonState('success', 'Downloading started!');
          showToast('Downloading video...', 'success');
        } else {
          const errMsg = response?.error || 'Failed to fetch video';
          console.warn('X Video DL failure:', errMsg);
          setButtonState('error', errMsg);
          showToast(errMsg, 'error');
        }
      });

      function setButtonState(state, tooltipText) {
        if (state === 'success') {
          button.className = 'x-dl-icon-button is-success';
          button.innerHTML = SVG_ICONS.success;
          button.setAttribute('title', tooltipText || 'Downloaded!');
        } else {
          button.className = 'x-dl-icon-button is-error';
          button.innerHTML = SVG_ICONS.error;
          button.setAttribute('title', tooltipText || 'Error downloading');
        }

        // Reset to normal state after delay
        setTimeout(() => {
          button.disabled = false;
          button.className = 'x-dl-icon-button';
          button.innerHTML = SVG_ICONS.download;
          button.setAttribute('title', 'Download Video');
        }, 3200);
      }
    });
  }

  // Scan and attach buttons to all visible videos
  function scanVideos() {
    document.querySelectorAll('video').forEach(addDownloadButtonToVideo);
  }

  // Initialize
  injectStyles();
  scanVideos();

  // Watch for dynamic timeline additions / lazy loading
  let debounceTimeout = null;
  const observer = new MutationObserver((mutations) => {
    let hasVideoCandidate = false;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          if (node.tagName === 'VIDEO' || (node.querySelector && node.querySelector('video'))) {
            hasVideoCandidate = true;
            break;
          }
        }
      }
      if (hasVideoCandidate) break;
    }

    if (hasVideoCandidate) {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(scanVideos, 150);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();