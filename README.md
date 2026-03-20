# X Video Downloader

A lightweight Chrome extension that seamlessly integrates a download button into X (formerly Twitter) to easily save videos. It securely uses the vxTwitter API to fetch and download the direct video links.

## Features

* **Native UI Integration:** Injects a download icon directly into the tweet's action bar (right next to the Share button). It perfectly matches X's default styling, including hover effects and colors.
* **Custom Save Location:** Includes a dedicated options page allowing you to specify a custom subfolder within your browser's default Downloads directory.
* **Real-time Visual Feedback:** The button provides immediate visual cues—turning orange with a spinner while loading, and green with a checkmark upon a successful download.


## Download & Install

1. **[Click here to download x-video-dl.zip](https://github.com/zhengheetong/x-video-dl/raw/refs/heads/main/x-video-dl.zip)**
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Turn on **Developer mode** using the toggle in the top right corner.
4. Simply drag and drop the downloaded `.zip` file anywhere onto that page to install it instantly.


## Screenshot

![X Video Downloader Action Bar](action_bar.png)
*The download button seamlessly integrates into the native X action bar.*

## Usage

1. Browse X.com as you normally would.
2. When you see a tweet containing a video, look at the action bar beneath the tweet (where the Reply, Repost, and Like buttons are located).
3. Click the new download icon.
4. The video will automatically be saved as an `.mp4` file in your specified downloads folder.

## Configuration

To change the specific folder where your videos are saved:

1. Go to `chrome://extensions/`.
2. Locate the **X Video Downloader** extension.
3. Click **Details**, then scroll down and click **Extension options**.
4. Enter your preferred folder name (e.g., `Memes` or `X_Videos`) and click **Save**. Leave it blank to save directly to the root of your Downloads folder.
