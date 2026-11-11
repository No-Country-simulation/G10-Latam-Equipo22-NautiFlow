import { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  RotateCcw,
  Ship,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import type { UserRole } from '../auth/auth.types';
import { api } from '../services/api';
import { WavyLoader } from '../components/WavyLoader';

interface KpiItem {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  featured?: boolean;
}

interface ActividadSemanalItem {
  key: string;
  label: string;
  count: number;
}

interface EventoActividad {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  estado?: string;
}

interface AdminDashboardData {
  totalLanchas: number;
  lanchasVerificadas: number;
  solicitudesPendientes: number;
  retornosDisponibles: number;
  viajesPendientes: number;
  viajesCompletados: number;
  calificacionPromedio: number | null;
  totalResenas: number;
  actividadSemanal: ActividadSemanalItem[];
  actividadReciente: EventoActividad[];
}

const DEFAULT_WEEK_DAYS: ActividadSemanalItem[] = [
  { key: 'lun', label: 'L', count: 0 },
  { key: 'mar', label: 'M', count: 0 },
  { key: 'mie', label: 'M', count: 0 },
  { key: 'jue', label: 'J', count: 0 },
  { key: 'vie', label: 'V', count: 0 },
  { key: 'sab', label: 'S', count: 0 },
  { key: 'dom', label: 'D', count: 0 },
];

export function RoleDashboardPage({ role }: { role: UserRole }) {
  const { user } = useAuth();
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(role === 'ADMIN');

  useEffect(() => {
    if (role === 'ADMIN') {
      let isMounted = true;
      api
        .get<AdminDashboardData>('/admin/dashboard/resumen')
        .then((data) => {
          if (isMounted) {
            setAdminData(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [role]);

  if (!user) return null;

  const firstName = user.name.split(' ')[0];

  // Métricas con datos reales del backend
  const topKpis: KpiItem[] =
    role === 'ADMIN'
      ? [
          {
            label: 'Total lanchas registradas',
            value: String(adminData?.totalLanchas ?? '—'),
            icon: Ship,
          },
          {
            label: 'Lanchas verificadas y activas',
            value: String(adminData?.lanchasVerificadas ?? '—'),
            icon: CheckCircle2,
            featured: true,
          },
          {
            label: 'Solicitudes pendientes',
            value: String(adminData?.solicitudesPendientes ?? '—'),
            icon: ClipboardList,
            featured: Boolean(adminData && adminData.solicitudesPendientes > 0),
          },
          {
            label: 'Retornos vacíos disponibles',
            value: String(adminData?.retornosDisponibles ?? '—'),
            icon: RotateCcw,
          },
        ]
      : [
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

  const bottomKpis: KpiItem[] =
    role === 'ADMIN'
      ? [
          {
            label: 'Viajes pendientes o programados',
            value: String(adminData?.viajesPendientes ?? '—'),
            icon: CalendarClock,
          },
          {
            label: 'Viajes completados',
            value: String(adminData?.viajesCompletados ?? '—'),
            icon: CalendarCheck,
          },
          {
            label: 'Calificación promedio de flota',
            value: adminData?.calificacionPromedio ? `${adminData.calificacionPromedio} ★` : '—',
            subtitle: adminData?.totalResenas ? `${adminData.totalResenas} reseñas de turistas` : 'Sin reseñas aún',
            icon: Star,
          },
        ]
      : [
          { label: 'Viajes programados', value: '1', icon: CalendarClock },
          { label: 'Viajes completados', value: '1', icon: CalendarCheck },
          { label: 'Calificación promedio', value: '4.8 ★', icon: Star },
        ];

  const chartData = adminData?.actividadSemanal?.length
    ? adminData.actividadSemanal
    : DEFAULT_WEEK_DAYS;

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  const greetingTitle =
    role === 'ADMIN' ? 'Buen día, equipo.' : `Buen día, ${firstName}.`;

  const greetingSubtitle =
    role === 'ADMIN'
      ? 'Panel central de control y monitoreo en tiempo real de la red NautiFlow en el Delta.'
      : 'Este es el estado operativo de tus embarcaciones y viajes en la red.';

  return (
    <section className="nf-dashboard">
      <header className="nf-dashboard-header">
        <p className="nf-eyebrow">RESUMEN OPERATIVO</p>
        <h1>{greetingTitle}</h1>
        <p className="nf-subtitle">{greetingSubtitle}</p>
      </header>

      {loading ? (
        <div className="admin-loading-state" style={{ minHeight: '160px' }}>
          <WavyLoader label="Sincronizando métricas en vivo del panel…" />
        </div>
      ) : (
        <>
          {/* Fila superior de KPIs (4 columnas) */}
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
                      <Icon size={18} />
                    </span>
                  </div>
                  <strong className="nf-kpi-value">{item.value}</strong>
                </article>
              );
            })}
          </div>

          {/* Fila secundaria de KPIs (3 columnas) */}
          <div className="nf-kpi-grid nf-kpi-grid-3">
            {bottomKpis.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className="nf-kpi-card">
                  <div className="nf-kpi-top">
                    <span className="nf-kpi-label">{item.label}</span>
                    <span className="nf-kpi-icon" aria-hidden="true">
                      <Icon size={18} />
                    </span>
                  </div>
                  <div>
                    <strong className="nf-kpi-value">{item.value}</strong>
                    {item.subtitle && (
                      <span className="nf-kpi-subtext">{item.subtitle}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Paneles inferiores: Gráfico de viajes y Actividad reciente */}
          <div className="nf-bottom-panels">
            {/* Gráfico semanal */}
            <section className="nf-panel nf-activity-panel" aria-labelledby="activity-title">
              <div className="nf-panel-header">
                <div>
                  <h2 id="activity-title">Actividad de viajes</h2>
                  <span className="nf-panel-desc">Viajes programados en los últimos 7 días</span>
                </div>
                <span className="nf-period-pill">Semana actual</span>
              </div>

              <div className="nf-chart-area" aria-label="Actividad semanal de lunes a domingo">
                {chartData.map((day) => {
                  const percentage = Math.max((day.count / maxCount) * 100, 8);
                  return (
                    <div key={day.key} className="nf-chart-col">
                      <div className="nf-chart-tooltip" title={`${day.count} viajes`}>
                        {day.count > 0 && <span className="chart-count-bubble">{day.count}</span>}
                      </div>
                      <div className="nf-chart-bar-wrap">
                        <span
                          className="nf-chart-bar"
                          style={{ height: `${percentage}%` }}
                        />
                      </div>
                      <span className="nf-chart-day">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Actividad Reciente */}
            <section className="nf-panel nf-recent-panel" aria-labelledby="recent-title">
              <div className="nf-panel-header">
                <div>
                  <h2 id="recent-title">Acontecimientos recientes</h2>
                  <span className="nf-panel-desc">Movimientos en vivo en la plataforma</span>
                </div>
                <span className="nf-period-pill">Últimos eventos</span>
              </div>

              <div className="recent-activity-list">
                {!adminData?.actividadReciente || adminData.actividadReciente.length === 0 ? (
                  <p className="empty-activity-text">
                    No se registran eventos recientes en este momento.
                  </p>
                ) : (
                  adminData.actividadReciente.slice(0, 6).map((ev) => (
                    <div key={ev.id} className="recent-event-item">
                      <div className="event-bullet" />
                      <div className="event-content">
                        <div className="event-title-row">
                          <strong className="event-title">{ev.titulo}</strong>
                          <span className="event-time">
                            {new Date(ev.fecha).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="event-desc">{ev.descripcion}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}
