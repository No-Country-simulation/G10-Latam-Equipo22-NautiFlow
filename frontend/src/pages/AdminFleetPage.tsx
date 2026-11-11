import { useEffect, useState } from 'react';
import {
  CalendarClock,
  Compass,
  FileCheck2,
  Phone,
  RotateCcw,
  Search,
  Ship,
  Users,
} from 'lucide-react';
import { PaginationBar } from '../components/PaginationBar';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';
import type { PageMeta, Paginated } from '../types/api';

interface ZoneRef {
  id: string;
  nombre: string;
}

interface BoatTrip {
  id: string;
  origin: string;
  destination: string;
  scheduledAt: string;
  status: string;
  passengerCount: number;
  cliente: { nombre: string; telefono: string };
}

interface BoatEmptyLeg {
  id: string;
  origin: string;
  destination: string;
  scheduledAt: string;
  status: string;
}

interface FleetBoat {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
  estado: string;
  descripcion: string | null;
  estadoOperativo: 'LIBRE' | 'RESERVADA' | 'RETORNO_DISPONIBLE';
  propietario: {
    id: string;
    phone: string | null;
    whatsappPhone: string | null;
    user: { id: string; name: string; email: string };
  };
  zonas: Array<{ zona: ZoneRef }>;
  viajes: BoatTrip[];
  emptyLegs: BoatEmptyLeg[];
}

interface ZonaDto {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activa: boolean;
}

