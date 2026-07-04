import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { SettingsProvider, EnhancementProvider } from './contexts';
import { DashboardPage } from './pages/Dashboard';
import { HistoryPage } from './pages/History';
import { TemplatesPage } from './pages/Templates';
import { SettingsPage } from './pages/Settings';
import { AboutPage } from './pages/About';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SettingsProvider>
          <EnhancementProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </Layout>
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
