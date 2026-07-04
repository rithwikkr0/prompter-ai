# Prompter AI

**Prompter AI** is an intelligent prompt engineering assistant that helps you write high-quality prompts for any AI model. Available as a **Chrome Extension** and a **Progressive Web App (PWA)**, it analyzes prompt quality, scores it, detects user intent, identifies missing details, and outputs optimized prompts using the Google Gemini API.

---

## ✨ Features

- **Prompt Quality Score**: Objective 0–100 quality indicator with custom visual progress tracking.
- **Intent Detection**: Automatic intent category classification with model-specific tuning.
- **Context Gap Analyzer**: Identifies key missing details (audience, constraint, output format, role).
- **Explanation Panel**: Understand exactly what modifications were made and why.
- **Editable Templates**: Over 12 pre-built expert templates across a wide array of domains (Coding, Research, Marketing, etc.).
- **Local Persistence**: Stores your settings (API Key) and complete prompt history safely inside your browser.
- **In-Site Extension Injection**: Floating control overlay on all major AI hubs (Google Gemini, ChatGPT, Claude, Perplexity, Microsoft Copilot, Grok).
- **Glassmorphic UI**: High-contrast, responsive modern dashboard supporting Light, System, and Dark modes.

---

## 🚀 Getting Started

### 1. Run the Web Interface
Clone the repository, install dependencies, and start the development server:

```bash
npm install
npm run dev
```
Open **http://localhost:5173/** in your browser.

### 2. Install the Chrome Extension
1. Compile the React app:
   ```bash
   npm run build
   ```
2. Unpack and load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions`.
   - Enable **Developer mode** (toggle in the top-right corner).
   - Click **Load unpacked** and select the `/extension` directory of this project.
   - Click the extensions puzzle icon, pin **Prompter AI**, and click to launch.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + React Router v7
- **Bundler**: Vite 8
- **AI Core**: Google Gemini API SDK (`@google/generative-ai`)
- **Styling**: Tailwind CSS v4 + Pure Glassmorphic Utilities
- **Animations**: Framer Motion
- **Persistence**: unified storage wrapper (chrome.storage vs localStorage)
- **Validation**: Zod + React Hook Form

---

## 🔒 Privacy & Safety
Prompter AI does not collect or transmit your prompts. Your Google Gemini API Key is stored safely on your local device (`chrome.storage.local` or `localStorage`) and is only used to establish connection with Google's API endpoints.
