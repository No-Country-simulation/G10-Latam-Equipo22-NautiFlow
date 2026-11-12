import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import type { AuthUser } from './auth.types';

const owner: AuthUser = {
  id: 'owner-id',
  name: 'Ana Navegante',
  email: 'ana@example.com',
  role: 'OWNER',
  ownerStatus: 'APPROVED',
};

function SessionStatus() {
  const { user, login } = useAuth();
  return (
    <div>
      <p>{user?.name ?? 'Sesión cerrada'}</p>
      <button type="button" onClick={() => void login(owner.email, 'correct-horse')}>Ingresar</button>
    </div>
  );
}

describe('AuthContext resiliencia de sesión', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('ignora un /auth/me tardío que resuelve 401 después de un login posterior', async () => {
    let resolveMe: (value: Response) => void = () => undefined;
    const pendingMe = new Promise<Response>((resolve) => {
      resolveMe = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/auth/me')) return pendingMe;
        if (url.endsWith('/auth/login')) {
          return new Response(JSON.stringify({ user: owner }), { status: 200 });
        }
        return new Response(null, { status: 204 });
      }),
    );

    render(
      <AuthProvider>
        <MemoryRouter>
          <SessionStatus />
        </MemoryRouter>
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText(owner.name)).toBeInTheDocument();

    await act(async () => {
      resolveMe(new Response('', { status: 401 }));
    });

    expect(screen.getByText(owner.name)).toBeInTheDocument();
  });

  it('ignora eventos 401 de /auth/me y cierra sesión ante 401 de otros endpoints', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/auth/me')) {
          return new Response(JSON.stringify({ user: owner }), { status: 200 });
        }
        return new Response(null, { status: 204 });
      }),
    );

    render(
      <AuthProvider>
        <MemoryRouter>
          <SessionStatus />
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(await screen.findByText(owner.name)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent('nautiflow:unauthorized', { detail: { path: '/auth/me' } }));
    });
    expect(screen.getByText(owner.name)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent('nautiflow:unauthorized', { detail: { path: '/owners/me/profile' } }));
    });
    expect(await screen.findByText('Sesión cerrada')).toBeInTheDocument();
  });

  it('muestra el reintento ante un fallo de red y restaura la sesión al reintentar', async () => {
    let attempts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/auth/me')) {
          attempts += 1;
          if (attempts === 1) throw new TypeError('Failed to fetch');
          return new Response(JSON.stringify({ user: owner }), { status: 200 });
        }
        return new Response(null, { status: 204 });
      }),
    );

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/owner/dashboard']}>
          <Routes>
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute role="OWNER">
                  <p>Panel de lanchero</p>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'No pudimos verificar tu sesión' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Panel de lanchero')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Panel de lanchero')).toBeInTheDocument();
  });
});
