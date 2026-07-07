# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-07-07

### Added
- **Smart Prompt Interview Mode**: Performs local completeness scoring. If a prompt score is below 75, it opens an adaptive questionnaire inside the side panel to gather additional requirement context (Art Style, Programming Language, Citation format, etc.) before running the AI enhancement.
- **Draggable & Persistent Widget**: Floating button coordinates are saved to browser local storage per hostname, allowing user drag custom placements.
- **New React Side Panel Pages**:
  - **Favorites page**: A curated, searchable view of starred enhanced prompts.
  - **Analytics page**: Renders weekly usage activity charts and category breakdown stats.
  - **Shortcuts page**: Interactive reference for keyboard hotkeys.
  - **Help page**: A complete FAQ and troubleshooting accordion guide.
- **Improved SPA Navigation Handling**: MutationObserver updated to monitor the `document.documentElement` context to catch complete swap updates on ChatGPT/Claude navigation actions.
- **Attribution Credit**: Rebranded extension credits to Rithwik KR and updated repository links.

### Changed
- Replaced routing system with `HashRouter` to prevent navigation failures in Chrome Extension popups.
- Upgraded default layout to include new navigation bar entries.

---

## [1.0.0] - 2026-07-04

### Added
- Initial release of Prompter AI for Google Builder Series.
- Support for Gemini, ChatGPT, Claude, Perplexity, Copilot, and Grok.
- Side panel prompt quality analysis and word diff highlights.
- Multi-provider BYOK (Bring Your Own Key) setup.
- Basic local history management.
