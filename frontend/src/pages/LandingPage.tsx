import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Compass,
  MapPin,
  MessageCircle,
  Ship,
  Star,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import { WavyLoader } from '../components/WavyLoader';
import { LiquidCursorEffect } from '../components/LiquidCursorEffect';
import { useReveal } from '../hooks/useReveal';

const boatImages = ['/boat1.jpg', '/boat2.jpg', '/boat3.jpg'];

interface PublicBoat {
  id: string;
  nombre: string;
  capacidad: number;
  descripcion?: string | null;
  propietario?: {
    whatsappPhone?: string | null;
    user?: { name: string };
  };
  zonas: Array<{ zona: { id: string; nombre: string } }>;
  rating: { average: number | null; total: number };
  reviews?: PublicBoatReview[];
}

interface PublicBoatReview {
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface PublicBoatPage {
  data: PublicBoat[];
}

interface PublicSalidaItem {
  id: string;
  fechaSalida: string;
  estado: string;
  embarcacion: {
    propietario?: {
      whatsappPhone?: string | null;
      user?: { name?: string };
    };
  };
}

interface UpcomingTrip {
  fechaSalida: string;
  estado: string;
}

const salidaEstadoLabels: Record<string, string> = {
  PROGRAMADA: 'Programada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
};

const AGENCY_WHATSAPP = '5491100000000';

interface ExperienceReview {
  id: string;
  rating: number;
  comment: string;
  boatName: string;
  createdAt: string;
}

const FALLBACK_EXPERIENCES: ExperienceReview[] = [
  {
    id: 'fallback-1',
    rating: 5,
    comment: 'Excelente servicio, embarcación impecable y muy puntual.',
    boatName: 'Brisa del Delta',
    createdAt: '2026-11-07T15:00:00.000Z',
  },
  {
    id: 'fallback-2',
    rating: 5,
    comment: 'Viaje cómodo, seguro y con muy buena atención durante todo el recorrido.',
    boatName: 'Río Sereno',
    createdAt: '2026-11-06T12:00:00.000Z',
  },
  {
    id: 'fallback-3',
    rating: 4,
    comment: 'Coordinación rápida y transparente desde el primer contacto.',
    boatName: 'Pampero',
    createdAt: '2026-11-05T10:00:00.000Z',
  },
];

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function ActionLink({
  children,
  to,
  outline = false,
}: {
  children: ReactNode;
  to: string;
  outline?: boolean;
}) {
  const hashIndex = to.indexOf('#');
  const sectionId = hashIndex >= 0 ? to.slice(hashIndex + 1) : '';

  return (
    <Link
      className={`nf-hero-btn${outline ? ' nf-hero-btn-outline' : ' nf-hero-btn-solid'}`}
      to={to}
      onClick={() => {
        if (sectionId) {
          scrollToSection(sectionId);
        }
      }}
    >
      <span>{children}</span>
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

function AudienceCard({
  icon,
  title,
  description,
  to,
  children,
  outline = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  to: string;
  children: ReactNode;
  outline?: boolean;
}) {
  return (
    <article className={`nf-audience-card${outline ? ' is-secondary' : ' is-primary'}`}>
      <span className="nf-audience-icon" aria-hidden="true">
        {icon}
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <ActionLink to={to} outline={outline}>
        {children}
      </ActionLink>
    </article>
  );
}

function BoatCard({
  boat,
  index,
  trips = [],
  ownReviews = [],
}: {
  boat: PublicBoat;
  index: number;
  trips?: UpcomingTrip[];
  ownReviews?: ExperienceReview[];
}) {
  const [hoverReview, setHoverReview] = useState<ExperienceReview | null>(null);
  const pickOwnReview = () => {
    if (ownReviews.length === 0) return;
    setHoverReview(ownReviews[Math.floor(Math.random() * ownReviews.length)]);
  };
  const zonesLabel =
    boat.zonas.map(({ zona }) => zona.nombre).join(' · ') || 'Delta del Tigre';
  const operatorName = boat.propietario?.user?.name;
  const ratingLabel =
    boat.rating.average === null ? '4.8' : boat.rating.average.toFixed(1);
  const initials = operatorName
    ? operatorName
        .split(' ')
        .map((word) => word[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'NF';
  const waDigits = boat.propietario?.whatsappPhone?.replace(/\D/g, '') || '';
  const waHref = `https://wa.me/${waDigits || AGENCY_WHATSAPP}?text=${encodeURIComponent(
    `Hola, quiero coordinar un viaje en el Delta. Vi la lancha ${boat.nombre}${
      operatorName ? ` de ${operatorName}` : ''
    } en NautiFlow.`,
  )}`;
  const upcoming = trips.filter((trip) => trip.estado === 'PROGRAMADA').slice(0, 2);

  return (
    <article className="nf-boat-card">
      <div className="nf-boat-media">
        <img
          src={boatImages[index % boatImages.length]}
          alt={`Embarcación ${boat.nombre}`}
          loading="lazy"
        />
        <span className="nf-boat-verified-badge">
          <Check size={12} strokeWidth={3} aria-hidden="true" />
          Verificada
        </span>
      </div>
      <div className="nf-boat-body">
        <div className="nf-boat-header-row">
          <div className="nf-boat-identity">
            <span className="nf-boat-avatar" aria-hidden="true">
              {initials}
            </span>
            <div>
              <h3>{boat.nombre}</h3>
              <p className="nf-boat-operator">
                {operatorName ? `Op. ${operatorName}` : 'Operador verificado del Delta'}
              </p>
            </div>
          </div>
          <span
            className="nf-boat-rating"
            role="img"
            aria-label={`Calificación ${ratingLabel}`}
          >
            <Star size={14} fill="#f5b82e" color="#f5b82e" aria-hidden="true" />
            <strong>{ratingLabel}</strong>
          </span>
        </div>

        <div className="nf-boat-meta-list">
          <p className="nf-boat-meta-item">
            <Users size={14} aria-hidden="true" />
            <span>Hasta {boat.capacidad} pas.</span>
          </p>
          <p className="nf-boat-meta-item">
            <MapPin size={14} aria-hidden="true" />
            <span>{zonesLabel}</span>
          </p>
        </div>

        {boat.descripcion && (
          <p className="nf-boat-description">{boat.descripcion}</p>
        )}

        <div
          className="nf-boat-trips"
          onMouseEnter={pickOwnReview}
          onMouseLeave={() => setHoverReview(null)}
          onFocus={pickOwnReview}
          onBlur={() => setHoverReview(null)}
          tabIndex={0}
          aria-label={`Próximos viajes de ${boat.nombre}. Pasá el mouse para ver una reseña de esta lancha.`}
        >
          <p className="nf-boat-trips-title">Próximos viajes</p>
          {upcoming.length === 0 ? (
            <p className="nf-boat-trips-empty">Sin viajes publicados por ahora.</p>
          ) : (
            <ul className="nf-boat-trips-list">
              {upcoming.map((trip) => (
                <li key={trip.fechaSalida} className="nf-boat-trip-row">
                  <span className="nf-boat-trip-date">
                    {new Date(trip.fechaSalida).toLocaleString('es-AR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span
                    className={`nf-boat-chip${trip.estado === 'PROGRAMADA' ? ' is-programada' : ''}`}
                  >
                    {salidaEstadoLabels[trip.estado] ?? trip.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {hoverReview && (
            <div className="nf-trip-review-pop" role="tooltip">
              <div className="nf-trip-review-stars" aria-hidden="true">
                {Array.from({ length: 5 }, (_, idx) => (
                  <Star
                    key={idx}
                    size={12}
                    fill={idx < hoverReview.rating ? '#f5b82e' : 'transparent'}
                    color={idx < hoverReview.rating ? '#f5b82e' : '#7d918c'}
                  />
                ))}
              </div>
              <p className="nf-trip-review-quote">“{hoverReview.comment}”</p>
              <span className="nf-trip-review-meta">— {hoverReview.boatName}</span>
            </div>
          )}
        </div>

        <a
          className="nf-boat-wa"
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={15} aria-hidden="true" />
          <span>Coordinar por WhatsApp</span>
        </a>
      </div>
    </article>
  );
}

function HowPath({
  icon,
  title,
  description,
  steps,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  steps: string[];
}) {
  return (
    <article className="nf-how-card">
      <div className="nf-how-card-head">
        <span className="nf-how-icon" aria-hidden="true">
          {icon}
        </span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <ol className="nf-how-steps">
        {steps.map((step, index) => (
          <li key={step} className="nf-how-step-item">
            <span className="nf-how-step-num">
              {String(index + 1).padStart(2, '0')}
            </span>
            <strong>{step}</strong>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function LandingPage() {
  const location = useLocation();
  const [boats, setBoats] = useState<PublicBoat[]>([]);
  const [loadingBoats, setLoadingBoats] = useState(true);
  const [boatsError, setBoatsError] = useState(false);
  const [experiences, setExperiences] = useState<ExperienceReview[]>(FALLBACK_EXPERIENCES);
  const [tripsByOperator, setTripsByOperator] = useState<Record<string, UpcomingTrip[]>>({});
  const [reviewsByBoat, setReviewsByBoat] = useState<Record<string, ExperienceReview[]>>({});
  const [visibleBoats, setVisibleBoats] = useState(8);
  const networkRef = useReveal<HTMLElement>();
  const howRef = useReveal<HTMLElement>();
  const experiencesRef = useReveal<HTMLElement>();

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get<PublicBoatPage>('/public/boats?limit=24'),
      api
        .get<{ data: PublicSalidaItem[] }>('/public/salidas?limit=100')
        .catch(() => ({ data: [] as PublicSalidaItem[] })),
    ])
      .then(async ([page, salidasPage]) => {
        if (!active) return;
        setBoats(page.data);

        const grouped: Record<string, UpcomingTrip[]> = {};
        for (const salida of salidasPage.data) {
          if (salida.estado !== 'PROGRAMADA') continue;
          const key = salida.embarcacion.propietario?.user?.name;
          if (!key) continue;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ fechaSalida: salida.fechaSalida, estado: salida.estado });
        }
        for (const list of Object.values(grouped)) {
          list.sort(
            (a, b) => new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime(),
          );
        }
        setTripsByOperator(grouped);

        const collected: ExperienceReview[] = [];
        const byBoat: Record<string, ExperienceReview[]> = {};
        for (const boat of page.data) {
          if (!Array.isArray(boat.reviews)) continue;
          const boatReviews: ExperienceReview[] = [];
          for (const rev of boat.reviews) {
            if (!rev.comment) continue;
            const item: ExperienceReview = {
              id: `${boat.id}-${rev.createdAt}`,
              rating: rev.rating,
              comment: rev.comment,
              boatName: boat.nombre,
              createdAt: rev.createdAt,
            };
            boatReviews.push(item);
            collected.push(item);
          }
          if (boatReviews.length > 0) byBoat[boat.id] = boatReviews;
        }

        if (collected.length > 0) {
          setReviewsByBoat(byBoat);
          setExperiences(shuffle(collected).slice(0, 6));
        }
      })
      .catch(() => {
        if (active) setBoatsError(true);
      })
      .finally(() => {
        if (active) setLoadingBoats(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.slice(1);
      requestAnimationFrame(() => scrollToSection(targetId));
    }
  }, [location.hash]);

  return (
    <div className="landing-page nf-landing">
      <section className="nf-hero" id="top" aria-labelledby="landing-title">
        <img
          className="nf-hero-bg"
          src="/hero.jpg"
          alt="Embarcaciones y muelle en el Delta del Tigre"
          width={1000}
          height={666}
          fetchPriority="high"
        />
        <div className="nf-hero-overlay" />
        <LiquidCursorEffect />

        <div className="nf-hero-container">
          <div className="nf-hero-content">
            <span className="nf-hero-pill">
              <span className="nf-hero-pill-dot" aria-hidden="true" />
              Operación en el Delta del Tigre
            </span>

            <h1 id="landing-title">
              Más confianza para moverse por el Delta.
            </h1>

            <p className="nf-hero-lead">
              Conectamos operaciones fluviales con embarcaciones verificadas,
              documentación revisada y reputación transparente.
            </p>

            <div
              className="nf-audience-grid"
              role="group"
              aria-label="Elegí cómo participar en NautiFlow"
            >
              <AudienceCard
                icon={<Compass size={22} />}
                title="Para viajeros"
                description="Explorá opciones y encontrá una lancha para tu recorrido."
                to="/#network"
              >
                Quiero viajar
              </AudienceCard>

              <AudienceCard
                icon={<Ship size={22} />}
                title="Para lancheros"
                description="Registrá tu embarcación y conectá con nuevos pasajeros."
                to="/registro/lanchero"
                outline
              >
                Quiero ofrecer mi lancha
              </AudienceCard>
            </div>

            <div className="nf-hero-perks">
              <span>
                <Check size={14} aria-hidden="true" /> Documentación verificada
              </span>
              <span>
                <Check size={14} aria-hidden="true" /> Operadores del Delta
              </span>
              <span>
                <Check size={14} aria-hidden="true" /> Coordinación por la agencia
              </span>
            </div>

            <p className="nf-hero-disclaimer">
              Las asignaciones son gestionadas manualmente por NautiFlow. No
              realizamos reservas públicas.
            </p>
          </div>
        </div>
      </section>

      <section
        ref={networkRef}
        className="nf-network-section"
        id="network"
        aria-labelledby="fleet-title"
      >
        <div className="nf-section-container">
          <div className="nf-section-header">
            <p className="nf-section-eyebrow">Nuestra red</p>
            <h2 id="fleet-title">
              Embarcaciones verificadas, operadores del Delta.
            </h2>
            <p className="nf-section-subtitle">
              Todas las embarcaciones cumplen con la revisión documental de la
              agencia antes de operar en la red.
            </p>
          </div>

          {loadingBoats ? (
            <p className="nf-fleet-empty" role="status" aria-busy="true">
              <WavyLoader label="Cargando embarcaciones verificadas..." />
            </p>
          ) : boatsError ? (
            <p className="nf-fleet-empty" role="status">
              No pudimos cargar las embarcaciones. Volvé a intentarlo más tarde.
            </p>
          ) : boats.length ? (
            <>
              <div className="nf-boat-grid">
                {boats.slice(0, visibleBoats).map((boat, index) => (
                  <BoatCard
                    key={boat.id}
                    boat={boat}
                    index={index}
                    trips={tripsByOperator[boat.propietario?.user?.name ?? '']}
                    ownReviews={reviewsByBoat[boat.id] ?? []}
                  />
                ))}
              </div>
              {boats.length > visibleBoats && (
                <div className="nf-fleet-more">
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => setVisibleBoats((prev) => prev + 8)}
                  >
                    Ver más embarcaciones ({boats.length - visibleBoats})
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="nf-fleet-empty">
              Todavía no hay embarcaciones verificadas para mostrar. La agencia
              publicará cada perfil después de revisar su documentación.
            </p>
          )}
        </div>
      </section>

      <section
        ref={howRef}
        className="nf-how-section"
        id="how-it-works"
        aria-labelledby="how-title"
      >
        <div className="nf-section-container">
          <div className="nf-section-header">
            <p className="nf-section-eyebrow">Cómo funciona</p>
            <h2 id="how-title">Coordinación simple, sin algoritmos.</h2>
            <p className="nf-section-subtitle">
              Un proceso claro tanto para quienes necesitan trasladarse como para
              los operadores fluviales del Delta.
            </p>
          </div>

          <div className="nf-how-grid">
            <HowPath
              icon={<Compass size={22} />}
              title="Si querés viajar"
              description="Explorá, coordiná y disfrutá la experiencia del Delta."
              steps={[
                'Explorar opciones',
                'Coordinar con el lanchero',
                'Disfrutar el viaje',
              ]}
            />
            <HowPath
              icon={<Ship size={22} />}
              title="Si tenés una lancha"
              description="Sumá tu embarcación y conectá con nuevos pasajeros."
              steps={[
                'Registrarte en la plataforma',
                'Verificar documentación',
                'Empezar a operar',
              ]}
            />
          </div>

          <div className="nf-how-cta-row">
            <a
              href="https://wa.me/5491100000000?text=Hola%20NautiFlow%2C%20quiero%20consultar%20por%20un%20viaje%20en%20el%20Delta"
              target="_blank"
              rel="noopener noreferrer"
              className="nf-whatsapp-btn"
            >
              <MessageCircle size={18} aria-hidden="true" />
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      <section
        ref={experiencesRef}
        className="nf-experiences-section"
        id="experiences"
        aria-labelledby="experiences-title"
      >
        <div className="nf-section-container">
          <div className="nf-section-header nf-section-header-light">
            <p className="nf-section-eyebrow nf-eyebrow-light">Experiencias</p>
            <h2 id="experiences-title">Viajes que generan confianza.</h2>
          </div>

          <div className="nf-experiences-grid">
            {experiences.map((item) => (
              <article key={item.id} className="nf-experience-card">
                <div
                  className="nf-experience-stars"
                  role="img"
                  aria-label={`Calificación: ${item.rating} de 5 estrellas`}
                >
                  {Array.from({ length: 5 }, (_, idx) => (
                    <Star
                      key={idx}
                      size={15}
                      fill={idx < item.rating ? '#f5b82e' : 'transparent'}
                      color={idx < item.rating ? '#f5b82e' : '#4a746f'}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="nf-experience-quote">
                  “{item.comment}”
                </blockquote>
                <p className="nf-experience-meta">— {item.boatName}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
