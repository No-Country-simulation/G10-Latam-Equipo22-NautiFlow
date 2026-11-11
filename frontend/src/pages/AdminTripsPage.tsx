import { useEffect, useState, type FormEvent } from 'react';
import {
  CalendarCheck,
  CalendarClock,
  Clock,
  Copy,
  Plus,
  RotateCcw,
  Search,
  Ship,
  Star,
} from 'lucide-react';
import { PaginationBar } from '../components/PaginationBar';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';
import type { PageMeta, Paginated } from '../types/api';

interface BoatOption {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
}

interface TripItem {
  id: string;
  scheduledAt: string;
  passengerCount: number;
  origin: string;
  destination: string;
  status: 'PENDING' | 'ASSIGNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  cliente: { nombre: string; telefono: string; email: string | null };
  embarcacion: {
    id: string;
    nombre: string;
    matricula: string;
    capacidad?: number;
    propietario?: { phone: string | null; whatsappPhone: string | null; user: { name: string } };
  } | null;
}

const statusBadgeClass: Record<TripItem['status'], string> = {
  PENDING: 'status-pending',
  ASSIGNED: 'status-assigned',
  CONFIRMED: 'status-confirmed',
  COMPLETED: 'status-completed',
  CANCELLED: 'status-cancelled',
};

