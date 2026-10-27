import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, api } from '../services/api';

interface Boat { id: string; nombre: string; matricula: string; capacidad: number }
interface Trip {
  id: string;
  scheduledAt: string;
  passengerCount: number;
  origin: string;
  destination: string;
  status: 'PENDING' | 'ASSIGNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  cliente: { nombre: string; telefono: string; email: string | null };
  embarcacion: { id: string; nombre: string; matricula: string } | null;
}

const statusLabels: Record<Trip['status'], string> = {
  PENDING: 'Pendiente', ASSIGNED: 'Asignado', CONFIRMED: 'Confirmado', COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};

export function AdminTripsPage() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [reviewLinks, setReviewLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function reload() {
    setError('');
    try {
      const [tripData, boatData] = await Promise.all([
        api.get<Trip[]>('/admin/trips'),
        api.get<Boat[]>('/boats/admin/approved'),
      ]);
      setTrips(tripData);
      setBoats(boatData);
    } catch {
      setError('No se pudo cargar la operación. Verificá tu sesión administrativa.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  async function createTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.passengerCount = String(Number(payload.passengerCount));
    payload.scheduledAt = new Date(String(payload.scheduledAt)).toISOString();
    if (!payload.clientEmail) delete payload.clientEmail;
    if (!payload.boatId) delete payload.boatId;
    try {
      await api.post('/admin/trips', payload);
      event.currentTarget.reset();
      await reload();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'No se pudo registrar el viaje.');
    } finally {
      setSubmitting(false);
    }
  }

  async function assign(tripId: string, boatId: string) {
    try {
      await api.patch(`/admin/trips/${tripId}/assign`, { boatId });
      await reload();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'No se pudo asignar la embarcación.');
    }
  }

  async function updateStatus(tripId: string, status: Trip['status']) {
    try {
      await api.patch(`/admin/trips/${tripId}/status`, { status });
      await reload();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'No se pudo actualizar el viaje.');
    }
  }

  async function createReviewLink(tripId: string) {
    try {
      const result = await api.post<{ reviewUrl: string; expiresAt: string }>(`/admin/trips/${tripId}/review-link`, {});
      setReviewLinks({ ...reviewLinks, [tripId]: result.reviewUrl });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'No se pudo generar el enlace de reseña.');
    }
  }

  return (
    <section className="admin-page">
      <header className="dashboard-heading"><div><p className="eyebrow">Administración · Operación</p><h1>Viajes</h1><p className="lead">Registrá los servicios coordinados por la agencia y asociá el cliente al viaje.</p></div></header>
      <section className="admin-section">
        <h2>Nuevo viaje</h2>
        <form className="registration-form trip-form" onSubmit={createTrip}>
          <div className="form-grid">
            <label>Nombre del cliente<input name="clientName" required minLength={2} maxLength={100} /></label>
            <label>Teléfono de contacto<input name="clientPhone" type="tel" required minLength={8} maxLength={30} /></label>
            <label>Correo electrónico, opcional<input name="clientEmail" type="email" maxLength={254} /></label>
            <label>Fecha y hora<input name="scheduledAt" type="datetime-local" required /></label>
            <label>Pasajeros<input name="passengerCount" type="number" min={1} max={100} required /></label>
            <label>Embarcación aprobada<select name="boatId" defaultValue=""><option value="">Sin asignar</option>{boats.map((boat) => <option value={boat.id} key={boat.id}>{boat.nombre} · {boat.capacidad} pasajeros</option>)}</select></label>
            <label>Origen<input name="origin" required minLength={2} maxLength={160} /></label>
            <label>Destino<input name="destination" required minLength={2} maxLength={160} /></label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Registrar viaje'}</button>
        </form>
      </section>
      <section className="admin-section">
        <div className="section-heading"><h2>Servicios</h2><button className="button button-ghost" type="button" onClick={() => void reload()} disabled={loading}>Actualizar</button></div>
        {loading ? <p className="session-loading" role="status">Cargando viajes...</p> : !trips.length ? <p className="empty-state">Todavía no hay viajes registrados.</p> : (
          <div className="admin-list">{trips.map((trip) => (
            <article className="admin-record trip-record" key={trip.id}>
              <div><div className="admin-record-heading"><strong>{trip.cliente.nombre}</strong><span className={`status-mark status-${trip.status.toLowerCase()}`}>{statusLabels[trip.status]}</span></div>
                <p>{trip.origin} → {trip.destination} · {new Date(trip.scheduledAt).toLocaleString('es-AR')}</p>
                <p>{trip.passengerCount} pasajeros · {trip.cliente.telefono}{trip.embarcacion ? ` · ${trip.embarcacion.nombre}` : ''}</p>
              </div>
              {trip.status === 'PENDING' && <label>Asignar lancha<select defaultValue="" onChange={(event) => event.target.value && void assign(trip.id, event.target.value)}><option value="">Seleccionar…</option>{boats.filter((boat) => boat.capacidad >= trip.passengerCount).map((boat) => <option value={boat.id} key={boat.id}>{boat.nombre} · {boat.capacidad} pasajeros</option>)}</select></label>}
              {trip.status === 'ASSIGNED' && <button className="button button-ghost" type="button" onClick={() => void updateStatus(trip.id, 'CONFIRMED')}>Confirmar</button>}
              {trip.status === 'CONFIRMED' && <button className="button" type="button" onClick={() => void updateStatus(trip.id, 'COMPLETED')}>Marcar completado</button>}
              {trip.status === 'COMPLETED' && <button className="button button-ghost" type="button" onClick={() => void createReviewLink(trip.id)}>Generar enlace de reseña</button>}
              {reviewLinks[trip.id] && <label>Enlace para el cliente<input readOnly value={reviewLinks[trip.id]} onFocus={(event) => event.currentTarget.select()} /></label>}
            </article>
          ))}</div>
        )}
      </section>
    </section>
  );
}