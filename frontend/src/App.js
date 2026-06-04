import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './context/AuthStore';
import './styles/globals.css';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Goals = lazy(() => import('./pages/Goals'));
const Habits = lazy(() => import('./pages/Habits'));
const Notes = lazy(() => import('./pages/Notes'));
const Focus = lazy(() => import('./pages/Focus'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const SuperAdminPanel = lazy(() => import('./pages/SuperAdminPanel'));
const AppLayout = lazy(() => import('./components/shared/AppLayout'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} className="animate-spin" />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading VidyutDhar...</span>
    </div>
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const { isAuthenticated, refreshUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) refreshUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="goals" element={<Goals />} />
              <Route path="habits" element={<Habits />} />
              <Route path="notes" element={<Notes />} />
              <Route path="focus" element={<Focus />} />
              <Route path="ai" element={<AIAssistant />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><AdminPanel /></ProtectedRoute>} />
              <Route path="superadmin" element={<ProtectedRoute roles={['SUPER_ADMIN']}><SuperAdminPanel /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-lg)',
            },
            success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-base)' } },
            error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg-base)' } },
          }}
        />
      </Router>
    </QueryClientProvider>
  );
}
