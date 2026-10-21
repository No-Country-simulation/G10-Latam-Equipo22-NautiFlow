import { NavLink, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand">
          NautiFlow
        </NavLink>
        <nav className="app-nav" aria-label="Navegación principal">
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/estado">Estado</NavLink>
          <NavLink to="/dashboard">Panel</NavLink>
          <NavLink to="/login" className="nav-cta">
            Ingresar
          </NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>NautiFlow · Delta del Tigre</span>
        <span>MVP en construcción · NoCountry G10</span>
      </footer>
    </div>
  );
}
