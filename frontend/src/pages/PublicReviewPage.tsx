import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, api } from '../services/api';

interface ReviewContext {
  trip: { origin: string; destination: string; scheduledAt: string; boatName: string | null };
}

export function PublicReviewPage() {
  const { token = '' } = useParams();
  const [context, setContext] = useState<ReviewContext | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<ReviewContext>(`/public/reviews/${encodeURIComponent(token)}`)
      .then(setContext)
      .catch(() => setError('Este enlace venció o ya fue utilizado.'));
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await api.post(`/public/reviews/${encodeURIComponent(token)}`, {
        rating: Number(form.get('rating')),
        comment: String(form.get('comment') ?? ''),
      });
      setSuccess(true);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'No se pudo enviar la reseña.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return <section className="confirmation-page"><p className="eyebrow">Reseña enviada</p><h1>Gracias por compartir tu experiencia.</h1><p className="lead">Tu opinión ayuda a mantener un servicio de calidad en el Delta.</p></section>;
  if (error && !context) return <section className="confirmation-page"><p className="eyebrow">Enlace no disponible</p><h1>No pudimos abrir esta reseña.</h1><p className="form-error" role="alert">{error}</p></section>;
  if (!context) return <p className="session-loading" role="status">Cargando viaje...</p>;

  return (
    <section className="review-page">
      <p className="eyebrow">NautiFlow · Tu experiencia</p>
      <h1>¿Cómo estuvo tu viaje?</h1>
      <p className="lead">{context.trip.origin} → {context.trip.destination} · {new Date(context.trip.scheduledAt).toLocaleDateString('es-AR')}{context.trip.boatName ? ` · ${context.trip.boatName}` : ''}</p>
      <form className="login-form" onSubmit={submit}>
        <label htmlFor="rating">Calificación</label>
        <select id="rating" name="rating" required defaultValue="5"><option value="5">5 · Excelente</option><option value="4">4 · Muy bueno</option><option value="3">3 · Bueno</option><option value="2">2 · Regular</option><option value="1">1 · Malo</option></select>
        <label htmlFor="comment">Comentario, opcional</label>
        <textarea id="comment" name="comment" rows={5} maxLength={2000} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button login-submit" type="submit" disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar reseña'}</button>
      </form>
    </section>
  );
}