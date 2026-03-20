chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadVideo') {
    
    const urlObj = new URL(request.url);
    const apiUrl = `https://api.vxtwitter.com${urlObj.pathname}`;

    const twitterUsername = urlObj.pathname.split('/')[1];
    const twitterStatusId = urlObj.pathname.split('/')[3];
    
    fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data && data.media_extended && data.media_extended.length > 0) {
        
        const videoMedia = data.media_extended.find(m => m.type === 'video' || m.type === 'gif');
        
        if (videoMedia && videoMedia.url) {
          
          // --- NEW: Get the custom folder name from storage ---
          chrome.storage.sync.get({ downloadFolder: 'twitter_download' }, (items) => {
            let folderPath = items.downloadFolder;
            
            // Format the path correctly based on user input
            if (folderPath !== "") {
              folderPath += "/"; // Add slash if they specified a folder
            }

            const finalFilename = `${folderPath}[@${twitterUsername}]${twitterStatusId}.mp4`;
            
            chrome.downloads.download({ 
              url: videoMedia.url, 
              filename: finalFilename 
            });
            
            // Notify content.js of success
            sendResponse({ success: true });
          });
          // ---------------------------------------------------

        } else {
          console.error("No video found in this Tweet.");
          sendResponse({ success: false });
        }

      } else {
        console.error("API did not return valid media.", data);
        sendResponse({ success: false });
      }
    })
    .catch(error => {
      console.error("Error communicating with the API:", error);
      sendResponse({ success: false });
    });
    
    return true; 
  }
});