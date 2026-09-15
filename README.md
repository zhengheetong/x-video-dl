# X Video Downloader (v2.0)

A lightweight, powerful Chrome extension that seamlessly integrates a native download button into X (formerly Twitter) to save videos and GIFs in top quality. It uses an intelligent dual-engine API (vxTwitter + FxTwitter fallback) to guarantee fast and reliable downloads.

## Features

* **Native Action Bar Integration:** Injects a download button directly into the tweet's action bar (next to Bookmark and Share). Includes X's circular hover backdrop, micro-animations, tooltips, and non-intrusive status toast alerts.
* **Dual-Engine Reliability:** Automatically attempts fetching media via vxTwitter and transparently falls back to FxTwitter if the primary API is rate-limited, unavailable, or down.
* **Full Context Support:** Works across timeline feeds, single tweet status pages, quote tweets, and full-screen media viewer / lightbox modals.
* **Custom Filename Formatting:** Flexible filename templating with live preview. Customize naming using dynamic tokens like `{username}`, `{id}`, `{date}`, and `{text}`.
* **Smart Organization:** Organize videos into custom subfolders or automatically group them by author (`twitter_download/{username}/`).
* **Filesystem Safe:** Automatically sanitizes filenames and directories across Windows, macOS, and Linux to prevent illegal character errors.
* **Dark-Themed Options UI:** Sleek settings interface matching X's aesthetic with preset chips, live filename preview, and quick access via the extension toolbar icon.

---

## Download & Install

1. **[Click here to download x-video-dl.zip](https://github.com/zhengheetong/x-video-dl/raw/refs/heads/main/x-video-dl.zip)**
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Drag and drop the downloaded `.zip` file anywhere onto the extensions page, or extract it and click **Load unpacked**.

---

## Screenshot

![X Video Downloader Action Bar](action_bar.png)
*The download button seamlessly integrates into the native X action bar.*

---

## Usage

1. Browse X.com (or Twitter.com) as you normally would.
2. Whenever you see a tweet with a video or GIF, locate the download icon in the tweet action bar (or in the full-screen media viewer).
3. Click the download icon:
   * **Orange spinner:** Fetching video stream and initializing download.
   * **Green checkmark + Toast:** Download successfully initiated.
   * **Red indicator + Toast:** Clearly alerts you if a tweet is private, deleted, or missing media.
4. The media file is automatically saved as an `.mp4` into your configured download folder.

---

## Configuration & Options

To open settings:
* Click the **X Video Downloader** icon in your browser's toolbar, or
* Go to `chrome://extensions/` > **X Video Downloader** > **Details** > **Extension options**.

### Configurable Settings
* **Base Folder:** Subfolder inside your default Downloads folder (e.g., `twitter_download` or leave blank for root).
* **Organize by Creator:** Toggle automatic creation of `@username` subfolders.
* **Filename Template:** Choose a preset or define custom patterns:
  * `[@{username}] {id}` *(Default)*
  * `{username}_{date}_{id}` *(Timestamped)*
  * `{username}-{id}` *(Minimal)*
  * `{text}_{id}` *(Snippet)*
  * Available tokens: `{username}`, `{id}`, `{date}`, `{text}`.
* **API Engine:** Choose between **Auto Fallback** (Recommended), **vxTwitter only**, or **FxTwitter only**.
* **Always Ask Where to Save:** Toggle Chrome's native "Save As" file picker.
