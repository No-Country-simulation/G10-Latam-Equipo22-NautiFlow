import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { roleDashboard } from './role-routes';
import type { UserRole } from './auth.types';

export function ProtectedRoute({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="session-loading" role="status">Verificando sesión...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (user.role !== role) {
    return <Navigate to={roleDashboard(user.role)} replace />;
  }
  return children;
}