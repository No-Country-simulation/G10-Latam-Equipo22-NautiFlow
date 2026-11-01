import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	EstadoEmbarcacion,
	EstadoSalida,
	EstadoTramo,
	OwnerStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BoatScheduleService } from '../boats/boat-schedule.service.js';
import { SalidasService } from './salidas.service.js';

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

function createService(prismaMock: object, scheduleOverride?: Partial<BoatScheduleService>) {
	const schedule = {
		assertSlotAvailable: vi.fn().mockResolvedValue(undefined),
		...scheduleOverride,
	} as unknown as BoatScheduleService;
	return {
		service: new SalidasService(prismaMock as unknown as PrismaService, schedule),
		schedule,
	};
}

function prismaMock({
	boat = {
		id: 'uuid-lancha',
		capacidad: 10,
		estado: EstadoEmbarcacion.VERIFICADA,
		propietario: {
			status: OwnerStatus.APPROVED,
			user: { status: 'ACTIVE' },
		},
	},
	salida = null,
	salidaFindFirst = null,
	createdSalida = { id: 'uuid-salida' },
	updatedSalida = { id: 'uuid-salida', fechaSalida: futureDate, estado: EstadoSalida.PROGRAMADA },
	tramoCreateMany = vi.fn().mockResolvedValue({ count: 2 }),
}: {
	boat?: object | null;
	salida?: object | null;
	salidaFindFirst?: object | null;
	createdSalida?: object;
	updatedSalida?: object;
	tramoCreateMany?: ReturnType<typeof vi.fn>;
} = {}) {
	const prisma = {
		embarcacion: { findUnique: vi.fn().mockResolvedValue(boat) },
		salida: {
			findUnique: vi.fn().mockResolvedValue(salida),
			findFirst: vi.fn().mockResolvedValue(salidaFindFirst),
			findMany: vi.fn().mockResolvedValue([]),
			count: vi.fn().mockResolvedValue(0),
			create: vi.fn().mockResolvedValue(createdSalida),
			update: vi.fn().mockResolvedValue(updatedSalida),
		},
		tramo: {
			createMany: tramoCreateMany,
			findMany: vi.fn().mockResolvedValue([]),
		},
		review: {
			groupBy: vi.fn().mockResolvedValue([]),
			aggregate: vi.fn().mockResolvedValue({ _avg: { rating: null }, _count: { _all: 0 } }),
		},
		$transaction: vi.fn(),
	};
	prisma.$transaction.mockImplementation(async (callback: (tx: object) => unknown) => callback(prisma));
	return prisma;
}

function createDto(overrides: object = {}) {
	return {
		embarcacionId: 'uuid-lancha',
		fechaSalida: futureDate.toISOString(),
		tramos: [
			{
				tipo: 'IDA',
				origen: 'Delta del Tigre',
				destino: 'Tigre Centro',
				fechaHora: futureDate.toISOString(),
				precioCentavos: 50000,
			},
		],
		...overrides,
	};
}

