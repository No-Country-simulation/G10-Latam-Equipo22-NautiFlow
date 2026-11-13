import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  CalendarClock,
  ChevronDown,
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
  UserRound,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { roleDashboard } from '../auth/role-routes';
import type { UserRole } from '../auth/auth.types';
import { NotificationBell } from '../components/NotificationBell';

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
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAdminMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAdminMenuOpen(false);
      }
    }

    if (isAdminMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminMenuOpen]);

  useEffect(() => {
    setIsAdminMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const isPrivate =
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/owner') ||
      location.pathname.startsWith('/dashboard') ||
      location.pathname.startsWith('/login');

    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (isPrivate) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'robots';
        document.head.appendChild(meta);
      }
      meta.content = 'noindex, nofollow';
    } else if (meta) {
      meta.remove();
    }
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
    const pageTitle =
      location.pathname.includes('verificacion')
        ? 'Verificación'
        : location.pathname.includes('flota')
        ? 'Gestión de flota'
        : location.pathname.includes('solicitudes')
        ? 'Solicitudes'
        : location.pathname.includes('busqueda')
        ? 'Búsqueda y asignación'
        : location.pathname.includes('retornos')
        ? 'Retornos vacíos'
        : location.pathname.includes('resenas')
        ? 'Reseñas'
        : location.pathname.includes('estado')
        ? 'Estado del sistema'
        : location.pathname.includes('salidas')
        ? 'Salidas y tramos'
        : location.pathname.includes('perfil')
        ? 'Mi perfil'
        : location.pathname.includes('viajes')
        ? 'Gestión de viajes'
        : location.pathname.includes('solicitud')
        ? 'Verificación'
        : 'Dashboard';

    const navItems =
      user.role === 'ADMIN'
        ? [
            { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
            { to: '/admin/verificacion', label: 'Verificación', icon: FileCheck2 },
            { to: '/admin/flota', label: 'Gestión de flota', icon: Ship },
            { to: '/admin/solicitudes', label: 'Solicitudes', icon: ClipboardList },
            { to: '/admin/busqueda', label: 'Búsqueda y asignación', icon: Search },
            { to: '/admin/viajes', label: 'Gestión de viajes', icon: CalendarClock },
            { to: '/admin/retornos', label: 'Retornos vacíos', icon: RotateCcw },
            { to: '/admin/resenas', label: 'Reseñas', icon: Star },
          ]
        : [
            { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
            { to: '/owner/solicitud', label: 'Verificación', icon: FileCheck2 },
            { to: '/owner/flota', label: 'Mi flota', icon: Ship },
            { to: '/owner/salidas', label: 'Salidas', icon: CalendarClock },
            { to: '/owner/retornos', label: 'Retornos vacíos', icon: RotateCcw },
            { to: '/owner/perfil', label: 'Mi perfil', icon: UserRound },
            { to: '/owner/resenas', label: 'Reseñas', icon: Star },
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
              <NotificationBell />
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
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
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
            {user && user.role !== 'ADMIN' && (
              <>
                <NavLink to={roleDashboard(user.role)}>Panel</NavLink>
                {user.role === 'OWNER' && <NavLink to="/owner/solicitud">Mi solicitud</NavLink>}
              </>
            )}
          </span>
          <span className="landing-header-actions">
            {user ? (
              user.role === 'ADMIN' ? (
                <div className="nav-dropdown-container" ref={adminDropdownRef}>
                  <button
                    type="button"
                    className="nav-dropdown-trigger"
                    onClick={() => setIsAdminMenuOpen((prev) => !prev)}
                    aria-expanded={isAdminMenuOpen}
                    aria-haspopup="true"
                    aria-label="Menú de administración"
                  >
                    <span>{user.name || 'Administración NautiFlow'}</span>
                    <ChevronDown
                      size={15}
                      className={`nav-dropdown-chevron${isAdminMenuOpen ? ' is-open' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isAdminMenuOpen && (
                    <div className="nav-dropdown-menu" role="menu">
                      <Link
                        to={roleDashboard(user.role)}
                        className="nav-dropdown-item"
                        role="menuitem"
                        onClick={() => setIsAdminMenuOpen(false)}
                      >
                        <LayoutGrid size={16} aria-hidden="true" />
                        <span>Ir al panel</span>
                      </Link>
                      <button
                        type="button"
                        className="nav-dropdown-item nav-dropdown-item-logout"
                        role="menuitem"
                        onClick={() => {
                          setIsAdminMenuOpen(false);
                          void handleLogout();
                        }}
                      >
                        <LogOut size={16} aria-hidden="true" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <span className="nav-user">{user.name}</span>
                  <button type="button" className="nav-cta nav-logout-btn" onClick={handleLogout}>
                    Salir
                  </button>
                </>
              )
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

      <main id="main-content" className={`app-main${isLanding ? ' app-main-landing' : ''}`}>
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
            <div className="footer-social" role="img" aria-label="NautiFlow en redes">
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