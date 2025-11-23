
import React, { useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ReservationProvider } from './contexts/ReservationContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { LogProvider } from './contexts/LogContext';
import { UserProvider } from './contexts/UserContext';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ConnectionTest from './pages/ConnectionTest';
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import UserDashboard from './pages/user/UserDashboard';
import MapPage from './pages/user/MapPage';
import UserReservations from './pages/user/UserReservations';
import ActiveReservationPage from './pages/user/ActiveReservationPage';
import UserSettingsPage from './pages/user/UserSettingsPage';
import ReservationConfirmationPage from './pages/user/ReservationConfirmationPage';
import PaymentPage from './pages/user/PaymentPage';
import BookingConfirmationPage from './pages/user/BookingConfirmationPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageParkingsPage from './pages/admin/ManageParkingsPage';
import ManageReservationsPage from './pages/admin/ManageReservationsPage';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import ManageUsersPage from './pages/superadmin/ManageUsersPage';
import ManageAdminsPage from './pages/superadmin/ManageAdminsPage';
import CurrencyManagerPage from './pages/superadmin/CurrencyManagerPage';
import SystemLogsPage from './pages/superadmin/SystemLogsPage';
import FullPageLoader from './components/common/FullPageLoader';
import { UserRole } from './types';
import { testSupabaseConnection } from './lib/supabaseClient';

// Centralized settings/profile and analytics pages
import AdminAnalyticsPage from './pages/admin/AnalyticsPage';
import SuperAdminAnalyticsPage from './pages/superadmin/AnalyticsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import SuperAdminProfilePage from './pages/superadmin/SuperAdminProfilePage';

const AppRoutes: React.FC = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('AuthContext must be used within an AuthProvider');
  }

  const { user, loading } = authContext;

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/connection-test" element={<ConnectionTest />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user.role === UserRole.USER) {
    return (
      <UserLayout>
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/reservations" element={<UserReservations />} />
          <Route path="/active-reservation" element={<ActiveReservationPage />} />
          <Route path="/settings" element={<UserSettingsPage />} />
          <Route path="/reservation-confirmation" element={<ReservationConfirmationPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UserLayout>
    );
  }

  if (user.role === UserRole.ADMIN) {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/manage-parkings" element={<ManageParkingsPage />} />
          <Route path="/manage-reservations" element={<ManageReservationsPage />} />
          <Route path="/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/profile" element={<AdminProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    return (
      <SuperAdminLayout>
        <Routes>
          <Route path="/" element={<SuperAdminDashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/manage-users" element={<ManageUsersPage />} />
          <Route path="/manage-admins" element={<ManageAdminsPage />} />
          <Route path="/manage-parkings" element={<ManageParkingsPage />} />
          <Route path="/analytics" element={<SuperAdminAnalyticsPage />} />
          <Route path="/currency" element={<CurrencyManagerPage />} />
          <Route path="/logs" element={<SystemLogsPage />} />
          <Route path="/profile" element={<SuperAdminProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SuperAdminLayout>
    );
  }

  return <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  useEffect(() => {
    // Check Supabase connection on app mount (non-blocking)
    testSupabaseConnection();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <LogProvider>
          <UserProvider>
            <ReservationProvider>
              <PaymentProvider>
                <HashRouter>
                  <AppRoutes />
                </HashRouter>
              </PaymentProvider>
            </ReservationProvider>
          </UserProvider>
        </LogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;