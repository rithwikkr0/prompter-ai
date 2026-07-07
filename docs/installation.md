---
layout: default
title: Installation Guide
---

# Installation Guide 🚀

Prompter AI is distributed as a developer-loadable Chrome Extension directory. Follow these steps to build and load it.

## Method 1: Load from Source (Recommended)

To run the latest version of Prompter AI built directly from source:

### Step 1: Clone the Repository
```bash
git clone https://github.com/rithwikkr0/prompter-ai.git
cd prompter-ai
```

### Step 2: Install Development Dependencies
Ensure you have Node.js (v18+) installed.
```bash
npm install
```

### Step 3: Build the Extension
Run the Vite compiler script:
```bash
npm run build
```
This compiles the React SPA popup and copies built bundles into the `/extension/assets` directory.

### Step 4: Load into Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`
2. Toggle the **Developer mode** switch in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the `extension/` folder inside your cloned repository.

---

## Method 2: Download Release ZIP

If you want to use a pre-packaged release without cloning code:

1. Download the latest `Prompter-AI-v2.0.0.zip` file from the repository [Releases section](https://github.com/rithwikkr0/prompter-ai/releases).
2. Unzip the file locally.
3. Open `chrome://extensions/` and toggle **Developer Mode** on.
4. Click **Load unpacked** and select the unzipped directory containing `manifest.json`.

---

## Troubleshooting Common Issues

### 1. "Manifest is missing or unreadable"
Make sure you chose the `extension/` subfolder when loading, not the root project folder. The root folder contains the React source code, while the subfolder contains the compiled extension manifest.

### 2. Widget does not show up on ChatGPT or Gemini
- Ensure you reload the AI chat page once after loading the extension.
- Verify the extension has site access by clicking the puzzle icon in the Chrome toolbar.
- If you are on an unsupported site, the widget remains hidden. Check settings for the supported URL list.
