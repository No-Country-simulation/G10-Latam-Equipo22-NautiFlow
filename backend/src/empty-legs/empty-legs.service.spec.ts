import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EmptyLegStatus, TripStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmptyLegsService } from './empty-legs.service.js';

const departure = new Date('2026-11-01T12:00:00.000Z');
const returnAt = '2026-11-01T18:00:00.000Z';
const futureReturnAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

function createService(prismaMock: object) {
  const notifications = { notify: vi.fn().mockResolvedValue(undefined), notifyAdmins: vi.fn().mockResolvedValue(undefined) };
  return {
    service: new EmptyLegsService(
      prismaMock as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    ),
    notifications,
  };
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
  owner = { id: 'uuid-owner' },
  boat = { id: 'uuid-lancha' },
  active = null,
  emptyLegDetail = null,
  updated = { id: 'uuid-tramo', status: EmptyLegStatus.CLOSED },
  created = { id: 'uuid-tramo' },
  rows = [],
  total = 0,
}: {
  trip?: object | null;
  owner?: object | null;
  boat?: object | null;
  active?: object | null;
  emptyLegDetail?: object | null;
  updated?: object;
  created?: object;
  rows?: object[];
  total?: number;
} = {}) {
  return {
    trip: { findUnique: vi.fn().mockResolvedValue(trip) },
    owner: { findUnique: vi.fn().mockResolvedValue(owner) },
    embarcacion: { findFirst: vi.fn().mockResolvedValue(boat) },
    emptyLeg: {
      findUnique: vi.fn().mockResolvedValue(emptyLegDetail),
      findFirst: vi.fn().mockResolvedValue(active),
      create: vi.fn().mockResolvedValue(created),
      update: vi.fn().mockResolvedValue(updated),
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
      const { service } = createService(prisma);

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
      const { service } = createService(prismaMock({ trip: null }));

      await expect(
        service.create({ tripId: 'uuid-viaje', scheduledAt: returnAt }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rechaza un viaje sin embarcación asignada', async () => {
      const { service } = createService(prismaMock({ trip: tripBase({ embarcacionId: null }) }));

      await expect(
        service.create({ tripId: 'uuid-viaje', scheduledAt: returnAt }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza viajes que no están asignados ni confirmados', async () => {
      const { service } = createService(
        prismaMock({ trip: tripBase({ status: TripStatus.COMPLETED }) }),
      );

      await expect(
        service.create({ tripId: 'uuid-viaje', scheduledAt: returnAt }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza un regreso anterior a la salida', async () => {
      const { service } = createService(prismaMock());

      await expect(
        service.create({ tripId: 'uuid-viaje', scheduledAt: '2026-11-01T10:00:00.000Z' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza un segundo tramo activo para el mismo viaje', async () => {
      const { service } = createService(prismaMock({ active: { id: 'uuid-tramo' } }));

      await expect(
        service.create({ tripId: 'uuid-viaje', scheduledAt: returnAt }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('list', () => {
    it('por defecto lista solo los tramos disponibles y pagina', async () => {
      const prisma = prismaMock({ rows: [{ id: 'uuid-tramo' }], total: 3 });
      const { service } = createService(prisma);

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
      const { service } = createService(prisma);

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

  describe('createMine', () => {
    it('crea el retorno de una embarcación propia y notifica a los admins', async () => {
      const prisma = prismaMock({
        created: {
          id: 'uuid-retorno',
          tripId: null,
          embarcacionId: 'uuid-lancha',
          origin: 'Tigre',
          destination: 'Delta del Tigre',
          scheduledAt: new Date(futureReturnAt),
          status: EmptyLegStatus.AVAILABLE,
        },
      });
      const { service, notifications } = createService(prisma);

      const result = await service.createMine('user-1', 'Ana Navegante', {
        embarcacionId: 'uuid-lancha',
        origin: ' Tigre ',
        destination: 'Delta del Tigre',
        scheduledAt: futureReturnAt,
      });

      expect(prisma.owner.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { id: true },
      });
      expect(prisma.embarcacion.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid-lancha', propietarioId: 'uuid-owner' },
        }),
      );
      expect(prisma.emptyLeg.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            embarcacionId: 'uuid-lancha',
            origin: 'Tigre',
            destination: 'Delta del Tigre',
            scheduledAt: new Date(futureReturnAt),
            status: EmptyLegStatus.AVAILABLE,
          }),
        }),
      );
      expect(result.tripId).toBeNull();
      expect(notifications.notifyAdmins).toHaveBeenCalledWith(
        'Retorno publicado',
        expect.stringContaining('Ana Navegante'),
      );
    });

    it('rechaza embarcaciones de otro lanchero', async () => {
      const prisma = prismaMock({ boat: null });
      const { service } = createService(prisma);

      await expect(
        service.createMine('user-1', 'Ana', {
          embarcacionId: 'uuid-ajena',
          origin: 'Tigre',
          destination: 'Delta',
          scheduledAt: futureReturnAt,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rechaza fechas pasadas', async () => {
      const { service } = createService(prismaMock());

      await expect(
        service.createMine('user-1', 'Ana', {
          embarcacionId: 'uuid-lancha',
          origin: 'Tigre',
          destination: 'Delta',
          scheduledAt: '2020-01-01T10:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('listMine', () => {
    it('lista solo los retornos del propietario sin filtrar estado', async () => {
      const prisma = prismaMock();
      const { service } = createService(prisma);

      await service.listMine('user-1', { page: 1, limit: 20 });

      expect(prisma.emptyLeg.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { embarcacion: { propietarioId: 'uuid-owner' } },
        }),
      );
    });

    it('aplica el filtro de estado opcional', async () => {
      const prisma = prismaMock();
      const { service } = createService(prisma);

      await service.listMine('user-1', { page: 1, limit: 20, status: EmptyLegStatus.CLOSED });

      expect(prisma.emptyLeg.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            embarcacion: { propietarioId: 'uuid-owner' },
            status: EmptyLegStatus.CLOSED,
          },
        }),
      );
    });

    it('lanza 404 si el usuario no tiene ficha de propietario', async () => {
      const { service } = createService(prismaMock({ owner: null }));

      await expect(service.listMine('user-1', { page: 1, limit: 20 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateMine', () => {
    it('lanza 404 si el retorno no pertenece al lanchero', async () => {
      const prisma = prismaMock({ active: null });
      const { service } = createService(prisma);

      await expect(
        service.updateMine('user-1', 'Ana', 'uuid-retorno', { status: EmptyLegStatus.CLOSED }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.emptyLeg.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid-retorno', embarcacion: { propietarioId: 'uuid-owner' } },
        }),
      );
    });

    it('rechaza modificar retornos ofrecidos o asignados', async () => {
      const prisma = prismaMock({
        active: { id: 'uuid-retorno', origin: 'Tigre', destination: 'Delta', status: EmptyLegStatus.ASSIGNED },
      });
      const { service } = createService(prisma);

      await expect(
        service.updateMine('user-1', 'Ana', 'uuid-retorno', { status: EmptyLegStatus.CLOSED }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza estados distintos de disponible o cerrado', async () => {
      const prisma = prismaMock({
        active: { id: 'uuid-retorno', origin: 'Tigre', destination: 'Delta', status: EmptyLegStatus.AVAILABLE },
      });
      const { service } = createService(prisma);

      await expect(
        service.updateMine('user-1', 'Ana', 'uuid-retorno', { status: EmptyLegStatus.OFFERED }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('actualiza el estado y notifica a los admins', async () => {
      const prisma = prismaMock({
        active: { id: 'uuid-retorno', origin: 'Tigre', destination: 'Delta', status: EmptyLegStatus.AVAILABLE },
        updated: {
          id: 'uuid-retorno',
          tripId: null,
          embarcacionId: 'uuid-lancha',
          origin: 'Tigre',
          destination: 'Delta',
          scheduledAt: new Date(returnAt),
          status: EmptyLegStatus.CLOSED,
        },
      });
      const { service, notifications } = createService(prisma);

      await service.updateMine('user-1', 'Ana Navegante', 'uuid-retorno', {
        status: EmptyLegStatus.CLOSED,
      });

      expect(prisma.emptyLeg.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: EmptyLegStatus.CLOSED } }),
      );
      expect(notifications.notifyAdmins).toHaveBeenCalledWith(
        'Retorno actualizado',
        expect.stringContaining('Ana Navegante'),
      );
    });
  });

  describe('updateStatus', () => {
    it('lanza 404 si el retorno no existe', async () => {
      const { service } = createService(prismaMock({ emptyLegDetail: null }));

      await expect(
        service.updateStatus('uuid-retorno', EmptyLegStatus.CLOSED),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('actualiza el estado y notifica al lanchero dueño', async () => {
      const prisma = prismaMock({
        emptyLegDetail: {
          id: 'uuid-retorno',
          status: EmptyLegStatus.AVAILABLE,
          origin: 'Tigre',
          destination: 'Delta',
          embarcacion: { propietario: { userId: 'owner-user' } },
        },
      });
      const { service, notifications } = createService(prisma);

      await service.updateStatus('uuid-retorno', EmptyLegStatus.CLOSED);

      expect(prisma.emptyLeg.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: EmptyLegStatus.CLOSED } }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        'owner-user',
        'Estado de retorno actualizado',
        expect.stringContaining('Cerrado'),
      );
    });
  });
});
