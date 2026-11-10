import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	EstadoEmbarcacion,
	OwnerStatus,
	TripStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BoatScheduleService } from '../boats/boat-schedule.service.js';
import { TripsService } from './trips.service.js';

const scheduledAt = new Date('2026-11-05T12:00:00.000Z');

function createService(prismaMock: object, scheduleOverride?: Partial<BoatScheduleService>) {
	const schedule = {
		assertSlotsAvailable: vi.fn().mockResolvedValue(undefined),
		...scheduleOverride,
	} as unknown as BoatScheduleService;
	const reservas = { anularPorViaje: vi.fn().mockResolvedValue(undefined) } as unknown as {
		anularPorViaje: ReturnType<typeof vi.fn>;
	};
	return {
		service: new TripsService(prismaMock as unknown as PrismaService, schedule, reservas),
		schedule,
		reservas,
	};
}

function prismaMock({
	trip = {
		id: 'uuid-viaje',
		status: TripStatus.PENDING,
		passengerCount: 4,
		scheduledAt,
		tramoId: null,
		salidaId: null,
	},
	boat = {
		id: 'uuid-lancha',
		capacidad: 8,
		estado: EstadoEmbarcacion.VERIFICADA,
		propietario: { status: OwnerStatus.APPROVED },
	},
	created = { id: 'uuid-viaje' },
	updated = { id: 'uuid-viaje', status: TripStatus.ASSIGNED, embarcacionId: 'uuid-lancha' },
}: {
	trip?: object | null;
	boat?: object | null;
	created?: object;
	updated?: object;
} = {}) {
	const prisma = {
		trip: {
			findUnique: vi.fn().mockResolvedValue(trip),
			findFirst: vi.fn().mockResolvedValue(null),
			findMany: vi.fn().mockResolvedValue([]),
			count: vi.fn().mockResolvedValue(0),
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
			const prisma = prismaMock();
			const { service, schedule } = createService(prisma, {
				assertSlotsAvailable: vi.fn().mockRejectedValue(
					new ConflictException('La embarcación ya tiene un viaje o salida asignado en esa franja horaria.'),
				),
			});

			await expect(service.assignBoat('uuid-viaje', 'uuid-lancha')).rejects.toBeInstanceOf(
				ConflictException,
			);
			expect(prisma.trip.update).not.toHaveBeenCalled();
			expect(schedule.assertSlotsAvailable).toHaveBeenCalledWith('uuid-lancha', [scheduledAt], {
				excludeTripId: 'uuid-viaje',
				excludeTramoId: undefined,
				excludeSalidaId: undefined,
			});
		});

		it('asigna la embarcación cuando no hay conflicto', async () => {
			const prisma = prismaMock();
			const { service, schedule } = createService(prisma);

			await service.assignBoat('uuid-viaje', 'uuid-lancha');

			expect(schedule.assertSlotsAvailable).toHaveBeenCalledWith('uuid-lancha', [scheduledAt], {
				excludeTripId: 'uuid-viaje',
				excludeTramoId: undefined,
				excludeSalidaId: undefined,
			});
			expect(prisma.trip.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: { embarcacionId: 'uuid-lancha', status: TripStatus.ASSIGNED },
				}),
			);
		});

		it('rechaza si el viaje ya fue asignado', async () => {
			const prisma = prismaMock({
				trip: { id: 'uuid-viaje', status: TripStatus.ASSIGNED, passengerCount: 4, scheduledAt },
			});
			const { service } = createService(prisma);

			await expect(service.assignBoat('uuid-viaje', 'uuid-lancha')).rejects.toBeInstanceOf(
				BadRequestException,
			);
		});

		it('rechaza si la embarcación no existe', async () => {
			const prisma = prismaMock({ boat: null });
			const { service } = createService(prisma);

			await expect(service.assignBoat('uuid-viaje', 'uuid-lancha')).rejects.toBeInstanceOf(
				NotFoundException,
			);
		});
	});

	describe('create', () => {
		it('rechaza un viaje nuevo con la embarcación ocupada', async () => {
			const prisma = prismaMock();
			const { service, schedule } = createService(prisma, {
				assertSlotsAvailable: vi.fn().mockRejectedValue(
					new ConflictException('La embarcación ya tiene un viaje o salida asignado en esa franja horaria.'),
				),
			});

			await expect(service.create(tripDto({ boatId: 'uuid-lancha' }), 'uuid-admin')).rejects.toBeInstanceOf(
				ConflictException,
			);
			expect(prisma.trip.create).not.toHaveBeenCalled();
			expect(schedule.assertSlotsAvailable).toHaveBeenCalledWith('uuid-lancha', [scheduledAt]);
		});

		it('no busca conflictos si el viaje se crea sin embarcación', async () => {
			const prisma = prismaMock();
			const { service, schedule } = createService(prisma);

			await service.create(tripDto(), 'uuid-admin');

			expect(schedule.assertSlotsAvailable).not.toHaveBeenCalled();
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

	describe('updateStatus', () => {
		it('anula la reserva vinculada al cancelar el viaje', async () => {
			const prisma = prismaMock({
				trip: { id: 'uuid-viaje', status: TripStatus.ASSIGNED, passengerCount: 4, scheduledAt },
				updated: { id: 'uuid-viaje', status: TripStatus.CANCELLED, scheduledAt },
			});
			const { service, reservas } = createService(prisma);

			const result = await service.updateStatus('uuid-viaje', TripStatus.CANCELLED);

			expect(result.status).toBe(TripStatus.CANCELLED);
			expect(reservas.anularPorViaje).toHaveBeenCalledWith(prisma, 'uuid-viaje');
		});

		it('no toca las reservas si el viaje no se cancela', async () => {
			const prisma = prismaMock({
				trip: {
					id: 'uuid-viaje',
					status: TripStatus.ASSIGNED,
					passengerCount: 4,
					scheduledAt,
					embarcacionId: 'uuid-lancha',
				},
				updated: { id: 'uuid-viaje', status: TripStatus.CONFIRMED, scheduledAt },
			});
			const { service, reservas } = createService(prisma);

			await service.updateStatus('uuid-viaje', TripStatus.CONFIRMED);

			expect(reservas.anularPorViaje).not.toHaveBeenCalled();
		});

		it('rechaza una transición no permitida', async () => {
			const prisma = prismaMock({
				trip: { id: 'uuid-viaje', status: TripStatus.COMPLETED, passengerCount: 4, scheduledAt },
			});
			const { service, reservas } = createService(prisma);

			await expect(service.updateStatus('uuid-viaje', TripStatus.CONFIRMED)).rejects.toBeInstanceOf(
				BadRequestException,
			);
			expect(prisma.trip.update).not.toHaveBeenCalled();
			expect(reservas.anularPorViaje).not.toHaveBeenCalled();
		});

		it('rechaza un viaje inexistente', async () => {
			const prisma = prismaMock({ trip: null });
			const { service } = createService(prisma);

			await expect(service.updateStatus('uuid-viaje', TripStatus.CANCELLED)).rejects.toBeInstanceOf(
				NotFoundException,
			);
		});
	});

	describe('list', () => {
		it('pagina los viajes y devuelve data con meta', async () => {
			const prisma = prismaMock();
			prisma.trip.findMany.mockResolvedValue([
				{
					id: 'uuid-viaje',
					scheduledAt,
					passengerCount: 4,
					origin: 'Tigre',
					destination: 'Delta del Tigre',
					status: TripStatus.PENDING,
					cliente: { nombre: 'Cliente Prueba', telefono: '+5491100000000', email: null },
					embarcacion: null,
					review: null,
					emptyLegs: [],
				},
			]);
			prisma.trip.count.mockResolvedValue(7);
			const { service } = createService(prisma);

			const result = await service.list({ page: 2, limit: 5 });

			expect(prisma.trip.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ skip: 5, take: 5, orderBy: { scheduledAt: 'desc' } }),
			);
			expect(result).toEqual({
				data: [
					{
						id: 'uuid-viaje',
						scheduledAt,
						passengerCount: 4,
						origin: 'Tigre',
						destination: 'Delta del Tigre',
						status: TripStatus.PENDING,
						cliente: { nombre: 'Cliente Prueba', telefono: '+5491100000000', email: null },
						embarcacion: null,
						lanchero: null,
						reviewId: null,
						emptyLegId: null,
					},
				],
				meta: { page: 2, limit: 5, total: 7, totalPages: 2 },
			});
		});

		it('filtra por estado, texto y rango de fechas', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await service.list({
				page: 1,
				limit: 20,
				status: TripStatus.PENDING,
				q: ' delta ',
				fechaDesde: '2026-11-01',
				fechaHasta: '2026-11-30',
			});

			const { where } = prisma.trip.findMany.mock.calls[0][0];
			expect(where.status).toBe(TripStatus.PENDING);
			expect(where.OR).toEqual([
				{
					cliente: {
						OR: [
							{ nombre: { contains: 'delta', mode: 'insensitive' } },
							{ telefono: { contains: 'delta', mode: 'insensitive' } },
							{ email: { contains: 'delta', mode: 'insensitive' } },
						],
					},
				},
				{ origin: { contains: 'delta', mode: 'insensitive' } },
				{ destination: { contains: 'delta', mode: 'insensitive' } },
			]);
			expect(where.scheduledAt).toEqual({
				gte: new Date('2026-11-01T00:00:00.000Z'),
				lte: new Date('2026-11-30T23:59:59.999Z'),
			});
		});

		it('acepta fecha y hora explícita en fechaHasta sin ajustar al fin del día', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await service.list({ page: 1, limit: 20, fechaHasta: '2026-11-30T15:30:00.000Z' });

			const { where } = prisma.trip.findMany.mock.calls[0][0];
			expect(where.scheduledAt).toEqual({ lte: new Date('2026-11-30T15:30:00.000Z') });
		});

		it('sin filtros no restringe la consulta', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await service.list({ page: 1, limit: 20 });

			const { where } = prisma.trip.findMany.mock.calls[0][0];
			expect(where).toEqual({});
			expect(prisma.trip.count).toHaveBeenCalledWith({ where: {} });
		});
	});
});
