import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Palette, Cpu, Zap, Keyboard, Download, Upload,
  Eye, EyeOff, Check, AlertCircle, Loader2, ToggleLeft,
} from 'lucide-react';
import { useSettings } from '../contexts';
import { testApiKey, PROVIDERS, PROVIDER_MODELS } from '../ai/gemini';
import { storage } from '../storage';
import { downloadFile } from '../utils/nanoid';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
];

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(66,133,244,0.12), rgba(147,51,234,0.12))' }}>
          <Icon size={15} className="text-primary-500" />
        </div>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Multi-provider state
  const [activeProvider, setActiveProvider] = useState(settings.provider || 'gemini');
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>(() => {
    const keys = { ...(settings.providerKeys || {}) };
    if (!keys.gemini && settings.apiKey) {
      keys.gemini = settings.apiKey;
    }
    return { gemini: '', openai: '', anthropic: '', groq: '', openrouter: '', ...keys };
  });
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>(() => {
    const models = { ...(settings.providerModels || {}) };
    if (!models.gemini && settings.preferredModel) {
      models.gemini = settings.preferredModel;
    }
    return {
      gemini: 'gemini-2.5-flash',
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-5-haiku-20241022',
      groq: 'llama-3.3-70b-versatile',
      openrouter: 'google/gemini-2.5-flash',
      ...models
    };
  });

  const handleSaveProviderConfig = async () => {
    await updateSettings({
      provider: activeProvider,
      providerKeys: apiKeyInputs,
      providerModels: selectedModels,
      apiKey: apiKeyInputs[activeProvider] || '',
      preferredModel: selectedModels[activeProvider] || '',
    });
    setTestStatus('success');
    setTestMessage('Configuration saved successfully! ✓');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const handleTestConnection = async () => {
    const key = apiKeyInputs[activeProvider] || '';
    const model = selectedModels[activeProvider] || '';
    if (!key) {
      setTestStatus('error');
      setTestMessage('Please enter an API Key first.');
      return;
    }
    setTestStatus('testing');
    const result = await testApiKey(key, model, activeProvider);
    if (result.valid) {
      setTestStatus('success');
      setTestMessage(`Connection successful! ✓ (${result.model})`);
      await updateSettings({
        provider: activeProvider,
        providerKeys: apiKeyInputs,
        providerModels: selectedModels,
        apiKey: key,
        preferredModel: model,
      });
    } else {
      setTestStatus('error');
      setTestMessage(result.error || 'Connection failed.');
    }
  };

  const handleExportHistory = async () => {
    const json = await storage.exportHistory();
    downloadFile(json, `prompter-history-${Date.now()}.json`, 'application/json');
  };

  const handleImportHistory = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        await storage.importHistory(text);
        alert('History imported successfully!');
      } catch {
        alert('Invalid history file format.');
      }
    };
    input.click();
  };


  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Configure your Prompter AI experience.
        </p>
      </motion.div>

      {/* AI Providers Section */}
      <Section title="AI Providers & Models" icon={Cpu}>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Configure connection details for your preferred AI models. Prompter AI will route prompts through the active provider.
        </p>

        {/* Active Provider Dropdown */}
        <div className="mb-4">
          <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>
            Active Provider
          </label>
          <select
            className="input-field"
            value={activeProvider}
            onChange={(e) => {
              const p = e.target.value;
              setActiveProvider(p);
              setTestStatus('idle');
              setTestMessage('');
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Provider Configuration */}
        {(() => {
          const currentProvMeta = PROVIDERS.find((p) => p.id === activeProvider);
          const modelsList = PROVIDER_MODELS[activeProvider] || [];
          const currentKey = apiKeyInputs[activeProvider] || '';
          const currentModel = selectedModels[activeProvider] || '';

          return (
            <div className="p-4 rounded-2xl border space-y-4 mb-4" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {currentProvMeta?.label} Config
                </span>
                {currentProvMeta?.doc && (
                  <a
                    href={currentProvMeta.doc}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary-500 hover:underline font-semibold"
                  >
                    Get API Key →
                  </a>
                )}
              </div>

              {/* API Key Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold block" style={{ color: 'var(--text-secondary)' }}>
                  API Key
                </label>
                <div className="relative">
                  <input
                    className="input-field pr-12 font-mono text-sm"
                    type={showKey ? 'text' : 'password'}
                    placeholder={currentProvMeta?.placeholder || 'Enter key...'}
                    value={currentKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setApiKeyInputs((prev) => ({ ...prev, [activeProvider]: val }));
                      setTestStatus('idle');
                    }}
                  />
                  <button
                    className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Model Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-semibold block" style={{ color: 'var(--text-secondary)' }}>
                  Model Selection
                </label>
                <select
                  className="input-field"
                  value={currentModel}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedModels((prev) => ({ ...prev, [activeProvider]: val }));
                    setTestStatus('idle');
                  }}
                >
                  {modelsList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Display */}
              {testStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium"
                  style={{
                    background: testStatus === 'success' ? 'rgba(52,168,83,0.12)' :
                      testStatus === 'error' ? 'rgba(234,67,53,0.12)' : 'var(--bg-card)',
                    color: testStatus === 'success' ? '#34A853' : testStatus === 'error' ? '#EA4335' : 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {testStatus === 'testing' && <Loader2 size={13} className="animate-spin" />}
                  {testStatus === 'success' && <Check size={13} />}
                  {testStatus === 'error' && <AlertCircle size={13} />}
                  {testStatus === 'testing' ? 'Testing credentials connection...' : testMessage}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  className="btn-primary py-2 text-xs"
                  onClick={handleTestConnection}
                  disabled={!currentKey || testStatus === 'testing'}
                >
                  {testStatus === 'testing' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Test Connection
                </button>
                <button
                  className="btn-secondary py-2 text-xs"
                  onClick={handleSaveProviderConfig}
                >
                  Save Config
                </button>
              </div>
            </div>
          );
        })()}
      </Section>


      {/* Preferences */}
      <Section title="Preferences" icon={Zap}>
        <div className="space-y-4">
          {/* Auto enhance */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Auto Enhance</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Automatically enhance prompts after typing</p>
            </div>
            <button
              role="switch"
              aria-checked={settings.autoEnhance}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ background: settings.autoEnhance ? '#4285F4' : 'var(--bg-muted)', border: '1px solid var(--border)' }}
              onClick={() => updateSettings({ autoEnhance: !settings.autoEnhance })}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ left: settings.autoEnhance ? '22px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Floating widget toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Floating Widget</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Show ✨ button on AI platforms</p>
            </div>
            <button
              role="switch"
              aria-checked={(settings as Record<string, unknown>).floatingWidget !== false}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{
                background: (settings as Record<string, unknown>).floatingWidget !== false ? '#4285F4' : 'var(--bg-muted)',
                border: '1px solid var(--border)',
              }}
              onClick={() => updateSettings({ floatingWidget: (settings as Record<string, unknown>).floatingWidget === false } as Parameters<typeof updateSettings>[0])}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ left: (settings as Record<string, unknown>).floatingWidget !== false ? '22px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Language */}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Language</label>
            <select
              className="input-field"
              value={settings.language}
              onChange={e => updateSettings({ language: e.target.value })}
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </Section>

      {/* Keyboard Shortcuts */}
      <Section title="Keyboard Shortcuts" icon={Keyboard}>
        <div className="space-y-2">
          {[
            { keys: 'Ctrl+Shift+E', action: 'Enhance current prompt', mac: '⌘+Shift+E' },
            { keys: 'Right-click → menu', action: 'Enhance / Rewrite / Analyze / Summarize', mac: 'Same' },
          ].map(({ keys, action, mac }) => (
            <div
              key={keys}
              className="flex items-center justify-between p-3 rounded-2xl"
              style={{ background: 'var(--bg-muted)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{action}</span>
              <div className="flex items-center gap-2">
                <code className="text-xs px-2 py-1 rounded-lg font-mono"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                  {keys}
                </code>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Customize keyboard shortcuts in{' '}
          <span
            className="text-primary-500 hover:underline cursor-pointer"
            onClick={() => window.open('chrome://extensions/shortcuts', '_blank')}
          >
            chrome://extensions/shortcuts
          </span>
        </p>
      </Section>

      {/* Extension Integration */}
      <Section title="Extension Status" icon={ToggleLeft}>
        <div className="space-y-3">
          {[
            { label: 'Google Gemini', url: 'https://gemini.google.com', color: '#4285F4' },
            { label: 'ChatGPT', url: 'https://chat.openai.com', color: '#10A37F' },
            { label: 'Claude', url: 'https://claude.ai', color: '#D97706' },
            { label: 'Perplexity', url: 'https://www.perplexity.ai', color: '#6366F1' },
            { label: 'Copilot', url: 'https://copilot.microsoft.com', color: '#0078D4' },
            { label: 'Grok', url: 'https://grok.com', color: '#1DA1F2' },
          ].map(({ label, url, color }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge" style={{ background: 'rgba(52,168,83,0.12)', color: '#34A853', fontSize: '10px' }}>Active</span>
                <button
                  className="text-xs hover:underline"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => window.open(url, '_blank')}
                >
                  Open →
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Data */}
      <Section title="Data Management" icon={Download}>
        <div className="flex gap-3 flex-wrap">
          <button className="btn-secondary" onClick={handleExportHistory}>
            <Download size={15} /> Export History
          </button>
          <button className="btn-secondary" onClick={handleImportHistory}>
            <Upload size={15} /> Import History
          </button>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          History is stored locally in your browser. Export regularly to back up your prompts.
        </p>
      </Section>
    </div>
  );
}
