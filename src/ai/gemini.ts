import { GoogleGenerativeAI } from '@google/generative-ai';
import { EnhancementResultSchema, type EnhancementResult } from '../types';

// ─── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Prompter AI, an expert prompt engineering assistant. Your job is to analyze user prompts and enhance them using advanced prompt engineering techniques.

When given a prompt, you must respond with a valid JSON object (no markdown, no code blocks, just raw JSON) with this exact structure:
{
  "qualityScore": <number 0-100>,
  "intent": {
    "category": <one of: coding, debugging, ai-agents, image-generation, video-generation, academic-writing, resume, linkedin, email, marketing, seo, social-media, business, startup-pitch, research, translation, cybersecurity, mathematics, data-science, writing, general>,
    "confidence": <number 0-100>,
    "label": <human readable category name>
  },
  "missingContext": [<array of strings describing what context is missing, e.g. "Target audience", "Output format", "Tone preference">],
  "improvements": [
    {
      "type": <short type string like "Added Role", "Added Constraints", "Improved Clarity">,
      "description": <explanation of the improvement>,
      "icon": <single emoji representing this improvement>
    }
  ],
  "enhancedPrompt": <the fully enhanced, production-quality prompt>,
  "explanation": <a 2-3 sentence human-readable summary of why the enhanced prompt is better>
}

Prompt Engineering Principles to apply:
1. Add a clear role/persona if missing (e.g., "You are an expert software engineer...")
2. Specify the exact output format (JSON, markdown, bullet points, code blocks)
3. Add relevant constraints (length, style, audience, tone)
4. Include examples if helpful (few-shot prompting)
5. Break complex tasks into clear steps
6. Add success criteria
7. Specify the target AI model's strengths if relevant
8. Remove ambiguity and vague language
9. Add context about the user's background/goal
10. For image prompts: add style, lighting, composition, camera settings

Quality Score Rubric:
- 0-30: Very vague, no context, single sentence
- 31-50: Some context but missing key elements
- 51-70: Decent prompt, improvable
- 71-85: Good prompt, minor improvements
- 86-100: Excellent prompt engineering

Always respond with ONLY valid JSON. Do not wrap in code blocks.`;

// ─── Gemini Client ─────────────────────────────────────────────────────────────
let _client: GoogleGenerativeAI | null = null;
let _currentKey = '';

function getClient(apiKey: string): GoogleGenerativeAI {
  if (!_client || _currentKey !== apiKey) {
    _client = new GoogleGenerativeAI(apiKey);
    _currentKey = apiKey;
  }
  return _client;
}

// ─── Enhance Prompt ────────────────────────────────────────────────────────────
export async function enhancePrompt(
  prompt: string,
  apiKey: string,
  model = 'gemini-2.5-flash',
): Promise<EnhancementResult> {
  if (!apiKey) throw new Error('API key is required. Please add your Gemini API key in Settings.');
  if (!prompt.trim()) throw new Error('Please enter a prompt to enhance.');

  const client = getClient(apiKey);
  const genModel = client.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await genModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Analyze and enhance this prompt:\n\n${prompt}` }] }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 4096,
    },
  });

  const text = result.response.text().trim();

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }

  const validated = EnhancementResultSchema.safeParse(parsed);
  if (!validated.success) {
    // Return partial result rather than failing
    return parsed as EnhancementResult;
  }
  return validated.data;
}

// ─── Test API Connection ─────────────────────────────────────────────────────────────
export async function testApiKey(
  apiKey: string,
  preferredModel = 'gemini-2.5-flash',
): Promise<{ valid: boolean; model?: string; error?: string }> {
  try {
    const client = getClient(apiKey);
    // Try preferred model first, fall back through options
    const modelsToTry = [preferredModel, 'gemini-2.5-flash', 'gemini-1.5-flash'];
    const uniqueModels = [...new Set(modelsToTry)];

    for (const model of uniqueModels) {
      try {
        const genModel = client.getGenerativeModel({ model });
        const result = await genModel.generateContent('Say "OK" in one word.');
        const text = result.response.text();
        if (text) return { valid: true, model };
      } catch (modelErr) {
        const msg = (modelErr as Error).message ?? '';
        // 429 on this model — try next
        if (msg.includes('429') || msg.includes('quota')) continue;
        // Other error — propagate
        throw modelErr;
      }
    }
    return { valid: false, error: 'All models rate-limited. Please wait a minute and try again.' };
  } catch (e) {
    const msg = (e as Error).message ?? 'Unknown error';
    if (msg.includes('429') || msg.includes('quota')) {
      return {
        valid: false,
        error: 'Rate limit reached on free tier. Wait ~1 minute then try again, or upgrade your Google AI plan.',
      };
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('401')) {
      return { valid: false, error: 'Invalid API key. Please check it at aistudio.google.com.' };
    }
    return { valid: false, error: msg };
  }
}
