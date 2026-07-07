import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, History, LayoutTemplate, Settings, Info,
  Zap, Moon, Sun, Monitor, ChevronRight, Menu, X,
  Star, BarChart3, Keyboard, HelpCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettings } from '../contexts';

const NAV = [
  { to: '/', icon: Sparkles, label: 'Dashboard', exact: true },
  { to: '/history', icon: History, label: 'History' },
  { to: '/favorites', icon: Star, label: 'Favorites' },
  { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/shortcuts', icon: Keyboard, label: 'Shortcuts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help' },
  { to: '/about', icon: Info, label: 'About' },
];

function ThemeToggle() {
  const { settings, updateSettings } = useSettings();
  const themes = [
    { value: 'light', icon: Sun },
    { value: 'system', icon: Monitor },
    { value: 'dark', icon: Moon },
  ] as const;

  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: 'var(--bg-muted)' }}>
      {themes.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => updateSettings({ theme: value })}
          className={`btn-icon w-8 h-8 rounded-xl transition-all ${
            settings.theme === value
              ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-500'
              : ''
          }`}
          title={value}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings } = useSettings();
  const location = useLocation();

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') root.classList.add('dark');
    else if (settings.theme === 'light') root.classList.remove('dark');
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [settings.theme]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #4285F4, #9333EA)' }}>
          <Zap size={18} className="text-white" fill="white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <span className="font-bold text-base gradient-text whitespace-nowrap">Prompter</span>
              <span className="text-xs block whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>AI v2.0</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={18} className="shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-3">
        {sidebarOpen && <ThemeToggle />}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="btn-icon w-full justify-center hidden lg:flex"
          title={sidebarOpen ? 'Collapse' : 'Expand'}
        >
          <ChevronRight size={16} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex w-full h-screen overflow-hidden relative">
      {/* Background orbs */}
      <div className="bg-orb w-96 h-96 -top-24 -left-24" style={{ background: '#4285F4' }} />
      <div className="bg-orb w-80 h-80 bottom-0 right-1/4 animation-delay-2000" style={{ background: '#9333EA', animationDelay: '2s' }} />

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 68 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="glass-sidebar hidden lg:block shrink-0 overflow-hidden relative z-20"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="glass-sidebar fixed left-0 top-0 bottom-0 w-56 z-40 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-sidebar)', backdropFilter: 'blur(20px)' }}>
          <button className="btn-icon" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="font-bold gradient-text">Prompter AI</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
