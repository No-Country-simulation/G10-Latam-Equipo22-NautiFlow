import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  MessageCircle,
  RotateCcw,
  Ship,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import type { UserRole } from '../auth/auth.types';
import { api } from '../services/api';
import { WavyLoader } from '../components/WavyLoader';
import type { Paginated } from '../types/api';

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

interface OwnerKpiData {
  totalBoats: number;
  verificadas: number;
  solicitudesPendientes: boolean;
  retornosDisponibles: number;
  viajesProgramados: number;
  viajesCompletados: number;
  docsAprobados: number;
  docsTotal: number;
}

interface OwnerBoatKpi {
  estado: string;
}

interface OwnerSolicitudKpi {
  status: string;
  documents: Array<{ status: string }>;
}

interface CountMeta {
  meta: { total: number };
}

interface AdminRetornoRow {
  id: string;
  origin: string;
  destination: string;
  scheduledAt: string;
  embarcacion?: { nombre: string } | null;
}

interface ProximoViajeRow {
  id: string;
  scheduledAt: string;
  origin: string;
  destination: string;
  status: string;
  cliente: { nombre: string };
}

interface PendienteResenaRow {
  id: string;
  scheduledAt: string;
  origin: string;
  destination: string;
  cliente: { nombre: string; telefono: string };
  embarcacion?: { nombre: string } | null;
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

const TRIP_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente de lancha',
  ASSIGNED: 'Lancha asignada',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

function statusLabelFor(status: string) {
  return TRIP_STATUS_LABELS[status] ?? status;
}

export function RoleDashboardPage({ role }: { role: UserRole }) {
  const { user } = useAuth();
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [adminRetornos, setAdminRetornos] = useState<AdminRetornoRow[]>([]);
  const [proximosViajes, setProximosViajes] = useState<ProximoViajeRow[]>([]);
  const [pendientesResena, setPendientesResena] = useState<PendienteResenaRow[]>([]);
  const [ownerKpis, setOwnerKpis] = useState<OwnerKpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (role === 'ADMIN') {
      Promise.all([
        api.get<AdminDashboardData>('/admin/dashboard/resumen'),
        api.get<Paginated<AdminRetornoRow>>('/admin/empty-legs?status=AVAILABLE&limit=4'),
        api.get<Paginated<ProximoViajeRow>>('/admin/trips?scope=upcoming&limit=5').catch(() => null),
        api.get<Paginated<PendienteResenaRow>>('/admin/reviews/pending?limit=3').catch(() => null),
      ])
        .then(([resumen, retornos, proximos, pendientes]) => {
          if (!isMounted) return;
          setAdminData(resumen);
          setAdminRetornos(retornos.data);
          setProximosViajes(proximos?.data ?? []);
          setPendientesResena(pendientes?.data ?? []);
        })
        .catch(() => undefined)
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      Promise.all([
        api.get<OwnerBoatKpi[]>('/boats/mine'),
        api.get<OwnerSolicitudKpi>('/owners/me/solicitud'),
        api.get<CountMeta>('/owners/me/empty-legs?status=AVAILABLE&limit=1'),
        api.get<CountMeta>('/owners/me/salidas?estado=PROGRAMADA&limit=1'),
        api.get<CountMeta>('/owners/me/salidas?estado=COMPLETADA&limit=1'),
      ])
        .then(([boats, solicitud, retornos, programadas, completadas]) => {
          if (!isMounted) return;
          setOwnerKpis({
            totalBoats: boats.length,
            verificadas: boats.filter((b) => b.estado === 'VERIFICADA').length,
            solicitudesPendientes: solicitud.status !== 'APPROVED',
            retornosDisponibles: retornos.meta.total,
            viajesProgramados: programadas.meta.total,
            viajesCompletados: completadas.meta.total,
            docsAprobados: solicitud.documents.filter((d) => d.status === 'APPROVED').length,
            docsTotal: solicitud.documents.length,
          });
        })
        .catch(() => undefined)
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [role]);

  if (!user) return null;

  const firstName = user.name.split(' ')[0];

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
          {
            label: 'Lanchas registradas',
            value: String(ownerKpis?.totalBoats ?? '—'),
            icon: Ship,
          },
          {
            label: 'Verificadas',
            value: ownerKpis ? String(ownerKpis.verificadas) : '—',
            icon: CheckCircle2,
            featured: Boolean(ownerKpis && ownerKpis.verificadas > 0),
          },
          {
            label: 'Solicitud de lanchero',
            value: ownerKpis ? (ownerKpis.solicitudesPendientes ? 'Pendiente' : 'Aprobada') : '—',
            icon: ClipboardList,
            featured: Boolean(ownerKpis?.solicitudesPendientes),
          },
          {
            label: 'Retornos disponibles',
            value: ownerKpis ? String(ownerKpis.retornosDisponibles) : '—',
            icon: RotateCcw,
          },
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
          {
            label: 'Salidas programadas',
            value: ownerKpis ? String(ownerKpis.viajesProgramados) : '—',
            icon: CalendarClock,
          },
          {
            label: 'Salidas completadas',
            value: ownerKpis ? String(ownerKpis.viajesCompletados) : '—',
            icon: CalendarCheck,
          },
          {
            label: 'Documentación aprobada',
            value: ownerKpis ? `${ownerKpis.docsAprobados}/${ownerKpis.docsTotal}` : '—',
            subtitle: ownerKpis
              ? ownerKpis.docsAprobados === ownerKpis.docsTotal
                ? 'Todo al día con la agencia'
                : `${ownerKpis.docsTotal - ownerKpis.docsAprobados} en revisión o pendientes`
              : undefined,
            icon: FileCheck2,
          },
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

  async function sendReviewWhatsApp(pt: PendienteResenaRow) {
    try {
      const res = await api.post<{ reviewUrl: string }>(`/admin/trips/${pt.id}/review-link`, {});
      const phone = pt.cliente.telefono.replace(/\D/g, '');
      const text = `Hola ${pt.cliente.nombre}, ¡gracias por viajar con NautiFlow en tu recorrido ${pt.origin} → ${pt.destination}! Nos ayudaría mucho que nos dejes tu reseña: ${res.reviewUrl}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    } catch {
      // Silencio: el panel no debe romperse si falla la generación del enlace.
    }
  }

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

          {role === 'ADMIN' && (
            <section className="nf-panel nf-recent-panel" aria-labelledby="admin-retornos-title" style={{ marginTop: '1.25rem' }}>
              <div className="nf-panel-header">
                <div>
                  <h2 id="admin-retornos-title">Retornos vacíos disponibles</h2>
                  <span className="nf-panel-desc">Publicados por lancheros, listos para ofrecer a la red</span>
                </div>
                <Link to="/admin/retornos" className="nf-period-pill" style={{ textDecoration: 'none' }}>
                  Ir a la bolsa
                </Link>
              </div>

              {adminRetornos.length === 0 ? (
                <p className="empty-activity-text">No hay retornos disponibles ahora mismo.</p>
              ) : (
                <div className="recent-activity-list">
                  {adminRetornos.map((el) => (
                    <div key={el.id} className="recent-event-item">
                      <div className="event-bullet" />
                      <div className="event-content">
                        <div className="event-title-row">
                          <strong className="event-title">
                            {el.origin} → {el.destination}
                          </strong>
                          <span className="event-time">
                            {new Date(el.scheduledAt).toLocaleString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="event-desc">{el.embarcacion?.nombre ?? 'Lancha propia del lanchero'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {role === 'ADMIN' && (
            <div className="nf-bottom-panels" style={{ marginTop: '1.25rem' }}>
              {/* Próximos viajes */}
              <section className="nf-panel" aria-labelledby="upcoming-title">
                <div className="nf-panel-header">
                  <div>
                    <h2 id="upcoming-title">Próximos viajes</h2>
                    <span className="nf-panel-desc">Salidas programadas a partir de hoy</span>
                  </div>
                  <Link to="/admin/viajes" className="nf-period-pill" style={{ textDecoration: 'none' }}>
                    Gestionar viajes
                  </Link>
                </div>

                {proximosViajes.length === 0 ? (
                  <p className="empty-activity-text">No hay viajes programados a partir de hoy.</p>
                ) : (
                  <div className="recent-activity-list">
                    {proximosViajes.map((trip) => (
                      <div key={trip.id} className="recent-event-item">
                        <div className="event-bullet" />
                        <div className="event-content">
                          <div className="event-title-row">
                            <strong className="event-title">
                              {trip.origin} → {trip.destination}
                            </strong>
                            <span className="event-time">
                              {new Date(trip.scheduledAt).toLocaleString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="event-desc">
                            {trip.cliente.nombre} · {statusLabelFor(trip.status)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Reseñas pendientes con envío por WhatsApp */}
              <section className="nf-panel" aria-labelledby="pending-reviews-title">
                <div className="nf-panel-header">
                  <div>
                    <h2 id="pending-reviews-title">Reseñas pendientes</h2>
                    <span className="nf-panel-desc">Pedir calificación por WhatsApp a los turistas</span>
                  </div>
                  <Link to="/admin/resenas" className="nf-period-pill" style={{ textDecoration: 'none' }}>
                    Ver reseñas
                  </Link>
                </div>

                {pendientesResena.length === 0 ? (
                  <p className="empty-activity-text">Todos los viajes completados ya fueron calificados.</p>
                ) : (
                  <div className="recent-activity-list">
                    {pendientesResena.map((pt) => (
                      <div key={pt.id} className="recent-event-item">
                        <div className="event-bullet" />
                        <div className="event-content">
                          <div className="event-title-row">
                            <strong className="event-title">
                              {pt.origin} → {pt.destination}
                            </strong>
                            <button
                              type="button"
                              className="button button-ghost btn-sm"
                              onClick={() => void sendReviewWhatsApp(pt)}
                            >
                              <MessageCircle size={14} /> WhatsApp
                            </button>
                          </div>
                          <p className="event-desc">
                            {pt.cliente.nombre} · {pt.embarcacion?.nombre ?? 'Sin lancha'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </section>
  );
}
