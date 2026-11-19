import React, { useEffect } from 'react';
import { useAuth, getDashboardPathForRole } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRole,
  children,
}) => {
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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          color: '#08783F',
        }}
      >
        Restoring Desi Ride session...
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
