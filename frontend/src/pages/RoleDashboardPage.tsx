import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  RotateCcw,
  Ship,
  Star,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import type { UserRole } from '../auth/auth.types';
import { api } from '../services/api';

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

interface ActivityEvent {
  type: 'owner' | 'trip' | 'review' | 'emptyLeg';
  at: string;
  [key: string]: unknown;
}

interface DashboardResumen {
  reservasPendientes: number;
  viajesPorOperar: number;
  solicitudesLancheroPendientes: number;
  documentosPendientes: number;
  salidasProgramadas: number;
  totalEmbarcaciones?: number;
  embarcacionesVerificadas?: number;
  retornosActivos?: number;
  viajesCompletados?: number;
  calificacionPromedio?: number | null;
  actividadReciente?: ActivityEvent[];
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

function barHeight(index: number): string {
  // Deterministic heights using Math.sin so they don't change between renders
  const pct = Math.round(30 + Math.abs(Math.sin(index * 1.7)) * 70);
  return `${pct}%`;
}

function relativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function ActivityItem({ event }: { event: ActivityEvent }) {
  let Icon: LucideIcon;
  let text: string;

  switch (event.type) {
    case 'owner':
      Icon = User;
      text = `Nuevo lanchero registrado: ${String(event.nombre ?? event.name ?? '')}`;
      break;
    case 'trip':
      Icon = CalendarClock;
      text = `Nuevo viaje: ${String(event.cliente ?? '')} · ${event.fechaHora ? String(event.fechaHora) : event.scheduledAt ? new Date(String(event.scheduledAt)).toLocaleDateString('es-AR') : ''}`;
      break;
    case 'review':
      Icon = Star;
      text = `Reseña recibida: ${String(event.embarcacion ?? '')} · ${String(event.rating ?? '')}★`;
      break;
    case 'emptyLeg':
      Icon = RotateCcw;
      text = `Retorno disponible: ${String(event.origin ?? '')} → ${String(event.destination ?? '')}`;
      break;
    default:
      Icon = AlertCircle;
      text = 'Evento desconocido';
  }

  return (
    <div className="nf-activity-item">
      <span className="nf-activity-icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <div>
        <p className="nf-activity-text">{text}</p>
        <p className="nf-activity-time">{relativeDate(event.at)}</p>
      </div>
    </div>
  );
}

export function RoleDashboardPage({ role }: { role: UserRole }) {
  const { user } = useAuth();

  // ── ADMIN: live data ─────────────────────────────────────────────────────
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [errorResumen, setErrorResumen] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    setLoadingResumen(true);
    setErrorResumen(null);
    api
      .get<DashboardResumen>('/admin/dashboard/resumen')
      .then((data) => setResumen(data))
      .catch((err: unknown) => {
        setErrorResumen(err instanceof Error ? err.message : 'Error al cargar el resumen.');
      })
      .finally(() => setLoadingResumen(false));
  }, [role]);

  if (!user) return null;

  const firstName = user.name.split(' ')[0];

  // ── ADMIN KPIs ───────────────────────────────────────────────────────────
  const dash = (n: number | undefined | null): string =>
    loadingResumen ? '—' : n == null ? '—' : String(n);

  const adminTopKpis: KpiItem[] = [
    {
      label: 'Total lanchas',
      value: dash(resumen?.totalEmbarcaciones),
      icon: Ship,
    },
    {
      label: 'Verificadas',
      value: dash(resumen?.embarcacionesVerificadas),
      icon: CheckCircle2,
    },
    {
      label: 'Solicitudes pendientes',
      value: dash(resumen?.solicitudesLancheroPendientes),
      icon: ClipboardList,
      featured: true,
    },
    {
      label: 'Retornos activos',
      value: dash(resumen?.retornosActivos),
      icon: RotateCcw,
    },
  ];

  const adminBottomKpis: KpiItem[] = [
    {
      label: 'Viajes por operar',
      value: dash(resumen?.viajesPorOperar),
      icon: CalendarCheck,
    },
    {
      label: 'Viajes completados',
      value: dash(resumen?.viajesCompletados),
      icon: Check,
    },
    {
      label: 'Calificación promedio',
      value: loadingResumen
        ? '—'
        : resumen?.calificacionPromedio == null
        ? '—'
        : String(resumen.calificacionPromedio),
      icon: Star,
    },
  ];

  // ── OWNER & CLIENT KPIs (unchanged) ──────────────────────────────────────
  const ownerTopKpis: KpiItem[] = [
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
  ];

  const ownerBottomKpis: KpiItem[] = [
    { label: 'Viajes programados', value: '1', icon: CalendarCheck },
    { label: 'Viajes completados', value: '1', icon: Check },
    { label: 'Calificación promedio', value: '4.8', icon: Star },
  ];

  const clientTopKpis: KpiItem[] = [
    { label: 'Lanchas disponibles', value: '8', icon: Ship },
    { label: 'Verificadas', value: '6', icon: CheckCircle2 },
    { label: 'Solicitudes activas', value: '1', icon: ClipboardList, featured: true },
    { label: 'Retornos activos', value: '2', icon: RotateCcw },
  ];

  const clientBottomKpis: KpiItem[] = [
    { label: 'Viajes programados', value: '1', icon: CalendarCheck },
    { label: 'Viajes completados', value: '1', icon: Check },
    { label: 'Calificación promedio', value: '4.9', icon: Star },
  ];

  const topKpis =
    role === 'ADMIN' ? adminTopKpis : role === 'OWNER' ? ownerTopKpis : clientTopKpis;

  const bottomKpis =
    role === 'ADMIN' ? adminBottomKpis : role === 'OWNER' ? ownerBottomKpis : clientBottomKpis;

  // ── Quick actions (OWNER / CLIENT only) ─────────────────────────────────
  const quickActions: QuickActionItem[] =
    role === 'OWNER'
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

  // ── Activity feed ────────────────────────────────────────────────────────
  const actividadReciente: ActivityEvent[] = resumen?.actividadReciente
    ? [...resumen.actividadReciente].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      )
    : [];

  return (
    <section className="nf-dashboard">
      <div className="nf-demo-banner" role="note">
        <span className="nf-demo-dot" aria-hidden="true" />
        <p>
          <strong>Datos de demostración.</strong> Este prototipo comparte cambios en este navegador.
          La autenticación, archivos privados y tokens requieren persistencia segura de backend antes de producción.
        </p>
      </div>

      {/* Error banner – ADMIN only */}
      {role === 'ADMIN' && errorResumen && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid #f5c6c3',
            background: '#fef2f2',
            color: '#b3261e',
            fontSize: '0.84rem',
          }}
        >
          <AlertCircle size={16} aria-hidden="true" />
          {errorResumen}
        </div>
      )}

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

      {/* ── Bottom panels ── */}
      {role === 'ADMIN' ? (
        /* ADMIN: bar chart + activity feed, full width */
        <div className="nf-bottom-panels">
          <section className="nf-panel nf-activity-panel" aria-labelledby="activity-title">
            <div className="nf-panel-header">
              <h2 id="activity-title">Actividad de viajes</h2>
              <span className="nf-period-pill">Últimos 7 días</span>
            </div>
            <div className="nf-chart-area" aria-label="Actividad semanal de lunes a domingo">
              {WEEK_DAYS.map((day, i) => (
                <div key={day.key} className="nf-chart-col">
                  <div className="nf-chart-bar-wrap">
                    <span className="nf-chart-bar" style={{ height: barHeight(i) }} />
                  </div>
                  <span className="nf-chart-day">{day.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="nf-panel" aria-labelledby="recientes-title">
            <div className="nf-panel-header">
              <h2 id="recientes-title">Actividad reciente</h2>
            </div>
            {loadingResumen ? (
              <p className="nf-activity-empty">Cargando actividad…</p>
            ) : actividadReciente.length === 0 ? (
              <p className="nf-activity-empty">No hay actividad reciente.</p>
            ) : (
              <div className="nf-activity-feed">
                {actividadReciente.map((event, i) => (
                  <ActivityItem key={`${event.type}-${event.at}-${i}`} event={event} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* OWNER / CLIENT: bar chart + quick actions (unchanged layout) */
        <div className="nf-bottom-panels">
          <section className="nf-panel nf-activity-panel" aria-labelledby="activity-title">
            <div className="nf-panel-header">
              <h2 id="activity-title">Actividad de viajes</h2>
              <span className="nf-period-pill">Últimos 7 días</span>
            </div>
            <div className="nf-chart-area" aria-label="Actividad semanal de lunes a domingo">
              {WEEK_DAYS.map((day, i) => (
                <div key={day.key} className="nf-chart-col">
                  <div className="nf-chart-bar-wrap">
                    <span className="nf-chart-bar" style={{ height: barHeight(i) }} />
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
      )}
    </section>
  );
}
