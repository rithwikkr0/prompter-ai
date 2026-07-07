# Security Policy

## Supported Versions

The following versions of Prompter AI receive security updates:

| Version | Supported |
| --- | --- |
| 2.x | :white_check_mark: Yes |
| 1.x | :x: No |

## Reporting a Vulnerability

We take the security of Prompter AI seriously. Please do not report security issues via public GitHub issues. 

Instead, report vulnerabilities privately by opening a GitHub issue with the tag `security` or contacting the repository owner directly. We will investigate and respond to security advisories within 48 hours.

## Security Architecture Model

Prompter AI operates entirely on a **local security model**:
- **Zero Remote Storage**: The extension does not connect to any servers owned by Prompter AI. There are no registration forms, usernames, or cloud databases.
- **BYOK (Bring Your Own Key)**: API keys for Gemini, OpenAI, Anthropic, or Groq are stored directly inside your browser local storage using Google Chrome's native security context (`chrome.storage.local`).
- **Direct API Dispatch**: When you trigger a prompt enhancement, requests are made directly from your browser to the respective provider's HTTPS endpoint. There are no intermediate proxy servers that read your keys or prompts.

## Key Security Recommendations

- **Device Integrity**: Since keys are stored in Chrome storage context, anyone with administrative access to your local machine could theoretically retrieve them. We recommend using full disk encryption (like BitLocker or FileVault) to protect your device data.
- **API Limits & Scopes**: We suggest setting usage limits on your AI provider dashboards to prevent accidental charge overruns in case your credentials are exposed.
