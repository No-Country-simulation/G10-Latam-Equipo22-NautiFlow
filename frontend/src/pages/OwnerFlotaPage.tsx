import { useEffect, useState } from 'react';
import { Compass, Plus, Ship, Users } from 'lucide-react';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';

interface Zona {
  id: string;
  nombre: string;
}

interface OwnerBoat {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
  descripcion: string | null;
  estado: string;
  zonas: Array<{ zona: Zona }>;
}

const estadoBoatLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente de verificación',
  VERIFICADA: 'Verificada',
  RECHAZADA: 'Rechazada',
  INACTIVA: 'Inactiva',
};

interface FormState {
  id?: string;
  nombre: string;
  matricula: string;
  capacidad: string;
  descripcion: string;
  zonaIds: string[];
}

const emptyForm: FormState = {
  nombre: '',
  matricula: '',
  capacidad: '',
  descripcion: '',
  zonaIds: [],
};

export function OwnerFlotaPage() {
  const [boats, setBoats] = useState<OwnerBoat[]>([]);
  const [zones, setZones] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [boatsRes, zonesRes] = await Promise.all([
        api.get<OwnerBoat[]>('/boats/mine'),
        api.get<Zona[]>('/zones'),
      ]);
      setBoats(boatsRes);
      setZones(zonesRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar tu flota.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setSuccess('');
    setError('');
    setForm({ ...emptyForm });
  }

  function openEdit(boat: OwnerBoat) {
    setSuccess('');
    setError('');
    setForm({
      id: boat.id,
      nombre: boat.nombre,
      matricula: boat.matricula,
      capacidad: String(boat.capacidad),
      descripcion: boat.descripcion ?? '',
      zonaIds: boat.zonas.map((z) => z.zona.id),
    });
  }

  function toggleZona(zonaId: string) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            zonaIds: prev.zonaIds.includes(zonaId)
              ? prev.zonaIds.filter((z) => z !== zonaId)
              : [...prev.zonaIds, zonaId],
          }
        : prev,
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError('');
    const body = {
      nombre: form.nombre.trim(),
      matricula: form.matricula.trim(),
      capacidad: Number(form.capacidad),
      descripcion: form.descripcion.trim() || undefined,
      zonaIds: form.zonaIds,
    };
    try {
      if (form.id) {
        await api.patch(`/boats/${form.id}`, body);
        setSuccess('Lancha actualizada correctamente.');
      } else {
        await api.post('/boats', body);
        setSuccess('Lancha registrada. Queda pendiente de verificación por la agencia.');
      }
      setForm(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la lancha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">EMBARCACIONES PROPIAS</span>
          <h1>Mi flota</h1>
          <p className="admin-subtitle">
            Registrá y editá tus lanchas: nombre, matrícula, capacidad y zonas de cobertura.
          </p>
        </div>
        <button type="button" className="button" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Nueva lancha
        </button>
      </header>

      {error && !form && <div className="nf-alert nf-alert-error" role="alert">{error}</div>}
      {success && <div className="nf-alert" role="status">{success}</div>}

      {loading ? (
        <div className="admin-loading-state">
          <WavyLoader label="Cargando tu flota…" />
        </div>
      ) : boats.length === 0 ? (
        <div className="admin-empty-card">
          <Ship size={44} className="empty-icon" />
          <h3>Todavía no registraste lanchas</h3>
          <p>Sumá tu primera embarcación para empezar a operar en la red.</p>
          <button type="button" className="button" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" />
            Registrar lancha
          </button>
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
                <span
                  className={`status-mark status-${boat.estado.toLowerCase()}`}
                >
                  {estadoBoatLabels[boat.estado] ?? boat.estado}
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
                    <strong>{boat.zonas.map((z) => z.zona.nombre).join(', ') || 'Sin zonas asignadas'}</strong>
                  </span>
                </div>
                {boat.descripcion && <p className="modal-hint">{boat.descripcion}</p>}
              </div>

              <div className="fleet-boat-footer">
                {boat.estado === 'VERIFICADA' ? (
                  <span className="verified-tag">Verificada</span>
                ) : (
                  <span className="boat-plate">En revisión</span>
                )}
                <button
                  type="button"
                  className="button button-ghost btn-sm"
                  onClick={() => openEdit(boat)}
                >
                  Editar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {form && (
        <div className="nf-modal-backdrop" onClick={() => setForm(null)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">{form.id ? 'EDITAR LANCHA' : 'NUEVA LANCHA'}</span>
                <h2>{form.id ? form.nombre || 'Editar lancha' : 'Registrar lancha'}</h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setForm(null)}>
                ✕
              </button>
            </div>

            <form className="nf-modal-content" onSubmit={(e) => void handleSubmit(e)}>
              {error && <p className="form-error" role="alert">{error}</p>}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="boat-nombre" className="field-label">Nombre</label>
                  <input
                    id="boat-nombre"
                    required
                    maxLength={80}
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Lancha Delta 1"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="boat-matricula" className="field-label">Matrícula</label>
                  <input
                    id="boat-matricula"
                    required
                    maxLength={30}
                    value={form.matricula}
                    onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                    placeholder="AR-1234"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="boat-capacidad" className="field-label">Capacidad (pasajeros)</label>
                  <input
                    id="boat-capacidad"
                    type="number"
                    required
                    min={1}
                    value={form.capacidad}
                    onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="boat-descripcion" className="field-label">Descripción (opcional)</label>
                  <input
                    id="boat-descripcion"
                    maxLength={300}
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Cubierta, techo retráctil…"
                  />
                </div>
              </div>

              <div className="form-group">
                <span className="field-label">Zonas de cobertura</span>
                <div className="zone-options">
                  {zones.map((zona) => (
                    <label key={zona.id} className="zone-option">
                      <input
                        type="checkbox"
                        checked={form.zonaIds.includes(zona.id)}
                        onChange={() => toggleZona(zona.id)}
                      />
                      <span>{zona.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="nf-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
                <button type="button" className="button button-ghost" onClick={() => setForm(null)}>
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
