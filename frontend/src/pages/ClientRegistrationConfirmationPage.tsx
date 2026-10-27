import { Link } from 'react-router-dom';
import { AuthFrame } from '../auth/AuthFrame';

export function ClientRegistrationConfirmationPage() {
  return (
    <AuthFrame title="Una comunidad, un mismo rumbo." description="Tu perfil ya fue recibido.">
      <section className="auth-form confirmation-copy">
        <p className="auth-kicker">Cuenta creada</p>
        <h2>Gracias por acercarte a NautiFlow.</h2>
        <p className="auth-form-description">Si los datos permiten procesarla, tu cuenta quedará lista para iniciar sesión. La agencia seguirá coordinando cada viaje de forma personal; las reseñas llegan mediante un enlace seguro al completar un servicio.</p>
        <Link className="button auth-submit" to="/login">Ir a iniciar sesión <span aria-hidden="true">›</span></Link>
      </section>
    </AuthFrame>
  );
}