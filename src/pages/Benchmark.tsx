import { useState } from 'react';
import { motion } from 'framer-motion';
import { Columns, Copy, Check, Sparkles, Zap, Bot, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '../contexts';
import type { BenchmarkResult } from '../types';

export function BenchmarkPage() {
  const { settings } = useSettings();
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [result, setResult] = useState<BenchmarkResult | null>(null);

  const handleBenchmark = async () => {
    if (!promptInput.trim()) {
      toast.error('Please enter a prompt to benchmark');
      return;
    }
    const provider = settings.provider || 'gemini';
    const apiKey = (settings.providerKeys && settings.providerKeys[provider]) || settings.apiKey || '';
    if (!apiKey) {
      toast.error(`Please configure an API key for ${provider} in Settings`);
      return;
    }

    setLoading(true);
    try {
      const ext = typeof chrome !== 'undefined' ? chrome : null;
      if (ext && ext.runtime) {
        ext.runtime.sendMessage(
          {
            type: 'BENCHMARK_PROMPTS',
            prompt: promptInput,
            provider,
            apiKey,
            model: settings.preferredModel,
          },
          (res: any) => {
            setLoading(false);
            if (res && res.success && res.result) {
              setResult(res.result);
              toast.success('Benchmark generated across Gemini, Claude, & ChatGPT');
            } else {
              toast.error(res?.error || 'Benchmark failed');
            }
          }
        );
      } else {
        // Fallback for dev preview
        setTimeout(() => {
          setLoading(false);
          setResult({
            originalPrompt: promptInput,
            geminiPrompt: `**Gemini Search Grounded Prompt:**\nAct as a Principal Engineer. Answer this query using standard Google groundings:\n\n${promptInput}`,
            claudePrompt: `<instructions>\n  <role>Principal Engineer</role>\n  <task>${promptInput}</task>\n  <output_format>XML Markdown</output_format>\n</instructions>`,
            chatgptPrompt: `### SYSTEM INSTRUCTIONS\nAct as a Senior Developer.\n\n### USER QUERY\n${promptInput}\n\n### CONSTRAINTS\n- Step-by-step reasoning\n- Modular code blocks`,
            recommendation: 'Use Claude for strict structured reasoning or Gemini for search groundings.',
            strengths: {
              gemini: 'Real-time search groundings & concise code blocks',
              claude: 'Superior XML tag structure & deep reasoning',
              chatgpt: 'Direct markdown formatting & step-by-step logic',
            },
          });
        }, 1200);
      }
    } catch (e) {
      setLoading(false);
      toast.error((e as Error).message);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <Columns size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AI Model Benchmark</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Generate side-by-side prompt variations optimized specifically for Google Gemini, Anthropic Claude, and OpenAI ChatGPT.
        </p>
      </div>

      {/* Input Form */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <textarea
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Enter a prompt to generate model-specific benchmark variations..."
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-blue-500 resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={handleBenchmark}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? <Zap size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? 'Generating Variations...' : 'Run Multi-Model Benchmark'}
          </button>
        </div>
      </div>

      {/* Results Comparison Grid */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Recommendation Banner */}
          <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs flex items-center justify-between">
            <span className="font-semibold">💡 Recommendation: {result.recommendation}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gemini Variation */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                    <Sparkles size={16} /> Google Gemini
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.geminiPrompt, 'gemini')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Copy"
                  >
                    {copiedKey === 'gemini' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 italic">{result.strengths?.gemini}</p>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {result.geminiPrompt}
                </div>
              </div>
            </div>

            {/* Claude Variation */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Bot size={16} /> Anthropic Claude
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.claudePrompt, 'claude')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Copy"
                  >
                    {copiedKey === 'claude' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 italic">{result.strengths?.claude}</p>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {result.claudePrompt}
                </div>
              </div>
            </div>

            {/* ChatGPT Variation */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <MessageSquare size={16} /> OpenAI ChatGPT
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.chatgptPrompt, 'chatgpt')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Copy"
                  >
                    {copiedKey === 'chatgpt' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 italic">{result.strengths?.chatgpt}</p>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {result.chatgptPrompt}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
