import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  RotateCcw,
  Ship,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import type { UserRole } from '../auth/auth.types';

interface KpiItem {
  label: string;
  value: string;
  icon: LucideIcon;
  featured?: boolean;
}

interface QuickActionItem {
  label: string;
  to: string;
  primary?: boolean;
}

const WEEK_DAYS = [
  { key: 'lun', label: 'L' },
  { key: 'mar', label: 'M' },
  { key: 'mie', label: 'M' },
  { key: 'jue', label: 'J' },
  { key: 'vie', label: 'V' },
  { key: 'sab', label: 'S' },
  { key: 'dom', label: 'D' },
];

export function RoleDashboardPage({ role }: { role: UserRole }) {
  const { user } = useAuth();

  if (!user) return null;

  const firstName = user.name.split(' ')[0];

  const topKpis: KpiItem[] =
    role === 'ADMIN'
      ? [
          { label: 'Lanchas registradas', value: '8', icon: Ship },
          { label: 'Verificadas', value: '6', icon: CheckCircle2 },
          { label: 'Solicitudes pendientes', value: '1', icon: ClipboardList, featured: true },
          { label: 'Retornos activos', value: '2', icon: RotateCcw },
        ]
      : role === 'OWNER'
      ? [
          { label: 'Lanchas registradas', value: '1', icon: Ship },
          {
            label: 'Verificadas',
            value: user.ownerStatus === 'APPROVED' ? '1' : '0',
            icon: CheckCircle2,
          },
          {
            label: 'Solicitudes pendientes',
            value: user.ownerStatus === 'APPROVED' ? '0' : '1',
            icon: ClipboardList,
            featured: true,
          },
          { label: 'Retornos activos', value: '1', icon: RotateCcw },
        ]
      : [
          { label: 'Lanchas disponibles', value: '8', icon: Ship },
          { label: 'Verificadas', value: '6', icon: CheckCircle2 },
          { label: 'Solicitudes activas', value: '1', icon: ClipboardList, featured: true },
          { label: 'Retornos activos', value: '2', icon: RotateCcw },
        ];

  const bottomKpis: KpiItem[] =
    role === 'ADMIN'
      ? [
          { label: 'Viajes programados', value: '1', icon: CalendarCheck },
          { label: 'Viajes completados', value: '1', icon: Check },
          { label: 'Calificación promedio', value: '4.7', icon: Star },
        ]
      : role === 'OWNER'
      ? [
          { label: 'Viajes programados', value: '1', icon: CalendarCheck },
          { label: 'Viajes completados', value: '1', icon: Check },
          { label: 'Calificación promedio', value: '4.8', icon: Star },
        ]
      : [
          { label: 'Viajes programados', value: '1', icon: CalendarCheck },
          { label: 'Viajes completados', value: '1', icon: Check },
          { label: 'Calificación promedio', value: '4.9', icon: Star },
        ];

  const quickActions: QuickActionItem[] =
    role === 'ADMIN'
      ? [
          { label: 'Registrar solicitud', to: '/admin/viajes', primary: true },
          { label: 'Revisar documentación', to: '/admin/solicitudes' },
          { label: 'Publicar retorno', to: '/admin/viajes#retornos' },
        ]
      : role === 'OWNER'
      ? [
          { label: 'Estado de mi solicitud', to: '/owner/solicitud', primary: true },
          { label: 'Revisar documentación', to: '/owner/solicitud#documentos' },
          { label: 'Estado del servicio', to: '/estado' },
        ]
      : [
          { label: 'Explorar viajes disponibles', to: '/#network', primary: true },
          { label: 'Cómo funciona el servicio', to: '/#how-it-works' },
          { label: 'Estado del servicio', to: '/estado' },
        ];

  const greetingTitle =
    role === 'ADMIN' ? 'Buen día, equipo.' : `Buen día, ${firstName}.`;

  const greetingSubtitle =
    role === 'ADMIN'
      ? 'Esto es lo que está pasando hoy en la red.'
      : role === 'OWNER'
      ? 'Este es el estado operativo de tus embarcaciones y viajes en la red.'
      : 'Este es el resumen de disponibilidad y servicios hoy en la red.';

  return (
    <section className="nf-dashboard">
      <div className="nf-demo-banner" role="note">
        <span className="nf-demo-dot" aria-hidden="true" />
        <p>
          <strong>Datos de demostración.</strong> Este prototipo comparte cambios en este navegador.
          La autenticación, archivos privados y tokens requieren persistencia segura de backend antes de producción.
        </p>
      </div>

      <header className="nf-dashboard-header">
        <p className="nf-eyebrow">RESUMEN OPERATIVO</p>
        <h1>{greetingTitle}</h1>
        <p className="nf-subtitle">{greetingSubtitle}</p>
      </header>

      <div className="nf-kpi-grid nf-kpi-grid-4">
        {topKpis.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.label}
              className={`nf-kpi-card${item.featured ? ' is-featured' : ''}`}
            >
              <div className="nf-kpi-top">
                <span className="nf-kpi-label">{item.label}</span>
                <span className="nf-kpi-icon" aria-hidden="true">
                  <Icon size={17} />
                </span>
              </div>
              <strong className="nf-kpi-value">{item.value}</strong>
            </article>
          );
        })}
      </div>

      <div className="nf-kpi-grid nf-kpi-grid-3">
        {bottomKpis.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="nf-kpi-card">
              <div className="nf-kpi-top">
                <span className="nf-kpi-label">{item.label}</span>
                <span className="nf-kpi-icon" aria-hidden="true">
                  <Icon size={17} />
                </span>
              </div>
              <strong className="nf-kpi-value">{item.value}</strong>
            </article>
          );
        })}
      </div>

      <div className="nf-bottom-panels">
        <section className="nf-panel nf-activity-panel" aria-labelledby="activity-title">
          <div className="nf-panel-header">
            <h2 id="activity-title">Actividad de viajes</h2>
            <span className="nf-period-pill">Últimos 7 días</span>
          </div>
          <div className="nf-chart-area" aria-label="Actividad semanal de lunes a domingo">
            {WEEK_DAYS.map((day) => (
              <div key={day.key} className="nf-chart-col">
                <div className="nf-chart-bar-wrap">
                  <span className="nf-chart-bar" />
                </div>
                <span className="nf-chart-day">{day.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="nf-panel nf-shortcuts-panel" aria-labelledby="shortcuts-title">
          <h2 id="shortcuts-title">Accesos rápidos</h2>
          <nav className="nf-shortcuts-list" aria-label="Accesos rápidos">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className={`nf-shortcut-btn${action.primary ? ' is-primary' : ''}`}
              >
                <span>{action.label}</span>
                <ChevronRight size={15} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </section>
      </div>
    </section>
  );
}