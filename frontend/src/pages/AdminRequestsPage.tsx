import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Search,
  User,
  XCircle,
} from 'lucide-react';
import { PaginationBar } from '../components/PaginationBar';
import { WavyLoader } from '../components/WavyLoader';
import { ApiError, api, apiBaseUrl } from '../services/api';
import type { PageMeta, Paginated } from '../types/api';

interface BoatSummary {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
  estado: string;
  zonas: Array<{ zona: { id: string; nombre: string } }>;
}

interface DocumentItem {
  id: string;
  type: string;
  status: string;
  filename: string;
  reviewNote?: string | null;
  createdAt: string;
}

interface BoatmanRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  reviewNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; status: string };
  embarcaciones: BoatSummary[];
  documents: DocumentItem[];
}

const docTypeLabels: Record<string, string> = {
  LICENSE: 'Licencia',
  INSURANCE: 'Seguro',
  BACKGROUND_CHECK: 'Antecedentes',
  PHOTO: 'Foto',
};

const REQUIRED_DOCS = ['LICENSE', 'INSURANCE', 'BACKGROUND_CHECK'];

export function AdminRequestsPage() {
  const [requests, setRequests] = useState<BoatmanRequest[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadRequests() {
    setLoading(true);
    setError('');
    try {
      const statusParam = statusFilter ? `&status=${statusFilter}` : '';
      const res = await api.get<Paginated<BoatmanRequest>>(
        `/admin/solicitudes?page=${page}&limit=12${statusParam}`
      );
      setRequests(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, [page, statusFilter]);

  const filtered = requests.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.user.name.toLowerCase().includes(term) ||
      r.user.email.toLowerCase().includes(term) ||
      (r.embarcaciones[0]?.nombre.toLowerCase() ?? '').includes(term)
    );
  });

  return (
    <div className="admin-page-container">
      <header className="admin-header-row">
        <div>
          <span className="admin-kicker">BANDEJA DE ENTRADA</span>
          <h1>Solicitudes de Lancheros</h1>
          <p className="admin-subtitle">
            Cada solicitud agrupa los datos del lanchero, su embarcación y el estado de sus documentos obligatorios.
          </p>
        </div>
        <button
          type="button"
          className="button button-ghost"
          onClick={() => void loadRequests()}
          disabled={loading}
        >
          Actualizar
        </button>
      </header>

      {error && <div className="nf-alert nf-alert-error" role="alert">{error}</div>}

      <div className="admin-filters-bar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab${statusFilter === 'PENDING' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
          >
            Pendientes
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === 'APPROVED' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
          >
            Aprobadas
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === 'REJECTED' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
          >
            Rechazadas
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === '' ? ' is-active' : ''}`}
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >
            Todas
          </button>
        </div>

        <div className="search-input-wrap">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar lanchero o embarcación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <WavyLoader label="Cargando solicitudes por lanchero…" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty-card">
          <FileCheck2 size={44} className="empty-icon" />
          <h3>No hay solicitudes para mostrar</h3>
          <p>
            {statusFilter === 'PENDING'
              ? 'No hay solicitudes pendientes en este momento.'
              : 'No se encontraron solicitudes con el filtro actual.'}
          </p>
        </div>
      ) : (
        <div className="requests-per-owner-list">
          {filtered.map((req) => {
            const boat = req.embarcaciones[0];

            return (
              <article key={req.id} className="owner-request-card">
                <div className="owner-request-header">
                  <div className="owner-profile-brief">
                    <div className="avatar-circle">
                      <User size={22} />
                    </div>
                    <div>
                      <strong className="owner-name-title">{req.user.name}</strong>
                      <span className="owner-email-sub">{req.user.email}</span>
                      <span className="owner-date-sub">
                        <Calendar size={13} /> Registrado:{' '}
                        {new Date(req.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="owner-request-status-side">
                    <span
                      className={`status-pill status-${req.status.toLowerCase()}`}
                    >
                      {req.status === 'PENDING'
                        ? 'Pendiente de revisión'
                        : req.status === 'APPROVED'
                        ? 'Aprobada'
                        : 'Rechazada'}
                    </span>
                    <Link
                      to="/admin/verificacion"
                      className="button button-ghost btn-sm"
                    >
                      Revisar en Verificación →
                    </Link>
                  </div>
                </div>

                <div className="owner-request-body">
                  {boat && (
                    <div className="owner-boat-row">
                      <span className="boat-tag">🚤 {boat.nombre} ({boat.matricula})</span>
                      <span className="boat-meta-tag">Capacidad: {boat.capacidad} pasajeros</span>
                      <span className="boat-meta-tag">
                        Zonas: {boat.zonas?.map((z) => z.zona.nombre).join(', ') || 'Delta del Tigre'}
                      </span>
                    </div>
                  )}

                  {/* Documentos agrupados del lanchero */}
                  <div className="owner-docs-grid">
                    {REQUIRED_DOCS.map((docType) => {
                      const doc = req.documents.find((d) => d.type === docType);
                      const isApproved = doc?.status === 'APPROVED';
                      const isRejected = doc?.status === 'REJECTED';

                      return (
                        <div key={docType} className="owner-doc-card">
                          <div className="owner-doc-title">
                            {isApproved ? (
                              <CheckCircle2 size={16} className="text-success" />
                            ) : isRejected ? (
                              <XCircle size={16} className="text-danger" />
                            ) : (
                              <Clock size={16} className="text-warning" />
                            )}
                            <strong>{docTypeLabels[docType]}</strong>
                          </div>

                          {doc ? (
                            <div className="owner-doc-meta">
                              <span className="owner-doc-file">{doc.filename}</span>
                              <div className="owner-doc-actions">
                                <a
                                  href={`${apiBaseUrl()}/documents/${doc.id}/file`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="doc-link-btn"
                                >
                                  <Eye size={13} /> Ver archivo
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
                          ) : (
                            <span className="doc-badge doc-badge-missing">No cargado</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {req.reviewNote && (
                    <div className="admin-note-preview">
                      <strong>Nota de revisión:</strong> {req.reviewNote}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PaginationBar meta={meta} onChange={setPage} label={(v) => `${v.total} solicitudes`} />
    </div>
  );
}
