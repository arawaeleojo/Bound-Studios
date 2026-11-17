import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Global contexts for application state and preferences
import { ThemeProvider } from './providers/ThemeProvider';
import { SettingsProvider } from './providers/SettingsProvider';
import { ToastProvider } from './providers/ToastProvider';

import { FollowUpsProvider } from './hooks/useFollowUps';
import { EnquiriesProvider } from './hooks/useEnquiries';

import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Enquiries } from './pages/Enquiries';
import { FollowUps } from './pages/FollowUps';
import { Statistics } from './pages/Statistics';
import { Settings } from './pages/Settings';

// Resets window scroll position when navigating between routes
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Root application component composing contexts and routing
function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ToastProvider>
          <FollowUpsProvider>
            <EnquiriesProvider>
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/enquiries" element={<Enquiries />} />
                    <Route path="/follow-ups" element={<FollowUps />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<div>Page not found</div>} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </EnquiriesProvider>
          </FollowUpsProvider>
        </ToastProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;