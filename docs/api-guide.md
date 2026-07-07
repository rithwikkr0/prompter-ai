---
layout: default
title: API Keys Configuration
---

# API Key Configuration Guide 🔑

Prompter AI is a **BYOK (Bring Your Own Key)** extension. All AI prompt enhancements are routed directly through your own accounts, meaning you have complete control over costs, models, and data privacy.

---

## Supported Providers

### 1. Google Gemini (Recommended)
- **Get Your Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Recommended Model**: `gemini-2.5-flash`
- **Cost**: The free tier is generous and easily covers personal daily use.

### 2. Groq Cloud (Ultra Fast & Free)
- **Get Your Key**: [Groq Console](https://console.groq.com/keys)
- **Recommended Model**: `llama-3.3-70b-versatile`
- **Cost**: Groq is currently **free** within developer rate limits, offering fast completions.

### 3. OpenAI GPT
- **Get Your Key**: [OpenAI Platform API Keys](https://platform.openai.com/api-keys)
- **Recommended Model**: `gpt-4o-mini`
- **Cost**: Pay-as-you-go. A small deposit ($5) lasts for thousands of prompt enhancements.

### 4. Anthropic Claude
- **Get Your Key**: [Anthropic Console Keys](https://console.anthropic.com/settings/keys)
- **Recommended Model**: `claude-3-5-haiku-20241022`
- **Cost**: Pay-as-you-go developer account.

### 5. OpenRouter
- **Get Your Key**: [OpenRouter API Keys](https://openrouter.ai/keys)
- **Recommended Model**: `google/gemini-2.5-flash` or custom choices
- **Cost**: Aggregator for multiple models, offering access to hundreds of open/closed models under one key.

---

## Step-by-Step Configuration

1. Click the **Prompter AI** icon in your browser toolbar to open the Side Panel.
2. Navigate to **Settings** (gear icon).
3. Scroll to **AI Providers & Models**.
4. Choose your provider from the list.
5. Paste your API key and choose the model version.
6. Click **Test Connection**. Once a green success message appears, your key is verified.
7. Click **Save Config** to store credentials.

## Frequently Solved Errors

### "Invalid API Key"
Verify you copied the complete key without any spaces or formatting characters. Check that your billing dashboard is active on pay-as-you-go providers.

### "Quota Exceeded (429)"
This means your chosen provider's free limit or token rate limit has been hit. We recommend switching to another configured provider (like Groq or Gemini free tier) in Settings.
