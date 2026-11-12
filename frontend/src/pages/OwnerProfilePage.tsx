import { useEffect, useState } from 'react';
import { FileCheck2, Upload } from 'lucide-react';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';

interface SolicitudData {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  phone: string | null;
  whatsappPhone: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  embarcaciones: Array<{ id: string; nombre: string; matricula: string; estado: string }>;
  documents: Array<{
    id: string;
    type: string;
    status: string;
    filename: string;
    reviewNote: string | null;
    createdAt: string;
  }>;
}

const requestStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente de revisión',
  APPROVED: 'Aprobada',
  REJECTED: 'Requiere correcciones',
};

const docTypeLabels: Record<string, string> = {
  LICENSE: 'Licencia de navegación',
  INSURANCE: 'Seguro',
  BACKGROUND_CHECK: 'Antecedentes penales',
  PHOTO: 'Foto de la embarcación',
};

const docStatusLabels: Record<string, string> = {
  PENDING: 'En revisión',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

export function OwnerProfilePage() {
  const [data, setData] = useState<SolicitudData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [license, setLicense] = useState<File | null>(null);
  const [insurance, setInsurance] = useState<File | null>(null);
  const [backgroundCheck, setBackgroundCheck] = useState<File | null>(null);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<SolicitudData>('/owners/me/solicitud');
      setData(res);
      setName(res.user.name);
      setPhone(res.phone ?? '');
      setWhatsappPhone(res.whatsappPhone ?? '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar tu perfil.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch<SolicitudData>('/owners/me', {
        name: name.trim(),
        phone: phone.trim(),
        whatsappPhone: whatsappPhone.trim() || null,
      });
      setData(res);
      setName(res.user.name);
      setPhone(res.phone ?? '');
      setWhatsappPhone(res.whatsappPhone ?? '');
      setSuccess('Datos actualizados. Recargá la página si querés ver el nombre nuevo en el menú.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron guardar los datos.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!license && !insurance && !backgroundCheck && !photos?.length) {
      setError('Elegí al menos un archivo para reenviar.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      if (license) fd.append('license', license);
      if (insurance) fd.append('insurance', insurance);
      if (backgroundCheck) fd.append('backgroundCheck', backgroundCheck);
      if (photos) Array.from(photos).forEach((photo) => fd.append('photos', photo));
      await api.postForm('/owners/me/documents', fd);
      setLicense(null);
      setInsurance(null);
      setBackgroundCheck(null);
      setPhotos(null);
      setSuccess('Documentación reenviada. La agencia la revisará a la brevedad.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar la documentación.');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-loading-state">
        <WavyLoader label="Cargando tu perfil…" />
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">MI CUENTA</span>
          <h1>Perfil y documentación</h1>
          <p className="admin-subtitle">
            Datos de contacto, estado de tu solicitud y reenvío de documentos.
          </p>
        </div>
        {data && (
          <span className={`status-mark status-${data.status.toLowerCase()}`}>
            {requestStatusLabels[data.status]}
          </span>
        )}
      </header>

      {error && <div className="nf-alert nf-alert-error" role="alert">{error}</div>}
      {success && <div className="nf-alert" role="status">{success}</div>}

      {!data ? (
        <div className="admin-empty-card">
          <FileCheck2 size={44} className="empty-icon" />
          <h3>Sin ficha de lanchero</h3>
          <p>No encontramos tu ficha. Completá el registro para operar en la red.</p>
        </div>
      ) : (
        <div className="nf-bottom-panels">
          <section className="nf-panel" aria-labelledby="profile-title">
            <div className="nf-panel-header">
              <div>
                <h2 id="profile-title">Datos de contacto</h2>
                <span className="nf-panel-desc">{data.user.email}</span>
              </div>
            </div>
            <form onSubmit={(e) => void handleProfileSubmit(e)} className="nf-modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="profile-name" className="field-label">Nombre</label>
                  <input
                    id="profile-name"
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-phone" className="field-label">Teléfono</label>
                  <input
                    id="profile-phone"
                    required
                    minLength={8}
                    maxLength={30}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+5491155550000"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-whatsapp" className="field-label">WhatsApp (opcional)</label>
                  <input
                    id="profile-whatsapp"
                    maxLength={30}
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+5491155550001"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <button type="submit" className="button" disabled={savingProfile}>
                  {savingProfile ? 'Guardando…' : 'Guardar datos'}
                </button>
              </div>
            </form>
          </section>

          <section className="nf-panel" aria-labelledby="docs-title">
            <div className="nf-panel-header">
              <div>
                <h2 id="docs-title">Documentación</h2>
                <span className="nf-panel-desc">
                  {data.documents.length} archivo{data.documents.length === 1 ? '' : 's'} en la ficha
                  {data.reviewNote ? ` · Observación: ${data.reviewNote}` : ''}
                </span>
              </div>
            </div>

            <div className="recent-activity-list">
              {data.documents.length === 0 ? (
                <p className="empty-activity-text">Todavía no cargaste documentos.</p>
              ) : (
                data.documents.map((doc) => (
                  <div key={doc.id} className="recent-event-item">
                    <div className="event-bullet" />
                    <div className="event-content">
                      <div className="event-title-row">
                        <strong className="event-title">{docTypeLabels[doc.type] ?? doc.type}</strong>
                        <span className={`status-pill status-${doc.status.toLowerCase()}`}>
                          {docStatusLabels[doc.status] ?? doc.status}
                        </span>
                      </div>
                      <p className="event-desc">
                        {doc.filename}
                        {doc.reviewNote ? ` · ${doc.reviewNote}` : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={(e) => void handleUploadSubmit(e)} style={{ marginTop: '1rem' }}>
              <p className="field-label">Reenviar documentos (rechazados o actualizados)</p>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="doc-license" className="field-label">Licencia</label>
                  <input
                    id="doc-license"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setLicense(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="doc-insurance" className="field-label">Seguro</label>
                  <input
                    id="doc-insurance"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setInsurance(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="doc-background" className="field-label">Antecedentes</label>
                  <input
                    id="doc-background"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setBackgroundCheck(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="doc-photos" className="field-label">Fotos (hasta 5)</label>
                  <input
                    id="doc-photos"
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    multiple
                    onChange={(e) => setPhotos(e.target.files)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <button type="submit" className="button" disabled={uploading}>
                  <Upload size={15} aria-hidden="true" />
                  {uploading ? 'Enviando…' : 'Reenviar documentos'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
