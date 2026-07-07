import { useState } from 'react';
import { motion } from 'framer-motion';
import { Keyboard, HelpCircle, Laptop, Settings, ExternalLink, Zap, Check, Eye } from 'lucide-react';
import { useSettings } from '../contexts';

export function ShortcutsPage() {
  const { settings, updateSettings } = useSettings();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const shortcuts = [
    { keys: 'Ctrl+Shift+E', action: 'Enhance the current prompt inside input box', mac: '⌘+Shift+E' },
    { keys: 'Right-click → Enhance', action: 'Directly analyze or improve selected text', mac: 'Same' },
    { keys: 'Ctrl+Shift+P', action: 'Toggle the right-side Prompter AI assistant panel', mac: '⌘+Shift+P' },
    { keys: 'Esc', action: 'Collapse the active panel or clear questionnaire overlay', mac: 'Same' },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Keyboard <span className="gradient-text">Shortcuts</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage extension hotkeys and triggers for faster prompt workflows
        </p>
      </motion.div>

      {/* Main Settings Card */}
      <div className="glass-card-static p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
            <Keyboard size={16} />
          </div>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Default Keys</h2>
        </div>

        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/10 border border-slate-700/10 hover:border-slate-600/20 transition-all duration-200"
            >
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block mb-0.5">{s.action}</span>
                <span className="text-slate-400 text-[10px]">Mac option: {s.mac}</span>
              </div>
              <div className="flex items-center gap-2">
                <code
                  onClick={() => handleCopy(s.keys)}
                  className="text-xs px-2.5 py-1.5 rounded-xl font-mono cursor-pointer transition-colors hover:bg-slate-700/40"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  title="Click to copy shortcut"
                >
                  {copiedText === s.keys ? 'Copied! ✓' : s.keys}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Links */}
      <div className="glass-card-static p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Custom Shortcuts</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Google Chrome allows you to globally configure or bind custom keyboard combinations to extension commands.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => window.open('chrome://extensions/shortcuts', '_blank')}
            className="btn-primary text-xs py-2 px-4"
          >
            <ExternalLink size={13} /> Bind Custom Keys
          </button>
        </div>
      </div>
    </div>
  );
}
