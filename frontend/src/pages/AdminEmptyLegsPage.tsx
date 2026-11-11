import { useEffect, useState, type FormEvent } from 'react';
import {
  Clock,
  Copy,
  Plus,
  RotateCcw,
  Ship,
  Users,
} from 'lucide-react';
import { PaginationBar } from '../components/PaginationBar';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';
import type { PageMeta, Paginated } from '../types/api';

interface EmptyLegRecord {
  id: string;
  origin: string;
  destination: string;
  scheduledAt: string;
  status: 'AVAILABLE' | 'OFFERED' | 'ASSIGNED' | 'CLOSED' | string;
  embarcacion: {
    id: string;
    nombre: string;
    matricula: string;
    capacidad: number;
    propietario: {
      phone: string | null;
      whatsappPhone: string | null;
      user: { name: string };
    };
  };
  trip: {
    id: string;
    scheduledAt: string;
    passengerCount: number;
    cliente: { nombre: string; telefono: string };
  };
}

interface EligibleTrip {
  id: string;
  origin: string;
  destination: string;
  scheduledAt: string;
  passengerCount: number;
  cliente: { nombre: string };
  embarcacion: { id: string; nombre: string; matricula: string } | null;
}

export function AdminEmptyLegsPage() {
  const [emptyLegs, setEmptyLegs] = useState<EmptyLegRecord[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'AVAILABLE' | 'ASSIGNED' | 'CLOSED' | ''>('AVAILABLE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal para publicar nuevo retorno desde un viaje asignado o confirmado
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [eligibleTrips, setEligibleTrips] = useState<EligibleTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [returnScheduledAt, setReturnScheduledAt] = useState('');
  const [publishing, setPublishing] = useState(false);

  async function loadEmptyLegs() {
    setLoading(true);
    setError('');
    try {
      const statusParam = statusFilter ? `status=${statusFilter}&` : '';
      const res = await api.get<Paginated<EmptyLegRecord>>(
        `/admin/empty-legs?${statusParam}page=${page}&limit=12`
      );
      setEmptyLegs(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar los retornos vacíos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmptyLegs();
  }, [page, statusFilter]);

  async function openPublishModal() {
    setShowPublishModal(true);
    setError('');
    try {
      // Cargar viajes asignados o confirmados
      const res = await api.get<Paginated<EligibleTrip>>('/admin/trips?scope=active&limit=50');
      const filtered = res.data.filter((t) => Boolean(t.embarcacion));
      setEligibleTrips(filtered);
      if (filtered[0]) {
        setSelectedTripId(filtered[0].id);
        const estDate = new Date(new Date(filtered[0].scheduledAt).getTime() + 2 * 60 * 60 * 1000);
        setReturnScheduledAt(estDate.toISOString().slice(0, 16));
      }
    } catch {
      // ignore
    }
  }

  async function handleCreateEmptyLeg(e: FormEvent) {
    e.preventDefault();
    if (!selectedTripId || !returnScheduledAt) return;
    setPublishing(true);
    setError('');
    try {
      await api.post('/admin/empty-legs', {
        tripId: selectedTripId,
        scheduledAt: new Date(returnScheduledAt).toISOString(),
      });
      setSuccess('¡Retorno vacío publicado con éxito!');
      setShowPublishModal(false);
      setSelectedTripId('');
      setReturnScheduledAt('');
      await loadEmptyLegs();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo publicar el retorno vacío.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleUpdateStatus(id: string, newStatus: string) {
    setError('');
    try {
      await api.patch(`/admin/empty-legs/${id}/status`, { status: newStatus });
      setSuccess(`Estado actualizado a ${newStatus}.`);
      await loadEmptyLegs();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cambiar estado.');
    }
  }

  function generateWhatsAppText(el: EmptyLegRecord) {
    const timeStr = new Date(el.scheduledAt).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateStr = new Date(el.scheduledAt).toLocaleDateString('es-AR');
    return `🚤 *NautiFlow - Oportunidad de Retorno Vacío*\nLancha *${el.embarcacion.nombre}* vuelve vacía desde *${el.origin}* a las *${timeStr} hs* (${dateStr}) hacia *${el.destination}*.\n¿Alguien necesita traslado o envío en ese trayecto? Coordinar con NautiFlow.`;
  }

  function handleCopyWhatsApp(el: EmptyLegRecord) {
    const text = generateWhatsAppText(el);
    navigator.clipboard.writeText(text);
    setSuccess(`¡Mensaje para WhatsApp de "${el.embarcacion.nombre}" copiado al portapapeles!`);
  }

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">BOLSA INTERNA DE RETORNOS</span>
          <h1>Retornos Vacíos</h1>
          <p className="admin-subtitle">
            Aproveche los trayectos de regreso sin pasajeros de la flota para cubrir traslados, envíos o rescates con tarifas promocionales.
          </p>
        </div>
        <div className="header-action-group">
          <button
            type="button"
            className="button"
            onClick={() => void openPublishModal()}
          >
            <Plus size={16} /> Publicar Retorno Vacío
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => void loadEmptyLegs()}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>
      </header>

      {error && <div className="nf-alert nf-alert-error" role="alert">{error}</div>}
      {success && <div className="nf-alert nf-alert-success" role="status">{success}</div>}

      <div className="admin-filters-bar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab${statusFilter === 'AVAILABLE' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('AVAILABLE'); setPage(1); }}
          >
            🟢 Disponibles
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === 'ASSIGNED' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('ASSIGNED'); setPage(1); }}
          >
            🔵 Asignados / Tomados
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === 'CLOSED' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('CLOSED'); setPage(1); }}
          >
            ⚪ Cerrados / Finalizados
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === '' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >
            Todos
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <WavyLoader label="Cargando retornos vacíos…" />
        </div>
      ) : emptyLegs.length === 0 ? (
        <div className="admin-empty-card">
          <RotateCcw size={44} className="empty-icon" />
          <h3>No hay retornos vacíos para mostrar</h3>
          <p>
            {statusFilter === 'AVAILABLE'
              ? 'No hay tramos vacíos disponibles en este momento. Puede publicar uno desde viajes activos.'
              : 'No se encontraron tramos con los filtros aplicados.'}
          </p>
        </div>
      ) : (
        <div className="empty-legs-grid">
          {emptyLegs.map((el) => {
            const isAvail = el.status === 'AVAILABLE';

            return (
              <article key={el.id} className="empty-leg-card">
                <div className="empty-leg-top">
                  <div>
                    <strong className="empty-leg-route">
                      {el.origin} → {el.destination}
                    </strong>
                    <span className="empty-leg-time">
                      <Clock size={13} /> {new Date(el.scheduledAt).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <span
                    className={`status-pill ${isAvail ? 'status-confirmed' : el.status === 'ASSIGNED' ? 'status-assigned' : 'status-cancelled'
                      }`}
                  >
                    {isAvail ? 'Disponible' : el.status === 'ASSIGNED' ? 'Asignado' : 'Cerrado'}
                  </span>
                </div>

                <div className="empty-leg-details">
                  <div className="fleet-meta-item">
                    <span className="meta-icon"><Ship size={16} /></span>
                    <div>
                      <strong>{el.embarcacion.nombre}</strong> ({el.embarcacion.matricula}) · Capacidad {el.embarcacion.capacidad} pas.
                    </div>
                  </div>

                  <div className="fleet-meta-item">
                    <span className="meta-icon"><Users size={16} /></span>
                    <div>
                      <span>Lanchero: {el.embarcacion.propietario.user.name}</span>
                      {(el.embarcacion.propietario.whatsappPhone || el.embarcacion.propietario.phone) && (
                        <span className="boatman-contact">
                          {' '}({el.embarcacion.propietario.whatsappPhone || el.embarcacion.propietario.phone})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="whatsapp-preview-box">
                    <span className="whatsapp-preview-title">Mensaje listo para WhatsApp:</span>
                    <p className="whatsapp-text-preview">"{generateWhatsAppText(el)}"</p>
                  </div>
                </div>

                <div className="empty-leg-footer">
                  <button
                    type="button"
                    className="button btn-sm"
                    onClick={() => handleCopyWhatsApp(el)}
                  >
                    <Copy size={13} /> Copiar mensaje WhatsApp
                  </button>

                  {isAvail && (
                    <div className="empty-leg-state-btns">
                      <button
                        type="button"
                        className="button button-ghost btn-sm"
                        onClick={() => void handleUpdateStatus(el.id, 'ASSIGNED')}
                        title="Marcar como aprovechado por un cliente"
                      >
                        Marcar Asignado
                      </button>
                      <button
                        type="button"
                        className="button button-danger btn-sm"
                        onClick={() => void handleUpdateStatus(el.id, 'CLOSED')}
                        title="Cerrar retorno si ya no está disponible"
                      >
                        Cerrar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PaginationBar meta={meta} onChange={setPage} label={(v) => `${v.total} retornos vacíos`} />

      {/* Modal de Publicación */}
      {showPublishModal && (
        <div className="nf-modal-backdrop" onClick={() => setShowPublishModal(false)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">PUBLICACIÓN EN BOLSA INTERNA</span>
                <h2>Publicar Retorno Vacío</h2>
                <span className="nf-modal-subtitle">
                  Seleccione el viaje que origina el regreso de la lancha.
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowPublishModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmptyLeg} className="nf-modal-content">
              {eligibleTrips.length === 0 ? (
                <div className="admin-empty-card">
                  <Ship size={36} className="empty-icon" />
                  <p>No hay viajes asignados o confirmados con embarcación disponible para crear retorno.</p>
                </div>
              ) : (
                <div className="modal-section-card">
                  <div className="form-group">
                    <label htmlFor="eligible-trip-select" className="field-label">
                      Viaje de ida (la embarcación regresará en sentido inverso):
                    </label>
                    <select
                      id="eligible-trip-select"
                      value={selectedTripId}
                      onChange={(e) => {
                        setSelectedTripId(e.target.value);
                        const found = eligibleTrips.find((t) => t.id === e.target.value);
                        if (found) {
                          const estDate = new Date(new Date(found.scheduledAt).getTime() + 2 * 60 * 60 * 1000);
                          setReturnScheduledAt(estDate.toISOString().slice(0, 16));
                        }
                      }}
                      required
                    >
                      {eligibleTrips.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.embarcacion?.nombre} · {t.origin} → {t.destination} ({new Date(t.scheduledAt).toLocaleString('es-AR')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label htmlFor="modal-return-scheduled" className="field-label">
                      Fecha y hora estimada del viaje de regreso:
                    </label>
                    <input
                      id="modal-return-scheduled"
                      type="datetime-local"
                      value={returnScheduledAt}
                      onChange={(e) => setReturnScheduledAt(e.target.value)}
                      required
                    />
                  </div>

                  <div className="modal-footer-actions" style={{ marginTop: '1.25rem' }}>
                    <button type="submit" className="button" disabled={publishing || !selectedTripId}>
                      {publishing ? 'Publicando...' : 'Confirmar y Publicar Retorno'}
                    </button>
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => setShowPublishModal(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
