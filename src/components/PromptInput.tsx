import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, Trash2, Upload, Loader2, AlertCircle, FileText } from 'lucide-react';
import { useEnhancement } from '../contexts';

interface PromptInputProps {
  onTemplateOpen?: () => void;
}

export function PromptInput({ onTemplateOpen }: PromptInputProps) {
  const { state, setPrompt, enhance, clearResult } = useEnhancement();
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const text = e.dataTransfer.getData('text/plain');
    if (text) setPrompt(text);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => setPrompt(ev.target?.result as string);
      reader.readAsText(file);
    }
  }, [setPrompt]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      e.preventDefault();
      setPrompt(state.currentPrompt + text);
    }
  }, [state.currentPrompt, setPrompt]);

  const charCount = state.currentPrompt.length;
  const wordCount = state.currentPrompt.trim() ? state.currentPrompt.trim().split(/\s+/).length : 0;

  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(147,51,234,0.15))' }}>
            <FileText size={15} className="text-primary-500" />
          </div>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Your Prompt
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* Textarea with drag & drop */}
      <div
        className={`relative rounded-2xl transition-all duration-200 ${isDragging ? 'ring-2 ring-primary-400 ring-offset-0' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          id="prompt-input"
          className="input-field prompt-editor min-h-36"
          placeholder="Describe what you want the AI to do...

Examples:
• Write code for a REST API
• Summarize this research paper
• Create a marketing email for my product
• Help me debug this error..."
          value={state.currentPrompt}
          onChange={(e) => setPrompt(e.target.value)}
          onPaste={handlePaste}
          disabled={state.status === 'loading'}
        />
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(66,133,244,0.08)', border: '2px dashed #4285F4' }}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload size={24} className="text-primary-500" />
                <span className="text-sm font-medium text-primary-500">Drop text or .txt file</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      <AnimatePresence>
        {state.status === 'error' && state.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-start gap-2 p-3 rounded-xl"
            style={{ background: '#FEE2E2', color: '#7F1D1D' }}
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-error" />
            <p className="text-xs font-medium">{state.error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <button
          id="enhance-btn"
          className="btn-primary flex-1 sm:flex-none"
          onClick={enhance}
          disabled={state.status === 'loading' || !state.currentPrompt.trim()}
        >
          {state.status === 'loading' ? (
            <><Loader2 size={16} className="animate-spin" /> Enhancing...</>
          ) : (
            <><Sparkles size={16} /> Enhance</>
          )}
        </button>

        <button
          className="btn-secondary"
          onClick={onTemplateOpen}
          title="Browse templates"
        >
          <FileText size={15} /> Templates
        </button>

        {state.currentPrompt && (
          <button
            className="btn-ghost ml-auto"
            onClick={clearResult}
            title="Clear"
          >
            <Trash2 size={15} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
