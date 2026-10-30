import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EmptyLegStatus, TripStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmptyLegsService } from './empty-legs.service.js';

const departure = new Date('2026-11-01T12:00:00.000Z');
const returnAt = '2026-11-01T18:00:00.000Z';

function createService(prismaMock: object) {
  return new EmptyLegsService(prismaMock as unknown as PrismaService);
}

function tripBase(overrides: object = {}) {
  return {
    id: 'uuid-viaje',
    status: TripStatus.ASSIGNED,
    origin: 'Tigre',
    destination: 'Delta del Tigre',
    scheduledAt: departure,
    embarcacionId: 'uuid-lancha',
    ...overrides,
  };
}

function prismaMock({
  trip = tripBase(),
  active = null,
  created = { id: 'uuid-tramo' },
  rows = [],
  total = 0,
}: {
  trip?: object | null;
  active?: object | null;
  created?: object;
  rows?: object[];
  total?: number;
} = {}) {
  return {
    trip: { findUnique: vi.fn().mockResolvedValue(trip) },
    emptyLeg: {
      findFirst: vi.fn().mockResolvedValue(active),
      create: vi.fn().mockResolvedValue(created),
      findMany: vi.fn().mockResolvedValue(rows),
      count: vi.fn().mockResolvedValue(total),
    },
  };
}

describe('EmptyLegsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('invierte el recorrido y toma la embarcación del viaje', async () => {
      const prisma = prismaMock();
      const service = createService(prisma);

      await service.create({ tripId: 'uuid-viaje', scheduledAt: returnAt });

      expect(prisma.emptyLeg.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tripId: 'uuid-viaje',
            embarcacionId: 'uuid-lancha',
            origin: 'Delta del Tigre',
            destination: 'Tigre',
            scheduledAt: new Date(returnAt),
            status: EmptyLegStatus.AVAILABLE,
          }),
        }),
      );
    });

    it('rechaza un viaje inexistente', async () => {
      const service = createService(prismaMock({ trip: null }));

      await expect(
        service.create({ tripId: 'uuid-viaje', scheduledAt: returnAt }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rechaza un viaje sin embarcación asignada', async () => {
      const service = createService(prismaMock({ trip: tripBase({ embarcacionId: null }) }));

      await expect(
        service.create({ tripId: 'uuid-viaje', scheduledAt: returnAt }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza viajes que no están asignados ni confirmados', async () => {
      const service = createService(
        prismaMock({ trip: tripBase({ status: TripStatus.COMPLETED }) }),
      );

      await expect(
        service.create({ tripId: 'uuid-viaje', scheduledAt: returnAt }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza un regreso anterior a la salida', async () => {
      const service = createService(prismaMock());

      await expect(
        service.create({ tripId: 'uuid-viaje', scheduledAt: '2026-11-01T10:00:00.000Z' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza un segundo tramo activo para el mismo viaje', async () => {
      const service = createService(prismaMock({ active: { id: 'uuid-tramo' } }));

      await expect(
        service.create({ tripId: 'uuid-viaje', scheduledAt: returnAt }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('list', () => {
    it('por defecto lista solo los tramos disponibles y pagina', async () => {
      const prisma = prismaMock({ rows: [{ id: 'uuid-tramo' }], total: 3 });
      const service = createService(prisma);

      const result = await service.list({ page: 1, limit: 2 });

      expect(prisma.emptyLeg.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: EmptyLegStatus.AVAILABLE },
          skip: 0,
          take: 2,
        }),
      );
      expect(result.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    });

    it('respeta el filtro de estado', async () => {
      const prisma = prismaMock();
      const service = createService(prisma);

      await service.list({ page: 2, limit: 10, status: EmptyLegStatus.OFFERED });

      expect(prisma.emptyLeg.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: EmptyLegStatus.OFFERED },
          skip: 10,
          take: 10,
        }),
      );
    });
  });
});
