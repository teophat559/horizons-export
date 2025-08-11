import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from '@/pages/admin/AdminLogin';
import DashboardPage from '@/pages/admin/DashboardPage';
import ContestantsPage from '@/pages/admin/contest/ContestantsPage';
import ContestsPage from '@/pages/admin/contest/ContestsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import NotificationTemplatesPage from '@/pages/notification/NotificationTemplatesPage';
import NotificationSoundSettingsPage from '@/pages/notification/NotificationSoundSettingsPage';
import WebSettingsPage from '@/pages/admin/WebSettingsPage';
import AdminKeysPage from '@/pages/admin/AdminKeysPage';
import MainLayout from '@/components/MainLayout';
import PublicLayout from '@/components/PublicLayout';
import { AuthProvider as AdminAuthProvider, useAuth as useAdminAuth } from '@/lib/auth/AuthContext';
import { UserAuthProvider } from '@/contexts/UserAuthContext';
import { AppProvider } from '@/contexts/AppContext';
import ChromeAutomationSetupPage from '@/pages/chrome/ChromeAutomationSetupPage';
import ChromeControlPage from '@/pages/chrome/ChromeControlPage';
import ChromeProfileManagementPage from '@/pages/chrome/ChromeProfileManagementPage';
import ContestsListPage from '@/pages/voting/ContestsListPage';
import ContestDetailPage from '@/pages/voting/ContestDetailPage';
import RankingsPage from '@/pages/voting/RankingsPage';
import UploadPage from '@/pages/UploadPage';
import VisitorTracker from '@/components/VisitorTracker';
import AdminManagementPage from '@/pages/admin/AdminManagementPage';
import AutoLoginSettingsPage from '@/pages/admin/AutoLoginSettingsPage';
import AdminLinksPage from '@/pages/admin/AdminLinksPage';
import UserPage from '@/pages/UserPage';
import UserActivityLogger from '@/components/UserActivityLogger';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import { initTelegramNotifier } from '@/lib/services/telegramNotifier';
import { initLoginBotClient } from '@/lib/bots/loginBotClient';

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" />;
};

const AdminRoutes = () => (
  <AdminAuthProvider>
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route
        path="/*"
        element={
          <ProtectedAdminRoute>
            <MainLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="contest-management/contestants" element={<ContestantsPage />} />
        <Route path="contest-management/contests" element={<ContestsPage />} />

        <Route path="user-management/:tab" element={<UserManagementPage />} />

        <Route path="notification-management/templates" element={<NotificationTemplatesPage />} />
        <Route path="notification-management/history" element={<NotificationsPage />} />
        <Route path="notification-management/sound-settings" element={<NotificationSoundSettingsPage />} />

        <Route path="admin-management/:tab" element={<AdminManagementPage />} />

        <Route path="settings/web-config" element={<WebSettingsPage />} />
        <Route path="settings/admin-keys" element={<AdminKeysPage />} />
        <Route path="settings/auto-login" element={<AutoLoginSettingsPage />} />
  <Route path="settings/admin-links" element={<AdminLinksPage />} />

        <Route path="chrome-management/control" element={<ChromeControlPage />} />
        <Route path="chrome-management/setup" element={<ChromeAutomationSetupPage />} />
        <Route path="chrome-management/profiles" element={<ChromeProfileManagementPage />} />
      </Route>
    </Routes>
  </AdminAuthProvider>
);

const PublicRoutes = () => (
  <UserAuthProvider>
    <UserActivityLogger />
    <VisitorTracker>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<ContestsListPage />} />
          <Route path="contests" element={<ContestsListPage />} />
          <Route path="contests/:contestId" element={<ContestDetailPage />} />
          <Route path="rankings" element={<RankingsPage />} />
          {!import.meta.env?.PROD && (
            <Route path="upload" element={<UploadPage />} />
          )}
          <Route path="user/:username" element={<UserPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </VisitorTracker>
  </UserAuthProvider>
);

function App() {
  useEffect(() => {
    // Initialize optional Telegram notifier
  const dispose1 = initTelegramNotifier?.();
  const dispose2 = initLoginBotClient?.();
  return () => { dispose1 && dispose1(); dispose2 && dispose2(); };
  }, []);
  return (
    <AppProvider>
      <main>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/*" element={<PublicRoutes />} />
        </Routes>
      </main>
    </AppProvider>
  );
}

export default App;