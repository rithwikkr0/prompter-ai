---
layout: default
title: Technical Architecture
---

# Technical Architecture 🏗️

This document describes the design, data flows, and security model of **Prompter AI v2.0**.

---

## Component Layout

```
                  +-----------------------------------------+
                  |               CHROME TABS               |
                  |  (Gemini, ChatGPT, Claude, Grok, etc.)  |
                  +--------------------+--------------------+
                                       |
                   Content Script      | [Injected Widget & Panel]
                   (content.js)        v
                  +-----------------------------------------+
                  |  - Floating Widget: Coordinates, drag   |
                  |  - Panel DOM & Style overlays           |
                  |  - Smart Interview: Scoring, question   |
                  |    options selection                    |
                  |  - DOM Context: Attachment extraction   |
                  +--------------------+--------------------+
                                       |
                     Chrome Messages   | [onMessage Channel]
                     (Local IPC)       v
                  +-----------------------------------------+
                  |  BACKGROUND SERVICE WORKER (background) |
                  |  - Fetch handlers & API routing         |
                  |  - Score evaluation logic               |
                  |  - History & Analytics storage dispatch |
                  +--------------------+--------------------+
                                       |
                   Direct HTTPS        | [No proxy server]
                   (CORS Bypass)       v
                  +-----------------------------------------+
                  |          AI API ENDPOINTS               |
                  |  (Gemini API, OpenAI API, Groq, etc.)   |
                  +-----------------------------------------+
```

---

## Code Breakdown

### 1. Injected Script (`extension/content.js`)
- Runs in the page context of supported hostnames.
- Handles mouse drag coordinate tracking, panel Slide-In toggle, and prompt textarea replacement.
- Utilizes `MutationObserver` on `document.documentElement` to prevent detaching under Single Page Application (SPA) DOM swaps.

### 2. Service Worker (`extension/background.js`)
- Bypasses Cross-Origin Resource Sharing (CORS) limits to send direct provider fetch requests.
- Contains the completeness scoring engine.
- Manages badges and system-wide hotkeys.

### 3. User Interface React Component App (`src/`)
- Renders the dashboard, favorites list, analytics charts, templates, settings configuration, and onboarding wizard.
- Built using Vite, React 19, Framer Motion, and Lucide React.
- Compiles into a single modular JS bundle that loads directly inside Chrome Side Panel popup views.

---

## Data Schema (`chrome.storage.local`)

- **Settings**: `prompter_settings` contains provider selections, API keys, models, language, and theme choices.
- **History**: `prompter_history` contains a list of previous original prompts, enhanced prompts, and quality analysis statistics.
- **Analytics**: `prompter_analytics` logs metrics event entries (date, platform, provider, qualityScore, interviewUsed, improved).
- **Interview Preferences**: `prompter_interview_prefs` remembers question choices per intent category.
- **Widget Positions**: `prompter_widget_positions` matches hostname keys with coordinate pairs `{ top, left }`.
