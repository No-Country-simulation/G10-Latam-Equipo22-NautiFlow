import { useAuth } from './useAuth';

export function SessionRetry() {
  const { refreshSession } = useAuth();
  return (
    <div className="session-retry" role="alert">
      <h1>No pudimos verificar tu sesión</h1>
      <p>Puede ser un problema de conexión con el servidor.</p>
      <button type="button" className="button" onClick={() => void refreshSession()}>
        Reintentar
      </button>
    </div>
  );
}
