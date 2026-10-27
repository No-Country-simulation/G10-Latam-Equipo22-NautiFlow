import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth/AuthContext';
import { OwnerRegistrationPage } from './OwnerRegistrationPage';

const zone = { id: '93e8c11a-7ac0-4bdb-97f0-778ff90b1af3', nombre: 'Delta del Tigre', descripcion: null };
describe('OwnerRegistrationPage', () => {
  it('envía los datos y documentos al backend y muestra confirmación', async () => {
    let submittedBody: FormData | undefined;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/me')) return new Response('', { status: 401 });
      if (url.endsWith('/zones')) return new Response(JSON.stringify([zone]), { status: 200 });
      if (url.endsWith('/auth/register/lanchero')) {
        submittedBody = init?.body as FormData;
        return new Response(JSON.stringify({ message: 'Solicitud recibida.' }), { status: 201 });
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const user = userEvent.setup();
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/registro/lanchero']}>
            <Routes>
              <Route path="/registro/lanchero" element={<OwnerRegistrationPage />} />
              <Route path="/registro/confirmacion" element={<p>La agencia revisará tu solicitud</p>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>,
      );

      fireEvent.change(await screen.findByLabelText('Nombre completo'), { target: { value: 'Ana Navegante' } });
      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
      fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '+541112345678' } });
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'long-secure-password' } });
      fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'long-secure-password' } });
      fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

      fireEvent.change(screen.getByLabelText('Nombre de la embarcación'), { target: { value: 'Luna' } });
      fireEvent.change(screen.getByLabelText('Matrícula'), { target: { value: 'AB-123' } });
      fireEvent.change(screen.getByLabelText('Capacidad máxima'), { target: { value: '8' } });
      fireEvent.click(await screen.findByLabelText('Delta del Tigre'));
      fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

      const pdf = new window.File([new Uint8Array([37, 80, 68, 70, 45])], 'document.pdf', { type: 'application/pdf' });
      for (const label of ['Licencia', 'Seguro', 'Antecedentes penales']) {
        const input = screen.getByLabelText(label) as HTMLInputElement;
        await user.upload(input, pdf);
        expect(input.files?.[0]?.size).toBe(pdf.size);
      }
      fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
      fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form')!);

      expect(await screen.findByText('La agencia revisará tu solicitud')).toBeInTheDocument();
      await waitFor(() => expect(submittedBody?.get('zonaIds')).toBe(JSON.stringify([zone.id])));
      expect(submittedBody?.get('license')).toBeInstanceOf(File);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register/lanchero'),
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});