import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { SettingsProvider, EnhancementProvider, useSettings } from './contexts';
import { DashboardPage } from './pages/Dashboard';
import { HistoryPage } from './pages/History';
import { TemplatesPage } from './pages/Templates';
import { SettingsPage } from './pages/Settings';
import { AboutPage } from './pages/About';
import { OnboardingPage } from './pages/Onboarding';
import { FavoritesPage } from './pages/Favorites';
import { AnalyticsPage } from './pages/Analytics';
import { ShortcutsPage } from './pages/Shortcuts';
import { HelpPage } from './pages/Help';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
});

// Loading spinner while storage hydrates
function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: 'var(--bg-app)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid rgba(66,133,244,0.2)',
          borderTopColor: '#4285F4',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// Route guard — reads from context (already loaded inside providers)
function AppRoutes() {
  const { settings, isLoaded } = useSettings();

  if (!isLoaded) return <LoadingScreen />;

  // First-time user: no API key AND onboarding not acknowledged
  const needsOnboarding =
    !settings.apiKey && !(settings as Record<string, unknown>).onboardingDone;

  return (
    <Routes>
      {/* Onboarding — shown before any other route for first-time users */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Main app — Layout uses Outlet so nested routes always render */}
      <Route element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/shortcuts" element={<ShortcutsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* Catch-all falls back to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <SettingsProvider>
          <EnhancementProvider>
            <AppRoutes />

            <Toaster
              position="bottom-right"
              richColors
              toastOptions={{
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  backdropFilter: 'blur(20px)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                },
              }}
            />
            </EnhancementProvider>
          </SettingsProvider>
        </HashRouter>
      </QueryClientProvider>
    );
  }


