import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { ZonasService } from './zonas.service.js';

const zonaBase = {
  id: 'uuid-zona',
  nombre: 'Delta del Tigre',
  descripcion: 'Canales del delta',
  activa: true,
  createdAt: new Date('2026-10-23T00:00:00Z'),
  updatedAt: new Date('2026-10-23T00:00:00Z'),
};

function createService(prismaMock: object) {
  return new ZonasService(prismaMock as unknown as PrismaService);
}

describe('ZonasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista solo zonas activas por defecto', async () => {
    const findMany = vi.fn().mockResolvedValue([zonaBase]);
    const service = createService({ zona: { findMany } });

    const result = await service.listar();

    expect(result).toEqual([zonaBase]);
    expect(findMany).toHaveBeenCalledWith({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
    });
  });

  it('lanza 404 cuando la zona no existe', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const service = createService({ zona: { findUnique } });

    await expect(service.buscarPorId('id-inexistente')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('crea una zona nueva con activa por defecto', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue(zonaBase);
    const service = createService({ zona: { findUnique, create } });

    const result = await service.crear({ nombre: 'Delta del Tigre' });

    expect(result).toEqual(zonaBase);
    expect(create).toHaveBeenCalledWith({
      data: { nombre: 'Delta del Tigre', descripcion: undefined, activa: true },
    });
  });

  it('rechaza el alta con nombre duplicado', async () => {
    const findUnique = vi.fn().mockResolvedValue(zonaBase);
    const service = createService({ zona: { findUnique } });

    await expect(service.crear({ nombre: 'Delta del Tigre' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('desactiva una zona existente', async () => {
    const findUnique = vi.fn().mockResolvedValue(zonaBase);
    const update = vi.fn().mockResolvedValue({ ...zonaBase, activa: false });
    const service = createService({ zona: { findUnique, update } });

    const result = await service.desactivar('uuid-zona');

    expect(result.activa).toBe(false);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'uuid-zona' },
      data: { activa: false },
    });
  });
});
