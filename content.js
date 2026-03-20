// The default download icon
function getDownloadIconSVG() {
  return `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="7 10 12 15 17 10"/>
  <line x1="12" y1="15" x2="12" y2="3"/>
</svg>`;
}

// A spinning loading icon
function getLoadingIconSVG() {
  return `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <style>
    .spin { transform-origin: center; animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  </style>
  <path class="spin" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/>
</svg>`;
}

// A success checkmark icon
function getSuccessIconSVG() {
  return `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"/>
</svg>`;
}

function addDownloadButtonToVideo(video) {
  // 1. Find the parent Tweet (article)
  const article = video.closest('article');
  if (!article) return;

  // 2. Find the action bar at the bottom of the tweet
  // Twitter uses role="group" for the container holding Reply/Repost/Like/Share
  const actionBar = article.querySelector('div[role="group"]');
  if (!actionBar) return;

  // Prevent adding multiple buttons to the same tweet
  if (actionBar.querySelector('.custom-download-btn-group')) return;

  // Get the tweet URL
  let tweetUrl = window.location.href;
  const timeLink = article.querySelector('a[href*="/status/"]');
  if (timeLink) tweetUrl = timeLink.href;

  // 3. Create a container that mimics Twitter's action button layout
  const downloadBtnContainer = document.createElement('div');
  downloadBtnContainer.className = 'custom-download-btn-group';
  downloadBtnContainer.style.display = 'flex';
  downloadBtnContainer.style.alignItems = 'center';
  downloadBtnContainer.style.justifyContent = 'center';
  downloadBtnContainer.style.cursor = 'pointer';
  downloadBtnContainer.style.padding = '0 8px'; 
  downloadBtnContainer.style.color = '#71767b'; // Twitter's default unselected gray
  downloadBtnContainer.style.transition = 'color 0.2s';
  downloadBtnContainer.title = "Download Video";

  // Hover effects to match Twitter's UI (turning blue)
  downloadBtnContainer.onmouseover = () => { downloadBtnContainer.style.color = '#1d9bf0'; };
  downloadBtnContainer.onmouseout = () => { downloadBtnContainer.style.color = '#71767b'; };

  // Create the inner icon wrapper
  const iconWrapper = document.createElement('div');
  iconWrapper.style.width = '18.5px'; // Matches standard Twitter icon size
  iconWrapper.style.height = '18.5px';
  iconWrapper.innerHTML = getDownloadIconSVG();
  downloadBtnContainer.appendChild(iconWrapper);

  // 4. Append right next to the share button
  actionBar.appendChild(downloadBtnContainer);

  // 5. Click Handling Logic
  downloadBtnContainer.addEventListener('click', (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    // Loading State
    iconWrapper.innerHTML = getLoadingIconSVG();
    downloadBtnContainer.style.color = '#f5a623'; // Orange
    
    // Disable hover effect while processing
    downloadBtnContainer.onmouseout = null; 

    // Send to background.js
    chrome.runtime.sendMessage({ action: 'downloadVideo', url: tweetUrl }, (response) => {
      
      if (response && response.success) {
        // Success State
        iconWrapper.innerHTML = getSuccessIconSVG();
        downloadBtnContainer.style.color = '#00ba7c'; // Twitter green
      } else {
        // Error State
        iconWrapper.innerHTML = getDownloadIconSVG();
        downloadBtnContainer.style.color = '#f4212e'; // Twitter red
      }

      // Reset back to normal after 3 seconds
      setTimeout(() => {
        iconWrapper.innerHTML = getDownloadIconSVG();
        downloadBtnContainer.style.color = '#71767b'; 
        // Restore hover effects
        downloadBtnContainer.onmouseout = () => { downloadBtnContainer.style.color = '#71767b'; };
      }, 3000);

    });
  });
}

// Initial check for videos on the page
document.querySelectorAll('video').forEach(addDownloadButtonToVideo);

// MutationObserver to watch for new videos as the user scrolls
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // ELEMENT_NODE
        if (node.tagName === 'VIDEO') {
          addDownloadButtonToVideo(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('video').forEach(addDownloadButtonToVideo);
        }
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });