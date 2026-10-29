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