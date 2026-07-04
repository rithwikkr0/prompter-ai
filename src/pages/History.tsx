import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Trash2, Star, Download, Filter, Clock,
  History as HistoryIcon, Sparkles, Copy, Check, RefreshCcw,
} from 'lucide-react';
import { storage } from '../storage';
import { CATEGORY_META } from '../types';
import type { HistoryEntry } from '../types';
import { timeAgo, truncate, copyToClipboard, downloadFile, scoreToColor } from '../utils/nanoid';
import { useEnhancement } from '../contexts';
import { useNavigate } from 'react-router-dom';

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFav, setFilterFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { loadResult } = useEnhancement();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    const h = await storage.getHistory();
    setEntries(h);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) => {
    if (filterFav && !e.isFavorite) return false;
    if (filterCategory !== 'all' && e.result.intent.category !== filterCategory) return false;
    if (search && !e.originalPrompt.toLowerCase().includes(search.toLowerCase()) &&
        !e.enhancedPrompt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = ['all', ...new Set(entries.map(e => e.result.intent.category))];

  const handleDelete = async (id: string) => {
    await storage.removeHistoryEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleToggleFav = async (id: string) => {
    await storage.toggleFavorite(id);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, isFavorite: !e.isFavorite } : e));
  };

  const handleCopy = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReuse = (entry: HistoryEntry) => {
    loadResult(entry.result, entry.originalPrompt);
    navigate('/');
  };

  const handleExport = async () => {
    const json = await storage.exportHistory();
    downloadFile(json, `promptforge-history-${Date.now()}.json`, 'application/json');
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all history? This cannot be undone.')) return;
    await storage.clearHistory();
    setEntries([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Prompt <span className="gradient-text">History</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {entries.length} saved prompt{entries.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs" onClick={handleExport}>
              <Download size={14} /> Export
            </button>
            {entries.length > 0 && (
              <button className="btn-danger text-xs" onClick={handleClearAll}>
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="glass-card-static p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="input-field pl-9 py-2"
              placeholder="Search history..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`btn-secondary gap-2 text-xs ${filterFav ? 'text-yellow-500' : ''}`}
            onClick={() => setFilterFav(!filterFav)}
          >
            <Star size={14} className={filterFav ? 'fill-yellow-400 text-yellow-400' : ''} />
            Favorites
          </button>
        </div>
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => {
            const meta = cat === 'all' ? null : CATEGORY_META[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterCategory === cat ? 'text-white' : 'badge-muted'
                }`}
                style={filterCategory === cat ? { background: meta?.color ?? '#4285F4' } : {}}
              >
                {meta ? `${meta.icon} ${meta.label}` : '✦ All'}
              </button>
            );
          })}
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="glass-card-static p-5 space-y-3">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 gap-3"
          style={{ color: 'var(--text-muted)' }}
        >
          <HistoryIcon size={48} className="opacity-30" />
          <p className="text-sm font-medium">No history found</p>
          <p className="text-xs">Enhance some prompts to see them here</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filtered.map((entry, idx) => {
              const meta = CATEGORY_META[entry.result.intent.category] ?? CATEGORY_META['general'];
              const isExpanded = expandedId === entry.id;
              const scoreColor = scoreToColor(entry.result.qualityScore);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.02 }}
                  className="glass-card p-5"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{meta.icon}</span>
                      <div className="min-w-0">
                        <span className="badge badge-muted text-xs">{meta.label}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-bold" style={{ color: scoreColor }}>{entry.result.qualityScore}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</span>
                    </div>
                  </div>

                  {/* Original prompt preview */}
                  <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Original: </span>
                    {truncate(entry.originalPrompt, isExpanded ? 9999 : 120)}
                  </p>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="mt-3 p-3 rounded-xl mb-3" style={{ background: 'var(--bg-muted)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Enhanced Prompt:</p>
                        <p className="text-xs leading-relaxed font-mono" style={{ color: 'var(--text-primary)' }}>
                          {entry.enhancedPrompt}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      className="btn-ghost text-xs"
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    >
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                    <button className="btn-ghost text-xs" onClick={() => handleReuse(entry)}>
                      <RefreshCcw size={12} /> Reuse
                    </button>
                    <button className="btn-ghost text-xs" onClick={() => handleCopy(entry.id, entry.enhancedPrompt)}>
                      {copiedId === entry.id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>
                    <button
                      className="btn-ghost text-xs ml-auto"
                      onClick={() => handleToggleFav(entry.id)}
                    >
                      <Star size={12} className={entry.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} />
                    </button>
                    <button className="btn-ghost text-xs" style={{ color: '#EA4335' }} onClick={() => handleDelete(entry.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
