import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppLayout } from './AppLayout';
import * as useAuthModule from '../auth/useAuth';
import type { AuthUser } from '../auth/auth.types';

vi.mock('../auth/useAuth');

const mockLogout = vi.fn();

const adminUser: AuthUser = {
  id: 'admin-1',
  name: 'Administración NautiFlow',
  email: 'admin@nautiflow.test',
  role: 'ADMIN',
  ownerStatus: null,
};

const ownerUser: AuthUser = {
  id: 'owner-1',
  name: 'Capitán Delta',
  email: 'owner@nautiflow.test',
  role: 'OWNER',
  ownerStatus: 'APPROVED',
};

function mockAuth(user: AuthUser | null) {
  vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
    user,
    loading: false,
    login: vi.fn(),
    logout: mockLogout,
    registerOwner: vi.fn(),
  });
}

function renderAppLayout(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<div>Landing Content</div>} />
          <Route path="login" element={<div>Login Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout - Navbar con sesión de Administrador', () => {
  it('oculta "Panel", "Solicitudes" y "Viajes" de la barra principal cuando es ADMIN', () => {
    mockAuth(adminUser);

    renderAppLayout('/');

    const mainNav = screen.getByRole('navigation', { name: /navegación principal/i });

    // Botones de navegación principal
    expect(within(mainNav).queryByRole('link', { name: /^panel$/i })).not.toBeInTheDocument();
    expect(within(mainNav).queryByRole('link', { name: /^solicitudes$/i })).not.toBeInTheDocument();
    expect(within(mainNav).queryByRole('link', { name: /^viajes$/i })).not.toBeInTheDocument();

    // Enlaces públicos que sí deben estar en la barra principal
    expect(within(mainNav).getByRole('link', { name: /explorar viajes/i })).toBeInTheDocument();
    expect(within(mainNav).getByRole('link', { name: /cómo funciona/i })).toBeInTheDocument();
  });

  it('no muestra el botón independiente "Salir" ni el span plano, sino el botón desplegable de administración', async () => {
    mockAuth(adminUser);

    renderAppLayout('/');

    // No debe haber un botón "Salir" suelto
    expect(screen.queryByRole('button', { name: /^salir$/i })).not.toBeInTheDocument();

    // Debe existir el botón desplegable con el nombre de administración
    const dropdownTrigger = screen.getByRole('button', { name: /menú de administración/i });
    expect(dropdownTrigger).toBeInTheDocument();
    expect(dropdownTrigger).toHaveTextContent('Administración NautiFlow');
    expect(dropdownTrigger).toHaveAttribute('aria-expanded', 'false');

    // Al inicio las opciones del menú no están visibles
    expect(screen.queryByRole('menuitem', { name: /ir al panel/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /cerrar sesión/i })).not.toBeInTheDocument();

    // Al hacer click en el botón desplegable, se abren las opciones
    await act(async () => {
      fireEvent.click(dropdownTrigger);
    });
    expect(dropdownTrigger).toHaveAttribute('aria-expanded', 'true');

    const panelOption = screen.getByRole('menuitem', { name: /ir al panel/i });
    const logoutOption = screen.getByRole('menuitem', { name: /cerrar sesión/i });
    expect(panelOption).toBeInTheDocument();
    expect(logoutOption).toBeInTheDocument();

    // Al hacer click en "Cerrar sesión", llama a logout
    await act(async () => {
      fireEvent.click(logoutOption);
    });
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('permite cerrar el menú desplegable presionando Escape o haciendo click fuera', async () => {
    mockAuth(adminUser);

    renderAppLayout('/');

    const dropdownTrigger = screen.getByRole('button', { name: /menú de administración/i });
    await act(async () => {
      fireEvent.click(dropdownTrigger);
    });
    expect(screen.getByRole('menuitem', { name: /ir al panel/i })).toBeInTheDocument();

    // Presionar Escape
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.queryByRole('menuitem', { name: /ir al panel/i })).not.toBeInTheDocument();
  });

  it('mantiene la navegación estándar para otros roles como OWNER', () => {
    mockAuth(ownerUser);

    renderAppLayout('/');

    expect(screen.getByRole('link', { name: /^panel$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^mi solicitud$/i })).toBeInTheDocument();
    expect(screen.getByText('Capitán Delta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^salir$/i })).toBeInTheDocument();
  });
});
