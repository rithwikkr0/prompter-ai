import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutTemplate, Search, ArrowRight } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../data/templates';
import { CATEGORY_META } from '../types';
import { useEnhancement } from '../contexts';
import { useNavigate } from 'react-router-dom';

export function TemplatesPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { setPrompt } = useEnhancement();
  const navigate = useNavigate();

  const allCategories = ['all', ...new Set(DEFAULT_TEMPLATES.map(t => t.category))];

  const filtered = DEFAULT_TEMPLATES.filter(t => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleUse = (prompt: string) => {
    setPrompt(prompt);
    navigate('/');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Prompt <span className="gradient-text">Templates</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {DEFAULT_TEMPLATES.length} professional templates across {allCategories.length - 1} categories. Click any to use it.
        </p>
      </motion.div>

      {/* Search + filter */}
      <div className="glass-card-static p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input-field pl-9 py-2.5"
            placeholder="Search templates by title, description, or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allCategories.map(cat => {
            const meta = cat === 'all' ? null : CATEGORY_META[cat];
            const count = cat === 'all' ? DEFAULT_TEMPLATES.length :
              DEFAULT_TEMPLATES.filter(t => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === cat ? 'text-white' : 'badge-muted'
                }`}
                style={activeCategory === cat ? { background: meta?.color ?? '#4285F4' } : {}}
              >
                {meta ? meta.icon : '✦'} {meta ? meta.label : 'All'}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeCategory === cat ? 'bg-white/20' : 'bg-black/10 dark:bg-white/10'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((template, i) => {
          const meta = CATEGORY_META[template.category] ?? CATEGORY_META['general'];
          const isExpanded = expandedId === template.id;

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5 flex flex-col"
            >
              {/* Category badge */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="badge text-xs text-white"
                  style={{ background: meta.color }}
                >
                  {meta.icon} {meta.label}
                </span>
                {template.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="badge badge-muted text-xs">{tag}</span>
                ))}
              </div>

              {/* Title + description */}
              <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                {template.title}
              </h3>
              <p className="text-xs leading-relaxed mb-3 flex-1" style={{ color: 'var(--text-secondary)' }}>
                {template.description}
              </p>

              {/* Preview */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-3 p-3 rounded-xl overflow-hidden"
                  style={{ background: 'var(--bg-muted)' }}
                >
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {template.prompt.slice(0, 300)}{template.prompt.length > 300 ? '...' : ''}
                  </pre>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <button
                  className="btn-primary flex-1 text-xs py-2"
                  onClick={() => handleUse(template.prompt)}
                >
                  <ArrowRight size={14} /> Use Template
                </button>
                <button
                  className="btn-secondary text-xs py-2 px-3"
                  onClick={() => setExpandedId(isExpanded ? null : template.id)}
                >
                  {isExpanded ? 'Hide' : 'Preview'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 gap-3"
          style={{ color: 'var(--text-muted)' }}
        >
          <LayoutTemplate size={48} className="opacity-30" />
          <p className="text-sm font-medium">No templates match your search</p>
        </motion.div>
      )}
    </div>
  );
}
