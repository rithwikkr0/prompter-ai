import type { UserSettings, HistoryEntry, Template } from '../types';

// ─── Chrome type shim (works in both extension and PWA contexts) ──────────────
declare const chrome: {
  storage: {
    local: {
      get: (keys: string[], callback: (result: Record<string, unknown>) => void) => void;
      set: (items: Record<string, unknown>, callback?: () => void) => void;
    };
  };
} | undefined;

const KEYS = {
  SETTINGS: 'prompter_settings',
  HISTORY: 'prompter_history',
  TEMPLATES: 'prompter_templates',
} as const;

const LEGACY_KEYS = {
  SETTINGS: 'promptforge_settings',
  HISTORY: 'promptforge_history',
  TEMPLATES: 'promptforge_templates',
} as const;

// ─── Chrome Storage Detection ─────────────────────────────────────────────────
const isChromeExtension = (): boolean =>
  typeof chrome !== 'undefined' && !!chrome?.storage?.local;

// ─── Generic Get with Auto-Migration ──────────────────────────────────────────
async function get<T>(key: string, fallback: T, legacyKey?: string): Promise<T> {
  if (isChromeExtension()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chromeStorage = (globalThis as any).chrome.storage.local;
    return new Promise((resolve) => {
      chromeStorage.get([key, legacyKey || ''], (result: Record<string, unknown>) => {
        if (result[key] !== undefined) {
          resolve(result[key] as T);
        } else if (legacyKey && result[legacyKey] !== undefined) {
          // Migrate legacy key to new key
          chromeStorage.set({ [key]: result[legacyKey] }, () => {
            resolve(result[legacyKey] as T);
          });
        } else {
          resolve(fallback);
        }
      });
    });
  }

  // Web localStorage fallback
  const raw = localStorage.getItem(key);
  if (raw !== null) {
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }

  if (legacyKey) {
    const legacyRaw = localStorage.getItem(legacyKey);
    if (legacyRaw !== null) {
      // Migrate legacy data
      localStorage.setItem(key, legacyRaw);
      localStorage.removeItem(legacyKey);
      try { return JSON.parse(legacyRaw) as T; } catch { return fallback; }
    }
  }

  return fallback;
}

// ─── Generic Set ─────────────────────────────────────────────────────────────
async function set<T>(key: string, value: T): Promise<void> {
  if (isChromeExtension()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chromeStorage = (globalThis as any).chrome.storage.local;
    return new Promise((resolve) => {
      chromeStorage.set({ [key]: value as unknown }, resolve);
    });
  }
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Settings ─────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: UserSettings = {
  apiKey: '',
  theme: 'system',
  preferredModel: 'gemini-2.5-flash',
  autoEnhance: false,
  language: 'en',
  keyboardShortcut: 'Ctrl+Shift+E',
};


export const storage = {
  // Settings
  getSettings: () => get<UserSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS, LEGACY_KEYS.SETTINGS),
  saveSettings: (settings: UserSettings) => set(KEYS.SETTINGS, settings),

  // History
  getHistory: () => get<HistoryEntry[]>(KEYS.HISTORY, [], LEGACY_KEYS.HISTORY),
  async addHistoryEntry(entry: HistoryEntry): Promise<void> {
    const history = await get<HistoryEntry[]>(KEYS.HISTORY, [], LEGACY_KEYS.HISTORY);
    const updated = [entry, ...history].slice(0, 100); // max 100 entries
    await set(KEYS.HISTORY, updated);
  },
  async removeHistoryEntry(id: string): Promise<void> {
    const history = await get<HistoryEntry[]>(KEYS.HISTORY, [], LEGACY_KEYS.HISTORY);
    await set(KEYS.HISTORY, history.filter((h) => h.id !== id));
  },
  async toggleFavorite(id: string): Promise<void> {
    const history = await get<HistoryEntry[]>(KEYS.HISTORY, [], LEGACY_KEYS.HISTORY);
    await set(
      KEYS.HISTORY,
      history.map((h) => (h.id === id ? { ...h, isFavorite: !h.isFavorite } : h)),
    );
  },
  async clearHistory(): Promise<void> {
    await set(KEYS.HISTORY, []);
  },

  // Templates
  getTemplates: () => get<Template[]>(KEYS.TEMPLATES, [], LEGACY_KEYS.TEMPLATES),

  async saveTemplate(template: Template): Promise<void> {
    const templates = await get<Template[]>(KEYS.TEMPLATES, [], LEGACY_KEYS.TEMPLATES);
    const idx = templates.findIndex((t) => t.id === template.id);
    if (idx >= 0) templates[idx] = template;
    else templates.push(template);
    await set(KEYS.TEMPLATES, templates);
  },
  async removeTemplate(id: string): Promise<void> {
    const templates = await get<Template[]>(KEYS.TEMPLATES, [], LEGACY_KEYS.TEMPLATES);
    await set(KEYS.TEMPLATES, templates.filter((t) => t.id !== id));
  },

  // Export / Import
  async exportHistory(): Promise<string> {
    const history = await get<HistoryEntry[]>(KEYS.HISTORY, [], LEGACY_KEYS.HISTORY);
    return JSON.stringify(history, null, 2);
  },
  async importHistory(json: string): Promise<void> {
    const data = JSON.parse(json) as HistoryEntry[];
    const current = await get<HistoryEntry[]>(KEYS.HISTORY, [], LEGACY_KEYS.HISTORY);
    const merged = [...data, ...current]
      .filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i)
      .slice(0, 100);
    await set(KEYS.HISTORY, merged);
  },
};
