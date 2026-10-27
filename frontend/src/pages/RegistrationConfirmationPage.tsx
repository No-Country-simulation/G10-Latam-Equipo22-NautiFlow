import { Link } from 'react-router-dom';
import { AuthFrame } from '../auth/AuthFrame';

export function RegistrationConfirmationPage() {
  return (
    <AuthFrame title="Sumá tu embarcación a una red confiable." description="La aprobación de cada solicitud es manual.">
      <section className="auth-form confirmation-copy">
        <p className="auth-kicker">Solicitud recibida</p>
        <h2>Gracias por acercarte a NautiFlow.</h2>
        <p className="auth-form-description">Si los datos permiten procesarla, la agencia revisará tu perfil, la embarcación y la documentación. La lancha no estará disponible para asignaciones hasta su aprobación.</p>
        <p className="auth-form-description">Si ya tenés una cuenta, iniciá sesión para consultar su estado.</p>
        <Link className="button auth-submit" to="/login">Ir a iniciar sesión <span aria-hidden="true">›</span></Link>
      </section>
    </AuthFrame>
  );
}