import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Save, RotateCcw, Download, Upload, Plus, Trash2, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { storage } from '../storage';
import type { UserMemory } from '../types';

const DEFAULT_MEMORY: UserMemory = {
  preferredProvider: 'gemini',
  preferredModel: 'gemini-2.5-flash',
  preferredLanguage: 'English',
  preferredFramework: 'React / TypeScript',
  preferredLength: 'Medium (300-800 words)',
  preferredFormat: 'Markdown',
  preferredStyle: 'Professional & Structured',
  preferredTone: 'Technical & Precise',
  favoriteCategories: ['coding', 'research'],
  customRules: [
    'Always include clear inline code comments',
    'Prefer clean, modular design patterns',
  ],
};

export function MemoryPage() {
  const [memory, setMemory] = useState<UserMemory>(DEFAULT_MEMORY);
  const [newRule, setNewRule] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.getMemory().then((mem) => {
      setMemory(mem || DEFAULT_MEMORY);
      setLoading(false);
    });
  }, []);

  const handleSave = async (updated: UserMemory) => {
    setMemory(updated);
    await storage.saveMemory(updated);
    toast.success('AI Prompt Memory updated successfully');
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    const updated = {
      ...memory,
      customRules: [...(memory.customRules || []), newRule.trim()],
    };
    handleSave(updated);
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    const updated = {
      ...memory,
      customRules: (memory.customRules || []).filter((_, i) => i !== index),
    };
    handleSave(updated);
  };

  const handleExport = async () => {
    const json = await storage.exportMemory();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompter-ai-memory-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success('AI Memory exported as JSON');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        await storage.importMemory(json);
        const mem = await storage.getMemory();
        setMemory(mem);
        toast.success('AI Memory imported successfully');
      } catch {
        toast.error('Invalid JSON memory file format');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    if (confirm('Reset all AI Prompt Memory preferences to defaults?')) {
      await storage.resetMemory();
      setMemory(DEFAULT_MEMORY);
      toast.success('AI Memory reset to default');
    }
  };

  if (loading) return null;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Brain size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AI Prompt Memory</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Personalize how Prompter AI enhances prompts. Your preferences are saved locally and auto-applied.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 transition flex items-center gap-1.5"
          >
            <Download size={14} /> Export
          </button>
          <label className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 transition cursor-pointer flex items-center gap-1.5">
            <Upload size={14} /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleReset}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Memory Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Preferred Language */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">Preferred Programming Language</label>
          <select
            value={memory.preferredLanguage}
            onChange={(e) => handleSave({ ...memory, preferredLanguage: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
          >
            <option value="English">English (Natural Language)</option>
            <option value="Python">Python</option>
            <option value="TypeScript / JavaScript">TypeScript / JavaScript</option>
            <option value="Java">Java</option>
            <option value="C++">C++</option>
            <option value="Go">Go</option>
            <option value="Rust">Rust</option>
            <option value="SQL">SQL</option>
          </select>
        </div>

        {/* Preferred Framework */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">Preferred Tech Stack / Framework</label>
          <input
            type="text"
            value={memory.preferredFramework}
            onChange={(e) => handleSave({ ...memory, preferredFramework: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
            placeholder="e.g. React, Next.js, PyTorch"
          />
        </div>

        {/* Response Length */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">Preferred Response Length</label>
          <select
            value={memory.preferredLength}
            onChange={(e) => handleSave({ ...memory, preferredLength: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
          >
            <option value="Concise (under 200 words)">Concise (under 200 words)</option>
            <option value="Medium (300-800 words)">Medium (300-800 words)</option>
            <option value="Comprehensive & In-Depth">Comprehensive & In-Depth</option>
          </select>
        </div>

        {/* Output Format */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">Preferred Output Format</label>
          <select
            value={memory.preferredFormat}
            onChange={(e) => handleSave({ ...memory, preferredFormat: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
          >
            <option value="Markdown">Markdown with headers</option>
            <option value="Structured JSON">Structured JSON</option>
            <option value="Bullet Points">Bullet Points</option>
            <option value="Step-by-step Guide">Step-by-step Guide</option>
          </select>
        </div>

        {/* Writing Tone */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">Preferred Communication Tone</label>
          <select
            value={memory.preferredTone}
            onChange={(e) => handleSave({ ...memory, preferredTone: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
          >
            <option value="Technical & Precise">Technical & Precise</option>
            <option value="Professional & Formal">Professional & Formal</option>
            <option value="Casual & Conversational">Casual & Conversational</option>
            <option value="Academic & Rigorous">Academic & Rigorous</option>
          </select>
        </div>

        {/* Writing Style */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">Preferred Writing Style</label>
          <input
            type="text"
            value={memory.preferredStyle}
            onChange={(e) => handleSave({ ...memory, preferredStyle: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
            placeholder="e.g. Senior Staff Engineer, Concise"
          />
        </div>
      </div>

      {/* Custom Rules Section */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" /> Custom System Rules
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal rules that will be auto-appended to every prompt enhancement.
            </p>
          </div>
        </div>

        {/* Input box */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
            placeholder="Add custom rule (e.g. 'Never use deprecated functions', 'Always include error handling')..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-purple-500"
          />
          <button
            onClick={handleAddRule}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Rule
          </button>
        </div>

        {/* Rule list */}
        <div className="space-y-2">
          {(memory.customRules || []).map((rule, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60"
            >
              <span className="text-xs text-slate-300 flex items-center gap-2">
                <CheckCircle size={14} className="text-purple-400 shrink-0" />
                {rule}
              </span>
              <button
                onClick={() => handleRemoveRule(idx)}
                className="text-slate-500 hover:text-red-400 transition p-1"
                title="Remove rule"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
          {(!memory.customRules || memory.customRules.length === 0) && (
            <p className="text-xs text-slate-500 italic text-center py-2">No custom rules added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
