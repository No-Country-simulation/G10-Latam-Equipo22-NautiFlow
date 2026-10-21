import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="narrow-section">
      <p className="eyebrow">404</p>
      <h1>Esta página no existe</h1>
      <Link to="/" className="link-back">
        Volver al inicio
      </Link>
    </section>
  );
}
