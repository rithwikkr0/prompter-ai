// Prompter AI — Content Script v4.0 (v2.0 Release Upgrade)
// Right-Side Assistant Panel + Draggable Widget + Smart Interview Mode + Conversation Awareness
// Plain JavaScript only — no TypeScript syntax (MV3 content script)

(function () {
  'use strict';

  if (window.__prompterAILoaded) return;
  window.__prompterAILoaded = true;

  // ─── Persistent Panel State ─────────────────────────────────────────────────
  // Survives panel open/close — cleared only on new enhancement
  window.__prompterState = window.__prompterState || {
    panelOpen: false,
    lastResult: null,     // Full structured AI result
    lastOriginal: '',     // Original prompt text before enhancement
    isFavorite: false,
    showingDiff: false,
  };
  var S = window.__prompterState;

  // ─── Platform Config ────────────────────────────────────────────────────────
  var PLATFORMS = {
    'gemini.google.com': {
      name: 'Gemini', color: '#4285F4',
      inputSelectors: [
        'rich-textarea .ql-editor[contenteditable="true"]',
        'div.ql-editor[contenteditable="true"]',
        'textarea[data-testid="user-input"]',
        '.input-area-container textarea',
      ],
      convUser:      ['.user-query-text', '[data-turn-role="user"] .query-text p', '.user-query .query-text'],
      convAssistant: ['.model-response-text p', '.response-container .content-parts p', '[data-turn-role="model"] p'],
    },
    'chat.openai.com': {
      name: 'ChatGPT', color: '#10A37F',
      inputSelectors: ['#prompt-textarea', 'textarea[data-testid="prompt-textarea"]'],
      convUser:      ['[data-message-author-role="user"] .whitespace-pre-wrap'],
      convAssistant: ['[data-message-author-role="assistant"] .markdown p'],
    },
    'chatgpt.com': {
      name: 'ChatGPT', color: '#10A37F',
      inputSelectors: ['#prompt-textarea', 'textarea[data-testid="prompt-textarea"]'],
      convUser:      ['[data-message-author-role="user"] .whitespace-pre-wrap'],
      convAssistant: ['[data-message-author-role="assistant"] .markdown p'],
    },
    'claude.ai': {
      name: 'Claude', color: '#D97706',
      inputSelectors: ['.ProseMirror[contenteditable="true"]', 'div[contenteditable="true"][data-placeholder]'],
      convUser:      ['.human-turn [data-testid="user-message"]', '.human-turn .contents p'],
      convAssistant: ['.assistant-turn [data-testid="assistant-message"] p', '.assistant-turn .contents p'],
    },
    'www.perplexity.ai': {
      name: 'Perplexity', color: '#6366F1',
      inputSelectors: ['textarea[placeholder]', 'textarea.overflow-auto'],
      convUser:      ['.break-anywhere'],
      convAssistant: ['.prose p'],
    },
    'copilot.microsoft.com': {
      name: 'Copilot', color: '#0078D4',
      inputSelectors: ['textarea[data-testid="chat-input"]', '#searchbox'],
      convUser:      ['.user-message-text'],
      convAssistant: ['.response-message-body p'],
    },
    'x.com': {
      name: 'Grok', color: '#1DA1F2',
      inputSelectors: ['textarea[placeholder*="Grok"]', 'textarea[data-testid="tweetTextarea_0"]'],
      convUser:      [],
      convAssistant: [],
    },
    'grok.com': {
      name: 'Grok', color: '#1DA1F2',
      inputSelectors: ['textarea', 'div[contenteditable="true"]'],
      convUser:      [],
      convAssistant: [],
    },
  };

  var hostname = window.location.hostname;
  var platformKey = Object.keys(PLATFORMS).find(function (k) { return hostname.includes(k); });
  if (!platformKey) return;
  var PLAT = PLATFORMS[platformKey];

  // ─── Input Utilities ────────────────────────────────────────────────────────
  function findInput() {
    for (var i = 0; i < PLAT.inputSelectors.length; i++) {
      var el = document.querySelector(PLAT.inputSelectors[i]);
      if (el) return el;
    }
    return null;
  }

  function getPromptText() {
    var el = findInput();
    if (!el) {
      var sel = window.getSelection();
      return sel && sel.toString().trim() ? sel.toString().trim() : '';
    }
    var tag = el.tagName.toUpperCase();
    if (tag === 'TEXTAREA' || tag === 'INPUT') return el.value.trim();
    return (el.innerText || el.textContent || '').trim();
  }

  function setPromptText(text) {
    var el = findInput();
    if (!el) return false;
    var tag = el.tagName.toUpperCase();
    try {
      if (tag === 'TEXTAREA' || tag === 'INPUT') {
        var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
        if (setter && setter.set) setter.set.call(el, text);
        else el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.focus();
        return true;
      }
      if (el.getAttribute('contenteditable')) {
        el.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
        if (!(el.innerText || '').trim()) {
          el.innerText = text;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return true;
      }
    } catch (e) { /* silent fail */ }
    return false;
  }

  // ─── Conversation Context ───────────────────────────────────────────────────
  function getAttachments() {
    var attachments = [];
    var selectors = [
      '[data-testid*="attachment"]', '[class*="attachment"]',
      '[class*="chip-container"] [class*="chip"]', '[class*="file-chip"]',
      'img[src^="blob:"]', '[class*="file-preview"]', '[class*="file_chip"]',
      '[data-testid="file-chip"]'
    ];
    try {
      selectors.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
          var text = (el.innerText || el.textContent || el.alt || '').trim();
          if (text && text.length > 2 && text.length < 60 && !attachments.includes(text)) {
            attachments.push(text);
          }
        });
      });
    } catch (_) {}
    return attachments;
  }

  function getConversationContext() {
    var parts = [];
    var maxTurns = 8;

    // 1. Context Title
    var title = (document.title || '').replace(/-(?:Gemini|ChatGPT|Claude|Perplexity|Copilot|Grok)/i, '').trim();
    if (title && title.length < 100) {
      parts.push('=== CONVERSATION TITLE ===\n' + title);
    }

    // 2. Active Attachments
    var files = getAttachments();
    if (files.length > 0) {
      parts.push('=== ATTACHED FILES ===\n- ' + files.join('\n- '));
    }

    // 3. Messages History
    function trySelectors(selList) {
      for (var i = 0; i < selList.length; i++) {
        var els = document.querySelectorAll(selList[i]);
        if (els.length > 0) return Array.from(els);
      }
      return [];
    }

    var userEls      = trySelectors(PLAT.convUser);
    var assistantEls = trySelectors(PLAT.convAssistant);

    var historyParts = [];
    var len = Math.min(Math.max(userEls.length, assistantEls.length), maxTurns);
    for (var k = 0; k < len; k++) {
      if (userEls[k]) {
        var ut = (userEls[k].innerText || '').trim().slice(0, 600);
        if (ut) historyParts.push('User: ' + ut);
      }
      if (assistantEls[k]) {
        var at = (assistantEls[k].innerText || '').trim().slice(0, 800);
        if (at) historyParts.push('Assistant: ' + at);
      }
    }

    if (historyParts.length > 0) {
      parts.push('=== CHAT HISTORY ===\n' + historyParts.join('\n\n'));
    }

    return parts.join('\n\n');
  }

  // ─── Notification (top-center, non-blocking) ────────────────────────────────
  var _notif = null;
  function showToast(msg, type) {
    type = type || 'info';
    if (_notif && _notif.parentNode) _notif.remove();
    var c = { info: '#4285F4', success: '#34A853', error: '#EA4335', loading: '#9333EA' };
    var ic = { info: 'ℹ️', success: '✅', error: '❌', loading: '⌛' };
    var d = document.createElement('div');
    d.id = 'pf-toast';
    d.setAttribute('style', 'position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
      'background:rgba(8,14,30,0.97);color:#f8fafc;padding:9px 18px;border-radius:50px;' +
      'font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:500;' +
      'box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid ' + (c[type] || c.info) + '44;' +
      'display:flex;align-items:center;gap:8px;' +
      'animation:pfToastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)');
    d.innerHTML = '<style>@keyframes pfToastIn{from{opacity:0;transform:translateX(-50%) scale(0.9)}to{opacity:1;transform:translateX(-50%) scale(1)}}</style>' +
      ic[type] + ' ' + _esc(msg);
    document.body.appendChild(d);
    _notif = d;
    if (type !== 'loading') {
      setTimeout(function () {
        if (d.parentNode) {
          d.style.transition = 'opacity 0.2s, transform 0.2s';
          d.style.opacity = '0';
          d.style.transform = 'translateX(-50%) scale(0.92)';
          setTimeout(function () { if (d.parentNode) d.remove(); }, 210);
        }
        if (_notif === d) _notif = null;
      }, 3200);
    }
    return d;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/\n/g,'<br>');
  }

  function scoreColor(n) {
    return n >= 70 ? '#34A853' : n >= 40 ? '#FBBC05' : '#EA4335';
  }

  function categoryColor(cat) {
    var m = { coding:'#4285F4', debugging:'#EA4335', 'ai-agents':'#9333EA',
      'image-generation':'#F59E0B', 'video-generation':'#EC4899',
      writing:'#10B981', research:'#06B6D4', marketing:'#F97316',
      business:'#8B5CF6', email:'#14B8A6', seo:'#84CC16', general:'#6B7280' };
    return m[cat] || '#4285F4';
  }

  function scoreRingHTML(score) {
    var r = 22, circ = +(2 * Math.PI * r).toFixed(2);
    var off = +(circ * (1 - score / 100)).toFixed(2);
    var col = scoreColor(score);
    return '<svg width="56" height="56" viewBox="0 0 56 56" style="transform:rotate(-90deg)">' +
      '<circle cx="28" cy="28" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="4.5"/>' +
      '<circle cx="28" cy="28" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="4.5"' +
      ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + off + '"' +
      ' stroke-linecap="round" style="transition:stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)"/>' +
      '</svg>' +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">' +
      '<span style="font-size:15px;font-weight:800;color:' + col + ';line-height:1">' + score + '</span>' +
      '<span style="font-size:9px;color:rgba(255,255,255,0.35);margin-top:1px">/100</span></div>';
  }

  function wordDiffHTML(orig, enh) {
    var origSet = new Set((orig.match(/\b\w{4,}\b/g) || []).map(function (w) { return w.toLowerCase(); }));
    return (enh || '').split(/\b/).map(function (tok) {
      var clean = tok.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.length >= 4 && !origSet.has(clean)) {
        return '<mark style="background:rgba(52,168,83,0.22);color:#86efac;border-radius:3px;padding:0 2px">' + _esc(tok) + '</mark>';
      }
      return _esc(tok);
    }).join('');
  }

  // ─── Panel CSS ──────────────────────────────────────────────────────────────
  var PANEL_CSS = '' +
    '#pf-panel{position:fixed;top:0;right:0;bottom:0;width:390px;z-index:2147483644;' +
    'display:flex;flex-direction:column;' +
    'background:rgba(6,11,26,0.97);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);' +
    'border-left:1px solid rgba(255,255,255,0.07);' +
    'box-shadow:-12px 0 60px rgba(0,0,0,0.7),' +
    '-2px 0 0 rgba(66,133,244,0.08);' +
    'transform:translateX(102%);' +
    'transition:transform 0.38s cubic-bezier(0.34,1.05,0.64,1);' +
    'font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden}' +

    '#pf-panel.pf-open{transform:translateX(0)}' +
    '#pf-panel *{box-sizing:border-box;-webkit-font-smoothing:antialiased}' +

    '#pf-hdr{display:flex;align-items:center;justify-content:space-between;' +
    'padding:13px 15px;border-bottom:1px solid rgba(255,255,255,0.05);' +
    'background:rgba(255,255,255,0.015);flex-shrink:0}' +

    '#pf-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}' +
    '#pf-body::-webkit-scrollbar{width:3px}' +
    '#pf-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}' +

    '#pf-footer{padding:11px 14px;border-top:1px solid rgba(255,255,255,0.05);' +
    'flex-shrink:0;background:rgba(255,255,255,0.008)}' +

    '.pf-card{background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.07);' +
    'border-radius:12px;padding:11px}' +

    '.pf-label{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;' +
    'color:rgba(255,255,255,0.3);margin-bottom:7px}' +

    '.pf-tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;' +
    'font-size:11px;font-weight:600;margin:2px 2px}' +

    '.pf-ibtn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);' +
    'color:rgba(255,255,255,0.55);width:28px;height:28px;border-radius:8px;cursor:pointer;' +
    'display:inline-flex;align-items:center;justify-content:center;font-size:13px;' +
    'transition:all 0.15s;flex-shrink:0}' +
    '.pf-ibtn:hover{background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.18)}' +
    '.pf-ibtn.active{background:rgba(66,133,244,0.18);border-color:rgba(66,133,244,0.35);color:#93c5fd}' +

    '.pf-btn{padding:9px 14px;border-radius:10px;border:none;cursor:pointer;' +
    'font-size:12px;font-weight:600;font-family:inherit;' +
    'display:inline-flex;align-items:center;justify-content:center;gap:5px;' +
    'transition:all 0.15s ease}' +
    '.pf-btn-primary{background:linear-gradient(135deg,#3b82f6,#7c3aed);color:#fff;flex:1}' +
    '.pf-btn-primary:hover{filter:brightness(1.12);transform:translateY(-1px);' +
    'box-shadow:0 4px 16px rgba(59,130,246,0.35)}' +
    '.pf-btn-secondary{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);' +
    'color:rgba(255,255,255,0.65)}' +
    '.pf-btn-secondary:hover{background:rgba(255,255,255,0.09);color:#fff}' +
    '.pf-btn-ghost{background:transparent;border:1px solid rgba(255,255,255,0.06);' +
    'color:rgba(255,255,255,0.4);font-size:11px;padding:7px 10px}' +
    '.pf-btn-ghost:hover{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.7)}' +

    '#pf-enhanced-ta{width:100%;min-height:120px;max-height:240px;resize:vertical;' +
    'background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.09);' +
    'border-radius:9px;padding:10px;' +
    'color:#e2e8f0;font-size:12.5px;line-height:1.65;' +
    'font-family:inherit;outline:none}' +
    '#pf-enhanced-ta:focus{border-color:rgba(59,130,246,0.5);' +
    'box-shadow:0 0 0 3px rgba(59,130,246,0.08)}' +

    '.pf-diff-view{width:100%;min-height:120px;max-height:240px;overflow-y:auto;' +
    'background:rgba(255,255,255,0.04);border:1.5px solid rgba(59,130,246,0.3);' +
    'border-radius:9px;padding:10px;' +
    'color:#e2e8f0;font-size:12.5px;line-height:1.65;' +
    'font-family:inherit}' +

    '.pf-imp-row{display:flex;gap:8px;align-items:flex-start;margin-bottom:7px}' +
    '.pf-imp-icon{width:22px;height:22px;border-radius:6px;flex-shrink:0;' +
    'background:rgba(66,133,244,0.12);display:flex;align-items:center;justify-content:center;font-size:12px}' +

    '@keyframes pfSpin{to{transform:rotate(360deg)}}' +
    '.pf-spin{animation:pfSpin 0.75s linear infinite;display:inline-block}' +
    '@keyframes pfFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
    '.pf-fade-in{animation:pfFadeIn 0.3s ease both}';

  // ─── Panel DOM ──────────────────────────────────────────────────────────────
  var _panel = null;
  var _enhTA  = null;   // enhanced textarea
  var _diffView = null; // diff overlay div

  function _injectCSS() {
    if (document.getElementById('pf-styles')) return;
    var s = document.createElement('style');
    s.id = 'pf-styles';
    s.textContent = PANEL_CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function _createPanel() {
    var existing = document.getElementById('pf-panel');
    if (existing) {
      _panel = existing;
      _enhTA = document.getElementById('pf-enhanced-ta');
      return;
    }
    _panel = null;
    _enhTA = null;
    _diffView = null;

    _injectCSS();

    _panel = document.createElement('div');
    _panel.id = 'pf-panel';
    _panel.setAttribute('role', 'complementary');
    _panel.setAttribute('aria-label', 'Prompter AI Assistant');

    _panel.innerHTML =
      // ── Header ────────────────────────────────────────────────────────────
      '<div id="pf-hdr">' +
        '<div style="display:flex;align-items:center;gap:9px">' +
          '<div style="width:28px;height:28px;border-radius:8px;' +
            'background:linear-gradient(135deg,#4285F4,#9333EA);' +
            'display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">✨</div>' +
          '<div>' +
            '<div style="color:#f1f5f9;font-size:13px;font-weight:700;line-height:1.1">Prompter AI</div>' +
            '<span id="pf-plat-badge" style="font-size:10px;font-weight:600;padding:1px 7px;' +
              'border-radius:10px;background:' + PLAT.color + '1a;color:' + PLAT.color + ';' +
              'border:1px solid ' + PLAT.color + '33;display:inline-block">' + PLAT.name + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:5px">' +
          '<button class="pf-ibtn" id="pf-diff-btn" title="Toggle diff view">⟷</button>' +
          '<button class="pf-ibtn" id="pf-minimize-btn" title="Minimize">−</button>' +
          '<button class="pf-ibtn" id="pf-close-btn" title="Close panel (keeps result)">×</button>' +
        '</div>' +
      '</div>' +

      // ── Scrollable body ────────────────────────────────────────────────────
      '<div id="pf-body">' +

        // Idle state
        '<div id="pf-idle" style="text-align:center;padding:48px 0;color:rgba(255,255,255,0.25)">' +
          '<div style="font-size:40px;margin-bottom:14px;opacity:0.6">✨</div>' +
          '<div style="font-size:13px;font-weight:600;margin-bottom:6px">Prompter AI Ready</div>' +
          '<div style="font-size:11px;line-height:1.6;opacity:0.7">' +
            'Click the ✨ button or press<br>' +
            '<code style="background:rgba(255,255,255,0.08);padding:2px 7px;border-radius:5px;font-size:10px">Ctrl+Shift+E</code>' +
            '<br><br>Your conversation stays fully visible.' +
          '</div>' +
        '</div>' +

        // Loading state
        '<div id="pf-loading" style="display:none;text-align:center;padding:48px 0;color:rgba(255,255,255,0.45)">' +
          '<div class="pf-spin" style="font-size:30px;margin-bottom:14px">⟳</div>' +
          '<div id="pf-loading-msg" style="font-size:13px;font-weight:600;margin-bottom:6px">Analyzing prompt...</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,0.3)">Reading conversation context…</div>' +
        '</div>' +

        // Smart Interview questionnaire state (Step-by-step Wizard)
        '<div id="pf-interview" style="display:none" class="pf-fade-in">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
            '<span style="font-size:12px;font-weight:700;color:#f1f5f9">Smart Prompt Interview</span>' +
            '<span id="pf-wizard-progress" style="font-size:10px;color:rgba(255,255,255,0.4)">Question 1 of 3</span>' +
          '</div>' +
          
          // Progress bar
          '<div style="width:100%;height:3px;background:rgba(255,255,255,0.05);border-radius:2px;margin-bottom:12px;overflow:hidden">' +
            '<div id="pf-wizard-progress-bar" style="width:33%;height:100%;background:linear-gradient(90deg,#4285F4,#9333EA);transition:width 0.3s ease"></div>' +
          '</div>' +
          
          // Active Question Card
          '<div id="pf-interview-question-card" style="margin-bottom:12px"></div>' +
          
          // AI Prompt Builder (Evolving Live)
          '<div class="pf-card" style="margin-bottom:12px;padding:9px;background:rgba(66,133,244,0.02);border-color:rgba(66,133,244,0.12)">' +
            '<div class="pf-label" style="margin-bottom:4px;font-size:8.5px">AI Prompt Builder (Evolving Live)</div>' +
            '<div style="font-size:9.5px;color:rgba(255,255,255,0.4);margin-bottom:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap">Original: <span id="pf-builder-original" style="font-style:italic"></span></div>' +
            '<div style="font-size:9.5px;color:#93c5fd;margin-bottom:4px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap">Answers: <span id="pf-builder-answers">None</span></div>' +
            '<div style="font-size:9.5px;color:rgba(255,255,255,0.3);margin-bottom:2px">Evolving Prompt Draft:</div>' +
            '<textarea id="pf-builder-draft" readonly style="width:100%;min-height:54px;max-height:80px;font-size:10px;font-family:monospace;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:6px;color:rgba(255,255,255,0.65);padding:4px 6px;resize:none;outline:none"></textarea>' +
          '</div>' +
          
          '<div style="display:flex;gap:6px">' +
            '<button class="pf-btn pf-btn-secondary" id="pf-wizard-prev" style="flex:1;font-size:11px;padding:7px 10px">Back</button>' +
            '<button class="pf-btn pf-btn-primary" id="pf-interview-submit" style="flex:2;font-size:11px;padding:7px 10px">✨ Enhance with Context</button>' +
          '</div>' +
          '<button class="pf-btn pf-btn-ghost" id="pf-interview-skip" style="width:100%;margin-top:6px;font-size:10.5px;padding:5px 8px">Skip & Enhance Directly</button>' +
        '</div>' +

        // Result state
        '<div id="pf-result" style="display:none" class="pf-fade-in">' +

          // Score + Intent
          '<div style="display:flex;gap:12px;align-items:center;margin-bottom:2px">' +
            '<div style="position:relative;width:56px;height:56px;flex-shrink:0" id="pf-score-ring"></div>' +
            '<div style="flex:1;min-width:0">' +
              '<div id="pf-intent-tag" style="margin-bottom:4px"></div>' +
              '<div id="pf-confidence" style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:4px"></div>' +
              '<div id="pf-explanation" style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.5"></div>' +
            '</div>' +
          '</div>' +

          // Missing context
          '<div id="pf-missing-card" class="pf-card" style="display:none">' +
            '<div class="pf-label">⚠ Missing Context</div>' +
            '<div id="pf-missing-tags"></div>' +
          '</div>' +

          // Improvements accordion
          '<div id="pf-impr-card" class="pf-card" style="display:none">' +
            '<div class="pf-label" id="pf-impr-toggle" style="cursor:pointer;user-select:none">' +
              '▸ Improvements Applied — <span id="pf-impr-count">0</span>' +
            '</div>' +
            '<div id="pf-impr-list" style="display:none;margin-top:6px"></div>' +
          '</div>' +

          // Learning Mode: Why this prompt became better
          '<div id="pf-why-better-card" class="pf-card" style="display:none;background:rgba(52,168,83,0.02);border-color:rgba(52,168,83,0.12)">' +
            '<div class="pf-label" style="color:#86efac;margin-bottom:6px">Why this prompt became better</div>' +
            '<div id="pf-why-better-list" style="font-size:11px;color:rgba(255,255,255,0.55);line-height:1.5;display:flex;flex-direction:column;gap:4px"></div>' +
          '</div>' +

          // Enhanced prompt
          '<div class="pf-card">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
              '<div class="pf-label" style="margin:0">Enhanced Prompt</div>' +
              '<div style="display:flex;gap:4px">' +
                '<button class="pf-ibtn" id="pf-copy-btn" title="Copy enhanced prompt">📋</button>' +
                '<button class="pf-ibtn" id="pf-fav-btn" title="Favorite">☆</button>' +
              '</div>' +
            '</div>' +
            '<textarea id="pf-enhanced-ta" spellcheck="false" placeholder="Enhanced prompt appears here…"></textarea>' +
          '</div>' +

        '</div>' + // end #pf-result
      '</div>' +  // end #pf-body

      // ── Footer actions ─────────────────────────────────────────────────────
      '<div id="pf-footer">' +
        '<div style="display:flex;gap:6px;margin-bottom:6px">' +
          '<button class="pf-btn pf-btn-primary" id="pf-replace-btn">⬆ Replace Prompt</button>' +
          '<button class="pf-btn pf-btn-secondary" id="pf-again-btn" title="Improve again">🔄</button>' +
        '</div>' +
        '<div style="display:flex;gap:6px">' +
          '<button class="pf-btn pf-btn-ghost" style="flex:1" id="pf-save-btn">💾 Save</button>' +
          '<button class="pf-btn pf-btn-ghost" style="flex:1" id="pf-export-btn">⬇ Export</button>' +
        '</div>' +
        '<div style="margin-top:8px;text-align:center;font-size:10px;color:rgba(255,255,255,0.18)">' +
          'Ctrl+Shift+E · Right-click for more options' +
        '</div>' +
      '</div>';

    document.body.appendChild(_panel);

    _enhTA = document.getElementById('pf-enhanced-ta');

    // ── Wire events ──────────────────────────────────────────────────────────
    document.getElementById('pf-close-btn').addEventListener('click', _closePanel);
    document.getElementById('pf-minimize-btn').addEventListener('click', _closePanel);
    document.getElementById('pf-diff-btn').addEventListener('click', _toggleDiff);
    document.getElementById('pf-copy-btn').addEventListener('click', _copyEnhanced);
    document.getElementById('pf-fav-btn').addEventListener('click', _toggleFav);
    document.getElementById('pf-replace-btn').addEventListener('click', _replacePrompt);
    document.getElementById('pf-again-btn').addEventListener('click', _improveAgain);
    document.getElementById('pf-save-btn').addEventListener('click', _saveHistory);
    document.getElementById('pf-export-btn').addEventListener('click', _exportJSON);

    var imprToggle = document.getElementById('pf-impr-toggle');
    if (imprToggle) {
      imprToggle.addEventListener('click', function () {
        var list = document.getElementById('pf-impr-list');
        if (!list) return;
        var open = list.style.display !== 'none';
        list.style.display = open ? 'none' : 'block';
        var cnt = S.lastResult && S.lastResult.improvements ? S.lastResult.improvements.length : 0;
        imprToggle.innerHTML = (open ? '▸' : '▾') + ' Improvements Applied — <span id="pf-impr-count">' + cnt + '</span>';
      });
    }

    // Restore last result if available
    if (S.lastResult) _showResult(S.lastResult);
  }

  function _openPanel() {
    if (!_panel) _createPanel();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        _panel.classList.add('pf-open');
      });
    });
    S.panelOpen = true;
  }

  function _closePanel() {
    if (_panel) _panel.classList.remove('pf-open');
    S.panelOpen = false;
  }

  // ── Panel state views ──────────────────────────────────────────────────────
  function _setView(which) {
    var views = { idle: '#pf-idle', loading: '#pf-loading', result: '#pf-result', interview: '#pf-interview' };
    Object.keys(views).forEach(function (k) {
      var el = document.getElementById(views[k].slice(1));
      if (el) el.style.display = k === which ? 'block' : 'none';
    });
  }

  function _showLoading(msg) {
    if (!_panel) _createPanel();
    _setView('loading');
    var m = document.getElementById('pf-loading-msg');
    if (m && msg) m.textContent = msg;
    _openPanel();
  }

  function _showResult(result) {
    if (!_panel) _createPanel();
    _setView('result');

    var ring = document.getElementById('pf-score-ring');
    if (ring && result.qualityScore !== undefined) ring.innerHTML = scoreRingHTML(result.qualityScore);

    var intentEl = document.getElementById('pf-intent-tag');
    if (intentEl && result.intent) {
      var col = categoryColor(result.intent.category);
      intentEl.innerHTML = '<span class="pf-tag" style="background:' + col + '1a;color:' + col +
        ';border:1px solid ' + col + '33">' + _esc(result.intent.label || result.intent.category) + '</span>';
    }

    var confEl = document.getElementById('pf-confidence');
    if (confEl && result.intent) confEl.textContent = 'Confidence: ' + result.intent.confidence + '%';

    var expEl = document.getElementById('pf-explanation');
    if (expEl && result.explanation) expEl.textContent = result.explanation;

    var missingCard = document.getElementById('pf-missing-card');
    var missingTags = document.getElementById('pf-missing-tags');
    if (missingCard && missingTags) {
      if (result.missingContext && result.missingContext.length) {
        missingCard.style.display = 'block';
        missingTags.innerHTML = result.missingContext.map(function (m) {
          return '<span class="pf-tag" style="background:rgba(251,188,5,0.1);color:#fde68a;' +
            'border:1px solid rgba(251,188,5,0.2)">' + _esc(m) + '</span>';
        }).join('');
      } else {
        missingCard.style.display = 'none';
      }
    }

    var imprCard = document.getElementById('pf-impr-card');
    var imprList = document.getElementById('pf-impr-list');
    var imprCount = document.getElementById('pf-impr-count');
    if (imprCard && result.improvements && result.improvements.length) {
      imprCard.style.display = 'block';
      if (imprCount) imprCount.textContent = result.improvements.length;
      if (imprList) {
        imprList.innerHTML = result.improvements.map(function (imp) {
          return '<div class="pf-imp-row">' +
            '<div class="pf-imp-icon">' + (imp.icon || '✓') + '</div>' +
            '<div><div style="color:#f1f5f9;font-size:11.5px;font-weight:600;margin-bottom:2px">' +
            _esc(imp.type) + '</div>' +
            '<div style="color:rgba(255,255,255,0.4);font-size:11px;line-height:1.4">' +
            _esc(imp.description) + '</div></div></div>';
        }).join('');
      }
    } else if (imprCard) {
      imprCard.style.display = 'none';
    }

    var whyBetterCard = document.getElementById('pf-why-better-card');
    var whyBetterList = document.getElementById('pf-why-better-list');
    if (whyBetterCard && whyBetterList) {
      if (result.whyBetter && result.whyBetter.length) {
        whyBetterCard.style.display = 'block';
        whyBetterList.innerHTML = result.whyBetter.map(function (item) {
          return '<div style="display:flex;gap:6px;align-items:start">' +
            '<span style="color:#4ade80;font-weight:bold">✓</span>' +
            '<span>' + _esc(item.replace(/^[✓✓]\s*/, '')) + '</span>' +
            '</div>';
        }).join('');
      } else {
        whyBetterCard.style.display = 'none';
      }
    }

    if (_enhTA) {
      _enhTA.value = result.enhancedPrompt || '';
      if (_diffView && _diffView.parentNode) { _diffView.remove(); _diffView = null; }
      _enhTA.style.display = '';
      var diffBtn = document.getElementById('pf-diff-btn');
      if (diffBtn) diffBtn.classList.remove('active');
      S.showingDiff = false;
    }

    var favBtn = document.getElementById('pf-fav-btn');
    if (favBtn) favBtn.textContent = S.isFavorite ? '★' : '☆';

    _openPanel();
  }

  function _showError(msg) {
    if (!_panel) _createPanel();
    _setView('result');
    var r = document.getElementById('pf-result');
    if (r) r.innerHTML =
      '<div style="text-align:center;padding:36px 0;animation:pfFadeIn 0.3s ease">' +
      '<div style="font-size:32px;margin-bottom:10px">❌</div>' +
      '<div style="color:#fca5a5;font-size:13px;font-weight:600;margin-bottom:8px">Enhancement Failed</div>' +
      '<div style="color:rgba(255,255,255,0.35);font-size:11.5px;line-height:1.6;max-width:280px;margin:0 auto">' +
      _esc(msg) + '</div>' +
      '<button id="pf-retry-btn" style="margin-top:14px;padding:8px 18px;border-radius:9px;' +
      'background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.25);' +
      'color:#93c5fd;cursor:pointer;font-size:12px;font-family:inherit;font-weight:600">↩ Try Again</button>' +
      '</div>';
    var retryBtn = document.getElementById('pf-retry-btn');
    if (retryBtn) retryBtn.addEventListener('click', function () { _enhance('enhance'); });
    _openPanel();
  }

  // ─── Toggle Diff View ────────────────────────────────────────────────────────
  function _toggleDiff() {
    if (!S.lastResult || !S.lastOriginal) return;
    S.showingDiff = !S.showingDiff;
    var diffBtn = document.getElementById('pf-diff-btn');
    if (diffBtn) diffBtn.classList.toggle('active', S.showingDiff);

    if (S.showingDiff) {
      _enhTA.style.display = 'none';
      if (!_diffView) {
        _diffView = document.createElement('div');
        _diffView.className = 'pf-diff-view';
        _enhTA.parentNode.insertBefore(_diffView, _enhTA.nextSibling);
      }
      _diffView.innerHTML = wordDiffHTML(S.lastOriginal, S.lastResult.enhancedPrompt || '');
    } else {
      if (_diffView && _diffView.parentNode) { _diffView.remove(); _diffView = null; }
      _enhTA.style.display = '';
    }
  }

  // ─── Panel Actions ───────────────────────────────────────────────────────────
  function _replacePrompt() {
    var text = _enhTA ? _enhTA.value.trim() : '';
    if (!text && S.lastResult) text = S.lastResult.enhancedPrompt || '';
    if (!text) { showToast('No enhanced prompt to insert', 'error'); return; }
    var ok = setPromptText(text);
    if (ok) {
      showToast('Prompt replaced! ✨', 'success');
      _closePanel();
    } else {
      navigator.clipboard.writeText(text).then(function () {
        showToast('Copied to clipboard (direct insert unavailable)', 'success');
      }).catch(function () { showToast('Could not insert or copy prompt', 'error'); });
    }

    // Record that they accepted/improved the prompt
    chrome.runtime.sendMessage({
      type: 'RECORD_ANALYTICS',
      platform: PLAT.name,
      improved: true
    });
  }

  function _copyEnhanced() {
    var text = _enhTA ? _enhTA.value.trim() : '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(function () {
      var btn = document.getElementById('pf-copy-btn');
      if (btn) { btn.textContent = '✅'; setTimeout(function () { btn.textContent = '📋'; }, 1600); }
    }).catch(function () { showToast('Clipboard access denied', 'error'); });
  }

  function _toggleFav() {
    if (!S.lastResult) return;
    S.isFavorite = !S.isFavorite;
    var btn = document.getElementById('pf-fav-btn');
    if (btn) btn.textContent = S.isFavorite ? '★' : '☆';
    _doSaveHistory(S.isFavorite);
    showToast(S.isFavorite ? 'Saved to favorites ★' : 'Removed from favorites', 'info');
  }

  function _improveAgain() {
    var text = _enhTA ? _enhTA.value.trim() : '';
    if (!text) text = S.lastOriginal;
    if (!text) { showToast('No prompt to improve', 'error'); return; }
    _enhance('enhance', text);
  }

  function _saveHistory() {
    if (!S.lastResult) { showToast('Nothing to save yet', 'error'); return; }
    _doSaveHistory(S.isFavorite);
    var btn = document.getElementById('pf-save-btn');
    if (btn) {
      btn.textContent = '✅ Saved!';
      setTimeout(function () { btn.textContent = '💾 Save'; }, 1800);
    }
  }

  function _doSaveHistory(favorite) {
    if (!S.lastResult) return;
    chrome.runtime.sendMessage({
      type: 'SAVE_HISTORY',
      original: S.lastOriginal,
      enhanced: S.lastResult.enhancedPrompt || '',
      action: 'enhance',
      platform: PLAT.name,
      favorite: !!favorite,
    });
  }

  function _exportJSON() {
    if (!S.lastResult) { showToast('No result to export yet', 'error'); return; }
    var data = {
      original: S.lastOriginal,
      enhanced: S.lastResult.enhancedPrompt,
      score: S.lastResult.qualityScore,
      intent: S.lastResult.intent,
      improvements: S.lastResult.improvements,
      missingContext: S.lastResult.missingContext,
      explanation: S.lastResult.explanation,
      platform: PLAT.name,
      timestamp: new Date().toISOString(),
    };
    try {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'prompter-' + Date.now() + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
    } catch (e) { showToast('Export failed', 'error'); }
  }

  // ─── Adaptive Question Banks ────────────────────────────────────────────────
  var INTERVIEW_QUESTIONS = {
    coding: [
      { id: 'language', q: 'Programming Language', opts: ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C++', 'Other'] },
      { id: 'output', q: 'Expected Output', opts: ['Full code implementation', 'Snippet / Code block', 'With step explanation', 'With Unit Tests'] },
      { id: 'framework', q: 'Framework / Environment', opts: ['React', 'Vue', 'Node.js', 'Django', 'FastAPI', 'None / Plain'] }
    ],
    'image-generation': [
      { id: 'style', q: 'Artistic Style', opts: ['Photorealistic', 'Digital illustration', 'Oil painting', 'Vector logo', 'Anime / Manga', '3D render'] },
      { id: 'lighting', q: 'Mood & Lighting', opts: ['Bright & vibrant', 'Dark & moody', 'Cinematic', 'Soft studio lighting', 'Golden hour natural'] },
      { id: 'ratio', q: 'Aspect Ratio', opts: ['1:1 Square', '16:9 Landscape', '9:16 Portrait', '4:3 Standard'] }
    ],
    research: [
      { id: 'level', q: 'Target Audience / Level', opts: ['General public', 'Undergraduate student', 'Professional executive', 'Scientific / Academic researcher'] },
      { id: 'format', q: 'Output Format', opts: ['Executive summary', 'Comprehensive review', 'Bullet point outline', 'Draft report'] },
      { id: 'range', q: 'Date / Time Range', opts: ['Recent (past year)', 'Historical', 'No constraint'] }
    ],
    writing: [
      { id: 'tone', q: 'Tone of Voice', opts: ['Professional', 'Casual / Conversational', 'Creative / Storyteller', 'Academic / Strict', 'Persuasive'] },
      { id: 'length', q: 'Target Length', opts: ['Very short (<150 words)', 'Medium (300-800 words)', 'Long (800+ words)'] },
      { id: 'format', q: 'Writing Format', opts: ['Blog post', 'Formal email', 'Essay / Article', 'Social media caption'] }
    ],
    business: [
      { id: 'goal', q: 'Strategic Objective', opts: ['Inform / Educate', 'Increase conversions', 'Solve a problem', 'Pitch investors'] },
      { id: 'audience', q: 'Target Audience', opts: ['C-Suite / Executives', 'Customers / Clients', 'Internal team', 'General public'] },
      { id: 'tone', q: 'Tone', opts: ['Executive', 'Friendly / Accessible', 'Consultative', 'Data-driven'] }
    ],
    general: [
      { id: 'goal', q: 'Primary Goal', opts: ['Learn a topic', 'Create content', 'Troubleshoot / Debug', 'Generate ideas'] },
      { id: 'format', q: 'Preferred Format', opts: ['Bullet points', 'Detailed guide', 'Structured table', 'Conversational'] },
      { id: 'style', q: 'Response Style', opts: ['Concise & direct', 'Detailed & analytical', 'Creative'] }
    ]
  };

  // ─── Smart Interview State & Rendering (Claude-Style Wizard) ─────────────────
  var _selectedAnswers = {};
  var _rememberChoices = {};
  var _useDefaults = {};

  function _showInterview(questions, prompt, action, category) {
    if (!_panel) _createPanel();
    _setView('interview');
    _openPanel();

    var progressText = document.getElementById('pf-wizard-progress');
    var progressBar = document.getElementById('pf-wizard-progress-bar');
    var questionCard = document.getElementById('pf-interview-question-card');
    
    var builderOriginal = document.getElementById('pf-builder-original');
    var builderAnswers = document.getElementById('pf-builder-answers');
    var builderDraft = document.getElementById('pf-builder-draft');
    
    var prevBtn = document.getElementById('pf-wizard-prev');
    var submitBtn = document.getElementById('pf-interview-submit');
    var skipBtn = document.getElementById('pf-interview-skip');

    var currentStepIndex = 0;
    _selectedAnswers = {};
    _rememberChoices = {};
    _useDefaults = {};

    if (builderOriginal) {
      builderOriginal.textContent = prompt.length > 45 ? prompt.slice(0, 45) + '...' : prompt;
    }

    function updatePromptBuilder() {
      var ansParts = [];
      Object.keys(_selectedAnswers).forEach(function (k) {
        if (_selectedAnswers[k] && _selectedAnswers[k] !== 'Skipped') {
          ansParts.push(k + ': ' + _selectedAnswers[k]);
        }
      });
      if (builderAnswers) {
        builderAnswers.textContent = ansParts.length > 0 ? ansParts.join(', ') : 'None';
      }
      
      var draft = prompt;
      var contextLines = [];
      Object.keys(_selectedAnswers).forEach(function (k) {
        if (_selectedAnswers[k] && _selectedAnswers[k] !== 'Skipped') {
          contextLines.push('- ' + k + ': ' + _selectedAnswers[k]);
        }
      });
      if (contextLines.length > 0) {
        draft += '\n\n=== ADDITIONAL USER PREFERENCES ===\n' + contextLines.join('\n');
      }
      if (builderDraft) {
        builderDraft.value = draft;
      }
    }

    // Load saved preferences to prepopulate or auto-apply
    chrome.runtime.sendMessage({ type: 'GET_INTERVIEW_PREFS' }, function (res) {
      var savedPrefs = (res && res.prefs && res.prefs[category]) || {};
      
      // Pre-fill answers with saved preferences
      questions.forEach(function (q) {
        if (savedPrefs[q.id]) {
          _selectedAnswers[q.id] = savedPrefs[q.id];
          _rememberChoices[q.id] = true; // Auto-enable check since it came from memory
        }
      });
      
      updatePromptBuilder();
      
      // Auto-bypass questions that have defaults saved if they are already answered
      var firstUnanswered = 0;
      for (var i = 0; i < questions.length; i++) {
        if (!_selectedAnswers[questions[i].id]) {
          firstUnanswered = i;
          break;
        }
      }
      
      // If all questions are pre-answered, start at step 0 anyway to review, or last step. Let's start at first unanswered or 0.
      renderStep(firstUnanswered < questions.length ? firstUnanswered : 0);
    });

    function renderStep(stepIndex) {
      currentStepIndex = stepIndex;
      var totalSteps = questions.length;
      
      if (progressText) {
        progressText.textContent = 'Question ' + (stepIndex + 1) + ' of ' + totalSteps;
      }
      if (progressBar) {
        progressBar.style.width = ((stepIndex + 1) / totalSteps * 100) + '%';
      }
      if (prevBtn) {
        prevBtn.style.display = stepIndex === 0 ? 'none' : 'block';
      }

      var q = questions[stepIndex];
      questionCard.innerHTML = '';

      var cardInner = document.createElement('div');
      cardInner.className = 'pf-card';
      cardInner.style.padding = '10px';
      cardInner.style.marginBottom = '6px';

      var qTitle = document.createElement('div');
      qTitle.className = 'pf-label';
      qTitle.style.marginBottom = '6px';
      qTitle.textContent = q.question;
      cardInner.appendChild(qTitle);

      var pillsContainer = document.createElement('div');
      pillsContainer.style.display = 'flex';
      pillsContainer.style.flexWrap = 'wrap';
      pillsContainer.style.gap = '5px';
      pillsContainer.style.marginBottom = '8px';

      var otherContainer = document.createElement('div');
      otherContainer.style.marginTop = '6px';
      otherContainer.style.display = 'none';

      var otherInput = document.createElement('input');
      otherInput.type = 'text';
      otherInput.placeholder = 'Type custom value...';
      otherInput.style.cssText = 'padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.25);color:#fff;font-size:11px;width:100%;outline:none';
      otherContainer.appendChild(otherInput);

      var selectedVal = _selectedAnswers[q.id] || '';

      // Render standard option pills
      q.options.forEach(function (opt) {
        var pill = document.createElement('span');
        pill.textContent = opt;
        pill.style.cssText = 'font-size:10.5px;padding:5px 9px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);cursor:pointer;transition:all 0.15s;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.6)';

        if (selectedVal === opt) {
          pill.style.background = 'rgba(66, 133, 244, 0.15)';
          pill.style.color = '#93c5fd';
          pill.style.borderColor = 'rgba(66, 133, 244, 0.4)';
        }

        pill.addEventListener('click', function () {
          _selectedAnswers[q.id] = opt;
          otherContainer.style.display = 'none';
          updatePillSelection(opt);
          updatePromptBuilder();
          savePrefsIfChecked(q.id, opt);
          
          // Auto-advance if not the last question
          if (stepIndex < totalSteps - 1) {
            setTimeout(function () {
              renderStep(stepIndex + 1);
            }, 250);
          }
        });

        pillsContainer.appendChild(pill);
      });

      // Render "Other..." pill
      var otherPill = document.createElement('span');
      otherPill.textContent = 'Other...';
      otherPill.style.cssText = 'font-size:10.5px;padding:5px 9px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);cursor:pointer;transition:all 0.15s;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.6)';
      
      var isCustomValue = selectedVal && !q.options.includes(selectedVal) && selectedVal !== 'Skipped';
      if (isCustomValue) {
        otherPill.style.background = 'rgba(66, 133, 244, 0.15)';
        otherPill.style.color = '#93c5fd';
        otherPill.style.borderColor = 'rgba(66, 133, 244, 0.4)';
        otherContainer.style.display = 'block';
        otherInput.value = selectedVal;
      }

      otherPill.addEventListener('click', function () {
        updatePillSelection('Other...');
        otherContainer.style.display = 'block';
        otherInput.focus();
      });
      pillsContainer.appendChild(otherPill);

      // Render "Skip" pill
      var skipPill = document.createElement('span');
      skipPill.textContent = 'Skip';
      skipPill.style.cssText = 'font-size:10.5px;padding:5px 9px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);cursor:pointer;transition:all 0.15s;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.6)';
      
      if (selectedVal === 'Skipped') {
        skipPill.style.background = 'rgba(255,255,255,0.08)';
        skipPill.style.color = 'rgba(255,255,255,0.85)';
      }

      skipPill.addEventListener('click', function () {
        _selectedAnswers[q.id] = 'Skipped';
        otherContainer.style.display = 'none';
        updatePillSelection('Skip');
        updatePromptBuilder();
        
        // Auto-advance
        if (stepIndex < totalSteps - 1) {
          setTimeout(function () {
            renderStep(stepIndex + 1);
          }, 250);
        }
      });
      pillsContainer.appendChild(skipPill);

      otherInput.addEventListener('input', function () {
        _selectedAnswers[q.id] = otherInput.value;
        updatePromptBuilder();
        savePrefsIfChecked(q.id, otherInput.value);
      });

      cardInner.appendChild(pillsContainer);
      cardInner.appendChild(otherContainer);

      // Memory settings (Remember choice & Use as default)
      var memoryContainer = document.createElement('div');
      memoryContainer.style.cssText = 'display:flex;gap:12px;align-items:center;margin-top:10px;border-top:1px solid rgba(255,255,255,0.05);padding-top:8px';

      var rememberLabel = document.createElement('label');
      rememberLabel.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;font-size:10px;color:rgba(255,255,255,0.45)';
      var rememberCb = document.createElement('input');
      rememberCb.type = 'checkbox';
      rememberCb.style.cssText = 'width:11px;height:11px;margin:0';
      rememberCb.checked = !!_rememberChoices[q.id];
      rememberCb.addEventListener('change', function () {
        _rememberChoices[q.id] = rememberCb.checked;
        if (rememberCb.checked && _selectedAnswers[q.id]) {
          savePrefsIfChecked(q.id, _selectedAnswers[q.id]);
        }
      });
      rememberLabel.appendChild(rememberCb);
      rememberLabel.appendChild(document.createTextNode('Remember choice'));

      var defaultLabel = document.createElement('label');
      defaultLabel.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;font-size:10px;color:rgba(255,255,255,0.45)';
      var defaultCb = document.createElement('input');
      defaultCb.type = 'checkbox';
      defaultCb.style.cssText = 'width:11px;height:11px;margin:0';
      defaultCb.checked = !!_useDefaults[q.id];
      defaultCb.addEventListener('change', function () {
        _useDefaults[q.id] = defaultCb.checked;
        if (defaultCb.checked && _selectedAnswers[q.id]) {
          savePrefsIfChecked(q.id, _selectedAnswers[q.id]);
        }
      });
      defaultLabel.appendChild(defaultCb);
      defaultLabel.appendChild(document.createTextNode('Use as default'));

      memoryContainer.appendChild(rememberLabel);
      memoryContainer.appendChild(defaultLabel);
      cardInner.appendChild(memoryContainer);

      questionCard.appendChild(cardInner);

      function updatePillSelection(targetPillText) {
        Array.from(pillsContainer.children).forEach(function (sib) {
          var active = sib.textContent === targetPillText;
          sib.style.background = active ? 'rgba(66, 133, 244, 0.15)' : 'rgba(255,255,255,0.02)';
          sib.style.color = active ? '#93c5fd' : 'rgba(255,255,255,0.6)';
          sib.style.borderColor = active ? 'rgba(66, 133, 244, 0.4)' : 'rgba(255,255,255,0.08)';
        });
      }

      function savePrefsIfChecked(qid, val) {
        if (_rememberChoices[qid] || _useDefaults[qid]) {
          chrome.runtime.sendMessage({
            type: 'SAVE_INTERVIEW_PREFS',
            category: category,
            answers: { [qid]: val }
          });
        }
      }
    }

    // Wire navigation actions
    var newPrev = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    prevBtn = newPrev;
    prevBtn.addEventListener('click', function () {
      if (currentStepIndex > 0) {
        renderStep(currentStepIndex - 1);
      }
    });

    var newSubmit = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
    submitBtn = newSubmit;
    submitBtn.addEventListener('click', function () {
      var contextParts = [];
      Object.keys(_selectedAnswers).forEach(function (key) {
        if (_selectedAnswers[key] && _selectedAnswers[key] !== 'Skipped') {
          contextParts.push(key + ': ' + _selectedAnswers[key]);
        }
      });
      var contextAnnotation = '';
      if (contextParts.length > 0) {
        contextAnnotation = '\n\n=== ADDITIONAL USER PREFERENCES ===\n- ' + contextParts.join('\n- ');
      }

      _doEnhance(prompt, action, contextAnnotation, true, true);
    });

    var newSkip = skipBtn.cloneNode(true);
    skipBtn.parentNode.replaceChild(newSkip, skipBtn);
    skipBtn = newSkip;
    skipBtn.addEventListener('click', function () {
      _doEnhance(prompt, action, '', false, true);
    });
  }

  // ─── Core Enhancement Logic ──────────────────────────────────────────────────
  var _busy = false;

  function _enhance(action, textOverride) {
    if (_busy) return;
    action = action || 'enhance';

    var prompt = textOverride || getPromptText();
    if (!prompt) {
      showToast('Please type a prompt first!', 'error');
      _openPanel();
      return;
    }

    _doEnhance(prompt, action, '', false, false);
  }

  function _doEnhance(prompt, action, contextAnnotation, interviewUsed, skipInterview) {
    chrome.storage.local.get(['prompter_settings', 'promptforge_settings'], function (stored) {
      var cfg = stored.prompter_settings || stored.promptforge_settings || {};
      var provider = cfg.provider || 'gemini';
      var apiKey = (cfg.providerKeys && cfg.providerKeys[provider]) || cfg.apiKey || '';
      var model = (cfg.providerModels && cfg.providerModels[provider]) || cfg.preferredModel || '';

      if (!apiKey) {
        _showError(
          'No API key configured for ' + provider.charAt(0).toUpperCase() + provider.slice(1) + '.\n\n' +
          'Open Settings → API Configuration → add your key.\n\n' +
          'Keys are stored locally and never shared.'
        );
        return;
      }

      _busy = true;
      S.isFavorite = false;
      S.showingDiff = false;

      if (_diffView && _diffView.parentNode) { _diffView.remove(); _diffView = null; }
      var diffBtn = document.getElementById('pf-diff-btn');
      if (diffBtn) diffBtn.classList.remove('active');

      _updateWidgetState('loading');
      _showLoading(
        action === 'rewrite' ? 'Rewriting prompt…' :
        action === 'analyze' ? 'Analyzing quality…' : 'Enhancing prompt…'
      );

      var convCtx = getConversationContext();

      chrome.runtime.sendMessage({
        type: 'GET_ENHANCEMENT',
        prompt: prompt + (contextAnnotation || ''),
        apiKey: apiKey,
        model: model,
        provider: provider,
        fullAnalysis: true,
        conversationContext: convCtx,
        action: action,
        skipInterview: !!skipInterview,
      }, function (resp) {
        _busy = false;
        _updateWidgetState('idle');

        if (chrome.runtime.lastError) {
          var errMsg = chrome.runtime.lastError.message || '';
          if (/network|fetch|offline/i.test(errMsg)) {
            _showError('No internet connection. Please check your network and try again.');
          } else {
            _showError('Extension error: ' + errMsg + '\n\nTry reloading the page.');
          }
          return;
        }
        if (!resp) { _showError('Background service unavailable. Try reloading the page.'); return; }
        if (!resp.success) { _showError(resp.error || 'Enhancement failed. Please check your API key in Settings.'); return; }

        // If the model recommends dynamic interview questions and we are not skipping them, transition to the interview wizard!
        if (!skipInterview && resp.result && resp.result.interviewQuestions && resp.result.interviewQuestions.length > 0) {
          _showInterview(resp.result.interviewQuestions, prompt, action, resp.result.intent.category || 'general');
          return;
        }

        S.lastOriginal = prompt;
        S.lastResult = resp.result || {
          qualityScore: 72,
          intent: { category: 'general', confidence: 75, label: 'General' },
          missingContext: [],
          improvements: [],
          enhancedPrompt: resp.text || prompt,
          explanation: 'Prompt enhanced successfully.',
        };

        _showResult(S.lastResult);

        chrome.runtime.sendMessage({ type: 'INCREMENT_BADGE' });
        chrome.runtime.sendMessage({
          type: 'SAVE_HISTORY',
          original: prompt,
          enhanced: S.lastResult.enhancedPrompt,
          action: action,
          platform: PLAT.name,
        });

        // Record initial analytics event
        chrome.runtime.sendMessage({
          type: 'RECORD_ANALYTICS',
          platform: PLAT.name,
          provider: provider,
          action: action,
          category: S.lastResult.intent.category || 'general',
          qualityScore: S.lastResult.qualityScore || 0,
          improved: false,
          interviewUsed: !!interviewUsed
        });
      });
    });
  }

  // ─── Floating Widget ─────────────────────────────────────────────────────────
  var _widget = null;

  function _buildWidget() {
    var existing = document.getElementById('pf-widget');
    if (existing) {
      _widget = existing;
      return;
    }
    _widget = null;

    var CSS = '' +
      '<style>' +
      '@keyframes pfWPulse{0%,100%{box-shadow:0 4px 20px rgba(66,133,244,0.4),0 0 0 0 rgba(66,133,244,0.15)}' +
      '60%{box-shadow:0 4px 20px rgba(66,133,244,0.4),0 0 0 8px rgba(66,133,244,0)}}' +
      '@keyframes pfWSpin{to{transform:rotate(360deg)}}' +
      '#pf-widget{position:fixed;bottom:20px;right:20px;z-index:2147483645;' +
      'display:flex;flex-direction:column;align-items:flex-end;gap:7px;' +
      'font-family:Inter,system-ui,sans-serif;cursor:grab}' +
      '#pf-widget:active{cursor:grabbing}' +
      '#pf-widget-subs{display:flex;flex-direction:column;gap:5px;align-items:flex-end;' +
      'opacity:0;transform:translateY(10px) scale(0.97);pointer-events:none;' +
      'transition:opacity 0.2s,transform 0.2s cubic-bezier(0.34,1.56,0.64,1)}' +
      '#pf-widget-subs.pf-xs-open{opacity:1;transform:none;pointer-events:auto}' +
      '.pf-ws-btn{background:rgba(8,14,30,0.96);color:rgba(255,255,255,0.75);' +
      'border:1px solid rgba(255,255,255,0.1);padding:6px 13px;border-radius:9px;' +
      'font-size:11px;font-weight:600;cursor:pointer;backdrop-filter:blur(20px);' +
      'transition:all 0.15s;white-space:nowrap;font-family:inherit}' +
      '.pf-ws-btn:hover{background:rgba(20,30,50,0.98);color:#fff;border-color:rgba(255,255,255,0.2)}' +
      '#pf-main-widget-btn{width:50px;height:50px;border-radius:14px;border:none;' +
      'background:linear-gradient(135deg,#4285F4,#9333EA);color:#fff;font-size:20px;' +
      'cursor:pointer;animation:pfWPulse 3.5s infinite;' +
      'transition:transform 0.2s,filter 0.2s;' +
      'display:flex;align-items:center;justify-content:center;position:relative}' +
      '#pf-main-widget-btn:hover{transform:translateY(-2px) scale(1.06);filter:brightness(1.15)}' +
      '</style>';

    _widget = document.createElement('div');
    _widget.id = 'pf-widget';
    _widget.innerHTML = CSS +
      '<div id="pf-widget-subs">' +
        '<button class="pf-ws-btn" id="pf-ws-analyze">🔍 Analyze</button>' +
        '<button class="pf-ws-btn" id="pf-ws-rewrite">🔄 Rewrite</button>' +
        '<button class="pf-ws-btn" id="pf-ws-templates">🗂️ Templates</button>' +
        '<button class="pf-ws-btn" id="pf-ws-settings">⚙️ Settings</button>' +
        '<button class="pf-ws-btn" id="pf-ws-panel" ' +
          'style="background:rgba(66,133,244,0.12);border-color:rgba(66,133,244,0.25);color:#93c5fd">' +
          '📊 Assistant Panel</button>' +
      '</div>' +
      '<button id="pf-main-widget-btn" title="Enhance Prompt — Ctrl+Shift+E">' +
        '<span style="font-size:8px;position:absolute;top:2px;opacity:0.35">⠿</span>' +
        '<span id="pf-wi">✨</span>' +
      '</button>';

    document.body.appendChild(_widget);
    _widget.style.display = 'flex';

    // Restore saved widget coordinates
    chrome.storage.local.get(['prompter_widget_positions'], function (res) {
      var positions = res.prompter_widget_positions || {};
      var pos = positions[hostname];
      if (pos && pos.top !== undefined && pos.left !== undefined) {
        _widget.style.top = pos.top + 'px';
        _widget.style.left = pos.left + 'px';
        _widget.style.bottom = 'auto';
        _widget.style.right = 'auto';
      }
    });

    var mainBtn = document.getElementById('pf-main-widget-btn');
    var subsEl  = document.getElementById('pf-widget-subs');
    var _expanded = false;

    function toggleSubs() {
      _expanded = !_expanded;
      subsEl.classList.toggle('pf-xs-open', _expanded);
    }

    var isDragging = false;
    var startX, startY, initialLeft, initialTop;

    // Draggable behavior on mousedown
    mainBtn.addEventListener('mousedown', function (e) {
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = _widget.offsetLeft;
      initialTop = _widget.offsetTop;

      function onMouseMove(moveEv) {
        var dx = moveEv.clientX - startX;
        var dy = moveEv.clientY - startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isDragging = true;
          _widget.style.left = (initialLeft + dx) + 'px';
          _widget.style.top = (initialTop + dy) + 'px';
          _widget.style.bottom = 'auto';
          _widget.style.right = 'auto';
        }
      }

      function onMouseUp(upEv) {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        
        if (isDragging) {
          var pos = { top: _widget.offsetTop, left: _widget.offsetLeft };
          chrome.storage.local.get(['prompter_widget_positions'], function(res) {
            var positions = res.prompter_widget_positions || {};
            positions[hostname] = pos;
            chrome.storage.local.set({ prompter_widget_positions: positions });
          });
        }
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    mainBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isDragging) return; 
      if (getPromptText()) {
        if (_expanded) toggleSubs();
        _enhance('enhance');
      } else {
        toggleSubs();
      }
    });

    mainBtn.addEventListener('contextmenu', function (e) { e.preventDefault(); toggleSubs(); });

    document.getElementById('pf-ws-analyze').addEventListener('click', function (e) {
      e.stopPropagation(); toggleSubs(); _enhance('analyze');
    });
    document.getElementById('pf-ws-rewrite').addEventListener('click', function (e) {
      e.stopPropagation(); toggleSubs(); _enhance('rewrite');
    });
    document.getElementById('pf-ws-templates').addEventListener('click', function (e) {
      e.stopPropagation(); toggleSubs();
      chrome.runtime.sendMessage({ type: 'OPEN_ROUTE', route: '/templates' });
    });
    document.getElementById('pf-ws-settings').addEventListener('click', function (e) {
      e.stopPropagation(); toggleSubs();
      chrome.runtime.sendMessage({ type: 'OPEN_ROUTE', route: '/settings' });
    });
    document.getElementById('pf-ws-panel').addEventListener('click', function (e) {
      e.stopPropagation(); toggleSubs();
      if (S.panelOpen) _closePanel(); else _openPanel();
    });

    document.addEventListener('click', function () { if (_expanded) toggleSubs(); }, true);
  }

  function _updateWidgetState(s) {
    var icon = document.getElementById('pf-wi');
    var btn  = document.getElementById('pf-main-widget-btn');
    if (!icon || !btn) return;
    if (s === 'loading') {
      icon.style.animation = 'pfWSpin 0.75s linear infinite';
      icon.textContent = '⟳';
      btn.style.cursor = 'wait';
    } else {
      icon.style.animation = '';
      icon.textContent = '✨';
      btn.style.cursor = 'pointer';
    }
  }

  function _positionWidget(inputEl) {
    if (!_widget) _buildWidget();
    _widget.style.display = 'flex';
  }

  // ─── Focus Listener — highlight widget when prompt is focused ────────────────
  document.addEventListener('focus', function (e) {
    var target = e.target;
    if (!_widget) return;
    for (var i = 0; i < PLAT.inputSelectors.length; i++) {
      if (target.matches && target.matches(PLAT.inputSelectors[i])) {
        var btn = document.getElementById('pf-main-widget-btn');
        if (btn) {
          btn.style.filter = 'brightness(1.15) saturate(1.3)';
          setTimeout(function() { if (btn) btn.style.filter = ''; }, 600);
        }
        break;
      }
    }
  }, true);

  // ─── Custom Event Listener (context menu / keyboard shortcut) ─────────────
  window.addEventListener('prompter:action', function (e) {
    var d = (e.detail) || {};
    var action = d.action || 'enhance';
    var text = d.text || '';
    if (text) setPromptText(text);
    _enhance(action, text || undefined);
  });

  // ─── History API Hook for SPA Navigation ────────────────────────────────────
  (function (history) {
    if (!history) return;
    var pushState = history.pushState;
    history.pushState = function () {
      var ret = pushState.apply(history, arguments);
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    };
    var replaceState = history.replaceState;
    history.replaceState = function () {
      var ret = replaceState.apply(history, arguments);
      window.dispatchEvent(new Event('replacestate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    };
    window.addEventListener('popstate', function () {
      window.dispatchEvent(new Event('locationchange'));
    });
  })(window.history);

  window.addEventListener('locationchange', function () {
    _scheduleInit();
  });

  // ─── SPA Navigation & DOM Monitoring — MutationObserver ───────────────────────
  var _initTimer = null;
  function _scheduleInit() {
    clearTimeout(_initTimer);
    _initTimer = setTimeout(function () {
      if (!document.getElementById('pf-widget')) { _widget = null; }
      if (!document.getElementById('pf-panel'))  { _panel = null; _enhTA = null; _diffView = null; }
      _buildWidget();
      if (S.lastResult && !_panel) { _createPanel(); }
    }, 200);
  }

  // Observe documentElement (captures body swapping/re-render cleanly)
  var _observerTimer = null;
  var observer = new MutationObserver(function () {
    if (_observerTimer) return;
    _observerTimer = setTimeout(function () {
      _observerTimer = null;
      if (!document.getElementById('pf-widget')) {
        _widget = null;
        _scheduleInit();
      }
    }, 350);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // ─── Boot ──────────────────────────────────────────────────────────────────
  function _init() {
    _buildWidget();
    if (S.lastResult) { _createPanel(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();
