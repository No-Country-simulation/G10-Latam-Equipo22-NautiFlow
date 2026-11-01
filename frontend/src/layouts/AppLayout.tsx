import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Anchor, Compass, MessageCircle, Star } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { roleDashboard } from '../auth/role-routes';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');
  const isLanding = location.pathname === '/';

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
      <header className={`app-header${isLanding ? ' landing-header' : ''}`}>
        <NavLink to="/" className="brand">
          <img src="/favicon.ico" alt="" />
          <span>NautiFlow</span>
        </NavLink>
        <nav className="app-nav" aria-label="Navegación principal">
          {isLanding && !user ? (
            <>
              <span className="nav-spacer">
                <Link to="/#network">Explorar viajes</Link>
                <Link to="/#how-it-works">Cómo funciona</Link>
                <Link to="/registro/lanchero">Para lancheros</Link>
              </span>
              <span className="landing-header-actions">
                <Link to="/login">Ingresar</Link>
                <Link to="/registro/cliente" className="nav-cta">Crear cuenta</Link>
              </span>
            </>
          ) : user ? (
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

      <main className={`app-main${isLanding ? ' app-main-landing' : ''}`}>
        {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
        <Outlet />
      </main>

      <footer className={`app-footer${isLanding ? ' landing-footer' : ''}`}>
        {isLanding ? (
          <div className="landing-footer-inner">
            <Link to="/" className="brand brand-light"><span className="brand-mark" aria-hidden="true"><Anchor size={20} /></span><span>NautiFlow<small>El Delta es uno</small></span></Link>
            <nav aria-label="Navegación del pie de página">
              <Link to="/#network">Explorar viajes</Link>
              <Link to="/#how-it-works">Cómo funciona</Link>
              <Link to="/registro/lanchero">Para lancheros</Link>
            </nav>
            <div className="footer-social" aria-label="NautiFlow en redes">
              <Compass size={17} aria-hidden="true" />
              <Star size={17} aria-hidden="true" />
              <MessageCircle size={17} aria-hidden="true" />
            </div>
          </div>
        ) : (
          <><span>NautiFlow · Delta del Tigre</span><span>MVP en construcción · NoCountry G10</span></>
        )}
      </footer>
    </div>
  );
}
