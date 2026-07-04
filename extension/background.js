// Prompter AI — Background Service Worker v2.0
// Manifest V3 — No DOM access, handles messaging, API calls, storage

// ─── Install / Update ──────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(function (details) {
  // Set up context menus
  setupContextMenus();

  // First install → open onboarding
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html') + '#/onboarding',
    });
  }

  // Initialize badge
  chrome.action.setBadgeBackgroundColor({ color: '#4285F4' });
});

// ─── Context Menus ────────────────────────────────────────────────────────────
function setupContextMenus() {
  chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
      id: 'prompter-separator',
      title: '── Prompter AI ──',
      contexts: ['selection', 'editable'],
    });
    chrome.contextMenus.create({
      id: 'prompter-enhance',
      title: '✨ Enhance Prompt',
      contexts: ['selection', 'editable'],
    });
    chrome.contextMenus.create({
      id: 'prompter-rewrite',
      title: '🔄 Rewrite Prompt',
      contexts: ['selection', 'editable'],
    });
    chrome.contextMenus.create({
      id: 'prompter-analyze',
      title: '🔍 Analyze Prompt Quality',
      contexts: ['selection', 'editable'],
    });
    chrome.contextMenus.create({
      id: 'prompter-summarize',
      title: '📝 Summarize for AI',
      contexts: ['selection'],
    });
  });
}

// ─── Context Menu Click ────────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (!tab || !tab.id) return;
  var action = String(info.menuItemId).replace('prompter-', '');
  if (action === 'separator') return;

  var text = info.selectionText || '';

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: function (promptText, actionType) {
      window.dispatchEvent(new CustomEvent('prompter:action', {
        detail: { text: promptText, action: actionType },
      }));
    },
    args: [text, action],
  });
});

// ─── Keyboard Shortcuts ────────────────────────────────────────────────────────
chrome.commands.onCommand.addListener(function (command, tab) {
  if (command !== 'enhance-prompt' || !tab || !tab.id) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: function () {
      window.dispatchEvent(new CustomEvent('prompter:action', {
        detail: { action: 'enhance' },
      }));
    },
  });
});

// ─── Badge Counter ────────────────────────────────────────────────────────────
var sessionCount = 0;

function updateBadge(count) {
  var text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ text: text });
}

// ─── Message Handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

  // ── Open popup ──
  if (message.type === 'OPEN_POPUP') {
    if (chrome.action.openPopup) {
      chrome.action.openPopup();
    }
    return false;
  }

  // ── Increment enhancement badge ──
  if (message.type === 'INCREMENT_BADGE') {
    sessionCount++;
    updateBadge(sessionCount);
    return false;
  }

  // ── Get settings ──
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get(['prompter_settings', 'promptforge_settings'], function (result) {
      var settings = result.prompter_settings || result.promptforge_settings || {};
      sendResponse({ settings: settings });
    });
    return true; // async
  }

  // ── Save history entry ──
  if (message.type === 'SAVE_HISTORY') {
    var entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      original: message.original || '',
      enhanced: message.enhanced || '',
      action: message.action || 'enhance',
      platform: message.platform || 'unknown',
      timestamp: new Date().toISOString(),
      favorite: false,
    };
    chrome.storage.local.get(['prompter_history'], function (result) {
      var history = Array.isArray(result.prompter_history) ? result.prompter_history : [];
      history.unshift(entry);
      // Keep last 200 entries
      if (history.length > 200) history = history.slice(0, 200);
      chrome.storage.local.set({ prompter_history: history }, function () {
        sendResponse({ success: true, id: entry.id });
      });
    });
    return true; // async
  }

  // ── Get history ──
  if (message.type === 'GET_HISTORY') {
    chrome.storage.local.get(['prompter_history'], function (result) {
      sendResponse({ history: result.prompter_history || [] });
    });
    return true; // async
  }

  // ── Clear history ──
  if (message.type === 'CLEAR_HISTORY') {
    chrome.storage.local.remove('prompter_history', function () {
      sendResponse({ success: true });
    });
    return true;
  }

  // ── AI Enhancement (bypasses CORS on target AI sites) ──
  if (message.type === 'GET_ENHANCEMENT') {
    var prompt = message.prompt || '';
    var apiKey = message.apiKey || '';
    var model = message.model || 'gemini-2.5-flash';
    var systemHint = message.systemHint ||
      'Enhance this prompt with professional prompt engineering. Return ONLY the enhanced prompt text, nothing else.';

    if (!apiKey) {
      sendResponse({ success: false, error: 'No API key configured.' });
      return false;
    }

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
    var body = JSON.stringify({
      system_instruction: {
        parts: [{ text: systemHint }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    });

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (errData) {
            var errMsg = (errData && errData.error && errData.error.message) || ('HTTP ' + res.status);
            throw new Error(errMsg);
          });
        }
        return res.json();
      })
      .then(function (data) {
        var text = data &&
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text;

        if (!text) throw new Error('Empty response from AI model.');

        sendResponse({ success: true, text: text.trim() });
      })
      .catch(function (err) {
        var msg = err.message || 'Unknown error';
        var friendly = msg;
        if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
          friendly = 'Rate limit reached. Wait ~1 minute and try again.';
        } else if (msg.includes('API_KEY_INVALID') || msg.includes('401')) {
          friendly = 'Invalid API key. Check your key at aistudio.google.com';
        }
        sendResponse({ success: false, error: friendly });
      });

    return true; // async response
  }

  return false;
});
