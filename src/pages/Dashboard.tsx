import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, TrendingUp, History, Star } from 'lucide-react';
import { PromptInput } from '../components/PromptInput';
import { ResultsPanel } from '../components/ResultsPanel';
import { TemplateBrowser } from '../components/TemplateBrowser';
import { useEnhancement } from '../contexts';

const stats = [
  { label: 'Avg Score Boost', value: '+47%', icon: TrendingUp, color: '#34A853' },
  { label: 'Time Saved', value: '3.2 min', icon: Zap, color: '#4285F4' },
  { label: 'Prompts Enhanced', value: '12', icon: Sparkles, color: '#9333EA' },
];

export function DashboardPage() {
  const [templateOpen, setTemplateOpen] = useState(false);
  const { state } = useEnhancement();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Prompt <span className="gradient-text">Enhancer</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Transform vague prompts into precision-engineered instructions powered by Gemini AI.
            </p>
          </div>
          {/* Quick stats */}
          <div className="hidden sm:flex items-center gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card-static px-3 py-2.5 text-center min-w-[80px]">
                <stat.icon size={14} style={{ color: stat.color, margin: '0 auto 4px' }} />
                <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
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
              { step: '04', icon: '🚀', label: 'Use It', desc: 'Copy or save your prompt' },
            ].map(({ step, icon, label, desc }) => (
              <div key={step} className="text-center p-3 rounded-2xl" style={{ background: 'var(--bg-muted)' }}>
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-xs font-bold text-primary-500 mb-1">Step {step}</div>
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
