import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const queryClient = new QueryClient();

// Guard: redirect first-time users to onboarding
function AppRoutes() {
  const { settings, isLoaded } = useSettings();

  // Don't render until settings loaded
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-app)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#4285F4', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // If no API key and onboarding not done → show onboarding
  const needsOnboarding = !settings.apiKey && !(settings as Record<string, unknown>).onboardingDone;

  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      {needsOnboarding ? (
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      ) : (
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </Layout>
          }
        />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SettingsProvider>
          <EnhancementProvider>
            <AppRoutes />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  backdropFilter: 'blur(20px)',
                },
              }}
            />
          </EnhancementProvider>
        </SettingsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
