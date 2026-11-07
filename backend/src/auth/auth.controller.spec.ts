import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';

describe('AuthController', () => {
  it('cierra la sesión expirando la cookie HttpOnly en modo desarrollo', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    try {
      const setHeader = vi.fn();
      const response = { setHeader } as unknown as Response;
      const controller = new AuthController({} as never);

      controller.logout(response);

      expect(setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('nautiflow_session=; HttpOnly; SameSite=Lax; Path=/api/v1; Max-Age=0'),
      );
      expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('usa SameSite=None y Secure para cookies cross-site en producción', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const setHeader = vi.fn();
      const response = { setHeader } as unknown as Response;
      const controller = new AuthController({} as never);

      controller.logout(response);

      expect(setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('nautiflow_session=; HttpOnly; SameSite=None; Path=/api/v1; Max-Age=0; Secure'),
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});