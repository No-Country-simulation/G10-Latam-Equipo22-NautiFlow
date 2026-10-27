import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import type { UserRole } from '../auth/auth.types';
import { useHealth } from '../hooks/useHealth';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administración',
  OWNER: 'Lanchero',
  CLIENT: 'Cliente',
};

export function RoleDashboardPage({ role }: { role: UserRole }) {
  const { user } = useAuth();
  const { data: health, loading, error } = useHealth();

  if (!user) return null;

  const cards = role === 'ADMIN'
    ? [
        { label: 'API', value: loading ? 'Consultando' : error ? 'Sin conexión' : 'Operativa' },
        { label: 'Base de datos', value: loading ? 'Consultando' : health?.db === 'up' ? 'Conectada' : 'Sin conexión' },
        { label: 'Gestión', value: 'Sin operaciones registradas' },
      ]
    : role === 'OWNER'
    ? [
        { label: 'Perfil', value: user.ownerStatus === 'APPROVED' ? 'Aprobado' : user.ownerStatus === 'REJECTED' ? 'Requiere revisión' : 'Pendiente de revisión' },
        { label: 'Embarcaciones', value: 'Todavía no hay embarcaciones' },
        { label: 'Actividad', value: 'Sin actividad registrada' },
      ]
    : [
        { label: 'Cuenta', value: 'Activa' },
        { label: 'Viajes', value: 'Los servicios se coordinan con la agencia' },
        { label: 'Reseñas', value: 'Vas a recibir un enlace al completar un viaje' },
      ];

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Panel · {roleLabels[role]}</p>
          <h1>Hola, {user.name.split(' ')[0]}.</h1>
          <p className="lead">Este es el estado actual de tu espacio en NautiFlow.</p>
        </div>
        <span className={`role-mark role-${role.toLowerCase()}`}>{roleLabels[role]}</span>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <article className="dashboard-stat" key={card.label}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <section className="dashboard-section" aria-labelledby="activity-title">
        <div>
          <p className="eyebrow">Actividad reciente</p>
          <h2 id="activity-title">Todo tranquilo por acá</h2>
          <p>
            {role === 'ADMIN'
              ? 'La gestión de viajes y verificaciones estará disponible cuando se habiliten esos módulos.'
              : role === 'OWNER'
              ? 'Cuando registres embarcaciones o recibas novedades, las vas a encontrar en este espacio.'
              : 'La agencia coordina los viajes manualmente. No necesitás gestionar reservas desde esta cuenta.'}
          </p>
        </div>
      </section>

      <nav className="dashboard-shortcuts" aria-label="Accesos rápidos">
        {role === 'OWNER' ? (
          <>
            <Link to="/owner/solicitud" className="shortcut-link">Estado de mi solicitud <span aria-hidden="true">↗</span></Link>
            <Link to="/estado" className="shortcut-link">Estado del servicio <span aria-hidden="true">↗</span></Link>
          </>
        ) : role === 'ADMIN' ? (
          <>
            <Link to="/admin/solicitudes" className="shortcut-link">Revisar solicitudes <span aria-hidden="true">↗</span></Link>
            <Link to="/admin/viajes" className="shortcut-link">Gestionar viajes <span aria-hidden="true">↗</span></Link>
          </>
        ) : <Link to="/" className="shortcut-link">Inicio <span aria-hidden="true">↗</span></Link>}
      </nav>
    </section>
  );
}