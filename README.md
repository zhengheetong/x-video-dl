# X Video Downloader

A lightweight Chrome extension that seamlessly integrates a download button into X (formerly Twitter) to easily save videos. It securely uses the vxTwitter API to fetch and download the direct video links.

## Features

* **Native UI Integration:** Injects a download icon directly into the tweet's action bar (right next to the Share button). It perfectly matches X's default styling, including hover effects and colors.
* **Custom Save Location:** Includes a dedicated options page allowing you to specify a custom subfolder within your browser's default Downloads directory.
* **Real-time Visual Feedback:** The button provides immediate visual cues—turning orange with a spinner while loading, and green with a checkmark upon a successful download.

## Installation

You can install this extension locally in Google Chrome:

1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** on in the top right corner of the page.
4. Click the **Load unpacked** button in the top left.
5. Select the folder containing the extension files (the folder containing the `manifest.json` file).

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