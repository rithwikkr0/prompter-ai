import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Copy, Check, Download, Save,
  BarChart2, AlertTriangle, Lightbulb, Wand2, ArrowUpRight,
} from 'lucide-react';
import { copyToClipboard, downloadFile, scoreToColor } from '../utils/nanoid';
import { CircularScore, ScoreSkeleton } from './CircularScore';
import { CATEGORY_META } from '../types';
import type { EnhancementResult } from '../types';
import { useEnhancement } from '../contexts';
import { storage } from '../storage';
import { nanoid } from '../utils/nanoid';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

/* ─── Skeleton for result panels ─────────────────────────────────────────────── */
export function ResultSkeleton() {
  return (
    <motion.div
      className="space-y-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Score + Intent row */}
      <motion.div variants={item} className="glass-card-static p-5 flex gap-6">
        <ScoreSkeleton />
        <div className="flex-1 space-y-3 mt-2">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-7 w-24 rounded-full" />
          <div className="skeleton h-4 w-48" />
        </div>
      </motion.div>
      {/* Missing context */}
      <motion.div variants={item} className="glass-card-static p-5 space-y-3">
        <div className="skeleton h-4 w-36" />
        <div className="flex gap-2">
          {[80, 100, 72].map((w, i) => <div key={i} className="skeleton h-7 rounded-full" style={{ width: w }} />)}
        </div>
      </motion.div>
      {/* Improvements */}
      <motion.div variants={item} className="glass-card-static p-5 space-y-3">
        <div className="skeleton h-4 w-28" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-24" />
              <div className="skeleton h-3 w-full" />
            </div>
          </div>
        ))}
      </motion.div>
      {/* Enhanced prompt */}
      <motion.div variants={item} className="glass-card-static p-5 space-y-3">
        <div className="skeleton h-4 w-36" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </motion.div>
    </motion.div>
  );
}

/* ─── Enhanced Prompt Card ────────────────────────────────────────────────────── */
function EnhancedPromptCard({ result, originalPrompt }: { result: EnhancementResult; originalPrompt: string }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const { setPrompt } = useEnhancement();

  const handleCopy = async () => {
    await copyToClipboard(result.enhancedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    await storage.addHistoryEntry({
      id: nanoid(),
      originalPrompt,
      enhancedPrompt: result.enhancedPrompt,
      result,
      timestamp: Date.now(),
      tags: [result.intent.category],
      isFavorite: false,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const content = `# Enhanced Prompt\n\n## Original\n${originalPrompt}\n\n## Enhanced\n${result.enhancedPrompt}\n\n## Explanation\n${result.explanation}`;
    downloadFile(content, `prompter-${Date.now()}.md`, 'text/markdown');
  };

  return (
    <motion.div variants={item} className="glass-card-static p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(52,168,83,0.15), rgba(16,163,127,0.15))' }}>
            <Wand2 size={15} className="text-success" />
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Enhanced Prompt</h3>
        </div>
        <span className="badge badge-success">Ready</span>
      </div>

      <textarea
        className="input-field min-h-40 font-mono text-xs leading-relaxed"
        value={result.enhancedPrompt}
        readOnly
      />

      {/* Explanation */}
      <div className="p-3 rounded-xl" style={{ background: 'rgba(66,133,244,0.06)', border: '1px solid rgba(66,133,244,0.12)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold text-primary-500">Why it's better: </span>
          {result.explanation}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button className="btn-primary" onClick={handleCopy}>
          {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy</>}
        </button>
        <button className="btn-secondary" onClick={() => setPrompt(result.enhancedPrompt)}>
          <ArrowUpRight size={15} /> Use This
        </button>
        <button className="btn-secondary" onClick={handleSave}>
          {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save</>}
        </button>
        <button className="btn-ghost ml-auto" onClick={handleExport}>
          <Download size={15} /> Export
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Results Panel ──────────────────────────────────────────────────────────── */
export function ResultsPanel() {
  const { state } = useEnhancement();

  if (state.status === 'loading') return <ResultSkeleton />;
  if (!state.result || state.status !== 'success') return null;

  const { result, currentPrompt } = state;
  const categoryMeta = CATEGORY_META[result.intent.category] ?? CATEGORY_META['general'];
  const scoreColor = scoreToColor(result.qualityScore);

  return (
    <motion.div
      className="space-y-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Score + Intent */}
      <motion.div variants={item} className="glass-card-static p-5">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center">
            <CircularScore score={result.qualityScore} size={110} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={15} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Detected Intent
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xl">{categoryMeta.icon}</span>
              <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                {result.intent.label}
              </span>
              <span className="badge badge-primary">{result.intent.confidence}% confidence</span>
            </div>
            <div className="w-full rounded-full h-2 mb-1" style={{ background: 'var(--bg-muted)' }}>
              <motion.div
                className="h-2 rounded-full"
                style={{ background: categoryMeta.color }}
                initial={{ width: 0 }}
                animate={{ width: `${result.intent.confidence}%` }}
                transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Quality: <span style={{ color: scoreColor, fontWeight: 600 }}>{result.qualityScore}/100</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Missing Context */}
      {result.missingContext.length > 0 && (
        <motion.div variants={item} className="glass-card-static p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} style={{ color: '#FBBC05' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Missing Context
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.missingContext.map((ctx) => (
              <span key={ctx} className="badge badge-warning">⚠ {ctx}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Improvements */}
      {result.improvements.length > 0 && (
        <motion.div variants={item} className="glass-card-static p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={15} className="text-primary-500" />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Improvements Made
            </h3>
            <span className="badge badge-primary ml-auto">{result.improvements.length}</span>
          </div>
          <div className="space-y-3">
            {result.improvements.map((imp, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'var(--bg-muted)' }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="text-xl shrink-0">{imp.icon ?? '✨'}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{imp.type}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{imp.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Enhanced Prompt */}
      <EnhancedPromptCard result={result} originalPrompt={currentPrompt} />
    </motion.div>
  );
}
