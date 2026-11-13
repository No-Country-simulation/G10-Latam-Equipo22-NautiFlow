export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Base de la API. En producción (build de la app desplegada) la API se
 * sirve en el mismo dominio vía proxy (`vercel.json`), por lo que la base
 * es relativa y la sesión funciona como cookie de primer nivel en
 * cualquier navegador. En desarrollo se usa `VITE_API_URL`.
 */
export function apiBaseUrl(): string {
  if (import.meta.env.PROD) return '/api/v1';
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    throw new Error('Falta VITE_API_URL. Copiá .env.example a .env en la raíz del repo.');
  }
  return url;
}

type CuerpoError = { mensaje?: unknown; message?: unknown; detalles?: unknown };

function textoDeError(body: CuerpoError): string | undefined {
  const principal =
    typeof body.mensaje === 'string' && body.mensaje
      ? body.mensaje
      : typeof body.message === 'string' && body.message
        ? body.message
        : undefined;
  const secundarios = Array.isArray(body.message)
    ? body.message
    : Array.isArray(body.detalles)
      ? body.detalles
      : [];
  const detalle = secundarios.filter((item): item is string => typeof item === 'string');
  if (principal && detalle.length > 0) return `${principal}: ${detalle.join(', ')}`;
  return principal ?? (detalle.length > 0 ? detalle.join(', ') : undefined);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const url = `${apiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: 'include',
      headers,
    });
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.');
  }

  if (!response.ok) {
    const detail = await response.text();
    if (
      response.status === 401 &&
      !['/auth/login', '/auth/register', '/auth/logout'].includes(path)
    ) {
      window.dispatchEvent(new CustomEvent('nautiflow:unauthorized', { detail: { path } }));
    }
    let message = detail;
    try {
      const texto = textoDeError(JSON.parse(detail) as CuerpoError);
      if (texto) message = texto;
    } catch {
      message = detail;
    }
    throw new ApiError(response.status, message || `La API respondió ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
