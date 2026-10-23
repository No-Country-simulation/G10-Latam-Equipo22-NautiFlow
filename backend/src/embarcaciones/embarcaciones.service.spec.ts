import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmbarcacionesService } from './embarcaciones.service.js';

const propietarioId = 'uuid-duenio';
const embarcacionBase = {
  id: 'uuid-embarcacion',
  propietarioId,
  nombre: 'Lancha Delta 1',
  matricula: 'ABC-123',
  capacidad: 8,
  descripcion: null,
  estado: 'PENDIENTE',
  createdAt: new Date('2026-10-23T00:00:00Z'),
  updatedAt: new Date('2026-10-23T00:00:00Z'),
  zonas: [],
};

function errorPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError('error de base', {
    code,
    clientVersion: '7.10.1',
  });
}

function createService(prismaMock: object) {
  return new EmbarcacionesService(prismaMock as unknown as PrismaService);
}

function prismaConMocks({
  findMany,
  findFirst,
  create,
  update,
  zonaFindMany,
}: {
  findMany?: ReturnType<typeof vi.fn>;
  findFirst?: ReturnType<typeof vi.fn>;
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  zonaFindMany?: ReturnType<typeof vi.fn>;
}) {
  return {
    embarcacion: {
      findMany: findMany ?? vi.fn(),
      findFirst: findFirst ?? vi.fn(),
      create: create ?? vi.fn(),
      update: update ?? vi.fn(),
    },
    zona: { findMany: zonaFindMany ?? vi.fn().mockResolvedValue([]) },
  };
}

describe('EmbarcacionesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buscarPropia', () => {
    it('devuelve la embarcación del propietario', async () => {
      const findFirst = vi.fn().mockResolvedValue(embarcacionBase);
      const service = createService(prismaConMocks({ findFirst }));

      const result = await service.buscarPropia('uuid-embarcacion', propietarioId);

      expect(result).toEqual(embarcacionBase);
      expect(findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-embarcacion', propietarioId },
      });
    });

    it('lanza 404 si no pertenece al propietario', async () => {
      const findFirst = vi.fn().mockResolvedValue(null);
      const service = createService(prismaConMocks({ findFirst }));

      await expect(service.buscarPropia('id-ajena', propietarioId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('crear', () => {
    it('crea la embarcación sin zonas cuando no se indican', async () => {
      const create = vi.fn().mockResolvedValue(embarcacionBase);
      const service = createService(prismaConMocks({ create }));

      const result = await service.crear(propietarioId, {
        nombre: 'Lancha Delta 1',
        matricula: 'ABC-123',
        capacidad: 8,
      });

      expect(result).toEqual(embarcacionBase);
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            propietarioId,
            nombre: 'Lancha Delta 1',
            matricula: 'ABC-123',
            capacidad: 8,
          }),
        }),
      );
    });

    it('rechaza matrícula duplicada con 409', async () => {
      const create = vi.fn().mockRejectedValue(errorPrisma('P2002'));
      const service = createService(prismaConMocks({ create }));

      await expect(
        service.crear(propietarioId, { nombre: 'X', matricula: 'ABC-123', capacidad: 4 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('valida que las zonas existan y estén activas', async () => {
      const zonaFindMany = vi.fn().mockResolvedValue([]);
      const service = createService(prismaConMocks({ zonaFindMany }));

      await expect(
        service.crear(propietarioId, {
          nombre: 'X',
          matricula: 'XYZ-9',
          capacidad: 4,
          zonaIds: ['zona-inactiva'],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(zonaFindMany).toHaveBeenCalledWith({
        where: { id: { in: ['zona-inactiva'] }, activa: true },
        select: { id: true },
      });
    });

    it('conecta las zonas activas indicadas', async () => {
      const zonaFindMany = vi.fn().mockResolvedValue([{ id: 'zona-1' }]);
      const create = vi.fn().mockResolvedValue(embarcacionBase);
      const service = createService(prismaConMocks({ create, zonaFindMany }));

      await service.crear(propietarioId, {
        nombre: 'X',
        matricula: 'XYZ-9',
        capacidad: 4,
        zonaIds: ['zona-1'],
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            zonas: { create: [{ zona: { connect: { id: 'zona-1' } } }] },
          }),
        }),
      );
    });
  });

  describe('actualizar', () => {
    it('actualiza campos de la embarcación propia', async () => {
      const findFirst = vi.fn().mockResolvedValue(embarcacionBase);
      const update = vi.fn().mockResolvedValue({ ...embarcacionBase, nombre: 'Nuevo nombre' });
      const service = createService(prismaConMocks({ findFirst, update }));

      const result = await service.actualizar('uuid-embarcacion', propietarioId, {
        nombre: 'Nuevo nombre',
      });

      expect(result.nombre).toBe('Nuevo nombre');
      expect(findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-embarcacion', propietarioId },
      });
    });

    it('lanza 404 si se intenta editar una embarcación ajena', async () => {
      const findFirst = vi.fn().mockResolvedValue(null);
      const service = createService(prismaConMocks({ findFirst }));

      await expect(
        service.actualizar('id-ajena', propietarioId, { nombre: 'Hack' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('reemplaza la cobertura cuando se envían zonas', async () => {
      const findFirst = vi.fn().mockResolvedValue(embarcacionBase);
      const update = vi.fn().mockResolvedValue(embarcacionBase);
      const zonaFindMany = vi.fn().mockResolvedValue([{ id: 'zona-2' }]);
      const service = createService(prismaConMocks({ findFirst, update, zonaFindMany }));

      await service.actualizar('uuid-embarcacion', propietarioId, { zonaIds: ['zona-2'] });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            zonas: {
              deleteMany: {},
              create: [{ zona: { connect: { id: 'zona-2' } } }],
            },
          }),
        }),
      );
    });
  });

  describe('listarPorPropietario', () => {
    it('lista embarcaciones del propietario con cobertura', async () => {
      const findMany = vi.fn().mockResolvedValue([embarcacionBase]);
      const service = createService(prismaConMocks({ findMany }));

      const result = await service.listarPorPropietario(propietarioId);

      expect(result).toEqual([embarcacionBase]);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { propietarioId } }),
      );
    });
  });
});
