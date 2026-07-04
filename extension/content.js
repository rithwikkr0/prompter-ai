// PromptForge AI — Content Script
// Injected into supported AI platforms to provide floating enhance button

(function() {
  'use strict';

  // ─── Platform Selectors ──────────────────────────────────────────────────────
  const PLATFORM_SELECTORS = {
    'gemini.google.com': {
      name: 'Google Gemini',
      input: 'rich-textarea .ql-editor, [data-testid="text-input"] textarea, .input-area textarea',
    },
    'chat.openai.com': {
      name: 'ChatGPT',
      input: '#prompt-textarea, textarea[data-id="root"]',
    },
    'claude.ai': {
      name: 'Claude',
      input: '.ProseMirror[contenteditable="true"], div[contenteditable="true"]',
    },
    'www.perplexity.ai': {
      name: 'Perplexity',
      input: 'textarea[placeholder], textarea.overflow-auto',
    },
    'copilot.microsoft.com': {
      name: 'Copilot',
      input: 'textarea[data-testid="chat-input"], #searchbox',
    },
    'x.com': {
      name: 'Grok',
      input: 'textarea[placeholder*="Grok"], div[data-testid="tweetTextarea_0"]',
    },
  };

  // Detect current platform
  const hostname = window.location.hostname;
  const platform = Object.keys(PLATFORM_SELECTORS).find(k => hostname.includes(k));
  if (!platform) return;

  const config = PLATFORM_SELECTORS[platform];

  // ─── Create Floating Button ──────────────────────────────────────────────────
  let floatingBtn = null;
  let isVisible = false;

  function createFloatingButton() {
    if (floatingBtn) return;

    floatingBtn = document.createElement('div');
    floatingBtn.id = 'promptforge-btn';
    floatingBtn.innerHTML = `
      <div style="
        position: fixed;
        bottom: 80px;
        right: 24px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
      ">
        <div id="pf-tooltip" style="
          background: #1e293b;
          color: white;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-family: Inter, system-ui, sans-serif;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
          margin-bottom: 4px;
        ">✨ Enhance Prompt (Ctrl+Shift+E)</div>

        <button id="pf-enhance-btn" style="
          width: 52px;
          height: 52px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(135deg, #4285F4, #9333EA);
          color: white;
          font-size: 22px;
          cursor: pointer;
          box-shadow: 0 4px 24px rgba(66,133,244,0.4);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        " title="Enhance Prompt with PromptForge AI (Ctrl+Shift+E)">
          ✨
          <span style="
            position: absolute;
            top: -4px;
            right: -4px;
            width: 16px;
            height: 16px;
            background: #34A853;
            border-radius: 50%;
            border: 2px solid white;
            font-size: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">AI</span>
        </button>
      </div>
    `;

    document.body.appendChild(floatingBtn);

    const btn = document.getElementById('pf-enhance-btn');
    const tooltip = document.getElementById('pf-tooltip');

    // Hover effects
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-3px) scale(1.05)';
      btn.style.boxShadow = '0 8px 32px rgba(66,133,244,0.6)';
      tooltip.style.opacity = '1';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'none';
      btn.style.boxShadow = '0 4px 24px rgba(66,133,244,0.4)';
      tooltip.style.opacity = '0';
    });

    // Click to enhance
    btn.addEventListener('click', handleEnhance);
  }

  // ─── Get Prompt Text from Current Platform ────────────────────────────────────
  function getPromptText() {
    const selectors = config.input.split(', ');
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        return el.value.trim();
      }
      if (el.getAttribute('contenteditable')) {
        return el.innerText.trim();
      }
    }
    // Fallback: selected text
    const sel = window.getSelection();
    return sel && sel.toString().trim() ? sel.toString().trim() : '';
  }

  // ─── Set Text Back in Input ───────────────────────────────────────────────────
  function setPromptText(text) {
    const selectors = config.input.split(', ');
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeInputValueSetter.call(el, text);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      if (el.getAttribute('contenteditable')) {
        el.innerText = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // ─── Show Overlay Notification ────────────────────────────────────────────────
  function showNotification(message, type = 'info') {
    const colors = { info: '#4285F4', success: '#34A853', error: '#EA4335', loading: '#9333EA' };
    const existing = document.getElementById('pf-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.id = 'pf-notification';
    notif.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 999999;
      background: ${type === 'loading' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : '#1e293b'};
      color: white;
      padding: 12px 16px;
      border-radius: 12px;
      font-family: Inter, system-ui, sans-serif;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      border-left: 3px solid ${colors[type]};
      max-width: 320px;
      animation: pfSlideIn 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    notif.innerHTML = `
      <style>
        @keyframes pfSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      </style>
      <span>${type === 'loading' ? '⏳' : type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
    `;
    document.body.appendChild(notif);

    if (type !== 'loading') {
      setTimeout(() => notif?.remove(), 4000);
    }

    return notif;
  }

  // ─── Main Enhance Handler ─────────────────────────────────────────────────────
  async function handleEnhance() {
    const prompt = getPromptText();
    if (!prompt) {
      showNotification('Please type a prompt first!', 'error');
      return;
    }

    // Get API key from storage
    const result = await chrome.storage.local.get(['promptforge_settings']);
    const settings = result.promptforge_settings ?? {};
    const apiKey = settings.apiKey ?? '';

    if (!apiKey) {
      showNotification('Please add your Gemini API key in PromptForge Settings', 'error');
      setTimeout(() => chrome.runtime.sendMessage({ type: 'OPEN_POPUP' }), 1000);
      return;
    }

    const notif = showNotification('Enhancing your prompt with AI...', 'loading');

    try {
      // Call Gemini API directly from content script
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.preferredModel ?? 'gemini-2.0-flash'}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `You are a prompt engineering expert. Enhance this prompt and return ONLY the enhanced version, nothing else:\n\n${prompt}` }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const enhanced = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!enhanced) throw new Error('No response from AI');

      notif?.remove();
      const success = setPromptText(enhanced);

      if (success) {
        showNotification('✨ Prompt enhanced! Check your input field.', 'success');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(enhanced);
        showNotification('Enhanced prompt copied to clipboard!', 'success');
      }
    } catch (err) {
      notif?.remove();
      showNotification(`Error: ${err.message}`, 'error');
    }
  }

  // ─── Listen for custom events from background ─────────────────────────────────
  window.addEventListener('promptforge:action', (e) => {
    const { action, text } = e.detail ?? {};
    if (action === 'enhance') {
      if (text) setPromptText(text); // pre-fill if text was provided via context menu
      handleEnhance();
    }
  });

  // ─── Initialize ───────────────────────────────────────────────────────────────
  function init() {
    createFloatingButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
