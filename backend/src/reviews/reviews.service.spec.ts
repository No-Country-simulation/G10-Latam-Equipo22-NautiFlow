import { GoneException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoEmbarcacion, OwnerStatus, TripStatus } from '../generated/prisma/client.js';
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

function createPublicService({
  findMany = vi.fn().mockResolvedValue([]),
  findFirst = vi.fn().mockResolvedValue(null),
  boatCount = vi.fn().mockResolvedValue(0),
  groupBy = vi.fn().mockResolvedValue([]),
  aggregate = vi.fn().mockResolvedValue({ _avg: { rating: null }, _count: { _all: 0 } }),
  reviewFindMany = vi.fn().mockResolvedValue([]),
  reviewCount = vi.fn().mockResolvedValue(0),
}: {
  findMany?: ReturnType<typeof vi.fn>;
  findFirst?: ReturnType<typeof vi.fn>;
  boatCount?: ReturnType<typeof vi.fn>;
  groupBy?: ReturnType<typeof vi.fn>;
  aggregate?: ReturnType<typeof vi.fn>;
  reviewFindMany?: ReturnType<typeof vi.fn>;
  reviewCount?: ReturnType<typeof vi.fn>;
} = {}) {
  const prisma = {
    embarcacion: { findMany, findFirst, count: boatCount },
    review: { groupBy, aggregate, findMany: reviewFindMany, count: reviewCount },
  } as unknown as PrismaService;
  return {
    service: new ReviewsService(prisma, {} as ConfigService),
    findMany,
    findFirst,
    groupBy,
    aggregate,
    reviewFindMany,
  };
}

describe('ReviewsService - reputación pública', () => {
  it('lista embarcaciones elegibles con promedio y cantidad de reseñas', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: 'boat-a', nombre: 'Lancha A' },
      { id: 'boat-b', nombre: 'Lancha B' },
    ]);
    const boatCount = vi.fn().mockResolvedValue(2);
    const groupBy = vi.fn().mockResolvedValue([
      { embarcacionId: 'boat-a', _avg: { rating: 4.6666 }, _count: { _all: 3 } },
    ]);
    const { service } = createPublicService({ findMany, boatCount, groupBy });

    const result = await service.listPublicBoats({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(2);
    expect(result.data[0].rating).toEqual({ average: 4.7, total: 3 });
    expect(result.data[1].rating).toEqual({ average: null, total: 0 });
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          estado: EstadoEmbarcacion.VERIFICADA,
          propietario: { status: OwnerStatus.APPROVED, user: { status: 'ACTIVE' } },
        },
        orderBy: { nombre: 'asc' },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('filtra por zona y pagina sin consultar reputación si no hay resultados', async () => {
    const { service, findMany, groupBy } = createPublicService();

    const result = await service.listPublicBoats({ page: 2, limit: 5, zonaId: 'zona-1' });

    expect(result.data).toEqual([]);
    expect(result.meta.totalPages).toBe(0);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ zonas: { some: { zonaId: 'zona-1' } } }),
        skip: 5,
        take: 5,
      }),
    );
    expect(groupBy).not.toHaveBeenCalled();
  });

  it('devuelve el detalle público con promedio y últimas reseñas', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: 'boat-a',
      nombre: 'Lancha A',
      reviews: [{ rating: 5, comment: 'Excelente', createdAt: new Date() }],
    });
    const aggregate = vi.fn().mockResolvedValue({
      _avg: { rating: 4 },
      _count: { _all: 2 },
    });
    const { service } = createPublicService({ findFirst, aggregate });

    const result = await service.getPublicBoat('boat-a');

    expect(result.rating).toEqual({ average: 4, total: 2 });
    expect(result.reviews).toHaveLength(1);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'boat-a',
          estado: EstadoEmbarcacion.VERIFICADA,
          propietario: { status: OwnerStatus.APPROVED, user: { status: 'ACTIVE' } },
        },
      }),
    );
  });

  it('oculta embarcaciones no elegibles con 404', async () => {
    const { service, aggregate } = createPublicService();

    await expect(service.getPublicBoat('boat-pendiente')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(aggregate).not.toHaveBeenCalled();
  });

  it('pagina las reseñas públicas de una embarcación', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'boat-a' });
    const reviewFindMany = vi.fn().mockResolvedValue([{ rating: 5, comment: null }]);
    const reviewCount = vi.fn().mockResolvedValue(1);
    const { service } = createPublicService({ findFirst, reviewFindMany, reviewCount });

    const result = await service.listPublicBoatReviews('boat-a', { page: 1, limit: 10 });

    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    expect(reviewFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { embarcacionId: 'boat-a' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      }),
    );
  });

  it('no lista reseñas de una embarcación no elegible', async () => {
    const { service, reviewFindMany } = createPublicService();

    await expect(
      service.listPublicBoatReviews('boat-pendiente', { page: 1, limit: 10 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(reviewFindMany).not.toHaveBeenCalled();
  });
});