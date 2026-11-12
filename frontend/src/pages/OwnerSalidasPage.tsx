import { useEffect, useState } from 'react';
import { CalendarClock, Ship } from 'lucide-react';
import { PaginationBar } from '../components/PaginationBar';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';
import type { PageMeta, Paginated } from '../types/api';

interface Tramo {
  id: string;
  tipo: string;
  origen: string;
  destino: string;
  fechaHora: string;
  cupo: number;
  precioCentavos: number;
  sinTuristas: boolean;
  estado: string;
}

interface Salida {
  id: string;
  fechaSalida: string;
  estado: string;
  createdAt: string;
  embarcacion: { id: string; nombre: string; matricula: string; capacidad: number };
  tramos: Tramo[];
}

const salidaLabels: Record<string, string> = {
  PROGRAMADA: 'Programada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
};

const tramoLabels: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  RESERVADO: 'Reservado',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
};

type EstadoFilter = '' | 'PROGRAMADA' | 'CANCELADA' | 'COMPLETADA';

interface FechaFormState {
  salida: Salida;
  fechaSalida: string;
}

interface TramoFormState {
  salida: Salida;
  tramo: Tramo;
  fechaHora: string;
  cupo: string;
  precioPesos: string;
  estado: string;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function OwnerSalidasPage() {
  const [salidas, setSalidas] = useState<Salida[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fechaForm, setFechaForm] = useState<FechaFormState | null>(null);
  const [tramoForm, setTramoForm] = useState<TramoFormState | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (estadoFilter) params.set('estado', estadoFilter);
      const res = await api.get<Paginated<Salida>>(`/owners/me/salidas?${params.toString()}`);
      setSalidas(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las salidas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [page, estadoFilter]);

  async function handleEstado(salida: Salida, nuevo: 'PROGRAMADA' | 'CANCELADA') {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/owners/me/salidas/${salida.id}`, { estado: nuevo });
      setSuccess(nuevo === 'CANCELADA' ? 'Salida cancelada.' : 'Salida reprogramada.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la salida.');
    } finally {
      setSaving(false);
    }
  }

  async function handleFechaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fechaForm) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/owners/me/salidas/${fechaForm.salida.id}`, {
        fechaSalida: new Date(fechaForm.fechaSalida).toISOString(),
      });
      setFechaForm(null);
      setSuccess('Fecha actualizada. Los tramos se recorrieron junto con la salida.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo mover la fecha.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTramoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tramoForm) return;
    setSaving(true);
    setError('');
    const body: Record<string, unknown> = {
      fechaHora: new Date(tramoForm.fechaHora).toISOString(),
      cupo: Number(tramoForm.cupo),
      precioCentavos: Math.round(Number(tramoForm.precioPesos.replace(',', '.')) * 100),
    };
    if (tramoForm.tramo.estado !== 'RESERVADO') body.estado = tramoForm.estado;
    try {
      await api.patch(
        `/owners/me/salidas/${tramoForm.salida.id}/tramos/${tramoForm.tramo.id}`,
        body,
      );
      setTramoForm(null);
      setSuccess('Tramo actualizado.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el tramo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">OPERATIVA DE SALIDAS</span>
          <h1>Mis salidas y tramos</h1>
          <p className="admin-subtitle">
            Mové fechas, cancelá salidas y ajustá cupos, precios y estados de cada tramo.
          </p>
        </div>
        <button type="button" className="button button-ghost" onClick={() => void load()} disabled={loading}>
          Actualizar
        </button>
      </header>

      {error && !fechaForm && !tramoForm && <div className="nf-alert nf-alert-error" role="alert">{error}</div>}
      {success && <div className="nf-alert" role="status">{success}</div>}

      <div className="admin-filters-bar">
        <div className="filter-tabs">
          {(
            [
              ['', 'Todas'],
              ['PROGRAMADA', 'Programadas'],
              ['CANCELADA', 'Canceladas'],
              ['COMPLETADA', 'Completadas'],
            ] as Array<[EstadoFilter, string]>
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              className={`filter-tab${estadoFilter === value ? ' is-active' : ''}`}
              onClick={() => {
                setEstadoFilter(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <WavyLoader label="Cargando tus salidas…" />
        </div>
      ) : salidas.length === 0 ? (
        <div className="admin-empty-card">
          <CalendarClock size={44} className="empty-icon" />
          <h3>Sin salidas</h3>
          <p>No hay salidas {estadoFilter ? `en estado "${salidaLabels[estadoFilter]}"` : 'registradas'} por el momento.</p>
        </div>
      ) : (
        <div className="fleet-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {salidas.map((salida) => (
            <article key={salida.id} className="fleet-boat-card">
              <div className="fleet-boat-top">
                <div>
                  <strong className="fleet-boat-name">
                    {new Date(salida.fechaSalida).toLocaleString('es-AR')}
                  </strong>
                  <span className="boat-plate">
                    <Ship size={12} aria-hidden="true" /> {salida.embarcacion.nombre} · {salida.embarcacion.matricula}
                  </span>
                </div>
                <span
                  className={`status-pill status-${salida.estado.toLowerCase()}`}
                >
                  {salidaLabels[salida.estado] ?? salida.estado}
                </span>
              </div>

              <div className="fleet-boat-details">
                {salida.tramos.map((tramo) => (
                  <div key={tramo.id} className="boat-trip-item">
                    <div>
                      <strong>
                        {tramo.tipo === 'IDA' ? '➡' : '⬅'} {tramo.origen} → {tramo.destino}
                      </strong>
                      <span className="boat-trip-meta">
                        {new Date(tramo.fechaHora).toLocaleString('es-AR')} · {tramo.cupo} cupos · $
                        {(tramo.precioCentavos / 100).toLocaleString('es-AR')}
                        {tramo.sinTuristas ? ' · sin turistas' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                      <span className={`status-pill status-${tramo.estado.toLowerCase()}`}>
                        {tramoLabels[tramo.estado] ?? tramo.estado}
                      </span>
                      <button
                        type="button"
                        className="button button-ghost btn-sm"
                        onClick={() => {
                          setSuccess('');
                          setError('');
                          setTramoForm({
                            salida,
                            tramo,
                            fechaHora: toLocalInput(tramo.fechaHora),
                            cupo: String(tramo.cupo),
                            precioPesos: String(tramo.precioCentavos / 100),
                            estado: tramo.estado,
                          });
                        }}
                      >
                        Editar tramo
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {salida.estado !== 'COMPLETADA' && (
                <div className="fleet-boat-footer">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="button button-ghost btn-sm"
                      onClick={() => {
                        setSuccess('');
                        setError('');
                        setFechaForm({ salida, fechaSalida: toLocalInput(salida.fechaSalida) });
                      }}
                    >
                      Mover fecha
                    </button>
                    {salida.estado === 'PROGRAMADA' ? (
                      <button
                        type="button"
                        className="button button-danger btn-sm"
                        disabled={saving}
                        onClick={() => void handleEstado(salida, 'CANCELADA')}
                      >
                        Cancelar salida
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button btn-sm"
                        disabled={saving}
                        onClick={() => void handleEstado(salida, 'PROGRAMADA')}
                      >
                        Reprogramar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <PaginationBar meta={meta} onChange={setPage} label={(v) => `${v.total} salidas`} />

      {fechaForm && (
        <div className="nf-modal-backdrop" onClick={() => setFechaForm(null)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">MOVER FECHA</span>
                <h2>Nueva fecha de salida</h2>
                <span className="nf-modal-subtitle">Los tramos se desplazan automáticamente.</span>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setFechaForm(null)}>
                ✕
              </button>
            </div>
            <form className="nf-modal-content" onSubmit={(e) => void handleFechaSubmit(e)}>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="form-group">
                <label htmlFor="salida-fecha" className="field-label">Fecha y hora de salida</label>
                <input
                  id="salida-fecha"
                  type="datetime-local"
                  required
                  min={toLocalInput(new Date(Date.now() + 60_000).toISOString())}
                  value={fechaForm.fechaSalida}
                  onChange={(e) => setFechaForm({ ...fechaForm, fechaSalida: e.target.value })}
                />
              </div>
              <div className="nf-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
                <button type="button" className="button button-ghost" onClick={() => setFechaForm(null)}>
                  Cancelar
                </button>
                <button type="submit" className="button" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tramoForm && (
        <div className="nf-modal-backdrop" onClick={() => setTramoForm(null)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">EDITAR TRAMO</span>
                <h2>
                  {tramoForm.tramo.origen} → {tramoForm.tramo.destino}
                </h2>
                <span className="nf-modal-subtitle">
                  {tramoForm.tramo.tipo === 'IDA' ? 'Tramo de ida' : 'Tramo de vuelta'}
                  {tramoForm.tramo.estado === 'RESERVADO' ? ' · con reservas: solo cupo, precio y fecha' : ''}
                </span>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setTramoForm(null)}>
                ✕
              </button>
            </div>
            <form className="nf-modal-content" onSubmit={(e) => void handleTramoSubmit(e)}>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="tramo-fecha" className="field-label">Fecha y hora</label>
                  <input
                    id="tramo-fecha"
                    type="datetime-local"
                    required
                    value={tramoForm.fechaHora}
                    onChange={(e) => setTramoForm({ ...tramoForm, fechaHora: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tramo-cupo" className="field-label">Cupo</label>
                  <input
                    id="tramo-cupo"
                    type="number"
                    required
                    min={1}
                    value={tramoForm.cupo}
                    onChange={(e) => setTramoForm({ ...tramoForm, cupo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tramo-precio" className="field-label">Precio por pasajero ($)</label>
                  <input
                    id="tramo-precio"
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={tramoForm.precioPesos}
                    onChange={(e) => setTramoForm({ ...tramoForm, precioPesos: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tramo-estado" className="field-label">Estado</label>
                  <select
                    id="tramo-estado"
                    value={tramoForm.estado}
                    disabled={tramoForm.tramo.estado === 'RESERVADO'}
                    onChange={(e) => setTramoForm({ ...tramoForm, estado: e.target.value })}
                  >
                    {tramoForm.tramo.estado === 'RESERVADO' && (
                      <option value="RESERVADO">Reservado</option>
                    )}
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="CERRADO">Cerrado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="nf-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
                <button type="button" className="button button-ghost" onClick={() => setTramoForm(null)}>
                  Cancelar
                </button>
                <button type="submit" className="button" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
