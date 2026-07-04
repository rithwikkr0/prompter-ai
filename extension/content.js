// Prompter AI — Content Script v2.0
// Production-ready: Injected into supported AI platforms
// No TypeScript syntax — this is plain JavaScript (MV3 content script)

(function () {
  'use strict';

  // Prevent double-injection
  if (window.__prompterAILoaded) return;
  window.__prompterAILoaded = true;

  // ─── Platform Selector Registry ──────────────────────────────────────────────
  var PLATFORMS = {
    'gemini.google.com': {
      name: 'Google Gemini',
      color: '#4285F4',
      selectors: [
        'rich-textarea .ql-editor[contenteditable="true"]',
        'div.ql-editor[contenteditable="true"]',
        'textarea[data-testid="user-input"]',
        '.input-area-container textarea',
      ],
    },
    'chat.openai.com': {
      name: 'ChatGPT',
      color: '#10A37F',
      selectors: [
        '#prompt-textarea',
        'textarea[data-testid="prompt-textarea"]',
        'div[contenteditable="true"][data-virtualized="false"]',
      ],
    },
    'chatgpt.com': {
      name: 'ChatGPT',
      color: '#10A37F',
      selectors: [
        '#prompt-textarea',
        'textarea[data-testid="prompt-textarea"]',
      ],
    },
    'claude.ai': {
      name: 'Claude',
      color: '#D97706',
      selectors: [
        'div[contenteditable="true"].ProseMirror',
        '.ProseMirror[contenteditable="true"]',
        'div[contenteditable="true"][data-placeholder]',
      ],
    },
    'www.perplexity.ai': {
      name: 'Perplexity',
      color: '#6366F1',
      selectors: [
        'textarea[placeholder]',
        'textarea.overflow-auto',
        'textarea[data-testid="search-input"]',
      ],
    },
    'copilot.microsoft.com': {
      name: 'Copilot',
      color: '#0078D4',
      selectors: [
        'textarea[data-testid="chat-input"]',
        '#searchbox',
        'textarea[name="q"]',
      ],
    },
    'x.com': {
      name: 'Grok',
      color: '#1DA1F2',
      selectors: [
        'textarea[placeholder*="Grok"]',
        'textarea[data-testid="tweetTextarea_0"]',
      ],
    },
    'grok.com': {
      name: 'Grok',
      color: '#1DA1F2',
      selectors: [
        'textarea',
        'div[contenteditable="true"]',
      ],
    },
  };

  // ─── Platform Detection ──────────────────────────────────────────────────────
  var hostname = window.location.hostname;
  var platformKey = Object.keys(PLATFORMS).find(function (k) {
    return hostname.includes(k);
  });
  if (!platformKey) return;

  var platform = PLATFORMS[platformKey];

  // ─── Utility: Find Input Element ─────────────────────────────────────────────
  function findInputElement() {
    for (var i = 0; i < platform.selectors.length; i++) {
      var el = document.querySelector(platform.selectors[i]);
      if (el) return el;
    }
    return null;
  }

  // ─── Utility: Get Text ───────────────────────────────────────────────────────
  function getPromptText() {
    var el = findInputElement();
    if (!el) {
      // Fall back to selection
      var sel = window.getSelection();
      return sel && sel.toString().trim() ? sel.toString().trim() : '';
    }
    var tag = el.tagName.toUpperCase();
    if (tag === 'TEXTAREA' || tag === 'INPUT') {
      return el.value.trim();
    }
    return (el.innerText || el.textContent || '').trim();
  }

  // ─── Utility: Set Text ───────────────────────────────────────────────────────
  function setPromptText(text) {
    var el = findInputElement();
    if (!el) return false;
    var tag = el.tagName.toUpperCase();

    try {
      if (tag === 'TEXTAREA' || tag === 'INPUT') {
        var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
        if (nativeSetter && nativeSetter.set) {
          nativeSetter.set.call(el, text);
        } else {
          el.value = text;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      if (el.getAttribute('contenteditable')) {
        el.focus();
        // Select all and replace — works for ProseMirror and Quill
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
        if (!(el.innerText || '').trim()) {
          // execCommand failed, set directly
          el.innerText = text;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return true;
      }
    } catch (err) {
      console.warn('[Prompter AI] setPromptText error:', err);
    }
    return false;
  }

  // ─── Notification Toast ──────────────────────────────────────────────────────
  var activeNotif = null;

  function showNotification(message, type) {
    type = type || 'info';
    if (activeNotif) activeNotif.remove();

    var colors = {
      info: '#4285F4',
      success: '#34A853',
      error: '#EA4335',
      loading: '#9333EA',
    };
    var icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      loading: '⏳',
    };

    var notif = document.createElement('div');
    notif.id = 'prompter-notif';
    notif.setAttribute('style', [
      'position:fixed',
      'top:20px',
      'right:20px',
      'z-index:2147483647',
      'background:linear-gradient(135deg,#1e293b,#0f172a)',
      'color:#f8fafc',
      'padding:12px 16px',
      'border-radius:14px',
      'font-family:Inter,system-ui,sans-serif',
      'font-size:13px',
      'font-weight:500',
      'box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06)',
      'border-left:3px solid ' + colors[type],
      'max-width:300px',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'animation:pf-slide-in 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      'backdrop-filter:blur(20px)',
    ].join(';'));

    notif.innerHTML =
      '<style>@keyframes pf-slide-in{from{opacity:0;transform:translateX(20px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}</style>' +
      '<span style="font-size:16px;flex-shrink:0">' + icons[type] + '</span>' +
      '<span>' + message + '</span>';

    document.body.appendChild(notif);
    activeNotif = notif;

    if (type !== 'loading') {
      setTimeout(function () {
        if (notif.parentNode) notif.remove();
        if (activeNotif === notif) activeNotif = null;
      }, 4000);
    }

    return notif;
  }

  // ─── Diff Preview Modal ──────────────────────────────────────────────────────
  function showDiffPreview(original, enhanced, onAccept, onReject) {
    var overlay = document.createElement('div');
    overlay.id = 'prompter-overlay';
    overlay.setAttribute('style', [
      'position:fixed',
      'inset:0',
      'z-index:2147483646',
      'background:rgba(0,0,0,0.7)',
      'backdrop-filter:blur(8px)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:20px',
      'font-family:Inter,system-ui,sans-serif',
    ].join(';'));

    overlay.innerHTML = [
      '<div style="background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;max-width:600px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.6)">',
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">',
          '<div style="display:flex;align-items:center;gap:10px">',
            '<div style="width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#4285F4,#9333EA);display:flex;align-items:center;justify-content:center;font-size:18px">✨</div>',
            '<div>',
              '<div style="color:#f8fafc;font-size:15px;font-weight:700">Prompt Enhanced</div>',
              '<div style="color:#94a3b8;font-size:12px">Review and accept or reject</div>',
            '</div>',
          '</div>',
          '<button id="pf-close-btn" style="background:rgba(255,255,255,0.06);border:none;color:#94a3b8;width:32px;height:32px;border-radius:10px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center">×</button>',
        '</div>',

        '<div style="margin-bottom:16px">',
          '<div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Original</div>',
          '<div style="background:rgba(234,67,53,0.08);border:1px solid rgba(234,67,53,0.2);border-radius:12px;padding:12px;color:#fca5a5;font-size:13px;line-height:1.6;max-height:120px;overflow-y:auto">' + escapeHtml(original) + '</div>',
        '</div>',

        '<div style="margin-bottom:20px">',
          '<div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">✨ Enhanced</div>',
          '<div style="background:rgba(52,168,83,0.08);border:1px solid rgba(52,168,83,0.2);border-radius:12px;padding:12px;color:#86efac;font-size:13px;line-height:1.6;max-height:180px;overflow-y:auto">' + escapeHtml(enhanced) + '</div>',
        '</div>',

        '<div style="display:flex;gap:10px">',
          '<button id="pf-accept-btn" style="flex:1;background:linear-gradient(135deg,#4285F4,#9333EA);color:white;border:none;padding:12px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity 0.2s">✅ Use Enhanced</button>',
          '<button id="pf-copy-btn" style="background:rgba(255,255,255,0.06);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);padding:12px 16px;border-radius:12px;font-size:14px;cursor:pointer">📋 Copy</button>',
          '<button id="pf-reject-btn" style="background:rgba(255,255,255,0.06);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);padding:12px 16px;border-radius:12px;font-size:14px;cursor:pointer">✕ Keep Original</button>',
        '</div>',
      '</div>',
    ].join('');

    document.body.appendChild(overlay);

    overlay.querySelector('#pf-close-btn').addEventListener('click', function () { overlay.remove(); onReject(); });
    overlay.querySelector('#pf-reject-btn').addEventListener('click', function () { overlay.remove(); onReject(); });
    overlay.querySelector('#pf-accept-btn').addEventListener('click', function () {
      overlay.remove();
      onAccept(enhanced);
    });
    overlay.querySelector('#pf-copy-btn').addEventListener('click', function () {
      navigator.clipboard.writeText(enhanced).then(function () {
        var btn = overlay.querySelector('#pf-copy-btn');
        if (btn) btn.textContent = '✅ Copied!';
        setTimeout(function () { if (btn) btn.textContent = '📋 Copy'; }, 2000);
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  // ─── Core Enhancement Logic ──────────────────────────────────────────────────
  var isEnhancing = false;

  function handleAction(action, textOverride) {
    if (isEnhancing) return;

    var prompt = textOverride || getPromptText();
    if (!prompt) {
      showNotification('Please type a prompt first!', 'error');
      return;
    }

    chrome.storage.local.get(['prompter_settings', 'promptforge_settings'], function (result) {
      var settings = result.prompter_settings || result.promptforge_settings || {};
      var apiKey = settings.apiKey || '';

      if (!apiKey) {
        showNotification('Add your Gemini API key in Prompter Settings', 'error');
        setTimeout(function () {
          chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
        }, 1200);
        return;
      }

      isEnhancing = true;
      updateButtonState('loading');

      var systemHints = {
        enhance: 'Enhance this prompt with full prompt engineering. Return ONLY the enhanced prompt text, nothing else.',
        rewrite: 'Completely rewrite this prompt to be clearer, more specific, and more effective. Return ONLY the rewritten prompt.',
        analyze: 'Analyze this prompt and return a JSON object with: {"score": 0-100, "issues": ["..."], "suggestions": ["..."]}',
        summarize: 'Create a concise, clear, AI-optimized version of this prompt. Return ONLY the summary prompt.',
      };

      var notif = showNotification(
        action === 'enhance' ? 'Enhancing your prompt...' :
        action === 'rewrite' ? 'Rewriting prompt...' :
        action === 'analyze' ? 'Analyzing prompt quality...' :
        'Processing...', 'loading'
      );

      chrome.runtime.sendMessage({
        type: 'GET_ENHANCEMENT',
        prompt: prompt,
        apiKey: apiKey,
        model: settings.preferredModel || 'gemini-2.5-flash',
        systemHint: systemHints[action] || systemHints.enhance,
      }, function (response) {
        isEnhancing = false;
        updateButtonState('idle');
        if (notif && notif.parentNode) notif.remove();

        if (chrome.runtime.lastError) {
          showNotification('Extension error: ' + chrome.runtime.lastError.message, 'error');
          return;
        }
        if (!response) {
          showNotification('Failed to connect to background service.', 'error');
          return;
        }
        if (!response.success) {
          showNotification('Error: ' + (response.error || 'Enhancement failed'), 'error');
          return;
        }

        var enhanced = response.text;

        if (action === 'analyze') {
          // Show analysis as notification
          try {
            var analysis = JSON.parse(enhanced);
            showNotification('Score: ' + analysis.score + '/100 | ' + (analysis.issues || []).slice(0, 2).join(', '), 'info');
          } catch (e) {
            showNotification(enhanced.slice(0, 120), 'info');
          }
          return;
        }

        // Show diff preview for enhance/rewrite
        showDiffPreview(prompt, enhanced,
          function (accepted) {
            var ok = setPromptText(accepted);
            if (ok) {
              showNotification('Prompt ' + (action === 'rewrite' ? 'rewritten' : 'enhanced') + '! 🚀', 'success');
              // Save to history
              chrome.runtime.sendMessage({
                type: 'SAVE_HISTORY',
                original: prompt,
                enhanced: enhanced,
                action: action,
                platform: platform.name,
              });
              // Increment badge
              chrome.runtime.sendMessage({ type: 'INCREMENT_BADGE' });
            } else {
              navigator.clipboard.writeText(accepted).then(function () {
                showNotification('Copied to clipboard (could not insert directly)', 'success');
              });
            }
          },
          function () {
            showNotification('Kept original prompt.', 'info');
          }
        );
      });
    });
  }

  // ─── Floating Widget ─────────────────────────────────────────────────────────
  var widget = null;

  function buildWidget() {
    if (widget) return;

    widget = document.createElement('div');
    widget.id = 'prompter-widget';
    widget.setAttribute('style', [
      'position:fixed',
      'bottom:80px',
      'right:20px',
      'z-index:2147483645',
      'display:flex',
      'flex-direction:column',
      'align-items:flex-end',
      'gap:8px',
      'font-family:Inter,system-ui,sans-serif',
    ].join(';'));

    widget.innerHTML = [
      // Platform badge
      '<div id="pf-badge" style="background:linear-gradient(135deg,' + platform.color + '22,' + platform.color + '11);border:1px solid ' + platform.color + '44;color:' + platform.color + ';padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;opacity:0;transition:opacity 0.3s;pointer-events:none">' + platform.name + '</div>',

      // Action buttons (hidden initially)
      '<div id="pf-actions" style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;opacity:0;transform:translateY(10px);transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none">',
        '<button id="pf-rewrite-btn" style="background:rgba(30,41,59,0.95);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);padding:8px 14px;border-radius:12px;font-size:12px;font-weight:600;cursor:pointer;backdrop-filter:blur(20px);transition:all 0.2s;white-space:nowrap">🔄 Rewrite</button>',
        '<button id="pf-analyze-btn" style="background:rgba(30,41,59,0.95);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);padding:8px 14px;border-radius:12px;font-size:12px;font-weight:600;cursor:pointer;backdrop-filter:blur(20px);transition:all 0.2s;white-space:nowrap">🔍 Analyze</button>',
      '</div>',

      // Main button
      '<button id="pf-main-btn" style="',
        'width:54px;height:54px;',
        'border-radius:16px;',
        'border:none;',
        'background:linear-gradient(135deg,#4285F4,#9333EA);',
        'color:white;',
        'font-size:22px;',
        'cursor:pointer;',
        'box-shadow:0 4px 24px rgba(66,133,244,0.45),0 0 0 0 rgba(66,133,244,0.3);',
        'transition:all 0.2s cubic-bezier(0.4,0,0.2,1);',
        'display:flex;align-items:center;justify-content:center;',
        'position:relative;',
        'animation:pf-pulse 3s infinite;',
      '" title="Enhance Prompt (Ctrl+Shift+E)">',
        '<style>',
          '@keyframes pf-pulse{0%,100%{box-shadow:0 4px 24px rgba(66,133,244,0.45),0 0 0 0 rgba(66,133,244,0.3)}50%{box-shadow:0 4px 24px rgba(66,133,244,0.45),0 0 0 8px rgba(66,133,244,0)}}',
          '@keyframes pf-spin{to{transform:rotate(360deg)}}',
          '#pf-main-btn:hover{transform:translateY(-3px) scale(1.06)!important;box-shadow:0 12px 36px rgba(66,133,244,0.6)!important}',
          '#pf-rewrite-btn:hover,#pf-analyze-btn:hover{background:rgba(51,65,85,0.98)!important;color:#f8fafc!important;border-color:rgba(255,255,255,0.2)!important}',
        '</style>',
        '<span id="pf-btn-icon">✨</span>',
        // Online indicator
        '<span style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#34A853;border-radius:50%;border:2px solid #0f172a;font-size:7px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700">AI</span>',
      '</button>',
    ].join('');

    document.body.appendChild(widget);

    var mainBtn = document.getElementById('pf-main-btn');
    var actions = document.getElementById('pf-actions');
    var badge = document.getElementById('pf-badge');
    var rewriteBtn = document.getElementById('pf-rewrite-btn');
    var analyzeBtn = document.getElementById('pf-analyze-btn');
    var expanded = false;

    function toggleExpanded() {
      expanded = !expanded;
      if (expanded) {
        actions.style.opacity = '1';
        actions.style.transform = 'translateY(0)';
        actions.style.pointerEvents = 'auto';
        badge.style.opacity = '1';
      } else {
        actions.style.opacity = '0';
        actions.style.transform = 'translateY(10px)';
        actions.style.pointerEvents = 'none';
        badge.style.opacity = '0';
      }
    }

    mainBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var promptText = getPromptText();
      if (!promptText) {
        toggleExpanded();
        return;
      }
      // If there's a prompt, directly enhance
      if (expanded) {
        toggleExpanded();
      }
      handleAction('enhance');
    });

    mainBtn.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      toggleExpanded();
    });

    rewriteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleExpanded();
      handleAction('rewrite');
    });

    analyzeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleExpanded();
      handleAction('analyze');
    });

    // Close expanded on outside click
    document.addEventListener('click', function () {
      if (expanded) toggleExpanded();
    });
  }

  function updateButtonState(state) {
    var icon = document.getElementById('pf-btn-icon');
    var btn = document.getElementById('pf-main-btn');
    if (!icon || !btn) return;
    if (state === 'loading') {
      icon.textContent = '⟳';
      icon.style.animation = 'pf-spin 0.8s linear infinite';
      btn.style.opacity = '0.8';
      btn.style.cursor = 'wait';
    } else {
      icon.textContent = '✨';
      icon.style.animation = '';
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  }

  // ─── Context Menu Action Listener ─────────────────────────────────────────────
  window.addEventListener('prompter:action', function (e) {
    var detail = e.detail || {};
    var action = detail.action || 'enhance';
    var text = detail.text || '';
    if (text) setPromptText(text);
    handleAction(action);
  });

  // ─── MutationObserver for SPA Navigation ──────────────────────────────────────
  var initTimeout = null;

  function scheduleInit() {
    clearTimeout(initTimeout);
    initTimeout = setTimeout(init, 800);
  }

  function init() {
    buildWidget();
  }

  // Observe DOM for SPA route changes (Gemini, ChatGPT use client routing)
  var observer = new MutationObserver(function (mutations) {
    var shouldReinit = false;
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        shouldReinit = true;
        break;
      }
    }
    if (shouldReinit && !document.getElementById('prompter-widget')) {
      scheduleInit();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: false,
  });

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
