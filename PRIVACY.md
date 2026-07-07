# Privacy Policy — Prompter AI

**Last Updated:** July 2026  
**Version:** 2.0.0

---

## Overview

Prompter AI is a Chrome Extension that enhances prompts directly inside AI platforms (Google Gemini, ChatGPT, Claude, Perplexity, Microsoft Copilot, and Grok). We are committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.

---

## Data We Collect

### API Keys
- Your AI provider API keys (Gemini, OpenAI, Anthropic, Groq, OpenRouter) are stored **locally** in your browser using Chrome's `storage.local` API.
- API keys are **never** transmitted to our servers or any third party other than the AI provider you explicitly configured.

### Enhancement History & Analytics
- When you enhance a prompt, records of your queries, quality scores, and provider choices are saved **locally** in `chrome.storage.local`.
- This analytics data is used only to show your metrics dashboard in the Analytics tab.
- None of this data is sent to external servers.

### Templates
- Custom templates you create are stored **locally** in `chrome.storage.local`.

---

## Data We Do NOT Collect

- We do **not** collect personal identification information.
- We do **not** transmit any data to Prompter AI servers (there are no Prompter AI servers).
- We do **not** track browsing history.
- We do **not** store conversation content permanently. Conversation context is read momentarily to enhance prompts and discarded immediately after.
- We do **not** use advertising or analytics SDKs.

---

## Third-Party Services

When you click "Enhance Prompt," the content of your prompt (and optionally your visible conversation context) is sent **directly from your browser** to the AI provider you configured (e.g., Google Gemini API, OpenAI API). This request is subject to that provider's own privacy policy.

- [Google Gemini Privacy Policy](https://policies.google.com/privacy)
- [OpenAI Privacy Policy](https://openai.com/privacy)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- [Groq Privacy Policy](https://groq.com/privacy-policy/)
- [OpenRouter Privacy Policy](https://openrouter.ai/privacy)

---

## Permissions Explained

| Permission | Why It's Needed |
|---|---|
| `storage` | Store API keys, history, templates, and settings locally |
| `activeTab` | Detect the current AI platform to show the floating widget |
| `scripting` | Inject the floating widget and read/write to prompt inputs |
| `contextMenus` | Add "Enhance Prompt" to right-click menus |
| `clipboardWrite` | Copy enhanced prompts to clipboard |
| `sidePanel` | Open the Prompter AI side panel when clicking the extension icon |
| `tabs` | Open settings and onboarding pages |

---

## Data Retention

All data is stored locally in Chrome's extension storage. You can delete all data at any time:
1. Open Prompter AI Settings
2. Scroll to the bottom and click **"Clear All Data"**
3. Or go to `chrome://extensions`, find Prompter AI, and click **"Clear data"**

---

## Contact

For privacy questions, contact: [GitHub Issues](https://github.com/rithwikkr0/prompter-ai/issues)
