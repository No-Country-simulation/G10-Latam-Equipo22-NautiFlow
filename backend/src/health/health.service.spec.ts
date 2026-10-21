import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

function createService(queryRaw: () => Promise<unknown>) {
  const prisma = { $queryRaw: vi.fn(queryRaw) } as unknown as PrismaService;
  return new HealthService(prisma);
}

describe('HealthService', () => {
  it('reporta ok cuando la base responde', async () => {
    const result = await createService(async () => [{ '?column?': 1 }]).check();

    expect(result.status).toBe('ok');
    expect(result.db).toBe('up');
  });

  it('reporta degraded cuando la base falla', async () => {
    const result = await createService(async () => {
      throw new Error('sin conexión');
    }).check();

    expect(result.status).toBe('degraded');
    expect(result.db).toBe('down');
  });
});
