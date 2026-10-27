import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

function contextFor(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('Auth guards', () => {
  it('rechaza una ruta protegida sin una sesión válida', async () => {
    const guard = new JwtAuthGuard({ authenticateToken: vi.fn().mockResolvedValue(null) } as never);
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toThrow();
  });

  it('permite al rol autorizado y deniega los demás', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([Role.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(contextFor({ user: { role: Role.ADMIN } }))).toBe(true);
    expect(() => guard.canActivate(contextFor({ user: { role: Role.OWNER } }))).toThrow(
      ForbiddenException,
    );
  });
});