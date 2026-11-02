import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	EstadoEmbarcacion,
	EstadoReserva,
	EstadoSalida,
	EstadoTramo,
	OwnerStatus,
	TripStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BoatScheduleService } from '../boats/boat-schedule.service.js';
import { ReservasService } from './reservas.service.js';
import type { CreateReservaDto } from './create-reserva.dto.js';

const ahora = new Date();
const futuro = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
const pasado = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

const tramoDisponible = {
	id: 'uuid-tramo',
	salidaId: 'uuid-salida',
	tipo: 'IDA',
	origen: 'Delta del Tigre',
	destino: 'Tigre Centro',
	fechaHora: futuro,
	cupo: 8,
	precioCentavos: 50000,
	estado: EstadoTramo.DISPONIBLE,
	salida: {
		id: 'uuid-salida',
		fechaSalida: futuro,
		estado: EstadoSalida.PROGRAMADA,
		embarcacionId: 'uuid-lancha',
		embarcacion: {
			id: 'uuid-lancha',
			capacidad: 10,
			estado: EstadoEmbarcacion.VERIFICADA,
			propietario: { status: OwnerStatus.APPROVED, user: { status: 'ACTIVE' } },
		},
	},
};

const reservaPendiente = {
	id: 'uuid-reserva',
	estado: EstadoReserva.PENDIENTE,
	tramoId: 'uuid-tramo',
	salidaId: 'uuid-salida',
	email: null as string | null,
	nombre: 'María Pérez',
	telefono: '+5491100000000',
	cantidadPasajeros: 2,
};

function createService(prismaMock: object, scheduleOverride?: Partial<BoatScheduleService>) {
	const schedule = {
		assertSlotsAvailable: vi.fn().mockResolvedValue(undefined),
		...scheduleOverride,
	} as unknown as BoatScheduleService;
	return {
		service: new ReservasService(prismaMock as unknown as PrismaService, schedule),
		schedule,
	};
}

function prismaMock() {
	const prisma = {
		tramo: {
			findUnique: vi.fn().mockResolvedValue(tramoDisponible),
			updateMany: vi.fn().mockResolvedValue({ count: 1 }),
			update: vi.fn().mockResolvedValue({ id: 'uuid-tramo' }),
		},
		reserva: {
			create: vi.fn().mockResolvedValue({ id: 'uuid-reserva', estado: EstadoReserva.PENDIENTE }),
			findUnique: vi.fn().mockResolvedValue(reservaPendiente),
			findFirst: vi.fn().mockResolvedValue(null),
			findMany: vi.fn().mockResolvedValue([]),
			count: vi.fn().mockResolvedValue(0),
			update: vi.fn().mockResolvedValue({ id: 'uuid-reserva', estado: EstadoReserva.CONFIRMADA }),
		},
		cliente: {
			upsert: vi.fn().mockResolvedValue({ id: 'uuid-cliente' }),
			create: vi.fn().mockResolvedValue({ id: 'uuid-cliente' }),
		},
		trip: {
			create: vi.fn().mockResolvedValue({ id: 'uuid-viaje', status: TripStatus.CONFIRMED }),
			updateMany: vi.fn().mockResolvedValue({ count: 1 }),
		},
		$transaction: vi.fn(),
	};
	prisma.$transaction.mockImplementation(async (callback: (tx: object) => unknown) => callback(prisma));
	return prisma;
}

function dto(overrides: Partial<CreateReservaDto> = {}): CreateReservaDto {
	return {
		tramoId: 'uuid-tramo',
		nombre: 'María Pérez',
		telefono: '+5491100000000',
		cantidadPasajeros: 2,
		...overrides,
	};
}

