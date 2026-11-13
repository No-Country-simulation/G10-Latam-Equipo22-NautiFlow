import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  MessageCircle,
  Star,
} from 'lucide-react';
import { PaginationBar } from '../components/PaginationBar';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';
import type { PageMeta, Paginated } from '../types/api';

interface ReceivedReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  embarcacion: {
    id: string;
    nombre: string;
    matricula: string;
    propietario: { user: { name: string } };
  } | null;
  trip: {
    id: string;
    scheduledAt: string;
    origin: string;
    destination: string;
    passengerCount: number;
    cliente: { nombre: string; telefono: string; email: string | null };
  };
}

interface PendingReviewTrip {
  id: string;
  scheduledAt: string;
  origin: string;
  destination: string;
  passengerCount: number;
  cliente: { nombre: string; telefono: string; email: string | null };
  embarcacion: {
    id: string;
    nombre: string;
    matricula: string;
    propietario: { user: { name: string } };
  } | null;
  reviewToken: {
    id: string;
    expiresAt: string;
    usedAt: string | null;
  } | null;
}

interface BoatOption {
  id: string;
  nombre: string;
}

export function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'PENDING'>('RECEIVED');

  // Received reviews
  const [reviews, setReviews] = useState<ReceivedReview[]>([]);
  const [reviewsMeta, setReviewsMeta] = useState<PageMeta | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [selectedBoatId, setSelectedBoatId] = useState('');
  const [minRating, setMinRating] = useState('');

  // Pending review trips
  const [pendingTrips, setPendingTrips] = useState<PendingReviewTrip[]>([]);
  const [pendingMeta, setPendingMeta] = useState<PageMeta | null>(null);
  const [pendingPage, setPendingPage] = useState(1);

  // Common data
  const [boats, setBoats] = useState<BoatOption[]>([]);
  const [generatedTokens, setGeneratedTokens] = useState<Record<string, string>>({});
  const [busyTripId, setBusyTripId] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'RECEIVED') {
        const params = new URLSearchParams();
        params.set('page', String(reviewsPage));
        params.set('limit', '12');
        if (selectedBoatId) params.set('boatId', selectedBoatId);
        if (minRating) params.set('ratingMin', minRating);

        const [revRes, boatsRes] = await Promise.all([
          api.get<Paginated<ReceivedReview>>(`/admin/reviews?${params.toString()}`),
          boats.length ? Promise.resolve(boats) : api.get<BoatOption[]>('/boats/admin/approved'),
        ]);

        setReviews(revRes.data);
        setReviewsMeta(revRes.meta);
        if (!boats.length) setBoats(boatsRes);
      } else {
        const [pendingRes, boatsRes] = await Promise.all([
          api.get<Paginated<PendingReviewTrip>>(`/admin/reviews/pending?page=${pendingPage}&limit=12`),
          boats.length ? Promise.resolve(boats) : api.get<BoatOption[]>('/boats/admin/approved'),
        ]);

        setPendingTrips(pendingRes.data);
        setPendingMeta(pendingRes.meta);
        if (!boats.length) setBoats(boatsRes);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar las reseñas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [activeTab, reviewsPage, pendingPage, selectedBoatId, minRating]);

  async function handleSendWhatsApp(pt: PendingReviewTrip) {
    setBusyTripId(pt.id);
    setError('');
    try {
      let url = generatedTokens[pt.id];
      if (!url) {
        const res = await api.post<{ reviewUrl: string }>(`/admin/trips/${pt.id}/review-link`, {});
        url = res.reviewUrl;
        setGeneratedTokens((prev) => ({ ...prev, [pt.id]: url }));
      }
      const boatName = pt.embarcacion?.nombre ?? 'la lancha';
      const phone = pt.cliente.telefono.replace(/\D/g, '');
      const text = `¡Hola ${pt.cliente.nombre}! 🚤 Gracias por viajar con ${boatName} en el Delta.\nTu opinión nos ayuda a mantener la mejor calidad de servicio. Por favor dejanos tu calificación en este enlace seguro:\n${url}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo preparar el mensaje de WhatsApp.');
    } finally {
      setBusyTripId('');
    }
  }

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">REPUTACIÓN Y CALIDAD DE SERVICIO</span>
          <h1>Reseñas y Calificaciones</h1>
          <p className="admin-subtitle">
            Monitoreo de satisfacción de turistas: gestione invitaciones a calificar viajes finalizados y consulte las opiniones recibidas.
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
      {success && <div className="nf-alert nf-alert-success" role="status">{success}</div>}

      {/* Tabs */}
      <div className="admin-filters-bar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab${activeTab === 'RECEIVED' ? ' is-active' : ''}`}
            onClick={() => { setActiveTab('RECEIVED'); setReviewsPage(1); }}
          >
            <Star size={16} /> Reseñas Recibidas
          </button>
          <button
            type="button"
            className={`filter-tab${activeTab === 'PENDING' ? ' is-active' : ''}`}
            onClick={() => { setActiveTab('PENDING'); setPendingPage(1); }}
          >
            <Clock size={16} /> Pendientes de Calificación
          </button>
        </div>

        {activeTab === 'RECEIVED' && (
          <div className="filters-extra-row">
            <select
              className="zone-select-filter"
              value={selectedBoatId}
              onChange={(e) => { setSelectedBoatId(e.target.value); setReviewsPage(1); }}
            >
              <option value="">Todas las lanchas</option>
              {boats.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>

            <select
              className="zone-select-filter"
              value={minRating}
              onChange={(e) => { setMinRating(e.target.value); setReviewsPage(1); }}
            >
              <option value="">Cualquier puntuación</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 estrellas)</option>
              <option value="4">⭐⭐⭐⭐ (4 o más estrellas)</option>
              <option value="3">⭐⭐⭐ (3 o más estrellas)</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <WavyLoader label="Cargando reseñas…" />
        </div>
      ) : activeTab === 'RECEIVED' ? (
        /* Listado de Reseñas Recibidas */
        reviews.length === 0 ? (
          <div className="admin-empty-card">
            <Star size={44} className="empty-icon" />
            <h3>No hay reseñas recibidas</h3>
            <p>Todavía no se registraron comentarios con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.map((rev) => (
              <article key={rev.id} className="review-card">
                <div className="review-card-top">
                  <div>
                    <div className="star-rating-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star-icon ${star <= rev.rating ? 'star-filled' : 'star-empty'}`}
                        >
                          ★
                        </span>
                      ))}
                      <strong className="star-rating-val">{rev.rating} / 5</strong>
                    </div>
                    <span className="review-boat-name">
                      🚤 {rev.embarcacion?.nombre ?? 'Embarcación'}
                      {rev.embarcacion?.propietario && (
                        <span> · Lanchero: {rev.embarcacion.propietario.user.name}</span>
                      )}
                    </span>
                  </div>

                  <span className="review-date-pill">
                    {new Date(rev.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>

                <div className="review-card-body">
                  <p className="review-comment-text">
                    "{rev.comment || 'El turista no dejó comentario escrito.'}"
                  </p>

                  <div className="review-trip-context">
                    <span className="review-context-title">Viaje calificado:</span>
                    <span>
                      {rev.trip.origin} → {rev.trip.destination} ·{' '}
                      {new Date(rev.trip.scheduledAt).toLocaleDateString('es-AR')} ({rev.trip.cliente.nombre})
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        /* Listado de Viajes Pendientes de Calificación */
        pendingTrips.length === 0 ? (
          <div className="admin-empty-card">
            <CheckCircle2 size={44} className="empty-icon" />
            <h3>No hay viajes pendientes de reseña</h3>
            <p>Todos los viajes completados ya recibieron su calificación o no hay servicios finalizados recientemente.</p>
          </div>
        ) : (
          <div className="pending-reviews-grid">
            {pendingTrips.map((pt) => {
              const hasActiveToken = pt.reviewToken && (!pt.reviewToken.usedAt && new Date(pt.reviewToken.expiresAt) > new Date());
              const localUrl = generatedTokens[pt.id];

              return (
                <article key={pt.id} className="pending-review-card">
                  <div className="pending-review-top">
                    <div>
                      <strong className="pending-route-text">{pt.origin} → {pt.destination}</strong>
                      <span className="pending-date-text">
                        <Clock size={13} /> Viaje completado:{' '}
                        {new Date(pt.scheduledAt).toLocaleString('es-AR')}
                      </span>
                    </div>

                    <span
                      className={`status-pill ${
                        localUrl || hasActiveToken ? 'status-confirmed' : 'status-pending'
                      }`}
                    >
                      {localUrl || hasActiveToken ? 'Enlace generado' : 'Sin enlace'}
                    </span>
                  </div>

                  <div className="pending-review-body">
                    <div className="pending-details-row">
                      <span>Turista: <strong>{pt.cliente.nombre}</strong> ({pt.cliente.telefono})</span>
                      <span>Lancha: <strong>{pt.embarcacion?.nombre ?? 'Sin lancha'}</strong></span>
                    </div>

                    {localUrl && (
                      <div className="generated-link-box">
                        <span className="generated-link-label">Enlace único de calificación:</span>
                        <div className="generated-link-row">
                          <input
                            readOnly
                            value={localUrl}
                            onFocus={(e) => e.currentTarget.select()}
                            className="review-link-input"
                          />
                          <button
                            type="button"
                            className="button button-ghost btn-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(localUrl);
                              setSuccess('Enlace copiado al portapapeles.');
                            }}
                          >
                            <Copy size={13} /> Copiar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pending-review-footer">
                    <button
                      type="button"
                      className="button btn-sm"
                      disabled={busyTripId === pt.id}
                      onClick={() => void handleSendWhatsApp(pt)}
                    >
                      <MessageCircle size={14} /> {busyTripId === pt.id ? 'Generando...' : localUrl ? 'Enviar por WhatsApp' : 'Generar enlace y enviar por WhatsApp'}
                    </button>
                    {localUrl && (
                      <button
                        type="button"
                        className="button button-ghost btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(localUrl);
                          setSuccess('Enlace copiado al portapapeles.');
                        }}
                      >
                        <Copy size={13} /> Copiar enlace
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )
      )}

      <PaginationBar
        meta={activeTab === 'RECEIVED' ? reviewsMeta : pendingMeta}
        onChange={activeTab === 'RECEIVED' ? setReviewsPage : setPendingPage}
        label={(v) => `${v.total} ${activeTab === 'RECEIVED' ? 'reseñas' : 'viajes'}`}
      />
    </div>
  );
}
