import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './api';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe('api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('arma la URL con la base configurada y devuelve el JSON', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get<{ ok: boolean }>('/health')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/health',
      expect.objectContaining({ credentials: 'include' }),
    );
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(options.headers).get('Content-Type')).toBeNull();
  });

  it('envía el cuerpo como JSON en POST', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({ created: true }, 201));
    vi.stubGlobal('fetch', fetchMock);

    await api.post('/auth/login', { email: 'a@b.com' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/login',
      expect.objectContaining({ method: 'POST', body: '{"email":"a@b.com"}' }),
    );
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(options.headers).get('Content-Type')).toBe('application/json');
  });

  it('envía FormData sin forzar el Content-Type multipart', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({ created: true }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const formData = new FormData();
    formData.append('name', 'Ana');

    await api.postForm('/auth/register/lanchero', formData);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/register/lanchero',
      expect.objectContaining({ method: 'POST', body: formData, credentials: 'include' }),
    );
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(options.headers).get('Content-Type')).toBeNull();
  });

  it('lanza ApiError cuando la respuesta no es exitosa', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('credenciales inválidas', { status: 401 })),
    );

    await expect(api.get('/auth/me')).rejects.toBeInstanceOf(ApiError);
  });
});
