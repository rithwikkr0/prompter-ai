import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key, Palette, Cpu, Zap, Globe, Keyboard, Download, Upload,
  Eye, EyeOff, Check, AlertCircle, Loader2, Settings as SettingsIcon,
} from 'lucide-react';
import { useSettings } from '../contexts';
import { testApiKey } from '../ai/gemini';
import { storage } from '../storage';
import { downloadFile } from '../utils/nanoid';

const MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: 'Recommended', color: '#4285F4' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', badge: 'Stable', color: '#34A853' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', badge: 'Powerful', color: '#9333EA' },
];

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
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleSaveKey = async () => {
    await updateSettings({ apiKey: apiKeyInput });
  };

  const handleTestKey = async () => {
    if (!apiKeyInput) return;
    setTestStatus('testing');
    const result = await testApiKey(apiKeyInput, settings.preferredModel);
    if (result.valid) {
      setTestStatus('success');
      setTestMessage(`Connected to ${result.model}`);
      await updateSettings({ apiKey: apiKeyInput });
    } else {
      setTestStatus('error');
      setTestMessage(result.error ?? 'Invalid API key');
    }
    setTimeout(() => setTestStatus('idle'), 4000);
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

      {/* API Key */}
      <Section title="Gemini API Key" icon={Key}>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Get your free API key from{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
            className="text-primary-500 hover:underline font-medium">
            Google AI Studio
          </a>
          . Your key is stored locally and never transmitted to our servers.
        </p>
        <div className="relative mb-3">
          <input
            id="api-key-input"
            className="input-field pr-12 font-mono text-sm"
            type={showKey ? 'text' : 'password'}
            placeholder="AIza..."
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
          />
          <button
            className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {testStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`flex items-center gap-2 p-2.5 rounded-xl mb-3 text-xs font-medium ${
              testStatus === 'success' ? 'text-green-700' :
              testStatus === 'error' ? 'text-red-700' : ''
            }`}
            style={{
              background: testStatus === 'success' ? '#D1FAE5' :
                testStatus === 'error' ? '#FEE2E2' : 'var(--bg-muted)',
              color: testStatus === 'success' ? '#065F46' : testStatus === 'error' ? '#7F1D1D' : 'var(--text-muted)'
            }}
          >
            {testStatus === 'testing' && <Loader2 size={13} className="animate-spin" />}
            {testStatus === 'success' && <Check size={13} />}
            {testStatus === 'error' && <AlertCircle size={13} />}
            {testStatus === 'testing' ? 'Testing connection...' : testMessage}
          </motion.div>
        )}

        <div className="flex gap-2">
          <button className="btn-primary" onClick={handleTestKey} disabled={!apiKeyInput || testStatus === 'testing'}>
            {testStatus === 'testing' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Test & Save
          </button>
          <button className="btn-secondary" onClick={handleSaveKey}>
            Save Key
          </button>
        </div>
      </Section>

      {/* Theme */}
      <Section title="Appearance" icon={Palette}>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'system', 'dark'] as const).map((theme) => (
            <button
              key={theme}
              id={`theme-${theme}`}
              className={`p-3 rounded-2xl border text-sm font-medium transition-all capitalize ${
                settings.theme === theme
                  ? 'border-primary-400 text-primary-500'
                  : ''
              }`}
              style={{
                background: settings.theme === theme ? 'rgba(66,133,244,0.08)' : 'var(--bg-muted)',
                borderColor: settings.theme === theme ? '#4285F4' : 'var(--border)',
                color: settings.theme === theme ? '#4285F4' : 'var(--text-secondary)',
              }}
              onClick={() => updateSettings({ theme })}
            >
              {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🖥️'} {theme}
            </button>
          ))}
        </div>
      </Section>

      {/* AI Model */}
      <Section title="AI Model" icon={Cpu}>
        <div className="space-y-2">
          {MODELS.map((model) => (
            <button
              key={model.value}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                settings.preferredModel === model.value ? 'border-primary-400' : ''
              }`}
              style={{
                background: settings.preferredModel === model.value ? 'rgba(66,133,244,0.06)' : 'var(--bg-muted)',
                borderColor: settings.preferredModel === model.value ? '#4285F4' : 'var(--border)',
              }}
              onClick={() => updateSettings({ preferredModel: model.value })}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: model.color }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{model.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge text-xs text-white" style={{ background: model.color }}>
                  {model.badge}
                </span>
                {settings.preferredModel === model.value && <Check size={14} className="text-primary-500" />}
              </div>
            </button>
          ))}
        </div>
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
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.autoEnhance ? 'bg-primary-500' : ''}`}
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
