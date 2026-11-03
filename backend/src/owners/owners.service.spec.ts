import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DocumentStatus, DocumentType, OwnerStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { OwnersService } from './owners.service.js';

describe('OwnersService', () => {
  it('does not approve an owner until all required documents are approved', async () => {
    const transaction = vi.fn();
    const prisma = {
      owner: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'owner-id',
          status: OwnerStatus.PENDING,
          documents: [
            { type: DocumentType.LICENSE, status: DocumentStatus.APPROVED },
            { type: DocumentType.INSURANCE, status: DocumentStatus.PENDING },
          ],
          embarcaciones: [],
        }),
      },
      $transaction: transaction,
    } as unknown as PrismaService;
    const service = new OwnersService(prisma);

    await expect(service.reviewRequest('owner-id', 'APPROVED', 'Validado', 'admin-id')).rejects.toThrow(
      BadRequestException,
    );
    expect(transaction).not.toHaveBeenCalled();
  });
});

function createReopenService(owner: { id: string; status: OwnerStatus } | null) {
  const prisma = {
    owner: {
      findUnique: vi.fn().mockResolvedValue(owner),
      update: vi.fn().mockResolvedValue({}),
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'owner-id', status: OwnerStatus.PENDING }),
    },
    embarcacion: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) =>
    callback(prisma),
  );
  return { service: new OwnersService(prisma as unknown as PrismaService), prisma };
}

describe('OwnersService - reapertura de solicitud', () => {
  it('devuelve la solicitud a pendiente y sus lanchas rechazadas a pendiente', async () => {
    const { service, prisma } = createReopenService({ id: 'owner-id', status: OwnerStatus.REJECTED });

    const result = await service.reopenMyRequest('user-id');

    expect(result).toEqual({ id: 'owner-id', status: OwnerStatus.PENDING });
    expect(prisma.owner.update).toHaveBeenCalledWith({
      where: { id: 'owner-id' },
      data: {
        status: OwnerStatus.PENDING,
        reviewNote: null,
        reviewedAt: null,
        reviewedById: null,
      },
    });
    expect(prisma.embarcacion.updateMany).toHaveBeenCalledWith({
      where: { propietarioId: 'owner-id', estado: 'RECHAZADA' },
      data: { estado: 'PENDIENTE' },
    });
  });

  it('solo permite reabrir una solicitud rechazada', async () => {
    const { service, prisma } = createReopenService({ id: 'owner-id', status: OwnerStatus.PENDING });

    await expect(service.reopenMyRequest('user-id')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('lanza 404 si el usuario no tiene ficha de propietario', async () => {
    const { service } = createReopenService(null);

    await expect(service.reopenMyRequest('user-id')).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createProfileService(owner: { id: string } | null) {
  const prisma = {
    owner: {
      findUnique: vi.fn().mockResolvedValue(owner),
      update: vi.fn().mockResolvedValue({}),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: 'owner-id',
        status: OwnerStatus.PENDING,
        phone: '+541112345678',
        whatsappPhone: null,
        user: { id: 'user-id', name: 'Ana Navegante', email: 'ana@example.com' },
      }),
    },
    user: { update: vi.fn().mockResolvedValue({}) },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) =>
    callback(prisma),
  );
  return { service: new OwnersService(prisma as unknown as PrismaService), prisma };
}

describe('OwnersService - perfil propio', () => {
  it('devuelve el usuario y los teléfonos junto a la solicitud', async () => {
    const { service, prisma } = createProfileService({ id: 'owner-id' });

    await service.getMyRequest('user-id');

    const select = prisma.owner.findUniqueOrThrow.mock.calls[0][0].select;
    expect(select).toMatchObject({
      phone: true,
      whatsappPhone: true,
      user: { select: { id: true, name: true, email: true } },
    });
  });

  it('actualiza nombre, teléfono y whatsapp en una transacción', async () => {
    const { service, prisma } = createProfileService({ id: 'owner-id' });

    const result = await service.updateProfile('user-id', {
      name: ' Ana Navegante ',
      phone: ' +541112345678 ',
      whatsappPhone: '+541198765432',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { name: 'Ana Navegante' },
    });
    expect(prisma.owner.update).toHaveBeenCalledWith({
      where: { id: 'owner-id' },
      data: { phone: '+541112345678', whatsappPhone: '+541198765432' },
    });
    expect(result).toMatchObject({ id: 'owner-id' });
  });

  it('solo toca los campos enviados', async () => {
    const { service, prisma } = createProfileService({ id: 'owner-id' });

    await service.updateProfile('user-id', { phone: '+541187654321' });

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.owner.update).toHaveBeenCalledWith({
      where: { id: 'owner-id' },
      data: { phone: '+541187654321' },
    });
  });

  it('limpia el whatsapp cuando se envía vacío o null', async () => {
    const { service, prisma } = createProfileService({ id: 'owner-id' });

    await service.updateProfile('user-id', { whatsappPhone: null });

    expect(prisma.owner.update).toHaveBeenCalledWith({
      where: { id: 'owner-id' },
      data: { whatsappPhone: null },
    });
  });

  it('lanza 404 si el usuario no tiene ficha de propietario', async () => {
    const { service, prisma } = createProfileService(null);

    await expect(service.updateProfile('user-id', { name: 'Ana' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

function createListService(rows: object[], total: number) {
  const prisma = {
    owner: {
      findMany: vi.fn().mockResolvedValue(rows),
      count: vi.fn().mockResolvedValue(total),
    },
  };
  return { service: new OwnersService(prisma as unknown as PrismaService), prisma };
}

describe('OwnersService - bandeja de solicitudes', () => {
  it('pagina el listado y devuelve data con meta', async () => {
    const { service, prisma } = createListService([{ id: 'owner-id' }], 25);

    const result = await service.listRequests({ page: 2, limit: 10, status: OwnerStatus.PENDING });

    expect(prisma.owner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: OwnerStatus.PENDING },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'asc' },
      }),
    );
    expect(result).toEqual({
      data: [{ id: 'owner-id' }],
      meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
    });
  });

  it('sin estado no restringe la consulta', async () => {
    const { service, prisma } = createListService([], 0);

    await service.listRequests({ page: 1, limit: 20 });

    const { where } = prisma.owner.findMany.mock.calls[0][0];
    expect(where).toEqual({});
    expect(prisma.owner.count).toHaveBeenCalledWith({ where: {} });
  });
});