import { useHealth } from '../hooks/useHealth';

const statusLabel = { ok: 'Operativo', degraded: 'Con problemas' } as const;
const dbLabel = { up: 'Conectada', down: 'Sin conexión' } as const;

export function StatusPage() {
  const { loading, data, error, reload } = useHealth();

  return (
    <section className="narrow-section">
      <h1>Estado del sistema</h1>
      <p className="lead">Chequeo en vivo de la API y su conexión con PostgreSQL.</p>

      <div className="card status-card" aria-live="polite">
        {loading && <p>Consultando…</p>}

        {!loading && error && (
          <>
            <p className="badge badge-error">Sin respuesta</p>
            <p>{error}</p>
            <p className="hint">
              Verificá que el backend y la base estén arriba: <code>docker compose up -d</code>
            </p>
          </>
        )}

        {!loading && data && (
          <dl className="status-list">
            <div>
              <dt>API</dt>
              <dd>
                <span className={`badge ${data.status === 'ok' ? 'badge-ok' : 'badge-error'}`}>
                  {statusLabel[data.status]}
                </span>
              </dd>
            </div>
            <div>
              <dt>Base de datos</dt>
              <dd>
                <span className={`badge ${data.db === 'up' ? 'badge-ok' : 'badge-error'}`}>
                  {dbLabel[data.db]}
                </span>
              </dd>
            </div>
            <div>
              <dt>Latencia</dt>
              <dd>{data.latencyMs} ms</dd>
            </div>
            <div>
              <dt>Encendida hace</dt>
              <dd>{Math.floor(data.uptime / 60)} min</dd>
            </div>
          </dl>
        )}

        <button type="button" className="button button-ghost" onClick={() => void reload()}>
          Actualizar
        </button>
      </div>
    </section>
  );
}
