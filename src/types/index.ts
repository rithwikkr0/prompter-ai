import { z } from 'zod';

// ─── Prompt Categories ────────────────────────────────────────────────────────
export const PROMPT_CATEGORIES = [
  'coding', 'debugging', 'ai-agents', 'image-generation', 'video-generation',
  'academic-writing', 'resume', 'linkedin', 'email', 'marketing', 'seo',
  'social-media', 'business', 'startup-pitch', 'research', 'translation',
  'cybersecurity', 'mathematics', 'data-science', 'writing', 'general',
] as const;

export type PromptCategory = typeof PROMPT_CATEGORIES[number];

// ─── Improvement ──────────────────────────────────────────────────────────────
export const ImprovementSchema = z.object({
  type: z.string(),
  description: z.string(),
  icon: z.string().optional(),
});
export type Improvement = z.infer<typeof ImprovementSchema>;

// ─── Enhancement Result ───────────────────────────────────────────────────────
export const EnhancementResultSchema = z.object({
  qualityScore: z.number().min(0).max(100),
  intent: z.object({
    category: z.string(),
    confidence: z.number().min(0).max(100),
    label: z.string(),
  }),
  missingContext: z.array(z.string()),
  improvements: z.array(ImprovementSchema),
  enhancedPrompt: z.string(),
  explanation: z.string(),
  targetModel: z.string().optional(),
});
export type EnhancementResult = z.infer<typeof EnhancementResultSchema>;

// ─── Prompt History Entry ─────────────────────────────────────────────────────
export const HistoryEntrySchema = z.object({
  id: z.string(),
  originalPrompt: z.string(),
  enhancedPrompt: z.string(),
  result: EnhancementResultSchema,
  timestamp: z.number(),
  platform: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
});
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

// ─── Template ─────────────────────────────────────────────────────────────────
export const TemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(PROMPT_CATEGORIES),
  prompt: z.string(),
  isCustom: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});
export type Template = z.infer<typeof TemplateSchema>;

// ─── User Settings ────────────────────────────────────────────────────────────
export const UserSettingsSchema = z.object({
  apiKey: z.string().default(''),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  preferredModel: z.string().default('gemini-2.5-flash'),
  autoEnhance: z.boolean().default(false),
  language: z.string().default('en'),
  keyboardShortcut: z.string().default('Ctrl+Shift+E'),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

// ─── App State ────────────────────────────────────────────────────────────────
export type EnhancementStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
  status: EnhancementStatus;
  currentPrompt: string;
  result: EnhancementResult | null;
  error: string | null;
}

// ─── Category Meta ────────────────────────────────────────────────────────────
export interface CategoryMeta {
  id: PromptCategory;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  coding: { id: 'coding', label: 'Coding', icon: '💻', color: '#4285F4' },
  debugging: { id: 'debugging', label: 'Debugging', icon: '🐛', color: '#EA4335' },
  'ai-agents': { id: 'ai-agents', label: 'AI Agents', icon: '🤖', color: '#9333EA' },
  'image-generation': { id: 'image-generation', label: 'Image Gen', icon: '🎨', color: '#EC4899' },
  'video-generation': { id: 'video-generation', label: 'Video Gen', icon: '🎬', color: '#F97316' },
  'academic-writing': { id: 'academic-writing', label: 'Academic', icon: '📚', color: '#6366F1' },
  resume: { id: 'resume', label: 'Resume', icon: '📄', color: '#14B8A6' },
  linkedin: { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0077B5' },
  email: { id: 'email', label: 'Email', icon: '✉️', color: '#34A853' },
  marketing: { id: 'marketing', label: 'Marketing', icon: '📣', color: '#FBBC05' },
  seo: { id: 'seo', label: 'SEO', icon: '🔍', color: '#059669' },
  'social-media': { id: 'social-media', label: 'Social Media', icon: '📱', color: '#8B5CF6' },
  business: { id: 'business', label: 'Business', icon: '🏢', color: '#1D4ED8' },
  'startup-pitch': { id: 'startup-pitch', label: 'Startup Pitch', icon: '🚀', color: '#DC2626' },
  research: { id: 'research', label: 'Research', icon: '🔬', color: '#7C3AED' },
  translation: { id: 'translation', label: 'Translation', icon: '🌐', color: '#0891B2' },
  cybersecurity: { id: 'cybersecurity', label: 'Cybersecurity', icon: '🔐', color: '#374151' },
  mathematics: { id: 'mathematics', label: 'Mathematics', icon: '📐', color: '#D97706' },
  'data-science': { id: 'data-science', label: 'Data Science', icon: '📊', color: '#2563EB' },
  writing: { id: 'writing', label: 'Writing', icon: '✍️', color: '#B45309' },
  general: { id: 'general', label: 'General', icon: '⚡', color: '#6B7280' },
};
