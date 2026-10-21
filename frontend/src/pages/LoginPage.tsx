import { Link } from 'react-router-dom';

export function LoginPage() {
  return (
    <section className="narrow-section">
      <h1>Ingreso de lancheros</h1>
      <p className="lead">
        El formulario de acceso se habilita en el Sprint 1 junto con la API de autenticación.
      </p>
      <div className="card">
        <p>
          Mientras tanto, la estructura de sesión ya está preparada: el backend expondrá
          <code> POST /api/v1/auth/login</code> y <code>GET /api/v1/auth/me</code>.
        </p>
      </div>
      <Link to="/" className="link-back">
        Volver al inicio
      </Link>
    </section>
  );
}