const statusLabels: Record<TripItem['status'], string> = {
  PENDING: 'Pendiente de lancha',
  ASSIGNED: 'Lancha asignada',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export function AdminTripsPage() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [boats, setBoats] = useState<BoatOption[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [submittingTrip, setSubmittingTrip] = useState(false);

  // Review link generation
  const [reviewLinks, setReviewLinks] = useState<Record<string, string>>({});
  const [generatingLink, setGeneratingLink] = useState('');

  // Publish empty return modal
  const [emptyReturnTrip, setEmptyReturnTrip] = useState<TripItem | null>(null);
  const [returnScheduledAt, setReturnScheduledAt] = useState('');
  const [publishingReturn, setPublishingReturn] = useState(false);

  async function loadTrips() {
    setLoading(true);
    setError('');
    try {
      const scopeParam = activeTab === 'ACTIVE' ? 'scope=active' : 'scope=history';
      const qParam = searchTerm.trim() ? `&q=${encodeURIComponent(searchTerm.trim())}` : '';

      const [tripRes, boatRes] = await Promise.all([
        api.get<Paginated<TripItem>>(`/admin/trips?${scopeParam}&page=${page}&limit=12${qParam}`),
        boats.length ? Promise.resolve(boats) : api.get<BoatOption[]>('/boats/admin/approved'),
      ]);

      setTrips(tripRes.data);
      setMeta(tripRes.meta);
      if (!boats.length) setBoats(boatRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar los viajes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTrips();
  }, [page, activeTab]);

  async function handleCreateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingTrip(true);
    setError('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: Record<string, unknown> = {
      clientName: String(formData.get('clientName')),
      clientPhone: String(formData.get('clientPhone')),
      clientEmail: formData.get('clientEmail') ? String(formData.get('clientEmail')) : undefined,
      scheduledAt: new Date(String(formData.get('scheduledAt'))).toISOString(),
      passengerCount: Number(formData.get('passengerCount')),
      origin: String(formData.get('origin')),
      destination: String(formData.get('destination')),
      boatId: formData.get('boatId') ? String(formData.get('boatId')) : undefined,
    };

    try {
      await api.post('/admin/trips', payload);
      setSuccess('¡Viaje registrado con éxito!');
      setShowNewTripModal(false);
      form.reset();
      await loadTrips();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el viaje.');
    } finally {
      setSubmittingTrip(false);
    }
  }

  async function handleAssignBoat(tripId: string, boatId: string) {
    if (!boatId) return;
    setError('');
    try {
      await api.patch(`/admin/trips/${tripId}/assign`, { boatId });
      setSuccess('Embarcación asignada correctamente.');
      await loadTrips();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo asignar la embarcación.');
    }
  }

  async function handleUpdateStatus(tripId: string, status: TripItem['status']) {
    setError('');
    try {
      await api.patch(`/admin/trips/${tripId}/status`, { status });
      setSuccess(`Estado del viaje actualizado a "${statusLabels[status]}".`);
      await loadTrips();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el estado.');
    }
  }

  async function handleGenerateReviewLink(tripId: string) {
    setGeneratingLink(tripId);
    setError('');
    try {
      const res = await api.post<{ reviewUrl: string }>(`/admin/trips/${tripId}/review-link`, {});
      setReviewLinks((prev) => ({ ...prev, [tripId]: res.reviewUrl }));
      setSuccess('Enlace de reseña generado con éxito.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo generar el enlace de reseña.');
    } finally {
      setGeneratingLink('');
    }
  }

  async function handlePublishEmptyReturn(e: FormEvent) {
    e.preventDefault();
    if (!emptyReturnTrip || !returnScheduledAt) return;
    setPublishingReturn(true);
    setError('');
    try {
      await api.post('/admin/empty-legs', {
        tripId: emptyReturnTrip.id,
        scheduledAt: new Date(returnScheduledAt).toISOString(),
      });
      setSuccess('¡Retorno vacío publicado en la bolsa interna de viajes!');
      setEmptyReturnTrip(null);
      setReturnScheduledAt('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo publicar el retorno vacío.');
    } finally {
      setPublishingReturn(false);
    }
  }

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">CENTRAL DE DESPACHO</span>
          <h1>Gestión de Viajes</h1>
          <p className="admin-subtitle">
            Coordinación integral de viajes: seguimiento operativo, cambios de estado, publicación de retornos y solicitud de reseñas.
          </p>
        </div>
        <div className="header-action-group">
          <button
            type="button"
            className="button"
            onClick={() => setShowNewTripModal(true)}
          >
            <Plus size={16} /> Registrar nuevo viaje
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => void loadTrips()}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>
      </header>

      {error && <div className="nf-alert nf-alert-error" role="alert">{error}</div>}
      {success && <div className="nf-alert nf-alert-success" role="status">{success}</div>}

      {/* Tabs: Viajes Activos vs Historial */}
      <div className="admin-filters-bar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab${activeTab === 'ACTIVE' ? ' is-active' : ''}`}
            onClick={() => { setActiveTab('ACTIVE'); setPage(1); }}
          >
            <CalendarClock size={16} /> Viajes Activos (Pendientes y en curso)
          </button>
          <button
            type="button"
            className={`filter-tab${activeTab === 'HISTORY' ? ' is-active' : ''}`}
            onClick={() => { setActiveTab('HISTORY'); setPage(1); }}
          >
            <CalendarCheck size={16} /> Historial de Viajes (Completados y cancelados)
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setPage(1); void loadTrips(); }} className="search-input-wrap">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por cliente, origen o destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <WavyLoader label="Cargando viajes…" />
        </div>
      ) : trips.length === 0 ? (
        <div className="admin-empty-card">
          <CalendarClock size={44} className="empty-icon" />
          <h3>No hay viajes para mostrar</h3>
          <p>
            {activeTab === 'ACTIVE'
              ? 'No hay viajes activos o programados en este momento.'
              : 'El historial de viajes completados está vacío o coincide con la búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="trips-grid">
          {trips.map((trip) => {
            const hasReviewLink = Boolean(reviewLinks[trip.id]);
            const boatmanName = trip.embarcacion?.propietario?.user.name;

            return (
              <article key={trip.id} className="trip-card">
                <div className="trip-card-header">
                  <div className="trip-route-title">
                    <strong className="route-text">{trip.origin} → {trip.destination}</strong>
                    <span className="trip-date-pill">
                      <Clock size={13} /> {new Date(trip.scheduledAt).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <span className={`status-pill ${statusBadgeClass[trip.status]}`}>
                    {statusLabels[trip.status]}
                  </span>
                </div>

                <div className="trip-card-body">
                  <div className="trip-info-row">
                    <span>Cliente: <strong>{trip.cliente.nombre}</strong> ({trip.cliente.telefono})</span>
                    <span>Pasajeros: <strong>{trip.passengerCount}</strong></span>
                  </div>

                  <div className="trip-boat-info-row">
                    {trip.embarcacion ? (
                      <div className="assigned-boat-banner">
                        <Ship size={16} />
                        <div>
                          <strong>{trip.embarcacion.nombre}</strong>
                          <span className="boat-plate-small">({trip.embarcacion.matricula})</span>
                          {boatmanName && <span className="boatman-name"> · Lanchero: {boatmanName}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="unassigned-boat-banner">
                        <span>Sin lancha asignada</span>
                        <select
                          className="assign-select-inline"
                          defaultValue=""
                          onChange={(e) => void handleAssignBoat(trip.id, e.target.value)}
                        >
                          <option value="">Asignar lancha aprobada...</option>
                          {boats
                            .filter((b) => b.capacidad >= trip.passengerCount)
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.nombre} · {b.capacidad} pasajeros
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Enlace de reseña generado */}
                  {hasReviewLink && (
                    <div className="review-link-box">
                      <span className="review-link-label">Enlace de reseña para el cliente:</span>
                      <div className="review-link-row">
                        <input
                          readOnly
                          value={reviewLinks[trip.id]}
                          onFocus={(e) => e.currentTarget.select()}
                          className="review-link-input"
                        />
                        <button
                          type="button"
                          className="button button-ghost btn-sm"
                          onClick={() => {
                            navigator.clipboard.writeText(reviewLinks[trip.id]);
                            setSuccess('¡Enlace copiado al portapapeles!');
                          }}
                        >
                          <Copy size={13} /> Copiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="trip-card-footer">
                  <div className="trip-footer-actions">
                    {trip.status === 'ASSIGNED' && (
                      <button
                        type="button"
                        className="button btn-sm"
                        onClick={() => void handleUpdateStatus(trip.id, 'CONFIRMED')}
                      >
                        ✓ Confirmar viaje
                      </button>
                    )}

                    {trip.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        className="button btn-sm"
                        onClick={() => void handleUpdateStatus(trip.id, 'COMPLETED')}
                      >
                        ✓ Marcar completado
                      </button>
                    )}

                    {(trip.status === 'ASSIGNED' || trip.status === 'CONFIRMED') && (
                      <button
                        type="button"
                        className="button button-ghost btn-sm"
                        onClick={() => {
                          setEmptyReturnTrip(trip);
                          // Default 2 horas después del viaje
                          const date = new Date(new Date(trip.scheduledAt).getTime() + 2 * 60 * 60 * 1000);
                          setReturnScheduledAt(date.toISOString().slice(0, 16));
                        }}
                      >
                        <RotateCcw size={14} /> Publicar retorno vacío
                      </button>
                    )}

                    {trip.status === 'COMPLETED' && (
                      <button
                        type="button"
                        className="button button-ghost btn-sm"
                        disabled={generatingLink === trip.id}
                        onClick={() => void handleGenerateReviewLink(trip.id)}
                      >
                        <Star size={14} /> {generatingLink === trip.id ? 'Generando...' : 'Generar enlace de reseña'}
                      </button>
                    )}

                    {(trip.status === 'PENDING' || trip.status === 'ASSIGNED' || trip.status === 'CONFIRMED') && (
                      <button
                        type="button"
                        className="button button-danger btn-sm"
                        onClick={() => void handleUpdateStatus(trip.id, 'CANCELLED')}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PaginationBar meta={meta} onChange={setPage} label={(v) => `${v.total} viajes`} />

      {/* Modal de Nuevo Viaje */}
      {showNewTripModal && (
        <div className="nf-modal-backdrop" onClick={() => setShowNewTripModal(false)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">REGISTRO DE SERVICIO</span>
                <h2>Nuevo Viaje para Cliente</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowNewTripModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="nf-modal-content">
              <div className="form-grid-modal">
                <div className="form-group">
                  <label htmlFor="clientName">Nombre del cliente *</label>
                  <input id="clientName" name="clientName" required minLength={2} maxLength={100} placeholder="Ej. Juan Pérez" />
                </div>

                <div className="form-group">
                  <label htmlFor="clientPhone">Teléfono de contacto *</label>
                  <input id="clientPhone" name="clientPhone" type="tel" required minLength={8} maxLength={30} placeholder="+54 9 11 ..." />
                </div>

                <div className="form-group">
                  <label htmlFor="clientEmail">Email (opcional)</label>
                  <input id="clientEmail" name="clientEmail" type="email" placeholder="cliente@example.com" />
                </div>

                <div className="form-group">
                  <label htmlFor="passengerCount">Cantidad de pasajeros *</label>
                  <input id="passengerCount" name="passengerCount" type="number" min={1} max={100} defaultValue={2} required />
                </div>

                <div className="form-group">
                  <label htmlFor="scheduledAt">Fecha y hora estimada *</label>
                  <input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
                </div>

                <div className="form-group">
                  <label htmlFor="boatId">Lancha inicial (opcional)</label>
                  <select id="boatId" name="boatId" defaultValue="">
                    <option value="">Sin asignar (quedará pendiente)</option>
                    {boats.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre} · {b.capacidad} pasajeros ({b.matricula})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="origin">Origen *</label>
                  <input id="origin" name="origin" required minLength={2} maxLength={160} placeholder="Ej. Estación Fluvial Tigre" />
                </div>

                <div className="form-group">
                  <label htmlFor="destination">Destino *</label>
                  <input id="destination" name="destination" required minLength={2} maxLength={160} placeholder="Ej. Río Sarmiento y Espera" />
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="submit" className="button" disabled={submittingTrip}>
                  {submittingTrip ? 'Guardando...' : 'Registrar Viaje'}
                </button>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setShowNewTripModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Publicar Retorno Vacío */}
      {emptyReturnTrip && (
        <div className="nf-modal-backdrop" onClick={() => setEmptyReturnTrip(null)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">APROVECHAMIENTO DE TRAYECTO</span>
                <h2>Publicar Retorno Vacío</h2>
                <span className="nf-modal-subtitle">
                  Lancha: {emptyReturnTrip.embarcacion?.nombre} · Regreso de {emptyReturnTrip.destination} hacia {emptyReturnTrip.origin}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEmptyReturnTrip(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishEmptyReturn} className="nf-modal-content">
              <div className="modal-section-card">
                <p className="modal-hint">
                  Al publicar el retorno vacío, quedará disponible en el sistema para que otros usuarios o clientes puedan aprovechar el trayecto sin costo o con tarifa reducida.
                </p>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="returnScheduledAt" className="field-label">
                    Fecha y hora estimada del retorno (posterior al viaje de ida):
                  </label>
                  <input
                    id="returnScheduledAt"
                    type="datetime-local"
                    value={returnScheduledAt}
                    onChange={(e) => setReturnScheduledAt(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-footer-actions" style={{ marginTop: '1.25rem' }}>
                  <button type="submit" className="button" disabled={publishingReturn}>
                    {publishingReturn ? 'Publicando...' : 'Confirmar y Publicar Retorno'}
                  </button>
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => setEmptyReturnTrip(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
