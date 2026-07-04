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
function isExtension() {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;
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
  const ext = typeof chrome !== 'undefined' ? chrome : null;
  if (ext && ext.runtime) {
    return new Promise((resolve, reject) => {
      ext.runtime.sendMessage({
        type: 'GET_ENHANCEMENT',
        prompt,
        apiKey,
        model,
        provider,
        conversationContext,
        action
      }, (response: any) => {
        const runtimeErr = typeof chrome !== 'undefined' ? chrome.runtime.lastError : null;
        if (runtimeErr) {
          reject(new Error(runtimeErr.message));
          return;
        }
        if (!response) {
          reject(new Error('No response from background service worker.'));
          return;
        }
        if (!response.success) {
          reject(new Error(response.error || 'Enhancement failed.'));
          return;
        }
        resolve(response.result);
      });
    });
  }

  // Fallback: Local fetch (useful for web-dashboard preview or development)
  return mockEnhancePrompt(prompt, provider, model);
}

// ─── Multi-Provider Connection Test ─────────────────────────────────────────
export async function testApiKey(
  apiKey: string,
  preferredModel = '',
  provider = 'gemini'
): Promise<{ valid: boolean; model?: string; error?: string }> {
  if (!apiKey) return { valid: false, error: 'API key is required.' };

  const ext = typeof chrome !== 'undefined' ? chrome : null;
  if (ext && ext.runtime) {
    return new Promise((resolve) => {
      ext.runtime.sendMessage({
        type: 'TEST_PROVIDER_CONNECTION',
        provider,
        apiKey,
        model: preferredModel
      }, (response: any) => {
        const runtimeErr = typeof chrome !== 'undefined' ? chrome.runtime.lastError : null;
        if (runtimeErr) {
          resolve({ valid: false, error: runtimeErr.message });
          return;
        }
        if (!response) {
          resolve({ valid: false, error: 'No response from background connection tester.' });
          return;
        }
        resolve({
          valid: response.valid,
          model: preferredModel || 'default',
          error: response.error
        });
      });
    });
  }


  // Fallback for development mode
  await new Promise((r) => setTimeout(r, 800));
  if (apiKey.startsWith('valid') || apiKey.length > 8) {
    return { valid: true, model: preferredModel || 'mock-model' };
  }
  return { valid: false, error: 'Invalid API key format.' };
}

// ─── Mock Fallback for Non-Extension Preview ───────────────────────────────
function mockEnhancePrompt(prompt: string, provider: string, model: string): Promise<EnhancementResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        qualityScore: 82,
        intent: {
          category: 'coding',
          confidence: 95,
          label: 'Software Development'
        },
        missingContext: ['Target language / framework version', 'Input variables examples'],
        improvements: [
          { type: 'Role Definition', description: 'Assigned Senior Architect role framing', icon: '🤖' },
          { type: 'Structured Output', description: 'Added clear markdown structure constraints', icon: '📋' }
        ],
        enhancedPrompt: `Act as a Senior Software Engineer. Rewrite this instruction for clarity:\n\n${prompt}\n\nDeliver the output in clean, formatted Markdown, following standard best practices.`,
        explanation: `Enhanced using Prompter AI via provider ${provider} (${model}). Structured the output, framing role, and added format constraints.`,
        targetModel: model
      });
    }, 1000);
  });
}
