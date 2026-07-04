import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, LayoutTemplate } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../data/templates';
import { CATEGORY_META, PROMPT_CATEGORIES } from '../types';
import { useEnhancement } from '../contexts';
import type { Template } from '../types';

interface TemplateBrowserProps {
  open: boolean;
  onClose: () => void;
}

export function TemplateBrowser({ open, onClose }: TemplateBrowserProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { setPrompt } = useEnhancement();

  const allCategories = ['all', ...new Set(DEFAULT_TEMPLATES.map(t => t.category))];

  const filtered = DEFAULT_TEMPLATES.filter(t => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleUse = (template: Template) => {
    setPrompt(template.prompt);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed inset-x-4 top-12 bottom-12 z-50 max-w-3xl mx-auto flex flex-col glass-card-static overflow-hidden"
            style={{ borderRadius: '1.5rem' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <LayoutTemplate size={18} className="text-primary-500" />
                <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Prompt Templates</h2>
                <span className="badge badge-primary">{DEFAULT_TEMPLATES.length}</span>
              </div>
              <button className="btn-icon" onClick={onClose}><X size={18} /></button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  className="input-field pl-9 py-2.5"
                  placeholder="Search templates..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Category pills */}
            <div className="px-5 py-3 flex gap-2 overflow-x-auto border-b shrink-0 no-scrollbar" style={{ borderColor: 'var(--border)' }}>
              {allCategories.map(cat => {
                const meta = cat === 'all' ? null : CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeCategory === cat ? 'text-white' : 'badge-muted'
                    }`}
                    style={activeCategory === cat ? { background: meta?.color ?? '#4285F4' } : {}}
                  >
                    {meta ? `${meta.icon} ${meta.label}` : '✦ All'}
                  </button>
                );
              })}
            </div>

            {/* Template grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: 'var(--text-muted)' }}>
                  <LayoutTemplate size={32} />
                  <p className="text-sm">No templates found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((template, i) => {
                    const meta = CATEGORY_META[template.category] ?? CATEGORY_META['general'];
                    return (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="glass-card p-4 cursor-pointer group"
                        onClick={() => handleUse(template)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0">{meta.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                {template.title}
                              </h3>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              {template.description}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="badge badge-muted text-xs">{meta.label}</span>
                              <span
                                className="text-xs font-semibold ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: meta.color }}
                              >
                                Use template →
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
