import { BadRequestException } from '@nestjs/common';
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