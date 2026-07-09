// Prompter AI — Background Service Worker v2.0
// Manifest V3 — No DOM access, handles messaging, API calls, storage

// Configure side panel behavior or fallback to popup
function configureSidePanel() {
  if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(function(e) {
      console.warn('Failed to set side panel behavior, falling back to popup', e);
      chrome.action.setPopup({ popup: 'popup.html' });
    });
  } else if (typeof chrome !== 'undefined' && chrome.action) {
    chrome.action.setPopup({ popup: 'popup.html' });
  }
}

// ─── Install / Update ──────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(function (details) {
  // Set up context menus
  setupContextMenus();
  
  // Set side panel or popup behavior
  configureSidePanel();

  // First install → open onboarding (opened in a tab context)
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html') + '?context=tab#/onboarding',
    });
  }

  // Initialize badge
  chrome.action.setBadgeBackgroundColor({ color: '#4285F4' });
});

// Configure on startup/initialization too
configureSidePanel();


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

  // ── Keep alive heartbeat ──
  if (message.type === 'KEEPALIVE') {
    sendResponse({ alive: true });
    return false;
  }

  // ── Open specific dashboard route in a new tab ──
  if (message.type === 'OPEN_ROUTE') {
    var route = message.route || '/';
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') + '?context=tab#' + route });
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

  // ── AI Enhancement — Multi-Provider Support ──
  if (message.type === 'GET_ENHANCEMENT') {
    var prompt          = message.prompt || '';
    var provider        = message.provider || 'gemini';
    var apiKey          = message.apiKey || '';
    var model           = message.model || '';
    var convCtx         = message.conversationContext || '';
    var action          = message.action || 'enhance';

    if (!apiKey) {
      sendResponse({ success: false, error: 'No API key configured for ' + provider + '. Please add it in Settings.' });
      return false;
    }

    // Determine default models if none specified
    if (!model) {
      if (provider === 'gemini') model = 'gemini-2.5-flash';
      else if (provider === 'openai') model = 'gpt-4o-mini';
      else if (provider === 'groq') model = 'llama-3.3-70b-versatile';
      else if (provider === 'openrouter') model = 'google/gemini-2.5-flash';
      else if (provider === 'anthropic') model = 'claude-3-5-haiku-20241022';
    }

    // ── System instructions ───────────────────────────────────────────────────
    var FULL_SYSTEM = [
      'You are Prompter AI, a world-class prompt engineering assistant.',
      'Your job is to analyze and transform user prompts into highly effective, precise instructions.',
      '',
      'INSTRUCTIONS:',
      '1. First, analyze the prompt: intent, completeness, missing context, and estimated quality (0-100 score).',
      '2. If the prompt is highly complete and specific (Quality Score >= 90):',
      '   - Enhance it immediately.',
      '   - Respond with "enhancedPrompt" and "explanation".',
      '   - Do not provide "interviewQuestions".',
      '3. If the prompt lacks critical context (Quality Score < 90):',
      '   - Generate a short, highly relevant interactive interview containing 2 to 3 targeted multiple choice questions (maximum 5, prefer 2-3) to clarify what is missing (e.g. framework, target audience, tone, programming language, constraints).',
      '   - Return them in the "interviewQuestions" field matching the schema.',
      '   - Still attempt a base level "enhancedPrompt" using assumptions.',
      '4. In all cases, include a "whyBetter" array containing 2 to 4 checkmark bullet points explaining exactly why this prompt is better (or will be better) based on prompt engineering principles (e.g., "✓ Added target audience", "✓ Configured specific role assumptions", "✓ Established success criteria").',
      '5. Read any provided context. If the user already specified details in the conversation history or query, DO NOT ask for them again.',
      '',
      'IMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no extra text.',
      '',
      'JSON schema to follow exactly:',
      '{',
      '  "qualityScore": <integer 0-100>,',
      '  "intent": {',
      '    "category": "<one of: coding|debugging|ai-agents|image-generation|video-generation|academic-writing|resume|linkedin|email|marketing|seo|social-media|business|startup-pitch|research|translation|cybersecurity|mathematics|data-science|writing|general>",',
      '    "confidence": <integer 0-100>,',
      '    "label": "<human readable category name>"',
      '  },',
      '  "missingContext": ["<item1>", "<item2>"],',
      '  "improvements": [',
      '    { "type": "<improvement type>", "description": "<what was done>", "icon": "<single emoji>" }',
      '  ],',
      '  "enhancedPrompt": "<the fully rewritten, optimized prompt>",',
      '  "explanation": "<1-2 sentence summary of key changes made>",',
      '  "interviewQuestions": [',
      '    { "id": "<unique_question_id>", "question": "<question text>", "options": ["<opt1>", "<opt2>", "<opt3>"] }',
      '  ],',
      '  "whyBetter": ["<checkmark bullet points>"]',
      '}',
    ].join('\n');

    var REWRITE_SYSTEM = [
      'You are Prompter AI. Completely rewrite the given prompt for maximum clarity and effectiveness.',
      'Respond ONLY with valid JSON matching this schema exactly:',
      '{"qualityScore":75,"intent":{"category":"general","confidence":90,"label":"General"},',
      '"missingContext":[],"improvements":[{"type":"Rewrite","description":"Rewritten for clarity","icon":"🔄"}],',
      '"enhancedPrompt":"<full rewritten prompt>","explanation":"Rewritten for better execution"}',
    ].join('\n');

    var ANALYZE_SYSTEM = [
      'You are Prompter AI. Analyze the given prompt quality and provide structured feedback.',
      'Respond ONLY with valid JSON matching this schema exactly:',
      '{"qualityScore":60,"intent":{"category":"general","confidence":90,"label":"General"},',
      '"missingContext":["Target output format"],"improvements":[{"type":"Analysis","description":"Identified missing context","icon":"🔍"}],',
      '"enhancedPrompt":"<improved prompt>","explanation":"Prompt analyzed and scored"}',
    ].join('\n');

    var systemPrompt = action === 'rewrite' ? REWRITE_SYSTEM
                     : action === 'analyze' ? ANALYZE_SYSTEM
                     : FULL_SYSTEM;

    if (message.skipInterview) {
      systemPrompt += '\nFORCE IMMEDIATE ENHANCEMENT: Do not return any "interviewQuestions" in the JSON response. Set "interviewQuestions" to [] or omit it. Immediately rewrite and enhance the prompt.';
    }

    var userMessage = prompt;
    if (convCtx && convCtx.trim()) {
      userMessage =
        '=== CONVERSATION CONTEXT ===\n' + convCtx.trim().slice(0, 2000) +
        '\n\n=== USER PROMPT TO ENHANCE ===\n' + prompt;
    }

    // ── Build API Request ────────────────────────────────────────────────────
    var url = '';
    var headers = { 'Content-Type': 'application/json' };
    var requestBody = {};

    if (provider === 'gemini') {
      url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
      requestBody = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: action === 'analyze' ? 0.3 : 0.7,
          responseMimeType: 'application/json',
        }
      };
    } else if (provider === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = 'Bearer ' + apiKey;
      requestBody = {
        model: model,
        temperature: action === 'analyze' ? 0.3 : 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      };
    } else if (provider === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = 'Bearer ' + apiKey;
      requestBody = {
        model: model,
        temperature: action === 'analyze' ? 0.3 : 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      };
    } else if (provider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = 'Bearer ' + apiKey;
      headers['HTTP-Referer'] = 'https://github.com/rithwikkr0/prompter-ai';
      headers['X-Title'] = 'Prompter AI';
      requestBody = {
        model: model,
        temperature: action === 'analyze' ? 0.3 : 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      };
    } else if (provider === 'anthropic') {
      url = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
      requestBody = {
        model: model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ],
        temperature: action === 'analyze' ? 0.3 : 0.7,
      };
    }

    fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(requestBody) })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (e) {
            var msg = (e && e.error && e.error.message) || (e && e.error) || 'HTTP ' + res.status;
            if (typeof msg === 'object') msg = JSON.stringify(msg);
            throw new Error(msg);
          }).catch(function() {
            throw new Error('HTTP ' + res.status);
          });
        }
        return res.json();
      })
      .then(function (data) {
        var rawText = '';
        if (provider === 'gemini') {
          rawText = data.candidates && data.candidates[0] && data.candidates[0].content &&
                    data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
                    data.candidates[0].content.parts[0].text;
        } else if (provider === 'openai' || provider === 'groq' || provider === 'openrouter') {
          rawText = data.choices && data.choices[0] && data.choices[0].message &&
                    data.choices[0].message.content;
        } else if (provider === 'anthropic') {
          rawText = data.content && data.content[0] && data.content[0].text;
        }

        if (!rawText) throw new Error('Empty response from model API.');

        var jsonStr = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
        var parsed;
        try {
          parsed = JSON.parse(jsonStr);
        } catch (_) {
          parsed = {
            qualityScore: 70,
            intent: { category: 'general', confidence: 70, label: 'General' },
            missingContext: [],
            improvements: [{ type: 'Enhancement', description: 'Prompt enhanced by AI model', icon: '✨' }],
            enhancedPrompt: rawText.trim(),
            explanation: 'Prompt enhanced successfully.',
          };
        }
        sendResponse({ success: true, result: parsed, text: parsed.enhancedPrompt || rawText.trim() });
      })
      .catch(function (err) {
        var msg = err.message || 'Unknown connection error';
        var friendly = msg;
        if (!navigator.onLine || /network|failed to fetch|net::/i.test(msg)) {
          friendly = 'Network unavailable. Please check your internet connection and try again.';
        } else if (msg.includes('429') || /quota|rate.?limit/i.test(msg)) {
          friendly = 'Your ' + provider + ' quota is exhausted. Try again later or switch to another provider in Settings.';
        } else if (msg.includes('401') || msg.includes('403') || /key|unauthorized|invalid/i.test(msg)) {
          friendly = 'Invalid API key for ' + provider + '. Open Settings → API Configuration to update it.';
        } else if (msg.includes('500') || msg.includes('503')) {
          friendly = provider.charAt(0).toUpperCase() + provider.slice(1) + ' service is temporarily unavailable. Please try again in a few minutes.';
        } else {
          friendly = 'API Error (' + provider + '): ' + msg;
        }
        sendResponse({ success: false, error: friendly });
      });


    return true; // async
  }

  // ── Connection Test — Multi-Provider ──
  if (message.type === 'TEST_PROVIDER_CONNECTION') {
    var provider = message.provider || 'gemini';
    var apiKey   = message.apiKey || '';
    var model    = message.model || '';

    if (!apiKey) {
      sendResponse({ valid: false, error: 'API key is required to test connection.' });
      return false;
    }

    var url = '';
    var headers = { 'Content-Type': 'application/json' };
    var requestBody = {};

    if (provider === 'gemini') {
      url = 'https://generativelanguage.googleapis.com/v1beta/models/' + (model || 'gemini-2.5-flash') + ':generateContent?key=' + apiKey;
      requestBody = { contents: [{ role: 'user', parts: [{ text: 'Respond with OK' }] }] };
    } else if (provider === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = 'Bearer ' + apiKey;
      requestBody = { model: model || 'gpt-4o-mini', messages: [{ role: 'user', content: 'Say OK' }] };
    } else if (provider === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = 'Bearer ' + apiKey;
      requestBody = { model: model || 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Say OK' }] };
    } else if (provider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = 'Bearer ' + apiKey;
      requestBody = { model: model || 'google/gemini-2.5-flash', messages: [{ role: 'user', content: 'Say OK' }] };
    } else if (provider === 'anthropic') {
      url = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
      requestBody = { model: model || 'claude-3-5-haiku-20241022', max_tokens: 10, messages: [{ role: 'user', content: 'Say OK' }] };
    }

    fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(requestBody) })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (e) {
            var msg = (e && e.error && e.error.message) || (e && e.error) || 'HTTP ' + res.status;
            if (typeof msg === 'object') msg = JSON.stringify(msg);
            throw new Error(msg);
          }).catch(function() {
            throw new Error('HTTP ' + res.status);
          });
        }
        return res.json();
      })
      .then(function () {
        sendResponse({ valid: true });
      })
      .catch(function (err) {
        var msg = err.message || 'Unknown error';
        var friendly = msg;
        if (msg.includes('429') || /quota|rate.?limit/i.test(msg)) {
          friendly = 'Rate limit reached or quota exhausted for ' + provider;
        } else if (msg.includes('401') || msg.includes('403') || /key|unauthorized|invalid/i.test(msg)) {
          friendly = 'Invalid API key for ' + provider + '. Please verify it.';
        }
        sendResponse({ valid: false, error: friendly });
      });

    return true; // async
  }

  // ── Record analytics event ──
  if (message.type === 'RECORD_ANALYTICS') {
    chrome.storage.local.get(['prompter_analytics'], function(result) {
      var analytics = Array.isArray(result.prompter_analytics) ? result.prompter_analytics : [];
      var entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        date: new Date().toISOString().split('T')[0],
        platform: message.platform || 'unknown',
        provider: message.provider || 'unknown',
        action: message.action || 'enhance',
        category: message.category || 'general',
        qualityScore: message.qualityScore || 0,
        improved: !!message.improved,
        interviewUsed: !!message.interviewUsed,
      };
      analytics.unshift(entry);
      if (analytics.length > 500) analytics = analytics.slice(0, 500);
      chrome.storage.local.set({ prompter_analytics: analytics });
    });
    return false;
  }

  // ── Get analytics ──
  if (message.type === 'GET_ANALYTICS') {
    chrome.storage.local.get(['prompter_analytics'], function(result) {
      sendResponse({ analytics: result.prompter_analytics || [] });
    });
    return true;
  }

  // ── Save interview preferences ──
  if (message.type === 'SAVE_INTERVIEW_PREFS') {
    chrome.storage.local.get(['prompter_interview_prefs'], function(result) {
      var prefs = result.prompter_interview_prefs || {};
      var category = message.category || 'general';
      prefs[category] = Object.assign({}, prefs[category] || {}, message.answers || {});
      chrome.storage.local.set({ prompter_interview_prefs: prefs }, function() {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  // ── Get interview preferences ──
  if (message.type === 'GET_INTERVIEW_PREFS') {
    chrome.storage.local.get(['prompter_interview_prefs'], function(result) {
      sendResponse({ prefs: result.prompter_interview_prefs || {} });
    });
    return true;
  }

  // ── Score Prompt Completeness ──
  if (message.type === 'SCORE_PROMPT') {
    var prompt = message.prompt || '';
    var score = 0;
    
    // 1. Has clear action verb?
    var verbs = /\b(write|create|explain|build|design|analyze|debug|rewrite|draft|summarize|translate|optimize|code|generate|develop|implement|compare|review)\b/i;
    if (verbs.test(prompt)) score += 20;
    
    // 2. Has clear subject/topic?
    var words = prompt.trim().split(/\s+/);
    if (words.length > 3) score += 20;
    
    // 3. Specifies output format?
    var formats = /\b(markdown|code|bullet|list|json|yaml|table|report|summary|essay|guide|step-by-step|pdf|csv)\b/i;
    if (formats.test(prompt)) score += 15;
    
    // 4. Target audience/context?
    var context = /\b(beginner|student|developer|professional|researcher|executive|manager|expert|child|public|for my|for a)\b/i;
    if (context.test(prompt)) score += 15;
    
    // 5. Length > 40 characters?
    if (prompt.length > 40) score += 15;
    
    // 6. Constraints/requirements?
    var constraints = /\b(limit|maximum|minimum|under|only|must|should|avoid|don't|do not|without|using)\b/i;
    if (constraints.test(prompt)) score += 15;

    // Estimate category/intent from keywords
    var category = 'general';
    if (/\b(python|javascript|typescript|js|ts|html|css|react|vue|node|code|programming|function|class|bug|error|exception|debug|compile|rust|golang|c\+\+|java)\b/i.test(prompt)) {
      category = 'coding';
    } else if (/\b(image|picture|photo|art|drawing|painting|style|render|aspect ratio|lighting|visual|illustration)\b/i.test(prompt)) {
      category = 'image-generation';
    } else if (/\b(research|paper|study|academic|thesis|citation|source|journal|literature)\b/i.test(prompt)) {
      category = 'research';
    } else if (/\b(essay|story|article|blog|writing|poem|draft|sentence|grammar|paragraph)\b/i.test(prompt)) {
      category = 'writing';
    } else if (/\b(business|marketing|startup|pitch|sales|kpi|customer|revenue|strategy|product)\b/i.test(prompt)) {
      category = 'business';
    }

    sendResponse({ score: score, category: category });
    return false;
  }

  return false;
});


