import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	EstadoEmbarcacion,
	OwnerStatus,
	TripStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TripsService } from './trips.service.js';

const scheduledAt = new Date('2026-11-05T12:00:00.000Z');

function createService(prismaMock: object, slotHours = 2) {
	const config = {
		get: (key: string) => (key === 'TRIP_SLOT_HOURS' ? slotHours : undefined),
	} as unknown as ConfigService;
	return new TripsService(prismaMock as unknown as PrismaService, config);
}

function prismaMock({
	trip = {
		id: 'uuid-viaje',
		status: TripStatus.PENDING,
		passengerCount: 4,
		scheduledAt,
	},
	boat = {
		id: 'uuid-lancha',
		capacidad: 8,
		estado: EstadoEmbarcacion.VERIFICADA,
		propietario: { status: OwnerStatus.APPROVED },
	},
	conflict = null,
	created = { id: 'uuid-viaje' },
	updated = { id: 'uuid-viaje', status: TripStatus.ASSIGNED, embarcacionId: 'uuid-lancha' },
}: {
	trip?: object | null;
	boat?: object | null;
	conflict?: object | null;
	created?: object;
	updated?: object;
} = {}) {
	const prisma = {
		trip: {
			findUnique: vi.fn().mockResolvedValue(trip),
			findFirst: vi.fn().mockResolvedValue(conflict),
			create: vi.fn().mockResolvedValue(created),
			update: vi.fn().mockResolvedValue(updated),
		},
		embarcacion: { findUnique: vi.fn().mockResolvedValue(boat) },
		cliente: {
			upsert: vi.fn().mockResolvedValue({ id: 'uuid-cliente' }),
			create: vi.fn().mockResolvedValue({ id: 'uuid-cliente' }),
		},
		$transaction: vi.fn(),
	};
	prisma.$transaction.mockImplementation(async (callback: (tx: object) => unknown) => callback(prisma));
	return prisma;
}

function tripDto(overrides: object = {}) {
	return {
		clientName: 'Cliente Prueba',
		clientPhone: '+5491100000000',
		scheduledAt: scheduledAt.toISOString(),
		passengerCount: 4,
		origin: 'Tigre',
		destination: 'Delta del Tigre',
		...overrides,
	};
}

describe('TripsService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('assignBoat', () => {
		it('rechaza una embarcación ocupada en la misma franja', async () => {
			const prisma = prismaMock({ conflict: { id: 'uuid-otro-viaje' } });
			const service = createService(prisma);

			await expect(service.assignBoat('uuid-viaje', 'uuid-lancha')).rejects.toBeInstanceOf(
				ConflictException,
			);
			expect(prisma.trip.update).not.toHaveBeenCalled();
		});

		it('ignora viajes cancelados o completados al buscar conflictos', async () => {
			const prisma = prismaMock();
			const service = createService(prisma);

			await service.assignBoat('uuid-viaje', 'uuid-lancha');

			expect(prisma.trip.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						embarcacionId: 'uuid-lancha',
						id: { not: 'uuid-viaje' },
						status: { notIn: [TripStatus.CANCELLED, TripStatus.COMPLETED] },
						scheduledAt: {
							gte: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
							lte: new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000),
						},
					}),
				}),
			);
			expect(prisma.trip.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: { embarcacionId: 'uuid-lancha', status: TripStatus.ASSIGNED },
				}),
			);
		});

		it('respeta la ventana configurada', async () => {
			const prisma = prismaMock();
			const service = createService(prisma, 4);

			await service.assignBoat('uuid-viaje', 'uuid-lancha');

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
	});

	describe('create', () => {
		it('rechaza un viaje nuevo con la embarcación ocupada', async () => {
			const prisma = prismaMock({ conflict: { id: 'uuid-otro-viaje' } });
			const service = createService(prisma);

			await expect(service.create(tripDto({ boatId: 'uuid-lancha' }), 'uuid-admin')).rejects.toBeInstanceOf(
				ConflictException,
			);
			expect(prisma.trip.create).not.toHaveBeenCalled();
		});

		it('no busca conflictos si el viaje se crea sin embarcación', async () => {
			const prisma = prismaMock();
			const service = createService(prisma);

			await service.create(tripDto(), 'uuid-admin');

			expect(prisma.trip.findFirst).not.toHaveBeenCalled();
			expect(prisma.trip.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						status: TripStatus.PENDING,
						embarcacionId: undefined,
					}),
				}),
			);
		});
	});
});
