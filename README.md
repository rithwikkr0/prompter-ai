# Prompter AI ✨

> **AI-powered prompt engineering assistant** — enhances prompts directly inside Google Gemini, ChatGPT, Claude, Perplexity, Copilot, and Grok.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white)](https://github.com/rithwikkr0/prompter-ai)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=flat&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Built with React](https://img.shields.io/badge/Built%20with-React%20%2B%20TypeScript-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Google Builder Series 2026](https://img.shields.io/badge/Google%20Builder%20Series-2026-FBBC05?style=flat&logo=google&logoColor=white)](https://github.com/rithwikkr0/prompter-ai)

---

## 🌟 Features

| Feature | Description |
|---|---|
| **✨ One-click Enhancement** | Floating button on every supported AI platform |
| **🔄 Smart Rewrite** | Completely rewrites prompts for clarity and effectiveness |
| **🔍 Quality Analysis** | Scores your prompts 0–100 with specific improvement suggestions |
| **📋 Diff Preview** | See original vs enhanced side-by-side before accepting |
| **⌨️ Keyboard Shortcut** | `Ctrl+Shift+E` to trigger from anywhere |
| **🖱️ Context Menu** | Right-click on any text → Enhance / Rewrite / Analyze / Summarize |
| **📜 History** | All enhancements saved locally with search & filter |
| **🗂️ Templates** | 12+ categories of pre-built prompts |
| **🌙 Dark Mode** | Glassmorphism UI with system/light/dark themes |
| **🔒 Private** | API key stored locally, never leaves your device |

### Supported AI Platforms

| Platform | URL |
|---|---|
| 🔵 Google Gemini | gemini.google.com |
| 🟢 ChatGPT | chat.openai.com / chatgpt.com |
| 🟠 Claude | claude.ai |
| 🟣 Perplexity | perplexity.ai |
| 🔷 Microsoft Copilot | copilot.microsoft.com |
| 🐦 Grok | grok.com / x.com |

---

## 🚀 Quick Install (Developer Mode)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/rithwikkr0/prompter-ai.git
cd prompter-ai
```

### Step 2 — Install Dependencies

```bash
npm install
```

### Step 3 — Build the Extension

```bash
npm run build
```

This will:
1. Compile TypeScript + React with Vite
2. Output to `dist/`
3. Copy compiled assets into `extension/assets/`

### Step 4 — Load into Chrome

1. Open **Chrome** → go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the **`extension/`** folder from this project

> ✅ The Prompter AI icon will appear in your Chrome toolbar!

### Step 5 — Configure Your API Key

1. Click the Prompter AI icon in the toolbar
2. Complete the **onboarding wizard** (only on first launch)
3. Enter your **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
4. Click **Test & Save**

---

## 📥 Direct Download

> **[⬇️ Download prompter-ai-extension.zip](https://github.com/rithwikkr0/prompter-ai/releases/latest)**

After downloading:
1. Unzip the file
2. Open `chrome://extensions/` → Developer mode ON
3. **Load unpacked** → select the unzipped `extension/` folder

---

## 🎯 How to Use

### Method 1: Floating Button
1. Navigate to any supported AI platform (Gemini, ChatGPT, Claude, etc.)
2. Type your prompt in the input box
3. Click the **✨ button** (bottom-right corner)
4. Review the diff preview → click **"Use Enhanced"**

### Method 2: Right-Click Menu
1. Select / write text in any AI input
2. Right-click → choose from:
   - **✨ Enhance Prompt** — Full prompt engineering
   - **🔄 Rewrite Prompt** — Complete rewrite for clarity
   - **🔍 Analyze Prompt Quality** — Score + suggestions
   - **📝 Summarize for AI** — Concise AI-optimized version

### Method 3: Keyboard Shortcut
- Press `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)
- Works on any supported page with text in the input

---

## 🛠️ Developer Setup

```bash
# Clone
git clone https://github.com/rithwikkr0/prompter-ai.git
cd prompter-ai

# Install
npm install

# Development (web preview)
npm run dev
# → Opens at http://localhost:5173/

# Production build for extension
npm run build
# → Compiled extension ready in extension/

# Lint
npm run lint
```

### Project Structure

```
prompter-ai/
├── extension/           # Chrome Extension (load this folder)
│   ├── manifest.json    # MV3 manifest
│   ├── background.js    # Service worker (API relay, history, badge)
│   ├── content.js       # Injected into AI platforms (floating widget)
│   ├── popup.html       # Extension popup entry point
│   ├── icons/           # Icon set (16, 32, 48, 128px)
│   └── assets/          # Compiled React app (JS + CSS)
├── src/                 # React + TypeScript source
│   ├── pages/           # Dashboard, History, Templates, Settings, About, Onboarding
│   ├── components/      # Layout, PromptInput, ResultsPanel, etc.
│   ├── ai/gemini.ts     # Gemini AI SDK integration
│   ├── storage/         # chrome.storage / localStorage abstraction
│   └── types/           # Zod schemas + TypeScript types
├── scripts/
│   └── copy-assets.js   # Post-build: copies dist/ → extension/assets/
└── vite.config.ts       # Vite build config
```

---

## 🔑 Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the key and paste it in Prompter AI Settings

> 🆓 The free tier includes generous limits for personal use.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+E` | Enhance current prompt |
| `Cmd+Shift+E` | Enhance (Mac) |

**Customize shortcuts:** Open `chrome://extensions/shortcuts` in Chrome.

---

## 🔒 Privacy & Security

- **API keys** are stored in `chrome.storage.local` — **never transmitted** to any server other than Google's own Gemini API
- **History** is stored locally in your browser
- **No analytics**, no tracking, no accounts required
- Source code is fully open source — audit it yourself

---

## 🏗️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + Glassmorphism design
- **Animations**: Framer Motion 12
- **AI**: Google Generative AI SDK (Gemini 2.5 Flash)
- **Schema Validation**: Zod 4
- **Extension**: Chrome Manifest V3

---

## 📋 Changelog

### v1.0.0 (July 2026)
- ✅ Initial release — Google Builder Series 2026
- ✅ Support for 6 AI platforms
- ✅ Floating widget with Enhance / Rewrite / Analyze
- ✅ Diff preview modal before inserting text
- ✅ Background service worker for CORS-free API calls
- ✅ Persistent history with search + favorites
- ✅ 12+ prompt templates across 12 categories
- ✅ Onboarding wizard for first-time setup
- ✅ Dark glassmorphism UI

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

```bash
# Fork & clone
git checkout -b feature/my-feature
git commit -m "Add my feature"
git push origin feature/my-feature
# Open a Pull Request
```

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
  <strong>Built for Google Builder Series 2026</strong><br/>
  Made with ✨ by <a href="https://github.com/rithwikkr0">@rithwikkr0</a>
</div>
