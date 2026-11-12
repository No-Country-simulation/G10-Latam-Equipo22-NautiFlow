import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { roleDashboard } from './role-routes';
import { SessionRetry } from './SessionRetry';

export function DashboardRedirect() {
  const { user, loading, sessionError } = useAuth();
  if (loading) return <p className="session-loading" role="status">Verificando sesión...</p>;
  if (!user && sessionError) return <SessionRetry />;
  return <Navigate to={user ? roleDashboard(user.role) : '/login'} replace />;
}
