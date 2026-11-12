import { useEffect, useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { PaginationBar } from '../components/PaginationBar';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';
import type { PageMeta, Paginated } from '../types/api';

interface OwnerBoatOption {
  id: string;
  nombre: string;
  matricula: string;
}

interface EmptyLeg {
  id: string;
  tripId: string | null;
  embarcacionId: string;
  origin: string;
  destination: string;
  scheduledAt: string;
  status: string;
}

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Disponible',
  OFFERED: 'Ofrecido',
  ASSIGNED: 'Asignado',
  CLOSED: 'Cerrado',
};

type StatusFilter = '' | 'AVAILABLE' | 'OFFERED' | 'ASSIGNED' | 'CLOSED';

interface CreateFormState {
  embarcacionId: string;
  origin: string;
  destination: string;
  scheduledAt: string;
}

interface EditFormState {
  leg: EmptyLeg;
  scheduledAt: string;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function OwnerRetornosPage() {
  const [legs, setLegs] = useState<EmptyLeg[]>([]);
  const [boats, setBoats] = useState<OwnerBoatOption[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createForm, setCreateForm] = useState<CreateFormState | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (statusFilter) params.set('status', statusFilter);
      const [res, boatsRes] = await Promise.all([
        api.get<Paginated<EmptyLeg>>(`/owners/me/empty-legs?${params.toString()}`),
        boats.length ? Promise.resolve(boats) : api.get<OwnerBoatOption[]>('/boats/mine'),
      ]);
      setLegs(res.data);
      setMeta(res.meta);
      if (!boats.length) setBoats(boatsRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los retornos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [page, statusFilter]);

  function openCreate() {
    setSuccess('');
    setCreateForm({ embarcacionId: boats[0]?.id ?? '', origin: '', destination: '', scheduledAt: '' });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/owners/me/empty-legs', {
        embarcacionId: createForm.embarcacionId,
        origin: createForm.origin.trim(),
        destination: createForm.destination.trim(),
        scheduledAt: new Date(createForm.scheduledAt).toISOString(),
      });
      setCreateForm(null);
      setSuccess('Retorno publicado. La agencia lo revisará y ofrecerá a la red.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo publicar el retorno.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/owners/me/empty-legs/${editForm.leg.id}`, {
        scheduledAt: new Date(editForm.scheduledAt).toISOString(),
      });
      setEditForm(null);
      setSuccess('Fecha del retorno actualizada.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el retorno.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(leg: EmptyLeg) {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/owners/me/empty-legs/${leg.id}`, {
        status: leg.status === 'AVAILABLE' ? 'CLOSED' : 'AVAILABLE',
      });
      setSuccess(leg.status === 'AVAILABLE' ? 'Retorno cerrado.' : 'Retorno reabierto como disponible.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar el estado.');
    } finally {
      setSaving(false);
    }
  }

  const editable = (leg: EmptyLeg) => leg.status === 'AVAILABLE' || leg.status === 'CLOSED';

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">BOLSA DE RETORNOS</span>
          <h1>Mis retornos en vacío</h1>
          <p className="admin-subtitle">
            Publicá cuándo volvés vacío y la agencia lo ofrecerá a turistas y envíos del Delta.
          </p>
        </div>
        <button type="button" className="button" onClick={openCreate} disabled={boats.length === 0}>
          <Plus size={16} aria-hidden="true" />
          Nuevo retorno
        </button>
      </header>

      {error && !createForm && !editForm && <div className="nf-alert nf-alert-error" role="alert">{error}</div>}
      {success && <div className="nf-alert" role="status">{success}</div>}

      <div className="admin-filters-bar">
        <div className="filter-tabs">
          {(
            [
              ['', 'Todas'],
              ['AVAILABLE', 'Disponibles'],
              ['OFFERED', 'Ofrecidos'],
              ['ASSIGNED', 'Asignados'],
              ['CLOSED', 'Cerrados'],
            ] as Array<[StatusFilter, string]>
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              className={`filter-tab${statusFilter === value ? ' is-active' : ''}`}
              onClick={() => {
                setStatusFilter(value);
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
          <WavyLoader label="Cargando tus retornos…" />
        </div>
      ) : legs.length === 0 ? (
        <div className="admin-empty-card">
          <RotateCcw size={44} className="empty-icon" />
          <h3>Sin retornos por aquí</h3>
          <p>No hay retornos {statusFilter ? `con estado "${statusLabels[statusFilter]}"` : 'registrados'} por el momento.</p>
        </div>
      ) : (
        <div className="fleet-grid">
          {legs.map((leg) => (
            <article key={leg.id} className="fleet-boat-card">
              <div className="fleet-boat-top">
                <div>
                  <strong className="fleet-boat-name">
                    {leg.origin} → {leg.destination}
                  </strong>
                  <span className="boat-plate">
                    {new Date(leg.scheduledAt).toLocaleString('es-AR')}
                  </span>
                </div>
                <span
                  className={`operational-badge ${
                    leg.status === 'AVAILABLE'
                      ? 'operational-retorno'
                      : leg.status === 'ASSIGNED'
                        ? 'operational-reservada'
                        : 'operational-libre'
                  }`}
                >
                  {statusLabels[leg.status] ?? leg.status}
                </span>
              </div>

              <div className="fleet-boat-footer">
                {!editable(leg) && leg.status !== 'CLOSED' ? (
                  <span className="boat-plate">Gestionado por la agencia</span>
                ) : (
                  <span className="boat-plate">
                    {leg.status === 'AVAILABLE' ? 'Visible en la bolsa' : 'Oculto de la bolsa'}
                  </span>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {editable(leg) && (
                    <button
                      type="button"
                      className="button button-ghost btn-sm"
                      onClick={() => {
                        setSuccess('');
                        setError('');
                        setEditForm({ leg, scheduledAt: toLocalInput(leg.scheduledAt) });
                      }}
                    >
                      Editar fecha
                    </button>
                  )}
                  {editable(leg) && (
                    <button
                      type="button"
                      className={`button btn-sm${leg.status === 'AVAILABLE' ? ' button-danger' : ''}`}
                      disabled={saving}
                      onClick={() => void handleToggleStatus(leg)}
                    >
                      {leg.status === 'AVAILABLE' ? 'Cerrar' : 'Reabrir'}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PaginationBar meta={meta} onChange={setPage} label={(v) => `${v.total} retornos`} />

      {createForm && (
        <div className="nf-modal-backdrop" onClick={() => setCreateForm(null)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">NUEVO RETORNO</span>
                <h2>Publicar retorno en vacío</h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setCreateForm(null)}>
                ✕
              </button>
            </div>
            <form className="nf-modal-content" onSubmit={(e) => void handleCreate(e)}>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="form-group">
                <label htmlFor="leg-boat" className="field-label">Embarcación</label>
                <select
                  id="leg-boat"
                  required
                  value={createForm.embarcacionId}
                  onChange={(e) => setCreateForm({ ...createForm, embarcacionId: e.target.value })}
                >
                  {boats.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} ({b.matricula})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="leg-origin" className="field-label">Origen</label>
                  <input
                    id="leg-origin"
                    required
                    maxLength={120}
                    value={createForm.origin}
                    onChange={(e) => setCreateForm({ ...createForm, origin: e.target.value })}
                    placeholder="Delta del Tigre"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="leg-destination" className="field-label">Destino</label>
                  <input
                    id="leg-destination"
                    required
                    maxLength={120}
                    value={createForm.destination}
                    onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })}
                    placeholder="Tigre Centro"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="leg-scheduled" className="field-label">Fecha y hora del regreso</label>
                <input
                  id="leg-scheduled"
                  type="datetime-local"
                  required
                  min={toLocalInput(new Date(Date.now() + 60_000).toISOString())}
                  value={createForm.scheduledAt}
                  onChange={(e) => setCreateForm({ ...createForm, scheduledAt: e.target.value })}
                />
              </div>
              <div className="nf-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
                <button type="button" className="button button-ghost" onClick={() => setCreateForm(null)}>
                  Cancelar
                </button>
                <button type="submit" className="button" disabled={saving}>
                  {saving ? 'Publicando…' : 'Publicar retorno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editForm && (
        <div className="nf-modal-backdrop" onClick={() => setEditForm(null)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">EDITAR RETORNO</span>
                <h2>
                  {editForm.leg.origin} → {editForm.leg.destination}
                </h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setEditForm(null)}>
                ✕
              </button>
            </div>
            <form className="nf-modal-content" onSubmit={(e) => void handleEditSubmit(e)}>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="form-group">
                <label htmlFor="leg-edit-scheduled" className="field-label">Nueva fecha y hora</label>
                <input
                  id="leg-edit-scheduled"
                  type="datetime-local"
                  required
                  min={toLocalInput(new Date(Date.now() + 60_000).toISOString())}
                  value={editForm.scheduledAt}
                  onChange={(e) => setEditForm({ ...editForm, scheduledAt: e.target.value })}
                />
              </div>
              <div className="nf-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
                <button type="button" className="button button-ghost" onClick={() => setEditForm(null)}>
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
