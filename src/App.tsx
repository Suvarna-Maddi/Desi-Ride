import React, { useEffect } from 'react';
import { AuthProvider, useAuth, getDashboardPathForRole } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserRole } from './types/auth';

const RoleGuard: React.FC<{
  allowedRole: UserRole;
  children: React.ReactNode;
}> = ({ allowedRole, children }) => {
  const { user, isAuthenticated, isLoading, navigate } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        navigate('/login');
      } else if (user.role !== allowedRole) {
        navigate(getDashboardPathForRole(user.role));
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRole, navigate]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#08783F' }}>
        Restoring Desi Ride session...
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
};

const RouterView: React.FC = () => {
  const { currentPath, isAuthenticated, user, isLoading, navigate } = useAuth();

  // Redirect already-authenticated users away from /login or /register to their dashboard,
  // and redirect Vehicle Owners, Operators, and Admins away from the Customer Homepage (/) to their dashboard.
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (currentPath === '/login' || currentPath === '/register') {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        if (redirect && user.role === 'customer') {
          navigate(redirect);
        } else {
          navigate(getDashboardPathForRole(user.role));
        }
      } else if (currentPath === '/' && user.role !== 'customer') {
        navigate(getDashboardPathForRole(user.role));
      }
    }
  }, [currentPath, isAuthenticated, user, isLoading, navigate]);

  if (currentPath === '/login') {
    return <LoginPage />;
  }

  if (currentPath === '/register') {
    return <RegisterPage />;
  }

  if (
    currentPath.startsWith('/customer/dashboard') ||
    (currentPath === '/' && isAuthenticated && user?.role === 'customer')
  ) {
    return (
      <RoleGuard allowedRole="customer">
        <CustomerDashboard />
      </RoleGuard>
    );
  }

  if (currentPath.startsWith('/owner/dashboard') || (currentPath === '/' && isAuthenticated && user?.role === 'owner')) {
    return (
      <RoleGuard allowedRole="owner">
        <OwnerDashboard />
      </RoleGuard>
    );
  }

  if (currentPath.startsWith('/operator/dashboard')) {
    return (
      <RoleGuard allowedRole="operator">
        <OperatorDashboard />
      </RoleGuard>
    );
  }

  if (currentPath.startsWith('/control-desk-x7k9p2m8')) {
    if (!isLoading && (!isAuthenticated || !user)) {
      return <LoginPage />;
    }
    if (!isLoading && user && user.role !== 'admin') {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: '#FBF9F2',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: 0, color: '#991B1B', fontSize: '22px' }}>
            403 – Access Denied
          </h2>
          <p style={{ margin: 0, color: '#4B5563', fontSize: '14px' }}>
            Your account role ({user.role}) does not have permission to access this control desk.
          </p>
          <button
            type="button"
            onClick={() => navigate(getDashboardPathForRole(user.role))}
            style={{
              background: '#08783F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '999px',
              padding: '10px 20px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Return to My Dashboard
          </button>
        </div>
      );
    }
    return (
      <RoleGuard allowedRole="admin">
        <AdminDashboard />
      </RoleGuard>
    );
  }

  return <HomePage />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RouterView />
    </AuthProvider>
  );
};

export default App;
