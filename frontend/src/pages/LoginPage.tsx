import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { roleDashboard } from '../auth/role-routes';
import { ApiError } from '../services/api';
import { AuthFrame } from '../auth/AuthFrame';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <p className="session-loading" role="status">Verificando sesión...</p>;
  if (user) return <Navigate to={roleDashboard(user.role)} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const signedInUser = await login(email, password);
      const destination = (location.state as { from?: string } | null)?.from;
      navigate(destination?.startsWith(`/${signedInUser.role.toLowerCase()}/`)
        ? destination
        : roleDashboard(signedInUser.role), { replace: true });
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        setError('El correo o la contraseña no coinciden.');
      } else {
        setError('No pudimos conectar con NautiFlow. Revisá tu conexión e intentá nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame title="Un mismo rumbo, una comunidad confiable." description="Ingresá para continuar con NautiFlow.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <p className="auth-kicker">NautiFlow · Delta del Tigre</p>
        <h2>Iniciar sesión</h2>
        <p className="auth-form-description">Usá el correo asociado a tu cuenta.</p>
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="password">Contraseña</label>
        <div className="password-field">
          <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="button" className="password-toggle" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Ingresar'} <span aria-hidden="true">›</span>
        </button>
        <p className="auth-links">¿Querés sumar tu embarcación? <Link to="/registro/lanchero">Registrate como lanchero</Link></p>
        <p className="auth-links">¿Vas a viajar? <Link to="/registro/cliente">Crear cuenta de cliente</Link></p>
      </form>
    </AuthFrame>
  );
}