describe('SalidasService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('create', () => {
		it('rechaza una fecha de salida pasada', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await expect(
				service.create(createDto({ fechaSalida: new Date(Date.now() - 1000).toISOString() }), 'uuid-admin'),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('rechaza si la embarcación no existe', async () => {
			const prisma = prismaMock({ boat: null });
			const { service } = createService(prisma);

			await expect(service.create(createDto(), 'uuid-admin')).rejects.toBeInstanceOf(NotFoundException);
		});

		it('rechaza embarcaciones no verificadas o no aprobadas', async () => {
			const prisma = prismaMock({
				boat: {
					id: 'uuid-lancha',
					capacidad: 10,
					estado: EstadoEmbarcacion.PENDIENTE,
					propietario: { status: OwnerStatus.APPROVED, user: { status: 'ACTIVE' } },
				},
			});
			const { service } = createService(prisma);

			await expect(service.create(createDto(), 'uuid-admin')).rejects.toBeInstanceOf(BadRequestException);
		});

		it('rechaza si no hay tramos', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await expect(
				service.create(createDto({ tramos: [] }), 'uuid-admin'),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('rechaza si no hay tramo IDA', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await expect(
				service.create(
					createDto({
						tramos: [
							{ tipo: 'VUELTA', origen: 'Tigre', destino: 'Delta', fechaHora: futureDate.toISOString(), precioCentavos: 30000 },
						],
					}),
					'uuid-admin',
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('rechaza más de un tramo IDA', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await expect(
				service.create(
					createDto({
						tramos: [
							{ tipo: 'IDA', origen: 'A', destino: 'B', fechaHora: futureDate.toISOString(), precioCentavos: 100 },
							{ tipo: 'IDA', origen: 'C', destino: 'D', fechaHora: futureDate.toISOString(), precioCentavos: 200 },
						],
					}),
					'uuid-admin',
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('rechaza más de un tramo VUELTA', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await expect(
				service.create(
					createDto({
						tramos: [
							{ tipo: 'IDA', origen: 'A', destino: 'B', fechaHora: futureDate.toISOString(), precioCentavos: 100 },
							{ tipo: 'VUELTA', origen: 'B', destino: 'A', fechaHora: futureDate.toISOString(), precioCentavos: 200 },
							{ tipo: 'VUELTA', origen: 'B', destino: 'A', fechaHora: futureDate.toISOString(), precioCentavos: 300 },
						],
					}),
					'uuid-admin',
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('rechaza IDA anterior a la salida', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await expect(
				service.create(
					createDto({
						tramos: [
							{ tipo: 'IDA', origen: 'A', destino: 'B', fechaHora: new Date(Date.now() + 1000).toISOString(), precioCentavos: 100 },
						],
					}),
					'uuid-admin',
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('rechaza VUELTA no posterior a la salida', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await expect(
				service.create(
					createDto({
						tramos: [
							{ tipo: 'IDA', origen: 'A', destino: 'B', fechaHora: futureDate.toISOString(), precioCentavos: 100 },
							{ tipo: 'VUELTA', origen: 'B', destino: 'A', fechaHora: futureDate.toISOString(), precioCentavos: 200 },
						],
					}),
					'uuid-admin',
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('rechaza si hay conflicto de horario', async () => {
			const prisma = prismaMock();
			const { service, schedule } = createService(prisma, {
				assertSlotAvailable: vi.fn().mockRejectedValue(
					new ConflictException('La embarcación ya tiene un viaje o salida asignado en esa franja horaria.'),
				),
			});

			await expect(service.create(createDto(), 'uuid-admin')).rejects.toBeInstanceOf(ConflictException);
			expect(prisma.salida.create).not.toHaveBeenCalled();
			expect(schedule.assertSlotAvailable).toHaveBeenCalledWith('uuid-lancha', futureDate);
		});

		it('crea la salida con cupo por defecto igual a la capacidad', async () => {
			const salidaResult = {
				id: 'uuid-salida',
				fechaSalida: futureDate,
				estado: EstadoSalida.PROGRAMADA,
				createdAt: new Date(),
				embarcacion: { id: 'uuid-lancha', nombre: 'Lancha', matricula: 'AR-123', capacidad: 10 },
				createdBy: { name: 'Admin' },
				tramos: [],
			};
			const prisma = prismaMock({ salida: salidaResult });
			const { service } = createService(prisma);

			await service.create(createDto(), 'uuid-admin');

			expect(prisma.tramo.createMany).toHaveBeenCalledWith({
				data: [
					expect.objectContaining({
						tipo: 'IDA',
						cupo: 10,
						precioCentavos: 50000,
						sinTuristas: false,
						estado: EstadoTramo.DISPONIBLE,
					}),
				],
			});
		});

		it('crea la salida con cupo personalizado', async () => {
			const salidaResult = {
				id: 'uuid-salida',
				fechaSalida: futureDate,
				estado: EstadoSalida.PROGRAMADA,
				createdAt: new Date(),
				embarcacion: { id: 'uuid-lancha', nombre: 'Lancha', matricula: 'AR-123', capacidad: 10 },
				createdBy: { name: 'Admin' },
				tramos: [],
			};
			const prisma = prismaMock({ salida: salidaResult });
			const { service } = createService(prisma);

			await service.create(
				createDto({
					tramos: [
						{ tipo: 'IDA', origen: 'A', destino: 'B', fechaHora: futureDate.toISOString(), cupo: 5, precioCentavos: 100 },
					],
				}),
				'uuid-admin',
			);

			expect(prisma.tramo.createMany).toHaveBeenCalledWith({
				data: [
					expect.objectContaining({ cupo: 5 }),
				],
			});
		});

		it('crea la salida en una transacción', async () => {
			const salidaResult = {
				id: 'uuid-salida',
				fechaSalida: futureDate,
				estado: EstadoSalida.PROGRAMADA,
				createdAt: new Date(),
				embarcacion: { id: 'uuid-lancha', nombre: 'Lancha', matricula: 'AR-123', capacidad: 10 },
				createdBy: { name: 'Admin' },
				tramos: [],
			};
			const prisma = prismaMock({ salida: salidaResult });
			const { service } = createService(prisma);

			await service.create(createDto(), 'uuid-admin');

			expect(prisma.$transaction).toHaveBeenCalledTimes(1);
			expect(prisma.salida.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						embarcacionId: 'uuid-lancha',
						createdById: 'uuid-admin',
						estado: EstadoSalida.PROGRAMADA,
					}),
				}),
			);
		});
	});

	describe('list', () => {
		it('filtra por estado', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await service.list({ estado: EstadoSalida.CANCELADA, page: 1, limit: 20 });

			expect(prisma.salida.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { estado: EstadoSalida.CANCELADA },
				}),
			);
		});
	});

	describe('adminDetail', () => {
		it('lanza 404 si la salida no existe', async () => {
			const prisma = prismaMock({ salida: null });
			const { service } = createService(prisma);

			await expect(service.adminDetail('uuid-salida')).rejects.toBeInstanceOf(NotFoundException);
		});

		it('devuelve la salida con tramos', async () => {
			const salida = {
				id: 'uuid-salida',
				fechaSalida: futureDate,
				estado: EstadoSalida.PROGRAMADA,
				createdAt: new Date(),
				embarcacion: { id: 'uuid-lancha', nombre: 'Lancha', matricula: 'AR-123', capacidad: 10 },
				createdBy: { name: 'Admin' },
				tramos: [],
			};
			const prisma = prismaMock({ salida });
			const { service } = createService(prisma);

			const result = await service.adminDetail('uuid-salida');
			expect(result.id).toBe('uuid-salida');
		});
	});

	describe('update', () => {
		it('lanza 404 si la salida no existe', async () => {
			const prisma = prismaMock({ salida: null });
			const { service } = createService(prisma);

			await expect(service.update('uuid-salida', { estado: 'CANCELADA' })).rejects.toBeInstanceOf(
				NotFoundException,
			);
		});

		it('rechaza fecha pasada al actualizar', async () => {
			const salida = { id: 'uuid-salida', fechaSalida: futureDate, estado: EstadoSalida.PROGRAMADA, embarcacionId: 'uuid-lancha' };
			const prisma = prismaMock({ salida });
			const { service } = createService(prisma);

			await expect(
				service.update('uuid-salida', { fechaSalida: new Date(Date.now() - 1000).toISOString() }),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('actualiza el estado', async () => {
			const salida = { id: 'uuid-salida', fechaSalida: futureDate, estado: EstadoSalida.PROGRAMADA, embarcacionId: 'uuid-lancha' };
			const prisma = prismaMock({ salida });
			const { service } = createService(prisma);

			await service.update('uuid-salida', { estado: EstadoSalida.CANCELADA });

			expect(prisma.salida.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: { estado: EstadoSalida.CANCELADA },
				}),
			);
		});
	});

	describe('listPublic', () => {
		it('solo muestra salidas programadas futuras', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await service.listPublic({ page: 1, limit: 20 });

			expect(prisma.salida.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						estado: EstadoSalida.PROGRAMADA,
						fechaSalida: { gte: expect.any(Date) },
					}),
				}),
			);
		});

		it('filtra por zona', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await service.listPublic({ zonaId: 'uuid-zona', page: 1, limit: 20 });

			expect(prisma.salida.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						embarcacion: expect.objectContaining({
							zonas: { some: { zonaId: 'uuid-zona' } },
						}),
					}),
				}),
			);
		});

		it('filtra por origen y destino en el tramo IDA', async () => {
			const prisma = prismaMock();
			const { service } = createService(prisma);

			await service.listPublic({ origen: 'Delta', destino: 'Tigre', page: 1, limit: 20 });

			expect(prisma.salida.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						tramos: {
							some: {
								tipo: 'IDA',
								origen: { contains: 'Delta', mode: 'insensitive' },
								destino: { contains: 'Tigre', mode: 'insensitive' },
							},
						},
					}),
				}),
			);
		});
	});

	describe('getPublic', () => {
		it('lanza 404 si la salida no existe o no es elegible', async () => {
			const prisma = prismaMock();
			prisma.salida.findFirst = vi.fn().mockResolvedValue(null);
			const { service } = createService(prisma);

			await expect(service.getPublic('uuid-salida')).rejects.toBeInstanceOf(NotFoundException);
		});

		it('devuelve la salida con rating y disponibilidad', async () => {
			const salida = {
				id: 'uuid-salida',
				fechaSalida: futureDate,
				embarcacion: {
					id: 'uuid-lancha',
					nombre: 'Lancha',
					capacidad: 10,
					descripcion: null,
					propietario: { whatsappPhone: null, user: { name: 'Owner' } },
					zonas: [],
					reviews: [],
				},
				tramos: [
					{
						id: 'uuid-tramo',
						tipo: 'IDA',
						origen: 'Delta',
						destino: 'Tigre',
						fechaHora: futureDate,
						cupo: 10,
						precioCentavos: 50000,
						sinTuristas: false,
						estado: EstadoTramo.DISPONIBLE,
					},
				],
			};
			const prisma = prismaMock({ salidaFindFirst: salida });
			const { service } = createService(prisma);

			const result = await service.getPublic('uuid-salida');
			expect(result.id).toBe('uuid-salida');
			expect(result.disponible).toBe(true);
			expect(result.rating).toEqual({ average: null, total: 0 });
		});

		it('marca como no disponible si todos los tramos están cerrados', async () => {
			const salida = {
				id: 'uuid-salida',
				fechaSalida: futureDate,
				embarcacion: {
					id: 'uuid-lancha',
					nombre: 'Lancha',
					capacidad: 10,
					descripcion: null,
					propietario: { whatsappPhone: null, user: { name: 'Owner' } },
					zonas: [],
					reviews: [],
				},
				tramos: [
					{
						id: 'uuid-tramo',
						tipo: 'IDA',
						origen: 'Delta',
						destino: 'Tigre',
						fechaHora: futureDate,
						cupo: 0,
						precioCentavos: 50000,
						sinTuristas: false,
						estado: EstadoTramo.CERRADO,
					},
				],
			};
			const prisma = prismaMock({ salidaFindFirst: salida });
			const { service } = createService(prisma);

			const result = await service.getPublic('uuid-salida');
			expect(result.disponible).toBe(false);
		});
	});
});
