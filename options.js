// Default preferences
const DEFAULT_PREFERENCES = {
  downloadFolder: 'twitter_download',
  filenameTemplate: '[@{username}] {id}',
  organizeByAuthor: false,
  saveAs: false,
  preferredApi: 'auto'
};

// Sample mock data for real-time preview
const MOCK_META = {
  username: 'jack',
  statusId: '20',
  date: new Date().toISOString().slice(0, 10),
  text: 'just setting up my twttr'
};

const folderInput = document.getElementById('downloadFolder');
const organizeAuthorToggle = document.getElementById('organizeByAuthor');
const templateInput = document.getElementById('filenameTemplate');
const apiSelect = document.getElementById('preferredApi');
const saveAsToggle = document.getElementById('saveAs');
const previewEl = document.getElementById('previewFilename');
const statusMsg = document.getElementById('statusMsg');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const presetChips = document.querySelectorAll('.chip');
const tagItems = document.querySelectorAll('.tag-item');

// Update preview filename display
function updatePreview() {
  const folder = folderInput.value.trim().replace(/[\\/]+$/, '');
  const byAuthor = organizeAuthorToggle.checked;
  let template = templateInput.value.trim() || '[@{username}] {id}';

  let filename = template
    .replace(/\{username\}/gi, MOCK_META.username)
    .replace(/\{id\}/gi, MOCK_META.statusId)
    .replace(/\{date\}/gi, MOCK_META.date)
    .replace(/\{text\}/gi, 'just_setting_up_my');

  // Strip invalid chars
  filename = filename.replace(/[<>:"/\\|?*]/g, '_').trim();
  if (!filename) filename = `[@${MOCK_META.username}]_${MOCK_META.statusId}`;
  filename += '.mp4';

  const parts = [];
  if (folder) parts.push(folder);
  if (byAuthor) parts.push(MOCK_META.username);
  parts.push(filename);

  previewEl.textContent = parts.join('/');

  // Highlight active preset chip if match
  presetChips.forEach(chip => {
    if (chip.getAttribute('data-preset') === templateInput.value.trim()) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

// Load settings on startup
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(DEFAULT_PREFERENCES, (items) => {
    folderInput.value = items.downloadFolder;
    organizeAuthorToggle.checked = Boolean(items.organizeByAuthor);
    templateInput.value = items.filenameTemplate;
    apiSelect.value = items.preferredApi || 'auto';
    saveAsToggle.checked = Boolean(items.saveAs);

    updatePreview();
  });
});

// Real-time input listeners
folderInput.addEventListener('input', updatePreview);
organizeAuthorToggle.addEventListener('change', updatePreview);
templateInput.addEventListener('input', updatePreview);

// Preset chips
presetChips.forEach(chip => {
  chip.addEventListener('click', () => {
    templateInput.value = chip.getAttribute('data-preset');
    updatePreview();
  });
});

// Clickable placeholder tags to insert into input
tagItems.forEach(tag => {
  tag.addEventListener('click', () => {
    const textToInsert = tag.getAttribute('data-tag');
    const start = templateInput.selectionStart || templateInput.value.length;
    const end = templateInput.selectionEnd || templateInput.value.length;
    const current = templateInput.value;
    templateInput.value = current.substring(0, start) + textToInsert + current.substring(end);
    templateInput.focus();
    templateInput.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    updatePreview();
  });
});

// Save settings
saveBtn.addEventListener('click', () => {
  let folder = folderInput.value.trim();

  // Normalize slashes
  folder = folder.replace(/^[\\/]+|[\\/]+$/g, '');

  const newSettings = {
    downloadFolder: folder,
    organizeByAuthor: organizeAuthorToggle.checked,
    filenameTemplate: templateInput.value.trim() || DEFAULT_PREFERENCES.filenameTemplate,
    preferredApi: apiSelect.value,
    saveAs: saveAsToggle.checked
  };

  chrome.storage.sync.set(newSettings, () => {
    statusMsg.textContent = 'Preferences saved!';
    statusMsg.style.color = 'var(--success)';
    statusMsg.classList.add('visible');

    setTimeout(() => {
      statusMsg.classList.remove('visible');
    }, 2400);
  });
});

// Reset defaults
resetBtn.addEventListener('click', () => {
  folderInput.value = DEFAULT_PREFERENCES.downloadFolder;
  organizeAuthorToggle.checked = DEFAULT_PREFERENCES.organizeByAuthor;
  templateInput.value = DEFAULT_PREFERENCES.filenameTemplate;
  apiSelect.value = DEFAULT_PREFERENCES.preferredApi;
  saveAsToggle.checked = DEFAULT_PREFERENCES.saveAs;

  updatePreview();

  statusMsg.textContent = 'Reset to defaults (click Save to apply)';
  statusMsg.style.color = 'var(--accent)';
  statusMsg.classList.add('visible');

  setTimeout(() => {
    statusMsg.classList.remove('visible');
  }, 2400);
});