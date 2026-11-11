import { useEffect, useState, type FormEvent } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Compass,
  Filter,
  Search,
  Ship,
  Users,
} from 'lucide-react';
import { PaginationBar } from '../components/PaginationBar';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';
import type { PageMeta, Paginated } from '../types/api';

interface Zona {
  id: string;
  nombre: string;
}

interface BoatResult {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
  estado: string;
  descripcion: string | null;
  propietario: {
    phone: string | null;
    whatsappPhone: string | null;
    user: { name: string };
  };
  zonas: Array<{ zona: Zona }>;
}

interface PendingTrip {
  id: string;
  origin: string;
  destination: string;
  scheduledAt: string;
  passengerCount: number;
  cliente: { nombre: string; telefono: string };
}

export function AdminBoatSearchPage() {
  const [boats, setBoats] = useState<BoatResult[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [zones, setZones] = useState<Zona[]>([]);
  const [pendingTrips, setPendingTrips] = useState<PendingTrip[]>([]);

  // Search filters
  const [searchText, setSearchText] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState('');

  // Assignment modal / state
  const [selectedBoatForAssign, setSelectedBoatForAssign] = useState<BoatResult | null>(null);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function searchBoats() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      if (searchText.trim()) params.set('q', searchText.trim());
      if (selectedZone) params.set('zonaId', selectedZone);
      if (minCapacity) params.set('capacidadMin', minCapacity);
      if (selectedDateTime) params.set('fechaHora', new Date(selectedDateTime).toISOString());

      const [boatsRes, zonesRes, tripsRes] = await Promise.all([
        api.get<Paginated<BoatResult>>(`/boats?${params.toString()}`),
        zones.length ? Promise.resolve(zones) : api.get<Zona[]>('/zones'),
        api.get<Paginated<PendingTrip>>('/admin/trips?status=PENDING&limit=50'),
      ]);

      setBoats(boatsRes.data);
      setMeta(boatsRes.meta);
      if (!zones.length) setZones(zonesRes);
      setPendingTrips(tripsRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al buscar embarcaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void searchBoats();
  }, [page, selectedZone]);

  function handleFilterSubmit(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    void searchBoats();
  }

  async function handleAssignTrip(e: FormEvent) {
    e.preventDefault();
    if (!selectedBoatForAssign || !selectedTripId) return;
    setAssigning(true);
    setError('');
    try {
      await api.patch(`/admin/trips/${selectedTripId}/assign`, {
        boatId: selectedBoatForAssign.id,
      });
      setSuccess(`Lancha "${selectedBoatForAssign.nombre}" asignada con éxito al viaje.`);
      setSelectedBoatForAssign(null);
      setSelectedTripId('');
      await searchBoats();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo asignar la embarcación.');
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">OPERACIONES Y DESPACHO</span>
          <h1>Búsqueda y Asignación de Flota</h1>
          <p className="admin-subtitle">
            Encuentre lanchas verificadas según capacidad, zona y disponibilidad horaria, y asígnelas manualmente a viajes pendientes.
          </p>
        </div>
        <button
          type="button"
          className="button button-ghost"
          onClick={() => void searchBoats()}
          disabled={loading}
        >
          Actualizar
        </button>
      </header>

      {error && <div className="nf-alert nf-alert-error" role="alert">{error}</div>}
      {success && <div className="nf-alert nf-alert-success" role="status">{success}</div>}

      {/* Formulario de Búsqueda Avanzada */}
      <section className="admin-search-box">
        <form onSubmit={handleFilterSubmit} className="search-form-grid">
          <div className="form-group">
            <label htmlFor="search-text">Buscar por nombre o matrícula</label>
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" aria-hidden="true" />
              <input
                id="search-text"
                type="search"
                placeholder="Ej. Delta 1, ABC-123..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="select-zone">Zona de cobertura</label>
            <select
              id="select-zone"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
            >
              <option value="">Todas las zonas</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="min-capacity">Pasajeros mínimos</label>
            <input
              id="min-capacity"
              type="number"
              min={1}
              max={100}
              placeholder="Ej. 6"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="search-datetime">Disponibilidad en fecha y hora</label>
            <input
              id="search-datetime"
              type="datetime-local"
              value={selectedDateTime}
              onChange={(e) => setSelectedDateTime(e.target.value)}
            />
          </div>

          <div className="form-actions-cell">
            <button type="submit" className="button" disabled={loading}>
              <Filter size={16} /> Aplicar filtros
            </button>
            {(searchText || selectedZone || minCapacity || selectedDateTime) && (
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  setSearchText('');
                  setSelectedZone('');
                  setMinCapacity('');
                  setSelectedDateTime('');
                  setPage(1);
                  void searchBoats();
                }}
              >
                Limpiar
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Resultados de lanchas */}
      {loading ? (
        <div className="admin-loading-state">
          <WavyLoader label="Buscando lanchas disponibles…" />
        </div>
      ) : boats.length === 0 ? (
        <div className="admin-empty-card">
          <Ship size={44} className="empty-icon" />
          <h3>No se encontraron lanchas verificadas</h3>
          <p>Intente modificar los criterios de búsqueda o el rango horario.</p>
        </div>
      ) : (
        <div className="fleet-grid">
          {boats.map((boat) => (
            <article key={boat.id} className="fleet-boat-card">
              <div className="fleet-boat-top">
                <div>
                  <strong className="fleet-boat-name">{boat.nombre}</strong>
                  <span className="boat-plate">{boat.matricula}</span>
                </div>
                <span className="verified-tag">
                  <CheckCircle2 size={13} /> Verificada
                </span>
              </div>

              <div className="fleet-boat-details">
                <div className="fleet-meta-item">
                  <span className="meta-icon"><Users size={16} /></span>
                  <span>Capacidad: <strong>{boat.capacidad} pasajeros</strong></span>
                </div>

                <div className="fleet-meta-item">
                  <span className="meta-icon"><Compass size={16} /></span>
                  <span>
                    Zonas: <strong>{boat.zonas?.map((z) => z.zona.nombre).join(', ') || 'Delta del Tigre'}</strong>
                  </span>
                </div>

                <div className="fleet-meta-item owner-item">
                  <span className="meta-icon"><Ship size={16} /></span>
                  <span>Lanchero: <strong>{boat.propietario.user.name}</strong></span>
                </div>
              </div>

              <div className="fleet-boat-footer">
                <button
                  type="button"
                  className="button btn-sm"
                  onClick={() => {
                    setSelectedBoatForAssign(boat);
                    setSelectedTripId(pendingTrips[0]?.id || '');
                  }}
                >
                  Asignar a un viaje
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <PaginationBar meta={meta} onChange={setPage} label={(v) => `${v.total} lanchas encontradas`} />

      {/* Modal de Asignación Manual */}
      {selectedBoatForAssign && (
        <div className="nf-modal-backdrop" onClick={() => setSelectedBoatForAssign(null)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">ASIGNACIÓN DE EMBARCACIÓN</span>
                <h2>Asignar {selectedBoatForAssign.nombre}</h2>
                <span className="nf-modal-subtitle">
                  Capacidad: {selectedBoatForAssign.capacidad} pasajeros · Matrícula: {selectedBoatForAssign.matricula}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedBoatForAssign(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignTrip} className="nf-modal-content">
              {pendingTrips.length === 0 ? (
                <div className="admin-empty-card">
                  <CalendarClock size={36} className="empty-icon" />
                  <p>No hay viajes pendientes esperando asignación en este momento.</p>
                </div>
              ) : (
                <div className="modal-section-card">
                  <label htmlFor="trip-select" className="field-label">
                    Seleccione el viaje pendiente a coordinar:
                  </label>
                  <select
                    id="trip-select"
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    required
                  >
                    <option value="">Seleccione un viaje...</option>
                    {pendingTrips.map((pt) => {
                      const fits = selectedBoatForAssign.capacidad >= pt.passengerCount;
                      return (
                        <option
                          key={pt.id}
                          value={pt.id}
                          disabled={!fits}
                        >
                          {pt.cliente.nombre} · {pt.origin} → {pt.destination} ({pt.passengerCount} pas.) - {new Date(pt.scheduledAt).toLocaleString('es-AR')} {!fits ? ' (Sin cupo)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  <div className="modal-footer-actions" style={{ marginTop: '1.25rem' }}>
                    <button
                      type="submit"
                      className="button"
                      disabled={assigning || !selectedTripId}
                    >
                      {assigning ? 'Asignando...' : 'Confirmar Asignación'}
                    </button>
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => setSelectedBoatForAssign(null)}
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

