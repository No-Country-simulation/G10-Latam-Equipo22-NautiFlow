import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { roleDashboard } from './role-routes';

export function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p className="session-loading" role="status">Verificando sesión...</p>;
  return <Navigate to={user ? roleDashboard(user.role) : '/login'} replace />;
}