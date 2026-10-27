import { useEffect, useState } from 'react';
import { ApiError, api } from '../services/api';

interface RequestRecord {
  id: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; status: string };
  embarcaciones: Array<{ id: string; nombre: string; matricula: string; capacidad: number; estado: string; zonas: Array<{ zona: { nombre: string } }> }>;
  documents: Array<{ id: string; type: string; status: string; filename: string; mimeType: string; size: number; reviewNote: string | null }>;
}

interface PendingDocument {
  id: string;
  ownerId: string;
  type: string;
  filename: string;
  mimeType: string;
  size: number;
  owner: { user: { name: string; email: string } };
  boat: { nombre: string; matricula: string } | null;
}

const docTypeLabels: Record<string, string> = {
  LICENSE: 'Licencia', INSURANCE: 'Seguro', BACKGROUND_CHECK: 'Antecedentes', PHOTO: 'Foto',
};

export function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function reload() {
    setError('');
    try {
      const [requestData, documentData] = await Promise.all([
        api.get<RequestRecord[]>('/admin/solicitudes?status=PENDING'),
        api.get<PendingDocument[]>('/admin/documents'),
      ]);
      setRequests(requestData);
      setDocuments(documentData);
    } catch {
      setError('No se pudieron cargar las solicitudes. Verificá tu sesión administrativa.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  async function reviewDocument(documentId: string, decision: 'APPROVED' | 'REJECTED') {
    const note = notes[documentId]?.trim();
    if (!note || busy) return;
    setBusy(documentId);
    setError('');
    try {
      await api.patch(`/admin/documents/${documentId}/review`, { decision, note });
      await reload();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'No se pudo guardar la revisión.');
    } finally {
      setBusy('');
    }
  }

  async function reviewRequest(requestId: string, decision: 'aprobar' | 'rechazar') {
    const note = notes[requestId]?.trim();
    if (!note || busy) return;
    setBusy(requestId);
    setError('');
    try {
      await api.patch(`/admin/solicitudes/${requestId}/${decision}`, { decision: decision === 'aprobar' ? 'APPROVED' : 'REJECTED', note });
      await reload();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'No se pudo guardar la decisión.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="admin-page">
      <header className="dashboard-heading">
        <div><p className="eyebrow">Administración · Flota</p><h1>Solicitudes</h1><p className="lead">Revisá los documentos antes de aprobar perfiles y embarcaciones.</p></div>
        <button className="button button-ghost" type="button" onClick={() => void reload()} disabled={loading}>Actualizar</button>
      </header>
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <p className="session-loading" role="status">Cargando solicitudes...</p> : (
        <>
          <section className="admin-section">
            <h2>Documentos pendientes <span className="count-mark">{documents.length}</span></h2>
            {!documents.length && <p className="empty-state">No hay documentos pendientes de revisión.</p>}
            <div className="admin-list">
              {documents.map((document) => (
                <article className="admin-record" key={document.id}>
                  <div className="admin-record-heading">
                    <div><strong>{docTypeLabels[document.type] ?? document.type}</strong><p>{document.owner.user.name} · {document.owner.user.email}</p><p>{document.boat?.nombre ?? 'Perfil'} · {document.filename} · {(document.size / 1024 / 1024).toFixed(1)} MB</p></div>
                    <a className="text-action" href={`${import.meta.env.VITE_API_URL}/documents/${document.id}/file`} target="_blank" rel="noreferrer">Abrir documento</a>
                  </div>
                  <form className="review-form" onSubmit={(event) => { event.preventDefault(); void reviewDocument(document.id, 'APPROVED'); }}>
                    <label>Nota de revisión<textarea required minLength={3} maxLength={1000} value={notes[document.id] ?? ''} onChange={(event) => setNotes({ ...notes, [document.id]: event.target.value })} /></label>
                    <div className="inline-actions">
                      <button className="button" type="submit" disabled={busy === document.id}>{busy === document.id ? 'Guardando...' : 'Aprobar documento'}</button>
                      <button className="button button-danger" type="button" disabled={busy === document.id || !notes[document.id]?.trim()} onClick={() => void reviewDocument(document.id, 'REJECTED')}>Rechazar</button>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-section">
            <h2>Perfiles pendientes <span className="count-mark">{requests.length}</span></h2>
            {!requests.length && <p className="empty-state">No hay perfiles pendientes.</p>}
            <div className="admin-list">
              {requests.map((request) => (
                <article className="admin-record" key={request.id}>
                  <div><strong>{request.user.name}</strong><p>{request.user.email} · recibido {new Date(request.createdAt).toLocaleDateString('es-AR')}</p></div>
                  {request.embarcaciones.map((boat) => <p key={boat.id}>{boat.nombre} · {boat.matricula} · {boat.capacidad} pasajeros · {boat.zonas.map(({ zona }) => zona.nombre).join(', ')}</p>)}
                  <p>{request.documents.filter((doc) => doc.status === 'APPROVED').length} de {request.documents.filter((doc) => doc.type !== 'PHOTO').length} documentos obligatorios aprobados</p>
                  <form className="review-form" onSubmit={(event) => { event.preventDefault(); void reviewRequest(request.id, 'aprobar'); }}>
                    <label>Nota final<textarea required minLength={3} maxLength={1000} value={notes[request.id] ?? ''} onChange={(event) => setNotes({ ...notes, [request.id]: event.target.value })} /></label>
                    <div className="inline-actions">
                      <button className="button" type="submit" disabled={busy === request.id}>{busy === request.id ? 'Guardando...' : 'Aprobar perfil y lancha'}</button>
                      <button className="button button-danger" type="button" disabled={busy === request.id || !notes[request.id]?.trim()} onClick={() => void reviewRequest(request.id, 'rechazar')}>Rechazar solicitud</button>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}