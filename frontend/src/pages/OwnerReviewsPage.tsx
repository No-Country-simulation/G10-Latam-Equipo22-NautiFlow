import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { PaginationBar } from '../components/PaginationBar';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';
import type { PageMeta, Paginated } from '../types/api';

interface ResenaItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  embarcacion: { id: string; nombre: string };
  trip: { origin: string; destination: string; scheduledAt: string };
}

interface ResenaLancha {
  boatId: string;
  nombre: string;
  promedio: number | null;
  total: number;
}

interface ResenasResponse extends Paginated<ResenaItem> {
  promedio: number | null;
  total: number;
  porLancha: ResenaLancha[];
}

export function OwnerReviewsPage() {
  const [data, setData] = useState<ResenasResponse | null>(null);
  const [page, setPage] = useState(1);
  const [boatId, setBoatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (boatId) params.set('boatId', boatId);

    api
      .get<ResenasResponse>(`/owners/me/reviews?${params.toString()}`)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las reseñas.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, boatId]);

  const meta: PageMeta | null = data?.meta ?? null;

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">REPUTACIÓN DE TU FLOTA</span>
          <h1>Reseñas de mis lanchas</h1>
          <p className="admin-subtitle">
            Calificaciones que los turistas dejaron por tus embarcaciones después de cada viaje.
          </p>
        </div>
      </header>

      {error && (
        <div className="nf-alert nf-alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="nf-kpi-grid nf-kpi-grid-2">
        <article className="nf-kpi-card">
          <div className="nf-kpi-top">
            <span className="nf-kpi-label">Calificación promedio</span>
            <span className="nf-kpi-icon" aria-hidden="true">
              <Star size={18} />
            </span>
          </div>
          <strong className="nf-kpi-value">
            {data ? (data.promedio !== null ? `${data.promedio} ★` : '—') : '—'}
          </strong>
        </article>
        <article className="nf-kpi-card">
          <div className="nf-kpi-top">
            <span className="nf-kpi-label">Total de reseñas</span>
            <span className="nf-kpi-icon" aria-hidden="true">
              <Star size={18} />
            </span>
          </div>
          <strong className="nf-kpi-value">{data ? data.total : '—'}</strong>
        </article>
      </div>

      <div className="admin-filters-bar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab${boatId === '' ? ' is-active' : ''}`}
            onClick={() => {
              setBoatId('');
              setPage(1);
            }}
          >
            Todas mis lanchas
          </button>
          {(data?.porLancha ?? [])
            .filter((lancha) => lancha.total > 0)
            .map((lancha) => (
              <button
                key={lancha.boatId}
                type="button"
                className={`filter-tab${boatId === lancha.boatId ? ' is-active' : ''}`}
                onClick={() => {
                  setBoatId(lancha.boatId);
                  setPage(1);
                }}
              >
                {lancha.nombre} ({lancha.total})
              </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <WavyLoader label="Cargando reseñas…" />
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="admin-empty-card">
          <Star size={44} className="empty-icon" />
          <h3>Sin reseñas por ahora</h3>
          <p>
            {boatId
              ? 'Esta lancha todavía no recibió calificaciones de turistas.'
              : 'Cuando los turistas califiquen sus viajes en tus lanchas, vas a verlos acá.'}
          </p>
        </div>
      ) : (
        <div className="reviews-grid">
          {data.data.map((rev) => (
            <article key={rev.id} className="review-card">
              <div className="review-card-top">
                <div className="star-rating-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={`star-icon ${star <= rev.rating ? 'star-filled' : 'star-empty'}`}
                      fill={star <= rev.rating ? '#f5b82e' : 'transparent'}
                      color={star <= rev.rating ? '#f5b82e' : '#4a746f'}
                      aria-hidden="true"
                    />
                  ))}
                  <strong className="star-rating-val">{rev.rating} / 5</strong>
                </div>
                <span className="review-boat-name">{rev.embarcacion.nombre}</span>
                <span className="review-date-pill">
                  {new Date(rev.createdAt).toLocaleDateString('es-AR')}
                </span>
              </div>
              <div className="review-card-body">
                <p className="review-comment-text">
                  {rev.comment ? `“${rev.comment}”` : 'Sin comentario escrito.'}
                </p>
                <div className="review-trip-context">
                  <span className="review-context-title">Viaje calificado:</span>
                  <span>
                    {rev.trip.origin} → {rev.trip.destination} ·{' '}
                    {new Date(rev.trip.scheduledAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PaginationBar
        meta={meta}
        onChange={setPage}
        label={(v) => `${v.total} reseñas`}
      />
    </div>
  );
}
