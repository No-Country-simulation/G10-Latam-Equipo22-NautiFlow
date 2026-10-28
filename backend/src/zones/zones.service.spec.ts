import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { ZonesService } from './zones.service.js';

const zonaBase = {
  id: 'uuid-zona',
  nombre: 'Delta del Tigre',
  descripcion: 'Canales del delta',
  activa: true,
  createdAt: new Date('2026-10-23T00:00:00Z'),
  updatedAt: new Date('2026-10-23T00:00:00Z'),
};

function createService(prismaMock: object) {
  return new ZonesService(prismaMock as unknown as PrismaService);
}

describe('ZonesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista las zonas activas con los campos públicos', async () => {
    const findMany = vi.fn().mockResolvedValue([zonaBase]);
    const service = createService({ zona: { findMany } });

    const result = await service.listActive();

    expect(result).toEqual([zonaBase]);
    expect(findMany).toHaveBeenCalledWith({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, descripcion: true },
    });
  });

  it('lista todas las zonas para el administrador', async () => {
    const findMany = vi.fn().mockResolvedValue([zonaBase, { ...zonaBase, id: 'uuid-zona-2', activa: false }]);
    const service = createService({ zona: { findMany } });

    const result = await service.listAll();

    expect(result).toHaveLength(2);
    expect(findMany).toHaveBeenCalledWith({ orderBy: { nombre: 'asc' } });
  });

  it('lanza 404 cuando la zona no existe', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const service = createService({ zona: { findUnique } });

    await expect(service.getById('id-inexistente')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('crea una zona nueva con activa por defecto', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue(zonaBase);
    const service = createService({ zona: { findUnique, create } });

    const result = await service.create({ nombre: 'Delta del Tigre' });

    expect(result).toEqual(zonaBase);
    expect(create).toHaveBeenCalledWith({
      data: { nombre: 'Delta del Tigre', descripcion: undefined, activa: true },
    });
  });

  it('rechaza el alta con nombre duplicado', async () => {
    const findUnique = vi.fn().mockResolvedValue(zonaBase);
    const service = createService({ zona: { findUnique } });

    await expect(service.create({ nombre: 'Delta del Tigre' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('actualiza los campos de la zona', async () => {
    const findUnique = vi.fn().mockResolvedValue(zonaBase);
    const update = vi.fn().mockResolvedValue({ ...zonaBase, descripcion: 'Nueva descripción' });
    const service = createService({ zona: { findUnique, update } });

    const result = await service.update('uuid-zona', { descripcion: 'Nueva descripción' });

    expect(result.descripcion).toBe('Nueva descripción');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'uuid-zona' },
      data: { descripcion: 'Nueva descripción' },
    });
  });

  it('rechaza un nombre duplicado al actualizar', async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce(zonaBase)
      .mockResolvedValueOnce(zonaBase);
    const service = createService({ zona: { findUnique } });

    await expect(service.update('uuid-zona', { nombre: 'Escobar' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('desactiva una zona existente', async () => {
    const findUnique = vi.fn().mockResolvedValue(zonaBase);
    const update = vi.fn().mockResolvedValue({ ...zonaBase, activa: false });
    const service = createService({ zona: { findUnique, update } });

    const result = await service.deactivate('uuid-zona');

    expect(result.activa).toBe(false);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'uuid-zona' },
      data: { activa: false },
    });
  });
});
