// Load the saved folder name when the page opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({ downloadFolder: 'twitter_download' }, (items) => {
    document.getElementById('folderName').value = items.downloadFolder;
  });
});

// Save the folder name when the button is clicked
document.getElementById('saveBtn').addEventListener('click', () => {
  let folder = document.getElementById('folderName').value.trim();
  
  // Remove trailing slashes if the user typed them accidentally
  if (folder.endsWith('/') || folder.endsWith('\\')) {
    folder = folder.slice(0, -1);
  }

  chrome.storage.sync.set({ downloadFolder: folder }, () => {
    // Show a "Saved!" message
    const status = document.getElementById('status');
    status.textContent = 'Saved!';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
});