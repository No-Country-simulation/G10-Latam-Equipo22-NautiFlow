import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import { PaginationBar } from '../components/PaginationBar';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api } from '../services/api';
import type { PageMeta, Paginated } from '../types/api';

interface BoatInfo {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
  estado: string;
  zonas: Array<{ zona: { id: string; nombre: string } }>;
}

interface DocumentInfo {
  id: string;
  type: 'LICENSE' | 'INSURANCE' | 'BACKGROUND_CHECK' | 'PHOTO' | string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  filename: string;
  mimeType?: string;
  size?: number;
  reviewNote?: string | null;
  createdAt: string;
}

interface RequestRecord {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  reviewNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; status: string };
  embarcaciones: BoatInfo[];
  documents: DocumentInfo[];
}

const docTypeLabels: Record<string, string> = {
  LICENSE: 'Licencia náutica',
  INSURANCE: 'Póliza de seguro',
  BACKGROUND_CHECK: 'Certificado de antecedentes',
  PHOTO: 'Foto de embarcación',
};

const REQUIRED_DOC_TYPES = ['LICENSE', 'INSURANCE', 'BACKGROUND_CHECK'];

export function AdminVerificationPage() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / active review state
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [finalDecisionNote, setFinalDecisionNote] = useState('');

  async function reload() {
    setLoading(true);
    setActionError('');
    try {
      const statusParam = statusFilter ? `&status=${statusFilter}` : '';
      const data = await api.get<Paginated<RequestRecord>>(
        `/admin/solicitudes?page=${page}&limit=12${statusParam}`
      );
      setRequests(data.data);
      setMeta(data.meta);

      if (selectedRequest) {
        const updated = data.data.find((item) => item.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
      }
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : 'No se pudieron cargar las solicitudes.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [page, statusFilter]);

  async function handleReviewDocument(docId: string, decision: 'APPROVED' | 'REJECTED') {
    const note = reviewNotes[docId]?.trim() || (decision === 'APPROVED' ? 'Documento aprobado y válido.' : 'Documento rechazado.');
    setBusyId(docId);
    setActionError('');
    try {
      await api.patch(`/admin/documents/${docId}/review`, { decision, note });
      setSuccessMsg(`Documento ${decision === 'APPROVED' ? 'aprobado' : 'rechazado'} correctamente.`);
      await reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Error al calificar documento.');
    } finally {
      setBusyId('');
    }
  }

  async function handleFinalDecision(requestId: string, decision: 'aprobar' | 'rechazar') {
    const note = finalDecisionNote.trim() || (decision === 'aprobar' ? 'Solicitud y embarcación aprobadas para operar en NautiFlow.' : 'Solicitud rechazada. Por favor regularice la documentación.');
    setBusyId(requestId);
    setActionError('');
    try {
      await api.patch(`/admin/solicitudes/${requestId}/${decision}`, {
        decision: decision === 'aprobar' ? 'APPROVED' : 'REJECTED',
        note,
      });
      setSuccessMsg(
        decision === 'aprobar'
          ? '¡Solicitud aprobada con éxito! La lancha ya figura activa y verificada.'
          : 'Solicitud rechazada correctamente.'
      );
      setFinalDecisionNote('');
      setSelectedRequest(null);
      await reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo completar la operación.');
    } finally {
      setBusyId('');
    }
  }

  const filteredRequests = requests.filter((req) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const userName = req.user.name.toLowerCase();
    const userEmail = req.user.email.toLowerCase();
    const boatName = req.embarcaciones[0]?.nombre.toLowerCase() ?? '';
    const boatMat = req.embarcaciones[0]?.matricula.toLowerCase() ?? '';
    return userName.includes(term) || userEmail.includes(term) || boatName.includes(term) || boatMat.includes(term);
  });

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">CONTROL Y GESTIÓN DE SEGURIDAD</span>
          <h1>Verificación de Lancheros</h1>
          <p className="admin-subtitle">
            Revisión manual de documentación obligatoria (Licencia, Seguro y Antecedentes) para habilitar lanchas en el Delta.
          </p>
        </div>
        <button
          type="button"
          className="button button-ghost"
          onClick={() => void reload()}
          disabled={loading}
        >
          Actualizar
        </button>
      </header>

      {actionError && (
        <div className="nf-alert nf-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {successMsg && (
        <div className="nf-alert nf-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Barra de filtros y búsqueda */}
      <div className="admin-filters-bar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab${statusFilter === 'PENDING' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
          >
            Pendientes de revisión
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === 'APPROVED' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
          >
            Verificados / Aprobados
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === 'REJECTED' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
          >
            Rechazados
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === '' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >
            Todos
          </button>
        </div>

        <div className="search-input-wrap">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por lanchero, email o lancha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <WavyLoader label="Cargando solicitudes para verificación…" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="admin-empty-card">
          <ShieldCheck size={44} className="empty-icon" />
          <h3>No hay solicitudes para mostrar</h3>
          <p>
            {statusFilter === 'PENDING'
              ? 'No hay solicitudes de lancheros pendientes de revisión en este momento.'
              : 'No se encontraron resultados con los filtros actuales.'}
          </p>
        </div>
      ) : (
        <div className="verification-grid">
          {filteredRequests.map((req) => {
            const boat = req.embarcaciones[0];
            const approvedCount = req.documents.filter(
              (doc) => doc.status === 'APPROVED' && REQUIRED_DOC_TYPES.includes(doc.type)
            ).length;

            return (
              <article key={req.id} className="verification-card">
                <div className="verification-card-header">
                  <div className="owner-avatar-block">
                    <div className="avatar-circle">
                      <User size={20} />
                    </div>
                    <div>
                      <strong className="owner-title-name">{req.user.name}</strong>
                      <span className="owner-email-text">{req.user.email}</span>
                    </div>
                  </div>

                  <span
                    className={`status-pill status-${req.status.toLowerCase()}`}
                  >
                    {req.status === 'PENDING'
                      ? 'Pendiente de revisión'
                      : req.status === 'APPROVED'
                      ? 'Verificado'
                      : 'Rechazado'}
                  </span>
                </div>

                <div className="verification-card-body">
                  {boat ? (
                    <div className="boat-summary-box">
                      <div className="boat-summary-header">
                        <strong>🚤 {boat.nombre}</strong>
                        <span className="boat-plate">{boat.matricula}</span>
                      </div>
                      <div className="boat-meta-row">
                        <span>Capacidad: <strong>{boat.capacidad} pasajeros</strong></span>
                        <span>
                          Zonas:{' '}
                          <strong>
                            {boat.zonas?.map((z) => z.zona.nombre).join(', ') || 'Sin zona'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="no-boat-warn">Sin embarcación registrada.</p>
                  )}

                  <div className="docs-checklist">
                    <span className="docs-checklist-title">
                      Documentación ({approvedCount} de {REQUIRED_DOC_TYPES.length} obligatorios aprobados):
                    </span>
                    <ul className="docs-list">
                      {REQUIRED_DOC_TYPES.map((type) => {
                        const doc = req.documents.find((d) => d.type === type);
                        const isApproved = doc?.status === 'APPROVED';
                        const isRejected = doc?.status === 'REJECTED';

                        return (
                          <li key={type} className="doc-check-item">
                            <div className="doc-check-info">
                              {isApproved ? (
                                <CheckCircle2 size={16} className="text-success" />
                              ) : isRejected ? (
                                <XCircle size={16} className="text-danger" />
                              ) : (
                                <Clock size={16} className="text-warning" />
                              )}
                              <span>{docTypeLabels[type]}</span>
                            </div>

                            {doc ? (
                              <div className="doc-action-links">
                                <a
                                  href={`${import.meta.env.VITE_API_URL}/documents/${doc.id}/file`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="doc-link-btn"
                                  title="Ver archivo original"
                                >
                                  <Eye size={14} /> Ver
                                </a>
                                <span
                                  className={`doc-badge doc-badge-${doc.status.toLowerCase()}`}
                                >
                                  {doc.status === 'APPROVED'
                                    ? 'Aprobado'
                                    : doc.status === 'REJECTED'
                                    ? 'Rechazado'
                                    : 'Pendiente'}
                                </span>
                              </div>
                            ) : (
                              <span className="doc-badge doc-badge-missing">No adjuntado</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {req.reviewNote && (
                    <div className="admin-note-preview">
                      <strong>Nota de revisión:</strong> {req.reviewNote}
                    </div>
                  )}
                </div>

                <div className="verification-card-footer">
                  <button
                    type="button"
                    className="button button-ghost btn-view-full"
                    onClick={() => {
                      setSelectedRequest(req);
                      setFinalDecisionNote(req.reviewNote || '');
                    }}
                  >
                    <FileText size={15} />
                    {req.status === 'PENDING' ? 'Revisar documentación' : 'Ver detalle'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PaginationBar meta={meta} onChange={setPage} label={(v) => `${v.total} solicitudes`} />

      {/* Modal / Drawer de revisión detallada */}
      {selectedRequest && (
        <div className="nf-modal-backdrop" onClick={() => setSelectedRequest(null)}>
          <div className="nf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-header">
              <div>
                <span className="admin-kicker">DETALLE DE SOLICITUD</span>
                <h2>{selectedRequest.user.name}</h2>
                <span className="nf-modal-subtitle">
                  {selectedRequest.user.email} · Registrado:{' '}
                  {new Date(selectedRequest.createdAt).toLocaleDateString('es-AR')}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedRequest(null)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <div className="nf-modal-content">
              {/* Información de embarcación */}
              {selectedRequest.embarcaciones[0] && (
                <div className="modal-section-card">
                  <h3>🚤 Información de la Embarcación</h3>
                  <div className="modal-data-grid">
                    <div>
                      <span className="data-label">Nombre</span>
                      <strong>{selectedRequest.embarcaciones[0].nombre}</strong>
                    </div>
                    <div>
                      <span className="data-label">Matrícula</span>
                      <strong>{selectedRequest.embarcaciones[0].matricula}</strong>
                    </div>
                    <div>
                      <span className="data-label">Capacidad de Pasajeros</span>
                      <strong>{selectedRequest.embarcaciones[0].capacidad} personas</strong>
                    </div>
                    <div>
                      <span className="data-label">Zonas de Cobertura</span>
                      <strong>
                        {selectedRequest.embarcaciones[0].zonas?.map((z) => z.zona.nombre).join(', ') || 'No asignada'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Revisión individual de cada documento */}
              <div className="modal-section-card">
                <h3>📄 Revisión Documental</h3>
                <p className="modal-hint">
                  Verificá que cada archivo sea auténtico y legible antes de dar la aprobación final.
                </p>

                <div className="modal-docs-list">
                  {selectedRequest.documents.map((doc) => (
                    <div key={doc.id} className="doc-review-card">
                      <div className="doc-review-top">
                        <div>
                          <strong>{docTypeLabels[doc.type] ?? doc.type}</strong>
                          <span className="doc-filename">
                            {doc.filename} {doc.size ? `· ${(doc.size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </span>
                        </div>

                        <div className="doc-top-actions">
                          <a
                            href={`${import.meta.env.VITE_API_URL}/documents/${doc.id}/file`}
                            target="_blank"
                            rel="noreferrer"
                            className="button button-ghost btn-sm"
                          >
                            <ExternalLink size={14} /> Abrir / Descargar
                          </a>
                          <span className={`doc-badge doc-badge-${doc.status.toLowerCase()}`}>
                            {doc.status === 'APPROVED'
                              ? 'Aprobado'
                              : doc.status === 'REJECTED'
                              ? 'Rechazado'
                              : 'Pendiente'}
                          </span>
                        </div>
                      </div>

                      {doc.status === 'PENDING' && (
                        <div className="doc-review-form">
                          <input
                            type="text"
                            placeholder="Nota opcional de revisión para este documento..."
                            value={reviewNotes[doc.id] ?? ''}
                            onChange={(e) =>
                              setReviewNotes({ ...reviewNotes, [doc.id]: e.target.value })
                            }
                            className="doc-note-input"
                          />
                          <div className="doc-btn-group">
                            <button
                              type="button"
                              className="button btn-sm"
                              disabled={busyId === doc.id}
                              onClick={() => void handleReviewDocument(doc.id, 'APPROVED')}
                            >
                              {busyId === doc.id ? 'Guardando...' : 'Aprobar documento'}
                            </button>
                            <button
                              type="button"
                              className="button button-danger btn-sm"
                              disabled={busyId === doc.id}
                              onClick={() => void handleReviewDocument(doc.id, 'REJECTED')}
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      )}

                      {doc.reviewNote && (
                        <div className="doc-saved-note">
                          <strong>Observación:</strong> {doc.reviewNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Decisión Final del Perfil */}
              {selectedRequest.status === 'PENDING' && (
                <div className="modal-section-card final-decision-card">
                  <h3>Resolución de la Solicitud</h3>
                  <p className="modal-hint">
                    Para aprobar al lanchero, los tres documentos obligatorios (Licencia, Seguro y Antecedentes) deben estar aprobados.
                  </p>

                  <label className="final-note-label">
                    <span>Nota general de resolución (visible para el lanchero):</span>
                    <textarea
                      rows={3}
                      value={finalDecisionNote}
                      onChange={(e) => setFinalDecisionNote(e.target.value)}
                      placeholder="Indique las razones de aprobación o los motivos del rechazo para que pueda subsanarlos..."
                    />
                  </label>

                  <div className="modal-footer-actions">
                    <button
                      type="button"
                      className="button"
                      disabled={
                        busyId === selectedRequest.id ||
                        selectedRequest.documents.filter(
                          (d) => d.status === 'APPROVED' && REQUIRED_DOC_TYPES.includes(d.type)
                        ).length !== REQUIRED_DOC_TYPES.length
                      }
                      onClick={() => void handleFinalDecision(selectedRequest.id, 'aprobar')}
                      title={
                        selectedRequest.documents.filter(
                          (d) => d.status === 'APPROVED' && REQUIRED_DOC_TYPES.includes(d.type)
                        ).length !== REQUIRED_DOC_TYPES.length
                          ? 'Debe aprobar primero Licencia, Seguro y Antecedentes.'
                          : 'Aprobar lanchero y su embarcación'
                      }
                    >
                      {busyId === selectedRequest.id ? 'Guardando...' : '✓ Aprobar perfil y habilitar lancha'}
                    </button>

                    <button
                      type="button"
                      className="button button-danger"
                      disabled={busyId === selectedRequest.id}
                      onClick={() => void handleFinalDecision(selectedRequest.id, 'rechazar')}
                    >
                      ✕ Rechazar solicitud
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
