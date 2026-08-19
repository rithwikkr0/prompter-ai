import { GoogleGenerativeAI } from '@google/generative-ai';
import { type EnhancementResult } from '../types';

// Supported Providers Registry for UI
export const PROVIDERS = [
  { id: 'gemini', label: 'Google Gemini', doc: 'https://aistudio.google.com/app/apikey', placeholder: 'AIzaSy...' },
  { id: 'openai', label: 'OpenAI GPT', doc: 'https://platform.openai.com/api-keys', placeholder: 'sk-proj-...' },
  { id: 'anthropic', label: 'Anthropic Claude', doc: 'https://console.anthropic.com/settings/keys', placeholder: 'sk-ant-...' },
  { id: 'groq', label: 'Groq Cloud', doc: 'https://console.groq.com/keys', placeholder: 'gsk_...' },
  { id: 'openrouter', label: 'OpenRouter', doc: 'https://openrouter.ai/keys', placeholder: 'sk-or-...' }
] as const;

export const PROVIDER_MODELS: Record<string, { id: string; label: string }[]> = {
  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ],
  anthropic: [
    { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Recommended)' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' }
  ],
  openrouter: [
    { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' }
  ]
};

// Helper: check if running inside extension context
function isExtension(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.runtime !== 'undefined' &&
    typeof chrome.runtime.sendMessage === 'function'
  );
}

// ─── Build the enhancement system prompt ────────────────────────────────────
function buildPrompt(prompt: string, action: string, conversationContext: string): string {
  const contextBlock = conversationContext
    ? `\n\n<conversation_context>\n${conversationContext}\n</conversation_context>`
    : '';

  const actionMap: Record<string, string> = {
    enhance: `You are an expert prompt engineer. Enhance the following prompt to make it clearer, more specific, and more effective for AI models. Maintain the original intent but improve structure, specificity, and clarity.`,
    rewrite: `You are an expert prompt engineer. Rewrite the following prompt from a different angle, making it more creative and effective while preserving the core goal.`,
    analyze: `You are an expert prompt engineer. Analyze the following prompt and identify its strengths, weaknesses, and specific improvements.`,
    summarize: `You are an expert at summarization. Summarize the following content concisely and accurately.`,
  };

  const systemInstruction = actionMap[action] || actionMap.enhance;

  return `${systemInstruction}${contextBlock}

<original_prompt>
${prompt}
</original_prompt>

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "qualityScore": <number 0-100>,
  "intent": {
    "category": "<coding|writing|research|analysis|creative|business|other>",
    "confidence": <number 0-100>,
    "label": "<human readable label>"
  },
  "missingContext": ["<item1>", "<item2>"],
  "improvements": [
    {"type": "<improvement type>", "description": "<what was improved>", "icon": "<relevant emoji>"}
  ],
  "enhancedPrompt": "<the improved prompt text>",
  "explanation": "<brief explanation of changes made>",
  "targetModel": "<model name>"
}`;
}

// ─── Parse AI response into EnhancementResult ────────────────────────────────
function parseResponse(text: string, model: string): EnhancementResult {
  // Strip markdown code blocks if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      qualityScore: parsed.qualityScore ?? 70,
      intent: parsed.intent ?? { category: 'other', confidence: 80, label: 'General' },
      missingContext: parsed.missingContext ?? [],
      improvements: parsed.improvements ?? [],
      enhancedPrompt: parsed.enhancedPrompt ?? text,
      explanation: parsed.explanation ?? 'Prompt enhanced.',
      targetModel: parsed.targetModel ?? model,
    };
  } catch {
    // Fallback: the model returned plain text, wrap it
    return {
      qualityScore: 75,
      intent: { category: 'other', confidence: 80, label: 'General' },
      missingContext: [],
      improvements: [{ type: 'Enhanced', description: 'Prompt restructured for clarity', icon: '✨' }],
      enhancedPrompt: text,
      explanation: 'Prompt enhanced by AI.',
      targetModel: model,
    };
  }
}

// ─── Direct Gemini API call (web mode) ──────────────────────────────────────
async function callGemini(
  prompt: string,
  apiKey: string,
  model: string,
  action: string,
  conversationContext: string
): Promise<EnhancementResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model: model || 'gemini-2.5-flash' });
  const fullPrompt = buildPrompt(prompt, action, conversationContext);
  const result = await genModel.generateContent(fullPrompt);
  const text = result.response.text();
  return parseResponse(text, model);
}

