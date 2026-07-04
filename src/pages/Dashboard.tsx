import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, TrendingUp, Star, Globe } from 'lucide-react';
import { PromptInput } from '../components/PromptInput';
import { ResultsPanel } from '../components/ResultsPanel';
import { TemplateBrowser } from '../components/TemplateBrowser';
import { useEnhancement } from '../contexts';
import { storage } from '../storage';
import type { HistoryEntry } from '../types';

// Platform name/color map for the active tab badge
const PLATFORM_MAP: Record<string, { name: string; color: string; emoji: string }> = {
  'gemini.google.com': { name: 'Gemini', color: '#4285F4', emoji: '🔵' },
  'chat.openai.com':   { name: 'ChatGPT', color: '#10A37F', emoji: '🟢' },
  'chatgpt.com':       { name: 'ChatGPT', color: '#10A37F', emoji: '🟢' },
  'claude.ai':         { name: 'Claude',  color: '#D97706', emoji: '🟠' },
  'www.perplexity.ai': { name: 'Perplexity', color: '#6366F1', emoji: '🟣' },
  'copilot.microsoft.com': { name: 'Copilot', color: '#0078D4', emoji: '🔷' },
  'x.com':             { name: 'Grok', color: '#1DA1F2', emoji: '🐦' },
  'grok.com':          { name: 'Grok', color: '#1DA1F2', emoji: '🐦' },
};

function useActivePlatform() {
  const [platform, setPlatform] = useState<{ name: string; color: string; emoji: string } | null>(null);

  useEffect(() => {
    // Only works inside the Chrome extension popup
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs?.[0]?.url || '';
      try {
        const hostname = new URL(url).hostname;
        const match = Object.keys(PLATFORM_MAP).find((k) => hostname.includes(k));
        if (match) setPlatform(PLATFORM_MAP[match]);
      } catch {
        // not a valid URL
      }
    });
  }, []);

  return platform;
}

function useHistoryStats() {
  const [stats, setStats] = useState({ total: 0, today: 0, favorites: 0, avgScore: 0 });

  useEffect(() => {
    storage.getHistory().then((history: HistoryEntry[]) => {
      const today = new Date().toDateString();
      const todayCount = history.filter((h) =>
        new Date(h.timestamp).toDateString() === today
      ).length;
      const favorites = history.filter((h) => h.isFavorite).length;
      const scores = history
        .map((h) => h.result?.qualityScore)
        .filter((s): s is number => typeof s === 'number');
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      setStats({ total: history.length, today: todayCount, favorites, avgScore });
    });
  }, []);

  return stats;
}

export function DashboardPage() {
  const [templateOpen, setTemplateOpen] = useState(false);
  const { state } = useEnhancement();
  const activePlatform = useActivePlatform();
  const stats = useHistoryStats();

  const statCards = [
    { label: 'Enhanced Today', value: stats.today.toString(), icon: Sparkles, color: '#4285F4' },
    { label: 'Total Enhanced', value: stats.total.toString(), icon: TrendingUp, color: '#9333EA' },
    { label: 'Avg Quality', value: stats.avgScore > 0 ? `${stats.avgScore}` : '—', icon: Zap, color: '#34A853' },
    { label: 'Favorites', value: stats.favorites.toString(), icon: Star, color: '#FBBC05' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Prompt <span className="gradient-text">Enhancer</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Transform vague prompts into precision-engineered instructions.
            </p>
          </div>

          {/* Active platform badge */}
          {activePlatform && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="platform-badge"
              style={{
                background: `${activePlatform.color}18`,
                border: `1px solid ${activePlatform.color}44`,
                color: activePlatform.color,
              }}
            >
              <Globe size={11} />
              <span>Active on {activePlatform.name}</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-4 gap-3"
      >
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i + 0.1 }}
            className="stat-card text-center"
          >
            <stat.icon size={14} style={{ color: stat.color, margin: '0 auto 6px' }} />
            <p
              className="text-lg font-bold leading-none mb-1"
              style={{ color: stat.color, animation: 'count-up 0.5s ease both' }}
            >
              {stat.value}
            </p>
            <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* How it works — only shown when idle with no prompt */}
      {state.status === 'idle' && !state.currentPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="glass-card-static p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            How Prompter Works
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { step: '01', icon: '📝', label: 'Enter Prompt', desc: 'Type or paste your prompt' },
              { step: '02', icon: '🤖', label: 'AI Analysis', desc: 'Gemini analyzes intent & quality' },
              { step: '03', icon: '✨', label: 'Enhancement', desc: 'Applied prompt engineering' },
              { step: '04', icon: '🚀', label: 'Use It', desc: 'Copy or inject into AI platform' },
            ].map(({ step, icon, label, desc }) => (
              <div key={step} className="text-center p-3 rounded-2xl" style={{ background: 'var(--bg-muted)' }}>
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-xs font-bold mb-1" style={{ color: '#4285F4' }}>Step {step}</div>
                <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{label}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main prompt input */}
      <PromptInput onTemplateOpen={() => setTemplateOpen(true)} />

      {/* Results */}
      <ResultsPanel />

      {/* Template browser modal */}
      <TemplateBrowser open={templateOpen} onClose={() => setTemplateOpen(false)} />
    </div>
  );
}
