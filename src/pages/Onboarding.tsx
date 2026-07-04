import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Palette, Rocket, Check, Loader2, Eye, EyeOff, ChevronRight, Sparkles } from 'lucide-react';
import { useSettings } from '../contexts';
import { testApiKey } from '../ai/gemini';

const STEPS = [
  { id: 'welcome', icon: Sparkles, label: 'Welcome' },
  { id: 'apikey', icon: Key, label: 'API Key' },
  { id: 'theme', icon: Palette, label: 'Theme' },
  { id: 'done', icon: Rocket, label: 'Ready!' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [step, setStep] = useState(0);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState('');

  const handleTestAndNext = async () => {
    if (!apiKeyInput) return;
    setTestStatus('testing');
    const result = await testApiKey(apiKeyInput, 'gemini-2.5-flash');
    if (result.valid) {
      await updateSettings({
        apiKey: apiKeyInput,
        provider: 'gemini',
        providerKeys: {
          gemini: apiKeyInput,
          openai: '',
          anthropic: '',
          groq: '',
          openrouter: '',
        },
      });
      setTestStatus('success');
      setTestMsg(`Connected to ${result.model} ✓`);
      setTimeout(() => setStep(2), 1200);
    } else {
      setTestStatus('error');
      setTestMsg(result.error ?? 'Invalid key');
    }
  };

  const handleFinish = async () => {
    await updateSettings({ onboardingDone: true } as Parameters<typeof updateSettings>[0]);
    navigate('/');
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40, scale: 0.97 },
    center: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -40, scale: 0.97 },
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-app)' }}
    >
      {/* Background glow orbs */}
      <div className="bg-orb w-80 h-80 -top-20 -left-20" style={{ background: '#4285F4' }} />
      <div className="bg-orb w-64 h-64 bottom-0 right-0" style={{ background: '#9333EA', animationDelay: '3s' }} />

      {/* Step dots */}
      <div className="flex items-center gap-3 mb-8 z-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
            {i < STEPS.length - 1 && (
              <div
                className="h-px w-10 transition-all duration-500"
                style={{ background: i < step ? '#34A853' : 'var(--border)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="glass-card-static w-full max-w-sm p-8 z-10 relative overflow-hidden">
        {/* Top aurora strip */}
        <div className="absolute top-0 left-0 right-0 h-0.5 aurora-gradient" />

        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="welcome"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="text-center mb-6">
                <div
                  className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl"
                  style={{ background: 'linear-gradient(135deg, #4285F4, #9333EA)' }}
                >
                  ✨
                </div>
                <h1 className="text-2xl font-bold mb-2 gradient-text">Welcome to Prompter AI</h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  The AI-powered prompt engineering assistant for Google Gemini, ChatGPT, Claude, Perplexity, Copilot, and Grok.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { icon: '✨', text: 'Enhance prompts with one click' },
                  { icon: '🔍', text: 'Analyze prompt quality score' },
                  { icon: '🔄', text: 'Rewrite prompts for any AI model' },
                  { icon: '⌨️', text: 'Keyboard shortcut: Ctrl+Shift+E' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</span>
                  </div>
                ))}
              </div>

              <button className="btn-primary w-full" onClick={() => setStep(1)}>
                Get Started <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Step 1: API Key */}
          {step === 1 && (
            <motion.div
              key="apikey"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(66,133,244,0.2), rgba(147,51,234,0.2))' }}>
                  <Key size={22} className="text-primary-500" />
                </div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Add Gemini API Key
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Get a free key from{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                    className="text-primary-500 hover:underline font-medium">
                    Google AI Studio
                  </a>
                  . Stored locally — never sent to any server.
                </p>
              </div>

              <div className="relative mb-3">
                <input
                  id="onboarding-api-key"
                  className="input-field pr-12 font-mono text-sm"
                  type={showKey ? 'text' : 'password'}
                  placeholder="AIza..."
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setTestStatus('idle');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestAndNext()}
                  autoFocus
                />
                <button
                  className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {testStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl mb-3 text-xs font-medium`}
                  style={{
                    background: testStatus === 'success' ? 'rgba(52,168,83,0.12)' :
                      testStatus === 'error' ? 'rgba(234,67,53,0.12)' : 'var(--bg-muted)',
                    color: testStatus === 'success' ? '#34A853' :
                      testStatus === 'error' ? '#EA4335' : 'var(--text-muted)',
                  }}
                >
                  {testStatus === 'testing' && <Loader2 size={13} className="animate-spin" />}
                  {testStatus === 'success' && <Check size={13} />}
                  {testStatus === 'testing' ? 'Testing connection...' : testMsg}
                </motion.div>
              )}

              <button
                className="btn-primary w-full"
                onClick={handleTestAndNext}
                disabled={!apiKeyInput || testStatus === 'testing'}
              >
                {testStatus === 'testing' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Test & Continue
              </button>

              <button
                className="btn-ghost w-full mt-2 text-xs"
                onClick={() => setStep(2)}
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {/* Step 2: Theme */}
          {step === 2 && (
            <motion.div
              key="theme"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(66,133,244,0.2), rgba(147,51,234,0.2))' }}>
                  <Palette size={22} className="text-primary-500" />
                </div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Choose Your Theme
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Customize the appearance of the popup.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {(['light', 'system', 'dark'] as const).map((theme) => (
                  <button
                    key={theme}
                    className="p-4 rounded-2xl border transition-all text-center"
                    style={{
                      background: settings.theme === theme ? 'rgba(66,133,244,0.08)' : 'var(--bg-muted)',
                      borderColor: settings.theme === theme ? '#4285F4' : 'var(--border)',
                    }}
                    onClick={() => updateSettings({ theme })}
                  >
                    <div className="text-xl mb-1">
                      {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🖥️'}
                    </div>
                    <div className="text-xs font-semibold capitalize" style={{
                      color: settings.theme === theme ? '#4285F4' : 'var(--text-secondary)',
                    }}>{theme}</div>
                    {settings.theme === theme && (
                      <Check size={12} className="mx-auto mt-1 text-primary-500" />
                    )}
                  </button>
                ))}
              </div>

              <button className="btn-primary w-full" onClick={() => setStep(3)}>
                Continue <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <motion.div
              key="done"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl"
                style={{ background: 'linear-gradient(135deg, #34A853, #059669)' }}
              >
                🚀
              </motion.div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                You're all set!
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Navigate to any AI platform, type a prompt, and click the <strong>✨</strong> floating button to enhance it instantly.
              </p>

              <div className="glass-card-static p-4 mb-6 text-left space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  Quick shortcuts
                </p>
                {[
                  { key: 'Ctrl+Shift+E', action: 'Enhance current prompt' },
                  { key: 'Right-click', action: 'Enhance / Rewrite / Analyze' },
                  { key: '✨ button', action: 'Click to enhance, right-click for more' },
                ].map(({ key, action }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{action}</span>
                    <code className="text-xs px-2 py-0.5 rounded-lg font-mono"
                      style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}>{key}</code>
                  </div>
                ))}
              </div>

              <button className="btn-success w-full" onClick={handleFinish}>
                <Rocket size={16} /> Open Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Version tag */}
      <p className="mt-6 text-xs z-10" style={{ color: 'var(--text-muted)' }}>
        Prompter AI v1.0 · Google Builder Series 2026
      </p>
    </div>
  );
}
