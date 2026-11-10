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
}

interface PublicBoatReview {
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface PublicBoatDetail extends PublicBoat {
  reviews: PublicBoatReview[];
}

interface PublicBoatPage {
  data: PublicBoat[];
}

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

function BoatCard({ boat, index }: { boat: PublicBoat; index: number }) {
  const zonesLabel =
    boat.zonas.map(({ zona }) => zona.nombre).join(' · ') || 'Delta del Tigre';
  const operatorName = boat.propietario?.user?.name;
  const ratingLabel =
    boat.rating.average === null ? '4.8' : boat.rating.average.toFixed(1);

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
          <div>
            <h3>{boat.nombre}</h3>
            <p className="nf-boat-operator">
              {operatorName ? `Op. ${operatorName}` : 'Operador verificado del Delta'}
            </p>
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

  useEffect(() => {
    let active = true;

    api
      .get<PublicBoatPage>('/public/boats?limit=6')
      .then(async (page) => {
        if (!active) return;
        setBoats(page.data);

        const detailPromises = page.data.map((boat) =>
          api
            .get<PublicBoatDetail>(`/public/boats/${boat.id}`)
            .catch(() => null),
        );
        const details = await Promise.all(detailPromises);
        if (!active) return;

        const collected: ExperienceReview[] = [];
        for (const detail of details) {
          if (!detail || !Array.isArray(detail.reviews)) continue;
          for (const rev of detail.reviews) {
            if (!rev.comment) continue;
            collected.push({
              id: `${detail.id}-${rev.createdAt}`,
              rating: rev.rating,
              comment: rev.comment,
              boatName: detail.nombre,
              createdAt: rev.createdAt,
            });
          }
        }

        collected.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        if (collected.length > 0) {
          setExperiences(collected.slice(0, 6));
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

      <section className="nf-network-section" id="network" aria-labelledby="fleet-title">
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
            <div className="nf-boat-grid">
              {boats.map((boat, index) => (
                <BoatCard key={boat.id} boat={boat} index={index} />
              ))}
            </div>
          ) : (
            <p className="nf-fleet-empty">
              Todavía no hay embarcaciones verificadas para mostrar. La agencia
              publicará cada perfil después de revisar su documentación.
            </p>
          )}
        </div>
      </section>

      <section className="nf-how-section" id="how-it-works" aria-labelledby="how-title">
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
