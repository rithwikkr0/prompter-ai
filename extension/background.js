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

// ─── Message Relay & API Worker delegation ─────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_POPUP') {
    chrome.action.openPopup?.();
  }

  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get(['prompter_settings', 'promptforge_settings'], (result) => {
      if (result.prompter_settings) {
        sendResponse({ settings: result.prompter_settings });
      } else if (result.promptforge_settings) {
        chrome.storage.local.set({ prompter_settings: result.promptforge_settings }, () => {
          sendResponse({ settings: result.promptforge_settings });
        });
      } else {
        sendResponse({ settings: {} });
      }
    });
    return true; // async response
  }

  if (message.type === 'GET_ENHANCEMENT') {
    const { prompt, apiKey, model } = message;
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `You are a prompt engineering expert. Enhance this prompt and return ONLY the enhanced version, nothing else:\n\n${prompt}` }]
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    })
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const enhanced = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        sendResponse({ success: true, text: enhanced });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });
    return true; // async response
  }
});

