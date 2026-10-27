import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { roleDashboard } from '../auth/role-routes';
import { ApiError, api } from '../services/api';
import { AuthFrame, ownerRegistrationSteps } from '../auth/AuthFrame';

interface Zone {
  id: string;
  nombre: string;
  descripcion: string | null;
}

const documentFields = [
  ['license', 'Licencia'],
  ['insurance', 'Seguro'],
  ['backgroundCheck', 'Antecedentes penales'],
] as const;

const acceptedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const maxFileSize = 5 * 1024 * 1024;
const emptyValues = {
  name: '', email: '', phone: '', whatsappPhone: '', password: '', passwordConfirmation: '',
  boatName: '', matricula: '', capacidad: '', descripcion: '',
};

export function OwnerRegistrationPage() {
  const { user, loading: sessionLoading, registerOwner } = useAuth();
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesError, setZonesError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(emptyValues);
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [files, setFiles] = useState<Record<string, File | File[]>>({});

  useEffect(() => {
    api.get<Zone[]>('/zones')
      .then(setZones)
      .catch(() => setZonesError('No pudimos cargar las zonas. Actualizá la página para volver a intentar.'));
  }, []);

  if (sessionLoading) return <p className="session-loading" role="status">Verificando sesión...</p>;
  if (user) return <Navigate to={roleDashboard(user.role)} replace />;

  function updateValue(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setValues((current) => ({ ...current, [event.currentTarget.name]: event.currentTarget.value }));
  }

  function advance() {
    setError('');
    if (step === 0) {
      if (!values.name.trim() || !values.email.trim() || !values.phone.trim() || !values.password) {
        setError('Completá nombre, correo, teléfono y contraseña para continuar.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.phone.trim().length < 8) {
        setError('Revisá el formato del correo electrónico y del teléfono.');
        return;
      }
      if (values.password.length < 10 || values.password !== values.passwordConfirmation) {
        setError(values.password.length < 10 ? 'La contraseña debe tener al menos 10 caracteres.' : 'Las contraseñas no coinciden.');
        return;
      }
    }
    if (step === 1 && (!values.boatName.trim() || !values.matricula.trim() || !values.capacidad || zoneIds.length === 0)) {
      setError('Completá los datos de la embarcación y seleccioná al menos una zona.');
      return;
    }
    if (step === 1 && (!Number.isInteger(Number(values.capacidad)) || Number(values.capacidad) < 1 || Number(values.capacidad) > 100)) {
      setError('La capacidad debe ser un número entero entre 1 y 100.');
      return;
    }
    if (step === 2) {
      const missing = documentFields.find(([field]) => !files[field]);
      if (missing) {
        setError(`Adjuntá el documento: ${missing[1]}.`);
        return;
      }
      const invalid = documentFields.some(([field]) => {
        const file = files[field] as File;
        return !acceptedFileTypes.includes(file.type) || file.size > maxFileSize;
      });
      if (invalid) {
        setError('Los documentos deben ser PDF o imagen JPEG, PNG o WebP de hasta 5 MB.');
        return;
      }
      const photos = files.photos as File[] | undefined;
      if ((photos?.length ?? 0) > 5 || photos?.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > maxFileSize)) {
        setError('Las fotos deben ser imágenes de hasta 5 MB cada una.');
        return;
      }
    }
    setStep((current) => Math.min(current + 1, 3));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (key !== 'passwordConfirmation') formData.append(key, value);
    }
    formData.append('zonaIds', JSON.stringify(zoneIds));
    for (const [field] of documentFields) formData.append(field, files[field] as File);
    const photos = files.photos as File[] | undefined;
    photos?.forEach((photo) => formData.append('photos', photo));

    setSubmitting(true);
    try {
      await registerOwner(formData);
      navigate('/registro/confirmacion', { replace: true });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'No se pudo enviar la solicitud. Revisá tu conexión.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame title="Sumá tu embarcación a una red confiable." description="Completá el registro en pocos minutos. La aprobación nunca es automática." step={step} steps={[...ownerRegistrationSteps]}>
      <form className="auth-form owner-wizard" onSubmit={handleSubmit}>
        <p className="auth-kicker">Paso {step + 1} de 4</p>
        <h2>{ownerRegistrationSteps[step] === 'Responsable' ? 'Datos del responsable' : ownerRegistrationSteps[step]}</h2>
        {step === 0 && <div className="auth-fields-grid">
          <label>Nombre completo<input name="name" value={values.name} onChange={updateValue} required autoComplete="name" maxLength={100} placeholder="Ej. Martín Acosta" /></label>
          <label>Correo electrónico<input name="email" type="email" value={values.email} onChange={updateValue} required autoComplete="email" maxLength={254} placeholder="nombre@correo.com" /></label>
          <label>Teléfono<input name="phone" type="tel" value={values.phone} onChange={updateValue} required autoComplete="tel" minLength={8} maxLength={30} placeholder="+54 11 0000 0000" /></label>
          <label>WhatsApp, si es distinto<input name="whatsappPhone" type="tel" value={values.whatsappPhone} onChange={updateValue} maxLength={30} /></label>
          <label>Contraseña<input name="password" type="password" value={values.password} onChange={updateValue} required minLength={10} maxLength={128} autoComplete="new-password" /></label>
          <label>Confirmar contraseña<input name="passwordConfirmation" type="password" value={values.passwordConfirmation} onChange={updateValue} required minLength={10} maxLength={128} autoComplete="new-password" /></label>
        </div>}
        {step === 1 && <div className="auth-fields-grid">
          <label>Nombre de la embarcación<input name="boatName" value={values.boatName} onChange={updateValue} required minLength={2} maxLength={100} /></label>
          <label>Matrícula<input name="matricula" value={values.matricula} onChange={updateValue} required minLength={2} maxLength={40} /></label>
          <label>Capacidad máxima<input name="capacidad" type="number" value={values.capacidad} onChange={updateValue} required min={1} max={100} /></label>
          <label className="field-span">Descripción<textarea name="descripcion" value={values.descripcion} onChange={updateValue} rows={3} maxLength={2000} /></label>
          <div className="field-span"><span className="field-label">Zonas de cobertura</span>
            {zonesError ? <p className="form-error" role="alert">{zonesError}</p> : <div className="zone-options">
              {zones.map((zone) => <label className="check-option" key={zone.id}><input type="checkbox" checked={zoneIds.includes(zone.id)} onChange={(event) => setZoneIds((current) => event.target.checked ? [...current, zone.id] : current.filter((id) => id !== zone.id))} /><span>{zone.nombre}</span></label>)}
              {!zones.length && !zonesError && <p className="hint">Cargando zonas...</p>}
            </div>}
          </div>
        </div>}
        {step === 2 && <div className="auth-fields-grid">
          <p className="field-span auth-form-description">PDF o imágenes JPEG, PNG y WebP de hasta 5 MB. La documentación solo será accesible para vos y la agencia.</p>
          {documentFields.map(([field, label]) => (
            <label key={field}>
              {label}
              <input
                type="file"
                required
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) setFiles((current) => ({ ...current, [field]: selected }));
                }}
              />
              {files[field] && <span className="file-selected">{(files[field] as File).name}</span>}
            </label>
          ))}
          <label className="field-span">
            Fotos de la embarcación, opcionales
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => setFiles((current) => ({ ...current, photos: Array.from(event.target.files ?? []) }))}
            />
            {Array.isArray(files.photos) && <span className="file-selected">{files.photos.length} seleccionadas</span>}
          </label>
        </div>}
        {step === 3 && <div className="registration-review">
          <p>La agencia revisará el perfil, la embarcación y los documentos antes de habilitarte.</p>
          <dl><div><dt>Responsable</dt><dd>{values.name}</dd></div><div><dt>Embarcación</dt><dd>{values.boatName} · {values.matricula}</dd></div><div><dt>Documentación</dt><dd>{documentFields.length} documentos obligatorios adjuntos</dd></div><div><dt>Estado inicial</dt><dd>Pendiente de revisión</dd></div></dl>
        </div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="auth-form-actions">
          {step > 0 ? <button className="auth-secondary" type="button" onClick={() => { setError(''); setStep((current) => current - 1); }}>← Volver</button> : <Link className="auth-secondary" to="/login">Ya tengo cuenta</Link>}
          {step < 3 ? <button className="button auth-submit" type="button" onClick={advance} disabled={step === 1 && (!zones.length || !!zonesError)}>Continuar <span aria-hidden="true">›</span></button> : <button className="button auth-submit" type="submit" disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar solicitud'} <span aria-hidden="true">›</span></button>}
        </div>
      </form>
    </AuthFrame>
  );
}