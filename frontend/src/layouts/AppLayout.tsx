import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { roleDashboard } from '../auth/role-routes';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      setLogoutError('No se pudo cerrar la sesión. Revisá tu conexión e intentá nuevamente.');
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand">
          NautiFlow
        </NavLink>
        <nav className="app-nav" aria-label="Navegación principal">
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/estado">Estado</NavLink>
          {user ? (
            <>
              <NavLink to={roleDashboard(user.role)}>Panel</NavLink>
              {user.role === 'OWNER' && <NavLink to="/owner/solicitud">Mi solicitud</NavLink>}
              {user.role === 'ADMIN' && (
                <>
                  <NavLink to="/admin/solicitudes">Solicitudes</NavLink>
                  <NavLink to="/admin/viajes">Viajes</NavLink>
                </>
              )}
              <span className="nav-user">{user.name}</span>
              <button type="button" className="nav-cta" onClick={handleLogout}>Salir</button>
            </>
          ) : (
            <NavLink to="/login" className="nav-cta">Ingresar</NavLink>
          )}
        </nav>
      </header>

      <main className="app-main">
        {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>NautiFlow · Delta del Tigre</span>
        <span>MVP en construcción · NoCountry G10</span>
      </footer>
    </div>
  );
}
