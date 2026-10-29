import { HttpException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitGuard } from './rate-limit.guard.js';

function contextFor(ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ ip }) }),
  } as unknown as ExecutionContext;
}

function guardWith(max: number | undefined, windowSeconds: number | undefined): RateLimitGuard {
  const values: Record<string, number | undefined> = {
    AUTH_RATE_LIMIT_MAX: max,
    AUTH_RATE_LIMIT_WINDOW_SECONDS: windowSeconds,
  };
  const config = { get: (key: string) => values[key] } as unknown as ConfigService;
  return new RateLimitGuard(config);
}

describe('RateLimitGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('permite hasta el máximo de intentos', () => {
    const guard = guardWith(3, 60);

    expect(guard.canActivate(contextFor('10.0.0.1'))).toBe(true);
    expect(guard.canActivate(contextFor('10.0.0.1'))).toBe(true);
    expect(guard.canActivate(contextFor('10.0.0.1'))).toBe(true);
  });

  it('bloquea con 429 al superar el máximo', () => {
    const guard = guardWith(2, 60);
    guard.canActivate(contextFor('10.0.0.1'));
    guard.canActivate(contextFor('10.0.0.1'));

    expect(() => guard.canActivate(contextFor('10.0.0.1'))).toThrow(HttpException);

    try {
      guard.canActivate(contextFor('10.0.0.1'));
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(429);
      expect((error as HttpException).message).toContain('Demasiadas solicitudes');
    }
  });

  it('vuelve a permitir al expirar la ventana', () => {
    const guard = guardWith(1, 60);
    guard.canActivate(contextFor('10.0.0.1'));

    expect(() => guard.canActivate(contextFor('10.0.0.1'))).toThrow(HttpException);

    vi.setSystemTime(new Date('2026-01-01T00:01:01Z'));

    expect(guard.canActivate(contextFor('10.0.0.1'))).toBe(true);
  });

  it('cuenta cada IP por separado', () => {
    const guard = guardWith(1, 60);
    guard.canActivate(contextFor('10.0.0.1'));

    expect(guard.canActivate(contextFor('10.0.0.2'))).toBe(true);
    expect(() => guard.canActivate(contextFor('10.0.0.1'))).toThrow(HttpException);
  });

  it('usa valores por defecto si falta configuración', () => {
    const guard = guardWith(undefined, undefined);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(guard.canActivate(contextFor('10.0.0.1'))).toBe(true);
    }

    expect(() => guard.canActivate(contextFor('10.0.0.1'))).toThrow(HttpException);
  });
});
