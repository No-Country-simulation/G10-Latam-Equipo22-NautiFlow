import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthFrame } from '../auth/AuthFrame';
import { roleDashboard } from '../auth/role-routes';
import { useAuth } from '../auth/useAuth';
import { ApiError } from '../services/api';

export function ClientRegistrationPage() {
  const { user, loading, registerClient } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <p className="session-loading" role="status">Verificando sesión...</p>;
  if (user) return <Navigate to={roleDashboard(user.role)} replace />;

  function update(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (values.password.length < 10) {
      setError('La contraseña debe tener al menos 10 caracteres.');
      return;
    }
    if (values.password !== values.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      await registerClient({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      navigate('/registro/cliente/confirmacion', { replace: true });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'No se pudo crear la cuenta. Revisá tu conexión.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame title="Prepará tu próximo viaje por el Delta." description="Creá tu perfil para recibir la información de tus servicios.">
      <form className="auth-form" onSubmit={submit}>
        <p className="auth-kicker">NautiFlow · Cuenta de cliente</p>
        <h2>Crear cuenta</h2>
        <p className="auth-form-description">La agencia continúa coordinando los viajes. No se crean reservas públicas desde esta cuenta.</p>
        <div className="auth-fields-grid">
          <label>Nombre<input name="firstName" value={values.firstName} onChange={update} required minLength={2} maxLength={80} autoComplete="given-name" placeholder="Ej. Ana" /></label>
          <label>Apellido<input name="lastName" value={values.lastName} onChange={update} required minLength={2} maxLength={100} autoComplete="family-name" placeholder="Ej. Pérez" /></label>
          <label className="field-span">Correo electrónico<input name="email" type="email" value={values.email} onChange={update} required maxLength={254} autoComplete="email" placeholder="nombre@correo.com" /></label>
          <label className="field-span">Teléfono<input name="phone" type="tel" value={values.phone} onChange={update} required minLength={8} maxLength={30} autoComplete="tel" placeholder="+54 11 0000 0000" /></label>
          <label>Contraseña<input name="password" type={showPassword ? 'text' : 'password'} value={values.password} onChange={update} required minLength={10} maxLength={128} autoComplete="new-password" /></label>
          <label>Confirmar contraseña<input name="confirmPassword" type="password" value={values.confirmPassword} onChange={update} required minLength={10} maxLength={128} autoComplete="new-password" /></label>
        </div>
        <button className="password-toggle auth-password-toggle" type="button" aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</button>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button auth-submit" type="submit" disabled={submitting}>{submitting ? 'Creando cuenta...' : 'Crear cuenta'} <span aria-hidden="true">›</span></button>
        <p className="auth-links">¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link></p>
        <p className="auth-links">¿Sos lanchero? <Link to="/registro/lanchero">Solicitá incorporarte a la flota</Link></p>
      </form>
    </AuthFrame>
  );
}