export function AdminFleetPage() {
  const [fleet, setFleet] = useState<FleetBoat[]>([]);
  const [zones, setZones] = useState<ZonaDto[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'LIBRE' | 'RESERVADA' | 'RETORNO_DISPONIBLE' | ''>('');
  const [selectedZone, setSelectedZone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailBoat, setDetailBoat] = useState<FleetBoat | null>(null);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      if (statusFilter) params.set('estadoOperativo', statusFilter);
      if (selectedZone) params.set('zonaId', selectedZone);
      if (searchTerm.trim()) params.set('q', searchTerm.trim());

      const [fleetRes, zonesRes] = await Promise.all([
        api.get<Paginated<FleetBoat>>(`/boats/admin/fleet?${params.toString()}`),
        zones.length ? Promise.resolve(zones) : api.get<ZonaDto[]>('/zones'),
      ]);

      setFleet(fleetRes.data);
      setMeta(fleetRes.meta);
      if (!zones.length) setZones(zonesRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la flota de embarcaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [page, statusFilter, selectedZone]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void loadData();
  }

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">MONITOREO DE ACTIVIDAD</span>
          <h1>Gestión de Flota</h1>
          <p className="admin-subtitle">
            Embarcaciones activas y verificadas de la agencia, con su disponibilidad operativa calculada en tiempo real.
          </p>
        </div>
        <button
          type="button"
          className="button button-ghost"
          onClick={() => void loadData()}
          disabled={loading}
        >
          Actualizar
        </button>
      </header>

      {error && <div className="nf-alert nf-alert-error" role="alert">{error}</div>}

      {/* Filtros */}
      <div className="admin-filters-bar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab${statusFilter === '' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >
            Todas
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === 'LIBRE' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('LIBRE'); setPage(1); }}
          >
            🟢 Libre
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === 'RESERVADA' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('RESERVADA'); setPage(1); }}
          >
            🟠 Reservada
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === 'RETORNO_DISPONIBLE' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('RETORNO_DISPONIBLE'); setPage(1); }}
          >
            🔵 Con retorno vacío
          </button>
        </div>

        <div className="filters-extra-row">
          <select
            className="zone-select-filter"
            value={selectedZone}
            onChange={(e) => { setSelectedZone(e.target.value); setPage(1); }}
          >
            <option value="">Todas las zonas</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>

          <form onSubmit={handleSearchSubmit} className="search-input-wrap">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar lancha o propietario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <WavyLoader label="Consultando estado de la flota…" />
        </div>
      ) : fleet.length === 0 ? (
        <div className="admin-empty-card">
          <Ship size={44} className="empty-icon" />
          <h3>No se encontraron lanchas</h3>
          <p>No hay embarcaciones verificadas que coincidan con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="fleet-grid">
          {fleet.map((boat) => {
            const isLibre = boat.estadoOperativo === 'LIBRE';
            const isReservada = boat.estadoOperativo === 'RESERVADA';

            return (
              <article key={boat.id} className="fleet-boat-card">
                <div className="fleet-boat-top">
                  <div>
                    <strong className="fleet-boat-name">{boat.nombre}</strong>
                    <span className="boat-plate">{boat.matricula}</span>
                  </div>

                  <span
                    className={`operational-badge ${
                      isLibre
                        ? 'operational-libre'
                        : isReservada
                        ? 'operational-reservada'
                        : 'operational-retorno'
                    }`}
                  >
                    {isLibre
                      ? '● Libre'
                      : isReservada
                      ? '● Reservada'
                      : '● Retorno disponible'}
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
                      Zonas:{' '}
                      <strong>
                        {boat.zonas?.map((z) => z.zona.nombre).join(', ') || 'Delta del Tigre'}
                      </strong>
                    </span>
                  </div>

                  <div className="fleet-meta-item owner-item">
                    <span className="meta-icon"><Phone size={16} /></span>
                    <div>
                      <span>Lanchero: <strong>{boat.propietario.user.name}</strong></span>
                      {(boat.propietario.whatsappPhone || boat.propietario.phone) && (
                        <a
                          href={`https://wa.me/${(boat.propietario.whatsappPhone || boat.propietario.phone)?.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="whatsapp-inline-link"
                        >
                          WhatsApp: {boat.propietario.whatsappPhone || boat.propietario.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="fleet-boat-footer">
                  <span className="verified-tag">
                    <FileCheck2 size={14} /> Verificada
                  </span>
                  <button
                    type="button"
                    className="button button-ghost btn-sm"
                    onClick={() => setDetailBoat(boat)}
                  >
                    Ver disponibilidad
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PaginationBar meta={meta} onChange={setPage} label={(v) => `${v.total} lanchas`} />

      {/* Modal de disponibilidad y agenda de la lancha */}
      {detailBoat && (
        <div className="nf-modal-backdrop" onClick={() => setDetailBoat(null)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">FICHA TÉCNICA Y OPERATIVA</span>
                <h2>🚤 {detailBoat.nombre} ({detailBoat.matricula})</h2>
                <span className="nf-modal-subtitle">
                  Lanchero: {detailBoat.propietario.user.name} · {detailBoat.capacidad} pasajeros
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDetailBoat(null)}
              >
                ✕
              </button>
            </div>

            <div className="nf-modal-content">
              <div className="modal-section-card">
                <h3>Estado Operativo Actual</h3>
                <div className="status-callout-row">
                  <span
                    className={`operational-badge ${
                      detailBoat.estadoOperativo === 'LIBRE'
                        ? 'operational-libre'
                        : detailBoat.estadoOperativo === 'RESERVADA'
                        ? 'operational-reservada'
                        : 'operational-retorno'
                    }`}
                  >
                    {detailBoat.estadoOperativo === 'LIBRE'
                      ? 'Libre: Lista para asignaciones'
                      : detailBoat.estadoOperativo === 'RESERVADA'
                      ? 'Reservada: Tiene viajes activos asignados'
                      : 'Disponible para retorno vacío'}
                  </span>
                  <span className="verified-tag">
                    <FileCheck2 size={14} /> Verificada en el sistema
                  </span>
                </div>
              </div>

              {/* Viajes asignados o en curso */}
              <div className="modal-section-card">
                <h3><CalendarClock size={16} /> Próximos Viajes Asignados</h3>
                {detailBoat.viajes.length === 0 ? (
                  <p className="modal-hint">No registra viajes inmediatos programados.</p>
                ) : (
                  <div className="boat-trips-list">
                    {detailBoat.viajes.map((vt) => (
                      <div key={vt.id} className="boat-trip-item">
                        <div>
                          <strong>{vt.origin} → {vt.destination}</strong>
                          <span className="boat-trip-meta">
                            {new Date(vt.scheduledAt).toLocaleString('es-AR')} · {vt.passengerCount} pasajeros
                          </span>
                        </div>
                        <span className={`status-pill status-${vt.status.toLowerCase()}`}>
                          {vt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tramos de retorno vacíos */}
              <div className="modal-section-card">
                <h3><RotateCcw size={16} /> Tramos de Retorno Disponibles</h3>
                {detailBoat.emptyLegs.length === 0 ? (
                  <p className="modal-hint">No tiene retornos vacíos activos en este momento.</p>
                ) : (
                  <div className="boat-trips-list">
                    {detailBoat.emptyLegs.map((el) => (
                      <div key={el.id} className="boat-trip-item">
                        <div>
                          <strong>{el.origin} → {el.destination}</strong>
                          <span className="boat-trip-meta">
                            Regreso estimado: {new Date(el.scheduledAt).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <span className="operational-badge operational-retorno">Disponible</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
