import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import type { AuthUser } from './auth.types';

const owner: AuthUser = {
  id: 'owner-id',
  name: 'Ana Navegante',
  email: 'ana@example.com',
  role: 'OWNER',
  ownerStatus: 'PENDING',
};

const admin: AuthUser = {
  ...owner,
  id: 'admin-id',
  name: 'Administración',
  role: 'ADMIN',
  ownerStatus: null,
};

function renderRoutes(initialEntry: string, fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/owner/dashboard" element={
            <ProtectedRoute role="OWNER"><p>Panel de lanchero</p></ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="ADMIN"><p>Panel de administración</p></ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function SessionStatus() {
  const { user, logout } = useAuth();
  return (
    <div>
      <p>{user?.name ?? 'Sesión cerrada'}</p>
      <button type="button" onClick={() => void logout()}>Cerrar sesión</button>
    </div>
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('redirige al login a quien no tiene una sesión', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 401 }));
    renderRoutes('/owner/dashboard', fetchMock);
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByText('Panel de lanchero')).not.toBeInTheDocument();
  });

  it('hace una sola comprobación de sesión bajo StrictMode', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    render(
      <StrictMode>
        <AuthProvider>
          <MemoryRouter>
            <SessionStatus />
          </MemoryRouter>
        </AuthProvider>
      </StrictMode>,
    );

    expect(await screen.findByText('Sesión cerrada')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('redirige a un usuario al dashboard de su rol y bloquea el de otro rol', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ user: admin }), { status: 200 }));
    renderRoutes('/owner/dashboard', fetchMock);
    expect(await screen.findByText('Panel de administración')).toBeInTheDocument();
    expect(screen.queryByText('Panel de lanchero')).not.toBeInTheDocument();
  });

  it('inicia sesión con el backend y navega al dashboard correspondiente', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/me')) return new Response('', { status: 401 });
      return new Response(JSON.stringify({ user: owner }), { status: 200 });
    });
    renderRoutes('/login', fetchMock);

    fireEvent.change(await screen.findByLabelText('Correo electrónico'), {
      target: { value: owner.email },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'correct-horse-battery' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Panel de lanchero')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    ));
  });

  it('cierra la sesión mediante el endpoint real y limpia el usuario', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/me')) {
        return new Response(JSON.stringify({ user: owner }), { status: 200 });
      }
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <AuthProvider>
        <MemoryRouter>
          <SessionStatus />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(await screen.findByText(owner.name)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByText('Sesión cerrada')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });
});