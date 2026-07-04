# Prompter AI — AI-Powered Prompt Engineering Assistant

**Prompter AI** is an intelligent prompt engineering assistant that helps you write high-quality prompts for any AI model. Available as both a **Chrome Extension** and a **Progressive Web App (PWA)**, it analyzes prompt quality, scores it, detects user intent, identifies missing details, and outputs optimized prompts using the Google Gemini API.

---

## 📥 Direct Download & Quick Install (Chrome Extension)

If you just want to run the extension in Chrome without doing any development work:

1. **[Click here to download Prompter AI (.zip)](https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/archive/refs/heads/master.zip)** *(Note: Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name once uploaded)*.
2. Extract the downloaded `.zip` file to a folder on your computer.
3. Open Google Chrome and go to `chrome://extensions`.
4. Enable **Developer mode** using the toggle switch in the top-right corner.
5. Click the **Load unpacked** button in the top-left corner.
6. Select the **`extension`** folder inside your extracted folder.
7. Click the **puzzle piece icon** in the Chrome toolbar, pin **Prompter AI**, and launch it!

---

## 🚀 Developer Setup Guide (Web App & Custom Builds)

If you want to modify the source code, run the development server, or compile custom bundles:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 1. Install Dependencies
Navigate to the project root directory and install dependencies:
```bash
npm install
```

### 2. Start the Development Server
Launch the local development server to run Prompter AI as a web app:
```bash
npm run dev
```
Open **http://localhost:5173/** in your browser.

### 3. Build & Sync Assets for Chrome Extension
If you modify the source files in the `/src` folder, you must rebuild the bundle to update the Chrome Extension popup:
```bash
npm run build
```
*Note: Our automated build script (`scripts/copy-assets.js`) will run automatically on compile, copying and renaming the production assets directly into the `/extension/assets/` directory.*

After the build completes, go to `chrome://extensions` and click the **Reload icon** on the Prompter AI card.

---

## ✨ Features

- **Prompt Quality Score**: Objective 0–100 quality indicator with custom visual progress tracking.
- **Intent Detection**: Automatic intent category classification with model-specific tuning (21 categories supported).
- **Context Gap Analyzer**: Identifies key missing details (audience, tone, constraints, role).
- **Explanation Panel**: Understand exactly what modifications were made by the AI and why.
- **Editable Templates**: Over 12 pre-built expert templates across a wide array of domains (Coding, Research, Marketing, etc.).
- **Local Storage Isolation**: Stores your settings (API Key) and complete prompt history safely inside your browser.
- **In-Site Extension Injection**: Floating control overlay on all major AI hubs (Google Gemini, ChatGPT, Claude, Perplexity, Microsoft Copilot, Grok).
- **Glassmorphic UI**: High-contrast, responsive modern dashboard supporting Light, System, and Dark modes.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + React Router v7
- **Bundler**: Vite 8
- **AI Core**: Google Gemini API SDK (`@google/generative-ai`)
- **Styling**: Tailwind CSS v4 + Pure Glassmorphic Utilities
- **Animations**: Framer Motion
- **Persistence**: Unified storage wrapper (`chrome.storage.local` or `localStorage`)
- **Validation**: Zod + React Hook Form

---

## 🔒 Privacy & Safety
Prompter AI does not collect or transmit your prompts. Your Google Gemini API Key is stored safely on your local device (`chrome.storage.local` or `localStorage`) and is only used to establish connection with Google's API endpoints.
