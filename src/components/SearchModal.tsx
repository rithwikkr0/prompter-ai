import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History, LayoutTemplate, Star, Settings, Brain, Columns, Sparkles, X } from 'lucide-react';
import { storage } from '../storage';
import type { HistoryEntry, Template } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      storage.getHistory().then(setHistory);
      storage.getTemplates().then(setTemplates);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else navigate('/'); // opens modal via hotkey
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, navigate]);

  if (!isOpen) return null;

  const filteredHistory = history.filter(h =>
    h.originalPrompt.toLowerCase().includes(query.toLowerCase()) ||
    h.enhancedPrompt.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    t.prompt.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const quickNav = [
    { label: 'Dashboard', path: '/', icon: Sparkles },
    { label: 'AI Memory', path: '/memory', icon: Brain },
    { label: 'Benchmark', path: '/benchmark', icon: Columns },
    { label: 'History', path: '/history', icon: History },
    { label: 'Favorites', path: '/favorites', icon: Star },
    { label: 'Templates', path: '/templates', icon: LayoutTemplate },
    { label: 'Settings', path: '/settings', icon: Settings },
  ].filter(n => n.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Search Bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/50">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search everywhere (Templates, History, Memory, Pages)..."
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
            />
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X size={16} />
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-96 overflow-y-auto p-3 space-y-4">
            {/* Quick Nav */}
            {quickNav.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                  Navigation
                </span>
                <div className="space-y-1">
                  {quickNav.map(({ label, path, icon: Icon }) => (
                    <button
                      key={path}
                      onClick={() => handleSelect(path)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Icon size={16} className="text-purple-400" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* History Matches */}
            {filteredHistory.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                  Recent History
                </span>
                <div className="space-y-1">
                  {filteredHistory.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => handleSelect('/history')}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition block group"
                    >
                      <p className="text-xs font-medium text-slate-200 truncate">{h.originalPrompt}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{h.enhancedPrompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Template Matches */}
            {filteredTemplates.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                  Prompt Templates
                </span>
                <div className="space-y-1">
                  {filteredTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelect('/templates')}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition block"
                    >
                      <p className="text-xs font-medium text-slate-200">{t.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quickNav.length === 0 && filteredHistory.length === 0 && filteredTemplates.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">No matching results found.</p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
