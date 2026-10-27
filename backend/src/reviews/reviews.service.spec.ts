import { GoneException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TripStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReviewsService } from './reviews.service.js';

const token = 'a'.repeat(43);

function createService(claimCount: number) {
  const updateMany = vi.fn().mockResolvedValue({ count: claimCount });
  const findUnique = vi.fn().mockResolvedValue({
    trip: {
      id: 'trip-id',
      status: TripStatus.COMPLETED,
      embarcacionId: 'boat-id',
      review: null,
    },
  });
  const create = vi.fn().mockResolvedValue({ id: 'review-id', rating: 5 });
  const transaction = {
    reviewToken: { updateMany, findUnique },
    review: { create },
  };
  const prisma = {
    $transaction: vi.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
  } as unknown as PrismaService;
  const config = {} as ConfigService;
  return { service: new ReviewsService(prisma, config), updateMany, create };
}

describe('ReviewsService', () => {
  it('claims a valid token atomically and creates one review', async () => {
    const { service, updateMany, create } = createService(1);

    await service.submit(token, 5, 'Muy buen servicio');

    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ usedAt: null, tokenHash: expect.any(String) }),
    }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tripId: 'trip-id', rating: 5 }),
    }));
  });

  it('rejects a token that was already claimed', async () => {
    const { service, create } = createService(0);

    await expect(service.submit(token, 4)).rejects.toThrow(GoneException);
    expect(create).not.toHaveBeenCalled();
  });
});