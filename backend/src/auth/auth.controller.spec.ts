import type { Response } from 'express';
import { AuthController } from './auth.controller.js';

describe('AuthController', () => {
  it('cierra la sesión expirando la cookie HttpOnly', () => {
    const setHeader = vi.fn();
    const response = { setHeader } as unknown as Response;
    const controller = new AuthController({} as never);

    controller.logout(response);

    expect(setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('nautiflow_session=; HttpOnly; SameSite=Lax; Path=/api/v1; Max-Age=0'),
    );
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });
});