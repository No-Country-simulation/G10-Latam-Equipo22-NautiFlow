import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface OwnerRequest {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  createdAt: string;
  embarcaciones: Array<{ id: string; nombre: string; matricula: string; capacidad: number; estado: string; zonas: Array<{ zona: { id: string; nombre: string } }> }>;
  documents: Array<{ id: string; type: string; status: string; filename: string; reviewNote: string | null; createdAt: string }>;
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente de revisión',
  APPROVED: 'Aprobada',
  REJECTED: 'Requiere correcciones',
};

const documentLabels: Record<string, string> = {
  LICENSE: 'Licencia',
  INSURANCE: 'Seguro',
  BACKGROUND_CHECK: 'Antecedentes penales',
  PHOTO: 'Foto',
};

export function OwnerRequestPage() {
  const [request, setRequest] = useState<OwnerRequest | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<OwnerRequest>('/owners/me/solicitud')
      .then(setRequest)
      .catch(() => setError('No se pudo cargar el estado de la solicitud.'));
  }, []);

  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!request) return <p className="session-loading" role="status">Cargando solicitud...</p>;

  return (
    <section className="request-page">
      <p className="eyebrow">Incorporación a la flota</p>
      <div className="dashboard-heading">
        <div><h1>Estado de mi solicitud</h1><p className="lead">Enviada el {new Date(request.createdAt).toLocaleDateString('es-AR')}</p></div>
        <span className={`status-mark status-${request.status.toLowerCase()}`}>{statusLabels[request.status]}</span>
      </div>
      {request.reviewNote && <p className="review-note">Observación de la agencia: {request.reviewNote}</p>}
      {request.embarcaciones.map((boat) => (
        <article className="request-boat" key={boat.id}>
          <h2>{boat.nombre}</h2>
          <p>Matrícula {boat.matricula} · Capacidad {boat.capacidad} pasajeros</p>
          <p>Zonas: {boat.zonas.map(({ zona }) => zona.nombre).join(', ')}</p>
          <span className={`status-mark status-${boat.estado.toLowerCase()}`}>{boat.estado}</span>
        </article>
      ))}
      <section className="request-documents">
        <h2>Documentación</h2>
        {request.documents.map((document) => (
          <div className="document-row" key={document.id}>
            <span>{documentLabels[document.type] ?? document.type}: {document.filename}</span>
            <span>{statusLabels[document.status] ?? document.status}</span>
            {document.reviewNote && <p>{document.reviewNote}</p>}
          </div>
        ))}
      </section>
    </section>
  );
}