describe('ReservasService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('create', () => {
		it('crea la reserva con snapshot del tramo', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await service.create(dto({ email: ' MARIA@Correo.COM ', mensaje: '  Hola  ' }));

			expect(prisma.reserva.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						tramoId: 'uuid-tramo',
						salidaId: 'uuid-salida',
						nombre: 'María Pérez',
						telefono: '+5491100000000',
						email: 'maria@correo.com',
						cantidadPasajeros: 2,
						mensaje: 'Hola',
						origen: 'Delta del Tigre',
						destino: 'Tigre Centro',
						fechaHora: futuro,
						precioCentavos: 50000,
					}),
				}),
			);
		});

		it('rechaza un tramo inexistente', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique.mockResolvedValue(null);
			const { service } = createService(prisma);

			await expect(service.create(dto())).rejects.toBeInstanceOf(NotFoundException);
			expect(prisma.reserva.create).not.toHaveBeenCalled();
		});

		it('rechaza una salida cancelada', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique.mockResolvedValue({
				...tramoDisponible,
				salida: { ...tramoDisponible.salida, estado: EstadoSalida.CANCELADA },
			});
			const { service } = createService(prisma);

			await expect(service.create(dto())).rejects.toBeInstanceOf(ConflictException);
			expect(prisma.reserva.create).not.toHaveBeenCalled();
		});

		it('rechaza una salida que ya salió', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique.mockResolvedValue({
				...tramoDisponible,
				fechaHora: pasado,
				salida: { ...tramoDisponible.salida, fechaSalida: pasado },
			});
			const { service } = createService(prisma);

			await expect(service.create(dto())).rejects.toBeInstanceOf(ConflictException);
			expect(prisma.reserva.create).not.toHaveBeenCalled();
		});

		it('rechaza un tramo que no está disponible', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique.mockResolvedValue({
				...tramoDisponible,
				estado: EstadoTramo.CERRADO,
			});
			const { service } = createService(prisma);

			await expect(service.create(dto())).rejects.toBeInstanceOf(ConflictException);
		});

		it('rechaza cuando no hay cupo suficiente', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique.mockResolvedValue({ ...tramoDisponible, cupo: 1 });
			const { service } = createService(prisma);

			await expect(service.create(dto({ cantidadPasajeros: 2 }))).rejects.toBeInstanceOf(
				ConflictException,
			);
		});

		it('rechaza pasajeros por encima de la capacidad', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique.mockResolvedValue({ ...tramoDisponible, cupo: 50 });
			const { service } = createService(prisma);

			await expect(service.create(dto({ cantidadPasajeros: 15 }))).rejects.toBeInstanceOf(
				BadRequestException,
			);
		});

		it('rechaza si la embarcación dejó de estar habilitada', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique.mockResolvedValue({
				...tramoDisponible,
				salida: {
					...tramoDisponible.salida,
					embarcacion: {
						...tramoDisponible.salida.embarcacion,
						estado: EstadoEmbarcacion.RECHAZADA,
					},
				},
			});
			const { service } = createService(prisma);

			await expect(service.create(dto())).rejects.toBeInstanceOf(ConflictException);
		});
	});

	describe('confirmar', () => {
		it('descuenta el cupo, crea el viaje y confirma la reserva', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique
				.mockResolvedValueOnce(tramoDisponible)
				.mockResolvedValueOnce({ cupo: 6 });
			const { service, schedule } = createService(prisma);

			const result = await service.confirmar('uuid-reserva', 'uuid-admin');

			expect(schedule.assertSlotsAvailable).toHaveBeenCalledWith('uuid-lancha', [futuro], {
				excludeSalidaId: 'uuid-salida',
				excludeTramoId: 'uuid-tramo',
			});
			expect(prisma.tramo.updateMany).toHaveBeenCalledWith({
				where: { id: 'uuid-tramo', estado: EstadoTramo.DISPONIBLE, cupo: { gte: 2 } },
				data: { cupo: { decrement: 2 } },
			});
			expect(prisma.trip.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						embarcacionId: 'uuid-lancha',
						scheduledAt: futuro,
						passengerCount: 2,
						origin: 'Delta del Tigre',
						destination: 'Tigre Centro',
						status: TripStatus.CONFIRMED,
						salidaId: 'uuid-salida',
						tramoId: 'uuid-tramo',
						createdById: 'uuid-admin',
					}),
				}),
			);
			expect(prisma.reserva.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						estado: EstadoReserva.CONFIRMADA,
						tripId: 'uuid-viaje',
						cupoDescontado: true,
						reviewedById: 'uuid-admin',
					}),
				}),
			);
			expect(result.trip.id).toBe('uuid-viaje');
		});

		it('cierra el tramo cuando el cupo llega a cero', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique
				.mockResolvedValueOnce(tramoDisponible)
				.mockResolvedValueOnce({ cupo: 0 });
			const { service } = createService(prisma);

			await service.confirmar('uuid-reserva', 'uuid-admin');

			expect(prisma.tramo.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 'uuid-tramo' },
					data: { estado: EstadoTramo.CERRADO },
				}),
			);
		});

		it('no cierra el tramo si queda cupo', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique
				.mockResolvedValueOnce(tramoDisponible)
				.mockResolvedValueOnce({ cupo: 6 });
			const { service } = createService(prisma);

			await service.confirmar('uuid-reserva', 'uuid-admin');

			expect(prisma.tramo.update).not.toHaveBeenCalled();
		});

		it('rechaza si el descuento no se puede aplicar', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique.mockResolvedValueOnce(tramoDisponible);
			prisma.tramo.updateMany.mockResolvedValue({ count: 0 });
			const { service } = createService(prisma);

			await expect(service.confirmar('uuid-reserva', 'uuid-admin')).rejects.toBeInstanceOf(
				ConflictException,
			);
			expect(prisma.trip.create).not.toHaveBeenCalled();
			expect(prisma.reserva.update).not.toHaveBeenCalled();
		});

		it('rechaza una reserva que ya fue procesada', async () => {
			const prisma = prismaMock();
			prisma.reserva.findUnique.mockResolvedValue({
				...reservaPendiente,
				estado: EstadoReserva.CONFIRMADA,
			});
			const { service } = createService(prisma);

			await expect(service.confirmar('uuid-reserva', 'uuid-admin')).rejects.toBeInstanceOf(
				ConflictException,
			);
			expect(prisma.tramo.updateMany).not.toHaveBeenCalled();
		});

		it('rechaza si no queda cupo para la cantidad solicitada', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique.mockResolvedValueOnce({ ...tramoDisponible, cupo: 1 });
			const { service } = createService(prisma);

			await expect(service.confirmar('uuid-reserva', 'uuid-admin')).rejects.toBeInstanceOf(
				ConflictException,
			);
			expect(prisma.tramo.updateMany).not.toHaveBeenCalled();
		});

		it('no descuenta cupo si la lancha está ocupada en la franja', async () => {
			const prisma = prismaMock();
			prisma.tramo.findUnique.mockResolvedValueOnce(tramoDisponible);
			const { service, schedule } = createService(prisma, {
				assertSlotsAvailable: vi.fn().mockRejectedValue(
					new ConflictException('La embarcación ya tiene un viaje o salida asignado en esa franja horaria.'),
				),
			});

			await expect(service.confirmar('uuid-reserva', 'uuid-admin')).rejects.toBeInstanceOf(
				ConflictException,
			);
			expect(schedule.assertSlotsAvailable).toHaveBeenCalledWith('uuid-lancha', [futuro], {
				excludeSalidaId: 'uuid-salida',
				excludeTramoId: 'uuid-tramo',
			});
			expect(prisma.tramo.updateMany).not.toHaveBeenCalled();
		});
	});

	describe('updateEstado', () => {
		it('rechaza una reserva pendiente sin tocar el cupo', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await service.updateEstado('uuid-reserva', 'RECHAZADA', 'Sin cupo para esa fecha', 'uuid-admin');

			expect(prisma.tramo.update).not.toHaveBeenCalled();
			expect(prisma.trip.updateMany).not.toHaveBeenCalled();
			expect(prisma.reserva.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						estado: EstadoReserva.RECHAZADA,
						adminNote: 'Sin cupo para esa fecha',
						reviewedById: 'uuid-admin',
					}),
				}),
			);
		});

		it('cancela una reserva confirmada y restaura el cupo', async () => {
			const prisma = prismaMock();
			prisma.reserva.findUnique.mockResolvedValue({
				...reservaPendiente,
				estado: EstadoReserva.CONFIRMADA,
				cupoDescontado: true,
				tripId: 'uuid-viaje',
				trip: { id: 'uuid-viaje', status: TripStatus.CONFIRMED },
			});
			prisma.tramo.findUnique.mockResolvedValue({ cupo: 4, estado: EstadoTramo.CERRADO });
			const { service } = createService(prisma);

			await service.updateEstado('uuid-reserva', 'CANCELADA', undefined, 'uuid-admin');

			expect(prisma.tramo.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 'uuid-tramo' },
					data: { cupo: { increment: 2 }, estado: EstadoTramo.DISPONIBLE },
				}),
			);
			expect(prisma.trip.updateMany).toHaveBeenCalledWith({
				where: { id: 'uuid-viaje', status: { in: [TripStatus.PENDING, TripStatus.ASSIGNED, TripStatus.CONFIRMED] } },
				data: { status: TripStatus.CANCELLED },
			});
			expect(prisma.reserva.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 'uuid-reserva' },
					data: expect.objectContaining({ cupoDescontado: false }),
				}),
			);
			expect(prisma.reserva.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ estado: EstadoReserva.CANCELADA }),
				}),
			);
		});

		it('no permite transiciones inválidas', async () => {
			const prisma = prismaMock();
			prisma.reserva.findUnique.mockResolvedValue({
				...reservaPendiente,
				estado: EstadoReserva.RECHAZADA,
			});
			const { service } = createService(prisma);

			await expect(
				service.updateEstado('uuid-reserva', 'CANCELADA', undefined, 'uuid-admin'),
			).rejects.toBeInstanceOf(BadRequestException);
			expect(prisma.reserva.update).not.toHaveBeenCalled();
		});

		it('no permite cancelar una reserva con viaje completado', async () => {
			const prisma = prismaMock();
			prisma.reserva.findUnique.mockResolvedValue({
				...reservaPendiente,
				estado: EstadoReserva.CONFIRMADA,
				cupoDescontado: true,
				tripId: 'uuid-viaje',
				trip: { id: 'uuid-viaje', status: TripStatus.COMPLETED },
			});
			const { service } = createService(prisma);

			await expect(
				service.updateEstado('uuid-reserva', 'CANCELADA', undefined, 'uuid-admin'),
			).rejects.toBeInstanceOf(ConflictException);
			expect(prisma.tramo.update).not.toHaveBeenCalled();
		});

		it('rechaza una reserva inexistente', async () => {
			const prisma = prismaMock();
			prisma.reserva.findUnique.mockResolvedValue(null);
			const { service } = createService(prisma);

			await expect(
				service.updateEstado('uuid-reserva', 'RECHAZADA', undefined, 'uuid-admin'),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('anularPorViaje', () => {
		it('restaura el cupo y anula la reserva del viaje', async () => {
			const prisma = prismaMock();
			prisma.reserva.findFirst.mockResolvedValue({
				id: 'uuid-reserva',
				tramoId: 'uuid-tramo',
				cantidadPasajeros: 2,
			});
			prisma.tramo.findUnique.mockResolvedValue({ cupo: 4, estado: EstadoTramo.CERRADO });
			const { service } = createService(prisma);

			await service.anularPorViaje(prisma as never, 'uuid-viaje');

			expect(prisma.reserva.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({ where: { tripId: 'uuid-viaje', cupoDescontado: true } }),
			);
			expect(prisma.tramo.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: { cupo: { increment: 2 }, estado: EstadoTramo.DISPONIBLE },
				}),
			);
			expect(prisma.reserva.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						estado: EstadoReserva.CANCELADA,
						cupoDescontado: false,
					}),
				}),
			);
		});

		it('no hace nada si el viaje no tiene cupo descontado', async () => {
			const prisma = prismaMock();
			prisma.reserva.findFirst.mockResolvedValue(null);
			const { service } = createService(prisma);

			await service.anularPorViaje(prisma as never, 'uuid-viaje');

			expect(prisma.tramo.update).not.toHaveBeenCalled();
			expect(prisma.reserva.update).not.toHaveBeenCalled();
		});
	});

	describe('list', () => {
		it('filtra por estado y por búsqueda de contacto', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await service.list({
				estado: EstadoReserva.PENDIENTE,
				q: 'María',
				page: 1,
				limit: 20,
			});

			expect(prisma.reserva.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						estado: EstadoReserva.PENDIENTE,
						OR: expect.arrayContaining([
							expect.objectContaining({ nombre: expect.objectContaining({ contains: 'María' }) }),
						]),
					}),
				}),
			);
			expect(prisma.reserva.count).toHaveBeenCalled();
		});

		it('devuelve la página vacía cuando no hay reservas', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			const result = await service.list({ page: 1, limit: 20 });

			expect(result).toEqual({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
		});
	});
});
