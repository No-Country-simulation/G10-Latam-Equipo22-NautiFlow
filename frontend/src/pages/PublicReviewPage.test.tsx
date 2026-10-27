import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PublicReviewPage } from './PublicReviewPage';

describe('PublicReviewPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('envía una reseña sin crear una cuenta', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('/public/reviews/valid-token')) {
        if (fetchMock.mock.calls.length === 1) {
          return new Response(JSON.stringify({
            trip: { origin: 'Tigre', destination: 'San Fernando', scheduledAt: '2026-10-27T12:00:00.000Z', boatName: 'Luna' },
          }), { status: 200 });
        }
        return new Response(JSON.stringify({ id: 'review-id', rating: 5 }), { status: 201 });
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <MemoryRouter initialEntries={['/reviews/valid-token']}>
        <Routes><Route path="/reviews/:token" element={<PublicReviewPage />} /></Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: '¿Cómo estuvo tu viaje?' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Calificación'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Comentario, opcional'), { target: { value: 'Muy buen servicio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar reseña' }));

    expect(await screen.findByText('Gracias por compartir tu experiencia.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/public/reviews/valid-token'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});