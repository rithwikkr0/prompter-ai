---
layout: default
title: Frequently Asked Questions
---

# Frequently Asked Questions (FAQ) ❓

Here are the answers to the most common questions regarding Prompter AI v2.0.

---

### 1. What is Prompter AI?
Prompter AI is a Chrome extension that helps you improve prompts directly inside Gemini, ChatGPT, Claude, Perplexity, Copilot, and Grok.

### 2. Is this extension free to use?
Yes, it is 100% open-source and free under the MIT license. You only need your own API credentials.

### 3. What is BYOK?
BYOK stands for "Bring Your Own Key". It means you use your own developer API keys from Google, OpenAI, Anthropic, or Groq to power prompt enhancements, ensuring no markups or intermediate proxy servers.

### 4. Which AI platforms are supported?
We support Gemini, ChatGPT, Claude, Perplexity, Microsoft Copilot, and Grok.

### 5. What are the recommended API models?
We recommend:
- `gemini-2.5-flash` for general and coding prompts (generous free tier).
- `llama-3.3-70b-versatile` on Groq (ultra fast and currently free).
- `gpt-4o-mini` on OpenAI.

### 6. Where are my API keys stored?
Keys are stored locally on your machine via `chrome.storage.local`. They are never sent to external servers other than direct HTTPS requests to the AI provider.

### 7. How does Smart Interview Mode work?
When you click enhance, the extension checks prompt completeness. If information is missing (score < 75), it asks 1-3 targeted questions inside the side panel to gather style, tone, or framework details.

### 8. How do I move the floating button?
Click and hold the `⠿` handle at the top of the ✨ widget, drag it to your desired coordinate, and release. Position is saved per hostname automatically.

### 9. Can I disable the floating button?
Yes, go to settings and toggle "Floating Widget" to turn it off.

### 10. Does this extension track my search history?
No. The extension only activates on supported AI websites. It never tracks search logs, page history, or passwords.

### 11. How do I open the main side panel?
Click the extension icon in your toolbar, or click the bottom-right option of the widget submenu.

### 12. What does "Replace Prompt" do?
It replaces the text currently in your ChatGPT/Gemini prompt textarea with the enhanced version, ready to submit.

### 13. What is the keyboard shortcut?
Press `Ctrl+Shift+E` (or `Cmd+Shift+E` on macOS) to instantly trigger enhancement.

### 14. Can I customize hotkeys?
Yes, open `chrome://extensions/shortcuts` in Google Chrome to bind any custom combination.

### 15. How do I export my templates and history?
Navigate to Settings → Data Management → Export History. This saves a JSON copy to your local downloads folder.

### 16. What is the diff preview?
It highlights exactly what words were added or changed between your original prompt and the enhanced version in green markup.

### 17. How do I clear all extension data?
Go to Settings → Analytics and click "Reset Metrics", or navigate to `chrome://extensions` and clear extension site data.

### 18. Does it work on mobile browsers?
No. Chrome Extensions are only officially supported on desktop web browsers.

### 19. Why does connection testing fail?
Verify your device is online. Ensure there are no spaces or special characters appended to your API key. Check if your API account has positive billing balances or has met rate limits.

### 20. How is my privacy protected?
Prompter AI does not use telemetry or metrics tracking servers. All history entries, custom templates, coordinates, and statistics are stored locally on your device.
