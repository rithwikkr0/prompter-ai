import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, Trash2, Clock, Sparkles, Copy, Check, RefreshCcw, Heart
} from 'lucide-react';
import { storage } from '../storage';
import { CATEGORY_META } from '../types';
import type { HistoryEntry } from '../types';
import { timeAgo, truncate, copyToClipboard, scoreToColor } from '../utils/nanoid';
import { useEnhancement } from '../contexts';
import { useNavigate } from 'react-router-dom';

export function FavoritesPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { loadResult } = useEnhancement();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    const h = await storage.getHistory();
    const favorites = h.filter(e => e.isFavorite);
    setEntries(favorites);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) => {
    if (search && !e.originalPrompt.toLowerCase().includes(search.toLowerCase()) &&
        !e.enhancedPrompt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleRemoveFavorite = async (id: string) => {
    await storage.toggleFavorite(id);
    setEntries(prev => prev.filter(e => e.id !== id));
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Favorite <span className="gradient-text">Prompts</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {entries.length} prompt{entries.length !== 1 ? 's' : ''} starred for quick access
          </p>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            className="input-field pl-10 text-sm"
            type="text"
            placeholder="Search favorites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading favorites...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card-static p-12 text-center">
          <Heart size={36} className="mx-auto text-pink-500/40 mb-3 animate-pulse" />
          <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>No Favorites Found</h3>
          <p className="text-xs max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {search ? 'No favorites match your search query.' : 'Click the star icon on any enhanced prompt to save it here for quick access.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((entry) => {
              const cat = CATEGORY_META[entry.result.intent.category] || CATEGORY_META.general;
              const isExpanded = expandedId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="glass-card p-4 hover:border-slate-400/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <div>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {cat.label}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {timeAgo(entry.timestamp)}
                          </span>
                          {entry.platform && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                              {entry.platform}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background: `${scoreToColor(entry.result.qualityScore)}12`, color: scoreToColor(entry.result.qualityScore) }}>
                        Score: {entry.result.qualityScore}
                      </span>
                      <button className="btn-icon text-amber-500" onClick={() => handleRemoveFavorite(entry.id)}>
                        <Star size={15} fill="currentColor" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                        Original
                      </span>
                      <p className="text-xs leading-relaxed font-mono p-2.5 rounded-xl"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                        {truncate(entry.originalPrompt, 180)}
                      </p>
                    </div>

                    {isExpanded ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-1">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                            Enhanced Prompt
                          </span>
                          <textarea
                            readOnly
                            value={entry.enhancedPrompt}
                            className="w-full text-xs font-mono p-3 rounded-xl min-h-[120px] outline-none"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                          <span className="text-[10px] font-medium italic" style={{ color: 'var(--text-muted)' }}>
                            {entry.result.explanation}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button className="btn-secondary text-xs py-1.5" onClick={() => handleCopy(entry.id, entry.enhancedPrompt)}>
                              {copiedId === entry.id ? <Check size={13} /> : <Copy size={13} />}
                              {copiedId === entry.id ? 'Copied' : 'Copy'}
                            </button>
                            <button className="btn-primary text-xs py-1.5" onClick={() => handleReuse(entry)}>
                              <RefreshCcw size={13} /> Reuse
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => setExpandedId(entry.id)}
                        className="text-xs text-primary-500 hover:underline font-semibold mt-1"
                      >
                        Show Enhanced Prompt →
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