// ─── Direct OpenAI-compatible API call (OpenAI / Groq / OpenRouter) ─────────
async function callOpenAICompat(
  prompt: string,
  apiKey: string,
  model: string,
  action: string,
  conversationContext: string,
  provider: string
): Promise<EnhancementResult> {
  const endpoints: Record<string, string> = {
    openai: 'https://api.openai.com/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  };

  const url = endpoints[provider];
  if (!url) throw new Error(`Unknown provider: ${provider}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // OpenRouter requires these headers
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Prompter AI';
  }

  const fullPrompt = buildPrompt(prompt, action, conversationContext);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || (provider === 'openai' ? 'gpt-4o-mini' : 'llama-3.3-70b-versatile'),
      messages: [{ role: 'user', content: fullPrompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message || `HTTP ${response.status}`;
    throw new Error(`${provider} API error: ${msg}`);
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? '';
  return parseResponse(text, model);
}

// ─── Multi-Provider Enhance Prompt ──────────────────────────────────────────
export async function enhancePrompt(
  prompt: string,
  apiKey: string,
  model = '',
  provider = 'gemini',
  conversationContext = '',
  action = 'enhance'
): Promise<EnhancementResult> {
  if (!prompt.trim()) throw new Error('Please enter a prompt to enhance.');

  // If in extension context, delegate to background script (bypasses CORS)
  if (isExtension()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ext = (globalThis as any).chrome;
    return new Promise((resolve, reject) => {
      const keepAliveInterval = setInterval(() => {
        ext.runtime.sendMessage({ type: 'KEEPALIVE' }, () => {
          if (ext.runtime?.lastError) { /* ignore */ }
        });
      }, 10000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ext.runtime.sendMessage(
        { type: 'GET_ENHANCEMENT', prompt, apiKey, model, provider, conversationContext, action },
        (response: any) => {
          clearInterval(keepAliveInterval);
          const runtimeErr = ext.runtime.lastError;
          if (runtimeErr) { reject(new Error(runtimeErr.message)); return; }
          if (!response) { reject(new Error('No response from background service worker.')); return; }
          if (!response.success) { reject(new Error(response.error || 'Enhancement failed.')); return; }
          resolve(response.result as EnhancementResult);
        }
      );
    });
  }

  // ── Web app mode: make real direct API calls ──────────────────────────────
  if (!apiKey) {
    throw new Error('No API key configured. Go to Settings → AI Providers to add your API key.');
  }

  if (provider === 'anthropic') {
    throw new Error(
      'Anthropic Claude cannot be called directly from the browser due to CORS restrictions. ' +
      'Please switch to OpenRouter (which supports Claude) in Settings → AI Providers.'
    );
  }

  if (provider === 'gemini') {
    return callGemini(prompt, apiKey, model, action, conversationContext);
  }

  return callOpenAICompat(prompt, apiKey, model, action, conversationContext, provider);
}

// ─── Multi-Provider Connection Test ─────────────────────────────────────────
export async function testApiKey(
  apiKey: string,
  preferredModel = '',
  provider = 'gemini'
): Promise<{ valid: boolean; model?: string; error?: string }> {
  if (!apiKey) return { valid: false, error: 'API key is required.' };

  // Extension context: delegate to background
  if (isExtension()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ext = (globalThis as any).chrome;
    return new Promise((resolve) => {
      const keepAliveInterval = setInterval(() => {
        ext.runtime.sendMessage({ type: 'KEEPALIVE' }, () => {
          if (ext.runtime?.lastError) { /* ignore */ }
        });
      }, 10000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ext.runtime.sendMessage(
        { type: 'TEST_PROVIDER_CONNECTION', provider, apiKey, model: preferredModel },
        (response: any) => {
          clearInterval(keepAliveInterval);
          const runtimeErr = ext.runtime.lastError;
          if (runtimeErr) { resolve({ valid: false, error: runtimeErr.message }); return; }
          if (!response) { resolve({ valid: false, error: 'No response from background connection tester.' }); return; }
          resolve({ valid: response.valid, model: preferredModel || 'default', error: response.error });
        }
      );
    });
  }

  // ── Web app mode: real validation calls ──────────────────────────────────
  try {
    if (provider === 'anthropic') {
      return {
        valid: false,
        error:
          'Anthropic Claude is not supported in the web app due to browser CORS restrictions. ' +
          'Use OpenRouter instead — it supports Claude models with CORS enabled.',
      };
    }

    if (provider === 'gemini') {
      const model = preferredModel || 'gemini-2.5-flash';
      const genAI = new GoogleGenerativeAI(apiKey);
      const genModel = genAI.getGenerativeModel({ model });
      await genModel.generateContent('Say "ok" in one word.');
      return { valid: true, model };
    }

    // OpenAI / Groq / OpenRouter — test with a minimal models list call or tiny completion
    const endpoints: Record<string, string> = {
      openai: 'https://api.openai.com/v1/chat/completions',
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    };

    const url = endpoints[provider];
    if (!url) return { valid: false, error: `Unknown provider: ${provider}` };

    const model = preferredModel || (provider === 'openai' ? 'gpt-4o-mini' : 'llama-3.1-8b-instant');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'Prompter AI';
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "ok".' }],
        max_tokens: 5,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } }).error?.message || `HTTP ${resp.status}`;
      return { valid: false, error: msg };
    }

    return { valid: true, model };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}
