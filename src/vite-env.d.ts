/// <reference types="vite/client" />

// ─── Chrome Extension API Types (minimal shim for Manifest V3) ───────────────
// These allow TypeScript to compile without @types/chrome package.
// The actual chrome object is injected by the browser at runtime.

interface ChromeTab {
  id?: number;
  url?: string;
  title?: string;
  active?: boolean;
  windowId?: number;
}

interface ChromeStorageArea {
  get(keys: string | string[], callback: (result: Record<string, unknown>) => void): void;
  set(items: Record<string, unknown>, callback?: () => void): void;
  remove(key: string | string[], callback?: () => void): void;
}

interface ChromeRuntime {
  sendMessage(message: unknown, callback?: (response: unknown) => void): void;
  getURL(path: string): string;
  lastError?: { message: string };
}

interface ChromeAction {
  setBadgeText(details: { text: string; tabId?: number }): void;
  setBadgeBackgroundColor(details: { color: string }): void;
  openPopup?(): void;
}

interface ChromeTabs {
  query(queryInfo: { active?: boolean; currentWindow?: boolean }, callback: (tabs: ChromeTab[]) => void): void;
  create(createProperties: { url: string }): void;
}

declare const chrome: {
  storage: {
    local: ChromeStorageArea;
    sync: ChromeStorageArea;
  };
  runtime: ChromeRuntime;
  action: ChromeAction;
  tabs: ChromeTabs;
} | undefined;
