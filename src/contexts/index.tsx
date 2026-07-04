import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserSettings, EnhancementResult, AppState } from '../types';
import { storage } from '../storage';

// ─── Settings Context ──────────────────────────────────────────────────────────
interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  isLoaded: boolean;
}

const defaultSettings: UserSettings = {
  apiKey: '',
  theme: 'system',
  preferredModel: 'gemini-2.5-flash',
  autoEnhance: false,
  language: 'en',
  keyboardShortcut: 'Ctrl+Shift+E',
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSettings: async () => {},
  isLoaded: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    storage.getSettings().then((s) => {
      setSettings(s);
      setIsLoaded(true);
    });
  }, []);

  const updateSettings = useCallback(async (partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await storage.saveSettings(updated);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);

// ─── Enhancement Context ───────────────────────────────────────────────────────
interface EnhancementContextValue {
  state: AppState;
  setPrompt: (prompt: string) => void;
  enhance: () => Promise<void>;
  clearResult: () => void;
  loadResult: (result: EnhancementResult, prompt: string) => void;
}

const EnhancementContext = createContext<EnhancementContextValue>({
  state: { status: 'idle', currentPrompt: '', result: null, error: null },
  setPrompt: () => {},
  enhance: async () => {},
  clearResult: () => {},
  loadResult: () => {},
});

export function EnhancementProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [state, setState] = useState<AppState>({
    status: 'idle',
    currentPrompt: '',
    result: null,
    error: null,
  });

  const setPrompt = useCallback((prompt: string) => {
    setState((prev) => ({ ...prev, currentPrompt: prompt }));
  }, []);

  const enhance = useCallback(async () => {
    if (!state.currentPrompt.trim()) return;

    setState((prev) => ({ ...prev, status: 'loading', error: null, result: null }));
    try {
      const { enhancePrompt } = await import('../ai/gemini');
      const result = await enhancePrompt(
        state.currentPrompt,
        settings.apiKey,
        settings.preferredModel,
      );
      setState((prev) => ({ ...prev, status: 'success', result }));

      // Auto-save to history
      const { nanoid } = await import('../utils/nanoid');
      const entry = {
        id: nanoid(),
        originalPrompt: state.currentPrompt,
        enhancedPrompt: result.enhancedPrompt,
        result,
        timestamp: Date.now(),
        tags: [result.intent.category],
        isFavorite: false,
      };
      await storage.addHistoryEntry(entry);
    } catch (e) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: (e as Error).message,
      }));
    }
  }, [state.currentPrompt, settings.apiKey, settings.preferredModel]);

  const clearResult = useCallback(() => {
    setState({ status: 'idle', currentPrompt: '', result: null, error: null });
  }, []);

  const loadResult = useCallback((result: EnhancementResult, prompt: string) => {
    setState({ status: 'success', currentPrompt: prompt, result, error: null });
  }, []);

  return (
    <EnhancementContext.Provider value={{ state, setPrompt, enhance, clearResult, loadResult }}>
      {children}
    </EnhancementContext.Provider>
  );
}

export const useEnhancement = () => useContext(EnhancementContext);
