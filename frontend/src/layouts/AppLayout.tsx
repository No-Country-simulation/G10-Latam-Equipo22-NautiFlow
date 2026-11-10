import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Bell,
  CalendarClock,
  ClipboardList,
  Compass,
  FileCheck2,
  LayoutGrid,
  LogOut,
  MessageCircle,
  RotateCcw,
  Search,
  Ship,
  Star,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { roleDashboard } from '../auth/role-routes';
import type { UserRole } from '../auth/auth.types';

const roleSectionLabel: Record<UserRole, string> = {
  ADMIN: 'ADMINISTRACIÓN',
  OWNER: 'LANCHERO',
};

const roleCardTitle: Record<UserRole, string> = {
  ADMIN: 'AGENCIA',
  OWNER: 'EMBARCACIÓN',
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const isLanding = location.pathname === '/';
  const isWorkspace =
    Boolean(user) &&
    (location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/owner') ||
      location.pathname.startsWith('/dashboard'));

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      setLogoutError('No se pudo cerrar la sesión. Revisá tu conexión e intentá nuevamente.');
    }
  }

  function handleSectionScroll(sectionId: string) {
    if (location.pathname === '/') {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  if (isWorkspace && user) {
    const dashboardPath = roleDashboard(user.role);
    const pageTitle = location.pathname.includes('solicitudes')
      ? 'Solicitudes'
      : location.pathname.includes('solicitud')
      ? 'Verificación'
      : location.pathname.includes('viajes')
      ? 'Gestión de viajes'
      : 'Dashboard';

    const navItems =
      user.role === 'ADMIN'
        ? [
            { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
            { to: '/admin/solicitudes', label: 'Verificación', icon: FileCheck2 },
            { to: '/admin/solicitudes#flota', label: 'Gestión de flota', icon: Ship },
            { to: '/admin/solicitudes#solicitudes', label: 'Solicitudes', icon: ClipboardList },
            { to: '/admin/viajes#busqueda', label: 'Búsqueda y asignación', icon: Search },
            { to: '/admin/viajes', label: 'Gestión de viajes', icon: CalendarClock },
            { to: '/admin/viajes#retornos', label: 'Retornos vacíos', icon: RotateCcw },
            { to: '/estado', label: 'Reseñas', icon: Star },
          ]
        : [
            { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
            { to: '/owner/solicitud', label: 'Verificación', icon: FileCheck2 },
            { to: '/owner/solicitud#flota', label: 'Gestión de flota', icon: Ship },
            { to: '/owner/solicitud#documentos', label: 'Solicitudes', icon: ClipboardList },
            { to: '/owner/dashboard#viajes', label: 'Gestión de viajes', icon: CalendarClock },
            { to: '/owner/dashboard#retornos', label: 'Retornos vacíos', icon: RotateCcw },
            { to: '/estado', label: 'Reseñas', icon: Star },
          ];

    return (
      <div className="workspace-shell">
        <aside className="workspace-sidebar" aria-label="Menú lateral">
          <div className="workspace-brand-row">
            <Link to="/" className="workspace-brand">
              <img src="/favicon.ico" alt="" className="brand-logo" />
              <span>NautiFlow</span>
            </Link>
          </div>

          <div className="workspace-agency-card">
            <span className="workspace-agency-kicker">{roleCardTitle[user.role]}</span>
            <strong className="workspace-agency-name">
              {user.role === 'ADMIN' ? 'Equipo NautiFlow' : user.name}
            </strong>
          </div>

          <nav className="workspace-nav" aria-label="Navegación del panel">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isHashLink = item.to.includes('#');
              const isActive = isHashLink
                ? location.pathname + location.hash === item.to
                : location.pathname === item.to && !location.hash;

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`workspace-nav-link${isActive ? ' is-active' : ''}`}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="workspace-sidebar-footer">
            <Link to={dashboardPath} className="workspace-nav-link workspace-footer-action">
              <RotateCcw size={16} aria-hidden="true" />
              <span>Restaurar demo</span>
            </Link>
            <button type="button" className="workspace-nav-link workspace-footer-action" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        <div className="workspace-main-column">
          <header className="workspace-topbar">
            <div className="workspace-topbar-titles">
              <span className="workspace-topbar-kicker">{roleSectionLabel[user.role]}</span>
              <strong className="workspace-topbar-title">{pageTitle}</strong>
            </div>
            <div className="workspace-topbar-actions">
              <span className="workspace-demo-pill">Demo</span>
              <Link to={dashboardPath} className="workspace-notif-btn" aria-label="Notificaciones">
                <Bell size={16} aria-hidden="true" />
              </Link>
            </div>
          </header>

          <main className="workspace-content">
            {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  const headerModeClass =
    isLanding && !isScrolled ? 'is-transparent' : 'is-scrolled';

  return (
    <div className="app-shell">
      <header className={`app-header landing-header ${headerModeClass}`}>
        <NavLink to="/" className="brand">
          <img src="/favicon.ico" alt="" className="brand-logo" />
          <span>NautiFlow</span>
        </NavLink>
        <nav className="app-nav" aria-label="Navegación principal">
          <span className="nav-spacer">
            <Link to="/#network" onClick={() => handleSectionScroll('network')}>
              Explorar viajes
            </Link>
            <Link to="/#how-it-works" onClick={() => handleSectionScroll('how-it-works')}>
              Cómo funciona
            </Link>
            {!user && <Link to="/registro/lanchero">Para lancheros</Link>}
            {user && (
              <>
                <NavLink to={roleDashboard(user.role)}>Panel</NavLink>
                {user.role === 'OWNER' && <NavLink to="/owner/solicitud">Mi solicitud</NavLink>}
                {user.role === 'ADMIN' && (
                  <>
                    <NavLink to="/admin/solicitudes">Solicitudes</NavLink>
                    <NavLink to="/admin/viajes">Viajes</NavLink>
                  </>
                )}
              </>
            )}
          </span>
          <span className="landing-header-actions">
            {user ? (
              <>
                <span className="nav-user">{user.name}</span>
                <button type="button" className="nav-cta nav-logout-btn" onClick={handleLogout}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Ingresar</Link>
                <Link to="/registro/lanchero" className="nav-cta">
                  Crear cuenta
                </Link>
              </>
            )}
          </span>
        </nav>
      </header>

      <main className={`app-main${isLanding ? ' app-main-landing' : ''}`}>
        {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
        <Outlet />
      </main>

      <footer className={`app-footer${isLanding ? ' landing-footer' : ''}`}>
        {isLanding ? (
          <div className="landing-footer-inner">
            <Link to="/" className="brand brand-light">
              <img src="/favicon.ico" alt="" className="brand-logo" />
              <span>NautiFlow<small>El Delta es uno</small></span>
            </Link>
            <nav aria-label="Navegación del pie de página">
              <Link to="/#network" onClick={() => handleSectionScroll('network')}>Explorar viajes</Link>
              <Link to="/#how-it-works" onClick={() => handleSectionScroll('how-it-works')}>Cómo funciona</Link>
              <Link to="/registro/lanchero">Para lancheros</Link>
            </nav>
            <div className="footer-social" aria-label="NautiFlow en redes">
              <Compass size={17} aria-hidden="true" />
              <Star size={17} aria-hidden="true" />
              <MessageCircle size={17} aria-hidden="true" />
            </div>
          </div>
        ) : (
          <div className="app-footer-inner">
            <span className="footer-brand">
              <img src="/favicon.ico" alt="" className="brand-logo" />
              <span>NautiFlow · Delta del Tigre</span>
            </span>
            <span>MVP en construcción · NoCountry G10</span>
          </div>
        )}
      </footer>
    </div>
  );
}