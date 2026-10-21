import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatusPage } from './StatusPage';

describe('StatusPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('muestra el estado de la API y la base', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              status: 'ok',
              db: 'up',
              uptime: 120,
              latencyMs: 5,
              timestamp: new Date().toISOString(),
            }),
            { status: 200 },
          ),
      ),
    );

    render(
      <MemoryRouter>
        <StatusPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Operativo')).toBeInTheDocument();
    expect(screen.getByText('Conectada')).toBeInTheDocument();
  });
});
