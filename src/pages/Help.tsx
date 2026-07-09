import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      q: 'How does Prompter AI v2.0 work?',
      a: 'Prompter AI injects a small floating button onto supported AI chat platforms. When you click it, our system localizer scores your prompt completeness. If your prompt is detailed, it enhances it directly. Otherwise, it opens an adaptive questionnaire to gather requirements (intent style, tone, format) and injects this information for optimal results.'
    },
    {
      q: 'Where are my API keys stored?',
      a: 'All API keys are stored locally inside your browser using Chrome Extension local storage (`chrome.storage.local`). They are never sent to our servers or any third parties. They are transmitted directly from your browser to your configured provider API endpoints.'
    },
    {
      q: 'Which AI platforms are currently supported?',
      a: 'We offer full floating assistant support on ChatGPT, Google Gemini, Anthropic Claude, Perplexity AI, Microsoft Copilot, and Grok.'
    },
    {
      q: 'What is Smart Interview Mode?',
      a: 'Instead of blindly upgrading prompts, the extension assesses your prompt quality. If key pieces of information (like art style for images or language choice for code) are missing, a structured prompt interview guide asks 1-3 targeted questions to generate a highly detailed prompt output.'
    },
    {
      q: 'Can I use this extension for free?',
      a: 'Yes, the extension is 100% free and open-source. You only need your own API keys from Google, OpenAI, Anthropic, or Groq (most of which have generous free tiers or low-cost pay-as-you-go developer plans).'
    },
    {
      q: 'The floating button did not show up, what should I do?',
      a: 'Make sure the extension is active on a supported page. Refresh the page once. If you are using a custom browser context or a browser page that was already open when the extension was installed, reload it so the scripts can initialize correctly.'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Help & <span className="gradient-text">Support</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Troubleshooting, documentation, and answers to frequently asked questions
        </p>
      </motion.div>

      {/* Troubleshooting Alert */}
      <div className="p-4 rounded-2xl flex gap-3 items-start border border-amber-500/20 bg-amber-500/5 text-amber-300">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold block text-amber-200">First-Time API Setup Issues?</span>
          <p className="leading-relaxed">
            Ensure your key does not contain leading/trailing whitespaces. Test connection using the button in Settings to ensure permissions are verified.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="glass-card-static p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
            <HelpCircle size={16} />
          </div>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Frequently Asked Questions</h2>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-700/10 transition-colors"
                style={{ background: 'var(--bg-muted)' }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs text-slate-200"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-xs leading-relaxed text-slate-400 border-t border-slate-700/10 pt-3">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
