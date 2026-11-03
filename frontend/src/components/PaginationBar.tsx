import type { PageMeta } from '../types/api';

interface PaginationBarProps {
  meta: PageMeta | null;
  onChange: (page: number) => void;
  label?: (meta: PageMeta) => string;
}

export function PaginationBar({ meta, onChange, label }: PaginationBarProps) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <nav className="pagination-bar" aria-label="Paginación">
      <button
        className="button button-ghost"
        type="button"
        disabled={meta.page <= 1}
        onClick={() => onChange(meta.page - 1)}
      >
        Anterior
      </button>
      <span className="page-indicator">
        Página {meta.page} de {meta.totalPages}
        {label ? ` · ${label(meta)}` : ''}
      </span>
      <button
        className="button button-ghost"
        type="button"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onChange(meta.page + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
