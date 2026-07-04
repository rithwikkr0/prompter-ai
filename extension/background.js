// PromptForge AI — Background Service Worker
// Handles context menus, keyboard shortcuts, and message routing

// ─── Context Menu Setup ────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'promptforge-enhance',
    title: '✨ Enhance with PromptForge',
    contexts: ['selection', 'editable'],
  });
  chrome.contextMenus.create({
    id: 'promptforge-analyze',
    title: '🔍 Analyze Prompt Quality',
    contexts: ['selection', 'editable'],
  });
  chrome.contextMenus.create({
    id: 'promptforge-rewrite',
    title: '🔄 Rewrite Prompt',
    contexts: ['selection', 'editable'],
  });
});

// ─── Context Menu Click Handler ────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const action = info.menuItemId as string;
  const text = info.selectionText ?? '';

  // Inject content script action
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (promptText, actionType) => {
      // Dispatch custom event to content script
      window.dispatchEvent(new CustomEvent('promptforge:action', {
        detail: { text: promptText, action: actionType },
      }));
    },
    args: [text, action.replace('promptforge-', '')],
  });
});

// ─── Keyboard Shortcut Handler ─────────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'enhance-prompt' || !tab?.id) return;

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      window.dispatchEvent(new CustomEvent('promptforge:action', {
        detail: { action: 'enhance' },
      }));
    },
  });
});

// ─── Message Relay ─────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_POPUP') {
    chrome.action.openPopup?.();
  }
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get(['promptforge_settings'], (result) => {
      sendResponse({ settings: result.promptforge_settings ?? {} });
    });
    return true; // async response
  }
});
