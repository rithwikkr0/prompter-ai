import { motion } from 'framer-motion';
import { Zap, ExternalLink, Globe, Star, Code2, Sparkles, Shield, Cpu } from 'lucide-react';

const FEATURES = [
  { icon: Sparkles, title: 'AI-Powered Enhancement', desc: 'Powered by Google Gemini 2.5 Flash, the most capable AI for prompt engineering.' },
  { icon: Shield, title: 'Privacy First', desc: 'Your API key and prompts stay on your device. We never see your data.' },
  { icon: Cpu, title: 'Structured Analysis', desc: 'Intelligent intent detection, quality scoring, and improvement explanations.' },
  { icon: Code2, title: 'Open Standards', desc: 'Built with React, TypeScript, and modern web APIs. Extensible architecture.' },
];

const STACK = [
  { label: 'React 19', color: '#61DAFB', icon: '⚛️' },
  { label: 'TypeScript', color: '#3178C6', icon: '🔷' },
  { label: 'Vite', color: '#646CFF', icon: '⚡' },
  { label: 'Tailwind CSS', color: '#38BDF8', icon: '🎨' },
  { label: 'Framer Motion', color: '#FF0055', icon: '🎭' },
  { label: 'Gemini AI', color: '#4285F4', icon: '🤖' },
  { label: 'Zod', color: '#3E67B1', icon: '✅' },
  { label: 'React Router', color: '#F44250', icon: '🔀' },
];

export function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-static p-8 text-center"
      >
        <motion.div
          className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-5"
          style={{ background: 'linear-gradient(135deg, #4285F4, #9333EA)' }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, repeatType: 'loop' }}
        >
          <Zap size={36} className="text-white" fill="white" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">PromptForge AI</span>
        </h1>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
          Version 1.0.0 · MVP
        </p>
        <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          The world's most intelligent prompt engineering assistant. Transform vague AI prompts
          into precision-crafted instructions that consistently get better results.
        </p>
        <div className="flex items-center justify-center gap-3 mt-5">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm"
          >
            <ExternalLink size={15} /> View Source
          </a>
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-sm"
          >
            <Globe size={15} /> Get API Key
          </a>
        </div>
      </motion.div>

      {/* Features */}
      <div className="space-y-3">
        <h2 className="font-bold text-base px-1" style={{ color: 'var(--text-primary)' }}>Why PromptForge?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-4"
            >
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'linear-gradient(135deg, rgba(66,133,244,0.12), rgba(147,51,234,0.12))' }}>
                <Icon size={16} className="text-primary-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="glass-card-static p-5">
        <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Built With</h2>
        <div className="flex flex-wrap gap-2">
          {STACK.map(({ label, color, icon }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
            >
              <span>{icon}</span> {label}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Credits */}
      <div className="glass-card-static p-5 text-center">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Built for the{' '}
          <span className="font-semibold text-primary-500">Google Builder Series</span>
          {' '}with ❤️ and ✨
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Powered by Gemini AI · © 2024 PromptForge AI
        </p>
      </div>
    </div>
  );
}
