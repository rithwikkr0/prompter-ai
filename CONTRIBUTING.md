# Contributing to Prompter AI

First off, thank you for considering contributing to Prompter AI! It is people like you who make Prompter AI a premium, open-source prompt co-pilot.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:
- Be respectful and welcoming to other contributors.
- Keep feedback constructive and focus on technical improvements.
- Prioritize security and user privacy (e.g. no logs of credentials).

## How Can I Contribute?

### Reporting Bugs
- Search existing GitHub Issues before opening a new one.
- Use our issue template and include:
  1. Detailed reproduction steps.
  2. The AI platform (Gemini, ChatGPT, etc.) you were using.
  3. The error message or screen recording showing the issue.

### Suggesting Enhancements
- Open a feature request explaining what the improvement is and why it benefits the user community.

### Development Setup

Follow these steps to run a local copy of Prompter AI:

```bash
# 1. Clone the repository
git clone https://github.com/rithwikkr0/prompter-ai.git
cd prompter-ai

# 2. Install dev dependencies
npm install

# 3. Start React application local preview
npm run dev

# 4. Compile the production extension build
npm run build
```

The compiled extension will be placed in the `/extension` directory. You can load this folder directly into Google Chrome.

### Chrome Extension MV3 Compliance

All contributions to the extension scripts (`extension/content.js`, `extension/background.js`) must follow Manifest V3 standards:
- **No Remote Code Execution**: Do not include any external JavaScript scripts or evaluate code with `eval` / `Function`.
- **Minimal Permissions**: Avoid requesting generic permissions in `manifest.json`. Only request what is essential for core helper functions.
- **Local Storage ONLY**: Keep keys, template lists, and history records locally on the user's browser context. Never write telemetry systems that send prompt data to external servers.

## Code Style

- Use TypeScript with strict typing enabled for the React pages.
- Verify code passes lint checkers:
  ```bash
  npm run lint
  ```
- Use descriptive commits following Conventional Commits (e.g., `feat: add draggable positions`, `fix: repair side panel blank rendering`).

## Pull Request Process

1. Fork the repo and create your branch from `master`.
2. Add tests or manually verify your modifications across all 6 supported platforms.
3. Submit a Pull Request describing your changes. Ensure the build pipeline succeeds.

Thank you for contributing!
