import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <section className="hero-section">
      <p className="eyebrow">Transporte privado en el Delta del Tigre</p>
      <h1>Lanchas verificadas, viajes coordinados.</h1>
      <p className="lead">
        NautiFlow centraliza la flota, la documentación y la reputación de los lancheros para que
        la agencia opere con información confiable.
      </p>
      <div className="hero-actions">
        <Link to="/registro/lanchero" className="button">
          Incorporarme como lanchero
        </Link>
        <Link to="/estado" className="button button-ghost">
          Ver estado del sistema
        </Link>
      </div>

      <div className="feature-grid">
        <article className="card">
          <h2>Verificación manual</h2>
          <p>Documentación revisada por la agencia antes de habilitar cada embarcación.</p>
        </article>
        <article className="card">
          <h2>Asignación cuidada</h2>
          <p>El administrador busca y asigna la lancha adecuada según capacidad y zona.</p>
        </article>
        <article className="card">
          <h2>Reputación real</h2>
          <p>Reseñas asociadas a viajes completados, sin cuentas ni registros para el turista.</p>
        </article>
      </div>
    </section>
  );
}
