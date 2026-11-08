import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  Eye,
  MapPin,
  ShieldCheck,
  Ship,
  Star,
  Users,
} from 'lucide-react';
import { api } from '../services/api';

const boatImages = ['/boat1.jpg', '/boat2.jpg', '/boat3.jpg'];

interface PublicBoat {
  id: string;
  nombre: string;
  capacidad: number;
  zonas: Array<{ zona: { id: string; nombre: string } }>;
  rating: { average: number | null; total: number };
}

interface PublicBoatPage {
  data: PublicBoat[];
}

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
      className={`button${outline ? ' button-ghost' : ''}`}
      to={to}
      onClick={() => {
        if (sectionId) {
          scrollToSection(sectionId);
        }
      }}
    >
      {children}
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
    <article className="audience-card">
      <span className="audience-icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <ActionLink to={to} outline={outline}>{children}</ActionLink>
    </article>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: string;
}) {
  return (
    <section className="hero-section">
      <span className="feature-icon" aria-hidden="true">
        {icon}
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}

function BoatCard({ boat, index }: { boat: PublicBoat; index: number }) {
  return (
    <article className="fleet-card">
      <img src={boatImages[index % boatImages.length]} alt={`Embarcación ${boat.nombre}`} loading="lazy" />
      <div className="fleet-card-content">
        <span className="fleet-tag">Verificada</span>
        <h3>{boat.nombre}</h3>
        <p><Users size={14} aria-hidden="true" /> Capacidad: {boat.capacidad} personas</p>
        <p><MapPin size={14} aria-hidden="true" /> Zona: {boat.zonas.map(({ zona }) => zona.nombre).join(', ') || 'Consultar'}</p>
        <p><Star size={14} aria-hidden="true" /> {boat.rating.average === null ? 'Sin reseñas' : `${boat.rating.average.toFixed(1)} (${boat.rating.total} reseñas)`}</p>
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
    <article className="how-path">
      <span className="how-path-icon" aria-hidden="true">{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <ol>
        {steps.map((step, index) => (
          <li key={step}><span>{index + 1}</span>{step}</li>
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

  useEffect(() => {
    api.get<PublicBoatPage>('/public/boats?limit=4')
      .then((page) => setBoats(page.data))
      .catch(() => setBoatsError(true))
      .finally(() => setLoadingBoats(false));
  }, []);

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.slice(1);
      requestAnimationFrame(() => scrollToSection(targetId));
    }
  }, [location.hash]);

  return (
    <div className="landing-page">
      <section className="landing-hero" id="top" aria-labelledby="landing-title">
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="eyebrow">Red fluvial del Delta del Tigre</p>
            <h1 id="landing-title">Más confianza para moverse por el Delta.<br /></h1>
            <p className="landing-intro">Conectamos operaciones fluviales con embarcaciones verificadas, documentación revisada y reputación transparente.</p>
            <div className="audience-grid" aria-label="Elegí cómo participar en NautiFlow">
              <AudienceCard icon={<Compass size={23} />} title="Para viajeros" description="Explorá opciones y encontrá una lancha para tu recorrido." to="/#network">
                Quiero viajar
              </AudienceCard>
              <AudienceCard icon={<Ship size={23} />} title="Para lancheros" description="Registrá tu embarcación y conectá con nuevos pasajeros." to="/registro/lanchero" outline>
                Quiero ofrecer mi lancha
              </AudienceCard>
            </div>
            <p className="hero-disclaimer">Las asignaciones son gestionadas manualmente por NautiFlow. No realizamos reservas públicas.</p>
          </div>
          <div className="landing-hero-visual">
            <img className="hero-photo" src="/hero.jpg" alt="Embarcaciones y muelle en el Delta del Tigre" />
          </div>
        </div>
      </section>

      <section className="trust-section" aria-labelledby="trust-title">
        <div className="landing-section-inner">
          <p className="eyebrow">¿Por qué elegir NautiFlow?</p>
          <h2 id="trust-title">Una red para recorrer y trabajar en el Delta</h2>
          <div className="feature-grid">
            <Feature icon={<ShieldCheck size={23} />} title="Embarcaciones verificadas">La agencia revisa la documentación antes de habilitar cada lancha.</Feature>
            <Feature icon={<Eye size={23} />} title="Coordinación transparente">Comunicación clara entre pasajeros, lancheros y administración.</Feature>
            <Feature icon={<Star size={23} />} title="Reputación confiable">Valoraciones asociadas a viajes completados.</Feature>
          </div>
        </div>
      </section>

      <section className="fleet-section" id="network" aria-labelledby="fleet-title">
        <div className="landing-section-inner">
          <div className="section-heading">
            <div><p className="eyebrow">Nuestra red</p><h2 id="fleet-title">Embaraciones destacadas</h2></div>
            <Link to="/#network" className="text-action">Ver más embarcaciones <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          {loadingBoats ? (
            <p className="fleet-empty" role="status">Cargando embarcaciones verificadas...</p>
          ) : boatsError ? (
            <p className="fleet-empty" role="status">No pudimos cargar las embarcaciones. Volvé a intentarlo más tarde.</p>
          ) : boats.length ? (
            <div className="fleet-gallery">
              {boats.map((boat, index) => <BoatCard key={boat.id} boat={boat} index={index} />)}
            </div>
          ) : (
            <p className="fleet-empty">Todavía no hay embarcaciones verificadas para mostrar. La agencia publicará cada perfil después de revisar su documentación.</p>
          )}
        </div>
      </section>

      <section className="how-section" id="how-it-works" aria-labelledby="how-title">
        <div className="landing-section-inner">
          <div className="how-heading"><p className="eyebrow">Paso a paso</p><h2 id="how-title">Cómo funciona</h2></div>
          <div className="how-paths">
            <HowPath icon={<Compass size={24} />} title="Si querés viajar" description="Explorá, coordiná y disfrutá la experiencia del Delta." steps={['Explorar opciones', 'Coordinar con el lanchero', 'Disfrutar el viaje']} />
            <HowPath icon={<Ship size={24} />} title="Si tenés una lancha" description="Sumá tu embarcación y conectá con nuevos pasajeros." steps={['Registrarte en la plataforma', 'Verificar documentación', 'Empezar a operar']} />
          </div>
        </div>
      </section>
    </div>
  );
}
