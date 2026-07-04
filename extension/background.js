// Prompter AI — Background Service Worker
// Handles context menus, keyboard shortcuts, and message routing

// ─── Context Menu Setup ────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'prompter-enhance',
    title: '✨ Enhance with Prompter AI',
    contexts: ['selection', 'editable'],
  });
  chrome.contextMenus.create({
    id: 'prompter-analyze',
    title: '🔍 Analyze Prompt Quality',
    contexts: ['selection', 'editable'],
  });
  chrome.contextMenus.create({
    id: 'prompter-rewrite',
    title: '🔄 Rewrite Prompt',
    contexts: ['selection', 'editable'],
  });
});

// ─── Context Menu Click Handler ────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const action = info.menuItemId;
  const text = info.selectionText ?? '';

  // Inject content script action
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (promptText, actionType) => {
      // Dispatch custom event to content script
      window.dispatchEvent(new CustomEvent('prompter:action', {
        detail: { text: promptText, action: actionType },
      }));
    },
    args: [text, action.replace('prompter-', '')],
  });
});

// ─── Keyboard Shortcut Handler ─────────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'enhance-prompt' || !tab?.id) return;

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      window.dispatchEvent(new CustomEvent('prompter:action', {
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
    // Look up new key, fallback to migrating old key
    chrome.storage.local.get(['prompter_settings', 'promptforge_settings'], (result) => {
      if (result.prompter_settings) {
        sendResponse({ settings: result.prompter_settings });
      } else if (result.promptforge_settings) {
        // Automatically migrate to new key
        chrome.storage.local.set({ prompter_settings: result.promptforge_settings }, () => {
          sendResponse({ settings: result.promptforge_settings });
        });
      } else {
        sendResponse({ settings: {} });
      }
    });
    return true; // async response
  }
});

