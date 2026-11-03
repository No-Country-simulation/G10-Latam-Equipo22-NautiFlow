import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EstadoSalida, TripStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BoatScheduleService } from './boat-schedule.service.js';

const scheduledAt = new Date('2026-11-05T12:00:00.000Z');

function createService(prismaMock: object, slotHours = 2) {
	const config = {
		get: (key: string) => (key === 'TRIP_SLOT_HOURS' ? slotHours : undefined),
	} as unknown as ConfigService;
	return new BoatScheduleService(prismaMock as unknown as PrismaService, config);
}

function prismaMock({
	tripConflict = null,
	salidaConflict = null,
}: {
	tripConflict?: object | null;
	salidaConflict?: object | null;
} = {}) {
	return {
		trip: { findFirst: vi.fn().mockResolvedValue(tripConflict) },
		salida: { findFirst: vi.fn().mockResolvedValue(salidaConflict) },
	};
}

describe('BoatScheduleService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rechaza si hay un viaje en conflicto', async () => {
		const prisma = prismaMock({ tripConflict: { id: 'uuid-otro-viaje' } });
		const service = createService(prisma);

		await expect(service.assertSlotAvailable('uuid-lancha', scheduledAt)).rejects.toBeInstanceOf(
			ConflictException,
		);
		expect(prisma.trip.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					embarcacionId: 'uuid-lancha',
					status: { in: [TripStatus.PENDING, TripStatus.ASSIGNED, TripStatus.CONFIRMED] },
					scheduledAt: {
						gte: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
						lte: new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000),
					},
				}),
			}),
		);
	});

	it('rechaza si hay una salida en conflicto', async () => {
		const prisma = prismaMock({ salidaConflict: { id: 'uuid-otra-salida' } });
		const service = createService(prisma);

		await expect(service.assertSlotAvailable('uuid-lancha', scheduledAt)).rejects.toBeInstanceOf(
			ConflictException,
		);
		expect(prisma.salida.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					embarcacionId: 'uuid-lancha',
					estado: { in: [EstadoSalida.PROGRAMADA] },
				}),
			}),
		);
	});

	it('ignora viajes cancelados o completados', async () => {
		const prisma = prismaMock();
		const service = createService(prisma);

		await service.assertSlotAvailable('uuid-lancha', scheduledAt);

		expect(prisma.trip.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					status: { in: [TripStatus.PENDING, TripStatus.ASSIGNED, TripStatus.CONFIRMED] },
				}),
			}),
		);
	});

	it('ignora salidas canceladas o completadas', async () => {
		const prisma = prismaMock();
		const service = createService(prisma);

		await service.assertSlotAvailable('uuid-lancha', scheduledAt);

		expect(prisma.salida.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					estado: { in: [EstadoSalida.PROGRAMADA] },
				}),
			}),
		);
	});

	it('respeta la ventana configurada', async () => {
		const prisma = prismaMock();
		const service = createService(prisma, 4);

		await service.assertSlotAvailable('uuid-lancha', scheduledAt);

		expect(prisma.trip.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					scheduledAt: {
						gte: new Date(scheduledAt.getTime() - 4 * 60 * 60 * 1000),
						lte: new Date(scheduledAt.getTime() + 4 * 60 * 60 * 1000),
					},
				}),
			}),
		);
	});

	it('excluye el viaje o salida que se está actualizando', async () => {
		const prisma = prismaMock();
		const service = createService(prisma);

		await service.assertSlotAvailable('uuid-lancha', scheduledAt, 'uuid-viaje', 'uuid-salida');

		expect(prisma.trip.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ id: { not: 'uuid-viaje' } }),
			}),
		);
		expect(prisma.salida.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ id: { not: 'uuid-salida' } }),
			}),
		);
	});

	it('devuelve las lanchas con viajes o salidas activos en la franja, sin duplicados', async () => {
		const prisma = {
			trip: {
				findMany: vi.fn().mockResolvedValue([
					{ embarcacionId: 'uuid-lancha-1' },
					{ embarcacionId: null },
				]),
			},
			salida: {
				findMany: vi.fn().mockResolvedValue([
					{ embarcacionId: 'uuid-lancha-2' },
					{ embarcacionId: 'uuid-lancha-1' },
				]),
			},
		};
		const service = createService(prisma);

		const ids = await service.findBusyBoatIds(scheduledAt);

		expect(ids).toEqual(['uuid-lancha-1', 'uuid-lancha-2']);
		expect(prisma.trip.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				distinct: ['embarcacionId'],
				where: expect.objectContaining({
					embarcacionId: { not: null },
					status: { in: [TripStatus.PENDING, TripStatus.ASSIGNED, TripStatus.CONFIRMED] },
					scheduledAt: {
						gte: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
						lte: new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000),
					},
				}),
			}),
		);
		expect(prisma.salida.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				distinct: ['embarcacionId'],
				where: expect.objectContaining({
					estado: { in: [EstadoSalida.PROGRAMADA] },
					OR: [
						{
							fechaSalida: {
								gte: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
								lte: new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000),
							},
						},
						{
							tramos: {
								some: {
									fechaHora: {
										gte: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
										lte: new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000),
									},
								},
							},
						},
					],
				}),
			}),
		);
	});

	it('devuelve una lista vacía cuando la franja está libre', async () => {
		const prisma = {
			trip: { findMany: vi.fn().mockResolvedValue([]) },
			salida: { findMany: vi.fn().mockResolvedValue([]) },
		};
		const service = createService(prisma);

		await expect(service.findBusyBoatIds(scheduledAt)).resolves.toEqual([]);
	});
});
