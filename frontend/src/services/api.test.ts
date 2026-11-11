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

  it('muestra el mensaje del filtro del backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ codigo: 'NO_AUTENTICADO', mensaje: 'Correo o contraseña incorrectos.' }, 401),
      ),
    );

    await expect(api.get('/auth/me')).rejects.toThrow('Correo o contraseña incorrectos.');
  });

  it('incluye los detalles de validación junto al mensaje', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          { codigo: 'DATOS_INVALIDOS', mensaje: 'Parámetros inválidos', detalles: ['email debe ser un email'] },
          400,
        ),
      ),
    );

    await expect(api.post('/auth/login', {})).rejects.toThrow(
      'Parámetros inválidos: email debe ser un email',
    );
  });

  it('respeta el formato message por defecto de Nest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'Bad Request', statusCode: 400 }, 400)),
    );

    await expect(api.get('/auth/me')).rejects.toThrow('Bad Request');
  });

  it('concatena los campos cuando message viene como arreglo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: ['campo requerido', 'formato inválido'] }, 400)),
    );

    await expect(api.get('/auth/me')).rejects.toThrow('campo requerido, formato inválido');
  });

  it('lanza ApiError con status 0 cuando fetch falla por red', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    const failure = await api.get('/auth/me').catch((reason: unknown) => reason);
    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).status).toBe(0);
    expect((failure as ApiError).message).toContain('Revisá tu conexión');
  });

  it('despacha nautiflow:unauthorized con el path ante un 401 de un endpoint protegido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 401 })),
    );
    const events: CustomEvent<{ path?: string }>[] = [];
    const listener = (event: Event) => events.push(event as CustomEvent<{ path?: string }>);
    window.addEventListener('nautiflow:unauthorized', listener);

    await api.get('/owners/me/profile').catch(() => undefined);

    window.removeEventListener('nautiflow:unauthorized', listener);
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ path: '/owners/me/profile' });
  });

  it('no despacha el evento ante un 401 de login, registro o logout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 401 })),
    );
    const listener = vi.fn();
    window.addEventListener('nautiflow:unauthorized', listener);

    await api.post('/auth/login', { email: 'a@b.com' }).catch(() => undefined);

    window.removeEventListener('nautiflow:unauthorized', listener);
    expect(listener).not.toHaveBeenCalled();
  });
});
