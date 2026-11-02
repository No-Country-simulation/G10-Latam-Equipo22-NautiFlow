import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
	EstadoEmbarcacion,
	EstadoReserva,
	EstadoSalida,
	EstadoTramo,
	OwnerStatus,
	Prisma,
	TripStatus,
} from '../generated/prisma/client.js';
import { buildPaginated } from '../common/dto/paginated-response.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BoatScheduleService } from '../boats/boat-schedule.service.js';
import type { CreateReservaDto } from './create-reserva.dto.js';
import type { ListReservasQueryDto } from './list-reservas-query.dto.js';

const TRAMO_SELECT = {
	id: true,
	salidaId: true,
	tipo: true,
	origen: true,
	destino: true,
	fechaHora: true,
	cupo: true,
	precioCentavos: true,
	estado: true,
	salida: {
		select: {
			id: true,
			fechaSalida: true,
			estado: true,
			embarcacionId: true,
			embarcacion: {
				select: {
					id: true,
					capacidad: true,
					estado: true,
					propietario: { select: { status: true, user: { select: { status: true } } } },
				},
			},
		},
	},
} satisfies Prisma.TramoSelect;

const RESERVA_ADMIN_SELECT = {
	id: true,
	tramoId: true,
	salidaId: true,
	nombre: true,
	telefono: true,
	email: true,
	cantidadPasajeros: true,
	mensaje: true,
	origen: true,
	destino: true,
	fechaHora: true,
	precioCentavos: true,
	estado: true,
	cupoDescontado: true,
	adminNote: true,
	reviewedAt: true,
	createdAt: true,
	updatedAt: true,
	tramo: { select: { tipo: true, cupo: true, estado: true, sinTuristas: true } },
	salida: {
		select: {
			id: true,
			fechaSalida: true,
			estado: true,
			embarcacion: { select: { id: true, nombre: true, matricula: true, capacidad: true } },
		},
	},
	trip: { select: { id: true, status: true, scheduledAt: true } },
} satisfies Prisma.ReservaSelect;

const TRANSICIONES: Record<EstadoReserva, EstadoReserva[]> = {
	[EstadoReserva.PENDIENTE]: [EstadoReserva.RECHAZADA, EstadoReserva.CANCELADA],
	[EstadoReserva.CONFIRMADA]: [EstadoReserva.CANCELADA],
	[EstadoReserva.RECHAZADA]: [],
	[EstadoReserva.CANCELADA]: [],
};

const VIAJES_CANCELABLES: TripStatus[] = [TripStatus.PENDING, TripStatus.ASSIGNED, TripStatus.CONFIRMED];

@Injectable()
export class ReservasService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly schedule: BoatScheduleService,
	) {}

	async create(dto: CreateReservaDto) {
		const tramo = await this.prisma.tramo.findUnique({
			where: { id: dto.tramoId },
			select: TRAMO_SELECT,
		});
		if (!tramo) throw new NotFoundException('No se encontró el tramo.');

		const salida = tramo.salida;
		const ahora = new Date();
		if (salida.estado !== EstadoSalida.PROGRAMADA || salida.fechaSalida <= ahora) {
			throw new ConflictException('La salida ya no está disponible para reservar.');
		}
		if (tramo.fechaHora <= ahora) {
			throw new ConflictException('El tramo ya salió; no admite nuevas reservas.');
		}
		if (tramo.estado !== EstadoTramo.DISPONIBLE) {
			throw new ConflictException('El tramo no admite nuevas reservas.');
		}
		if (tramo.cupo < dto.cantidadPasajeros) {
			throw new ConflictException('No hay cupo suficiente para la cantidad de pasajeros solicitada.');
		}
		if (dto.cantidadPasajeros > salida.embarcacion.capacidad) {
			throw new BadRequestException('La cantidad de pasajeros supera la capacidad de la embarcación.');
		}
		if (!this.embarcacionHabilitada(salida.embarcacion)) {
			throw new ConflictException('La embarcación ya no está habilitada para reservas.');
		}

		return this.prisma.reserva.create({
			data: {
				tramoId: tramo.id,
				salidaId: salida.id,
				nombre: dto.nombre.trim(),
				telefono: dto.telefono.trim(),
				email: dto.email?.trim().toLowerCase(),
				cantidadPasajeros: dto.cantidadPasajeros,
				mensaje: dto.mensaje?.trim() || null,
				origen: tramo.origen,
				destino: tramo.destino,
				fechaHora: tramo.fechaHora,
				precioCentavos: tramo.precioCentavos,
			},
			select: {
				id: true,
				estado: true,
				nombre: true,
				telefono: true,
				email: true,
				cantidadPasajeros: true,
				mensaje: true,
				origen: true,
				destino: true,
				fechaHora: true,
				precioCentavos: true,
				createdAt: true,
			},
		});
	}

	async list(query: ListReservasQueryDto) {
		const where: Prisma.ReservaWhereInput = {};
		if (query.estado) where.estado = query.estado;
		if (query.salidaId) where.salidaId = query.salidaId;
		if (query.tramoId) where.tramoId = query.tramoId;
		if (query.fechaDesde || query.fechaHasta) {
			where.createdAt = {
				...(query.fechaDesde ? { gte: new Date(query.fechaDesde) } : {}),
				...(query.fechaHasta ? { lte: finDeDia(new Date(query.fechaHasta)) } : {}),
			};
		}
		if (query.q) {
			const busqueda = query.q.trim();
			where.OR = [
				{ nombre: { contains: busqueda, mode: 'insensitive' } },
				{ telefono: { contains: busqueda, mode: 'insensitive' } },
				{ email: { contains: busqueda, mode: 'insensitive' } },
			];
		}

		const [data, total] = await Promise.all([
			this.prisma.reserva.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (query.page - 1) * query.limit,
				take: query.limit,
				select: RESERVA_ADMIN_SELECT,
			}),
			this.prisma.reserva.count({ where }),
		]);

		return buildPaginated(data, total, query.page, query.limit);
	}

	async detail(id: string) {
		const reserva = await this.prisma.reserva.findUnique({
			where: { id },
			select: { ...RESERVA_ADMIN_SELECT, reviewedBy: { select: { name: true } } },
		});
		if (!reserva) throw new NotFoundException('No se encontró la reserva.');
		return reserva;
	}

	async confirmar(id: string, adminId: string) {
		const reserva = await this.prisma.reserva.findUnique({
			where: { id },
			select: {
				id: true,
				estado: true,
				tramoId: true,
				salidaId: true,
				email: true,
				nombre: true,
				telefono: true,
				cantidadPasajeros: true,
			},
		});
		if (!reserva) throw new NotFoundException('No se encontró la reserva.');
		if (reserva.estado !== EstadoReserva.PENDIENTE) {
			throw new ConflictException('La reserva ya fue procesada.');
		}

		const tramo = await this.prisma.tramo.findUnique({
			where: { id: reserva.tramoId },
			select: TRAMO_SELECT,
		});
		if (!tramo) throw new NotFoundException('No se encontró el tramo.');

		const salida = tramo.salida;
		const ahora = new Date();
		if (salida.estado !== EstadoSalida.PROGRAMADA || salida.fechaSalida <= ahora) {
			throw new ConflictException('La salida ya no está disponible para confirmar reservas.');
		}
		if (tramo.fechaHora <= ahora) {
			throw new ConflictException('El tramo ya salió; no se puede confirmar la reserva.');
		}
		if (tramo.estado !== EstadoTramo.DISPONIBLE) {
			throw new ConflictException('El tramo ya no admite confirmaciones.');
		}
		if (tramo.cupo < reserva.cantidadPasajeros) {
			throw new ConflictException('No hay cupo disponible para confirmar la reserva.');
		}
		if (!this.embarcacionHabilitada(salida.embarcacion)) {
			throw new ConflictException('La embarcación ya no está habilitada para esta salida.');
		}

		await this.schedule.assertSlotsAvailable(salida.embarcacionId, [tramo.fechaHora], {
			excludeSalidaId: salida.id,
			excludeTramoId: tramo.id,
		});

		return this.prisma.$transaction(async (tx) => {
			const descuento = await tx.tramo.updateMany({
				where: {
					id: tramo.id,
					estado: EstadoTramo.DISPONIBLE,
					cupo: { gte: reserva.cantidadPasajeros },
				},
				data: { cupo: { decrement: reserva.cantidadPasajeros } },
			});
			if (descuento.count === 0) {
				throw new ConflictException('No hay cupo disponible para confirmar la reserva.');
			}

			const tramoActualizado = await tx.tramo.findUnique({
				where: { id: tramo.id },
				select: { cupo: true },
			});
			if (tramoActualizado?.cupo === 0) {
				await tx.tramo.update({
					where: { id: tramo.id },
					data: { estado: EstadoTramo.CERRADO },
				});
			}

			const cliente = reserva.email
				? await tx.cliente.upsert({
						where: { email: reserva.email },
						update: { nombre: reserva.nombre.trim(), telefono: reserva.telefono.trim() },
						create: {
							nombre: reserva.nombre.trim(),
							telefono: reserva.telefono.trim(),
							email: reserva.email,
						},
					})
				: await tx.cliente.create({
						data: { nombre: reserva.nombre.trim(), telefono: reserva.telefono.trim() },
					});

			const trip = await tx.trip.create({
				data: {
					clienteId: cliente.id,
					createdById: adminId,
					embarcacionId: salida.embarcacionId,
					scheduledAt: tramo.fechaHora,
					passengerCount: reserva.cantidadPasajeros,
					origin: tramo.origen,
					destination: tramo.destino,
					status: TripStatus.CONFIRMED,
					salidaId: salida.id,
					tramoId: tramo.id,
				},
				select: { id: true, status: true, scheduledAt: true, origin: true, destination: true },
			});

			const actualizada = await tx.reserva.update({
				where: { id: reserva.id },
				data: {
					estado: EstadoReserva.CONFIRMADA,
					tripId: trip.id,
					cupoDescontado: true,
					reviewedById: adminId,
					reviewedAt: new Date(),
				},
				select: RESERVA_ADMIN_SELECT,
			});

			return { reserva: actualizada, trip };
		});
	}

	async updateEstado(id: string, estado: 'RECHAZADA' | 'CANCELADA', nota: string | undefined, adminId: string) {
		const reserva = await this.prisma.reserva.findUnique({
			where: { id },
			select: {
				id: true,
				estado: true,
				tramoId: true,
				cantidadPasajeros: true,
				cupoDescontado: true,
				tripId: true,
				trip: { select: { id: true, status: true } },
			},
		});
		if (!reserva) throw new NotFoundException('No se encontró la reserva.');
		if (!TRANSICIONES[reserva.estado].includes(estado)) {
			throw new BadRequestException('La transición de estado de la reserva no está permitida.');
		}
		if (estado === 'CANCELADA' && reserva.trip && reserva.trip.status === TripStatus.COMPLETED) {
			throw new ConflictException('No se puede cancelar una reserva cuyo viaje ya fue completado.');
		}

		return this.prisma.$transaction(async (tx) => {
			if (estado === 'CANCELADA' && reserva.cupoDescontado) {
				await restaurarCupo(tx, reserva.tramoId, reserva.cantidadPasajeros);
				await tx.reserva.update({
					where: { id: reserva.id },
					data: { cupoDescontado: false },
				});
			}
			if (estado === 'CANCELADA' && reserva.tripId) {
				await tx.trip.updateMany({
					where: { id: reserva.tripId, status: { in: VIAJES_CANCELABLES } },
					data: { status: TripStatus.CANCELLED },
				});
			}

			return tx.reserva.update({
				where: { id: reserva.id },
				data: {
					estado,
					adminNote: nota?.trim() ?? null,
					reviewedById: adminId,
					reviewedAt: new Date(),
				},
				select: RESERVA_ADMIN_SELECT,
			});
		});
	}

	/// Cancela la reserva vinculada a un viaje y le devuelve el cupo al tramo.
	async anularPorViaje(tx: Prisma.TransactionClient, tripId: string) {
		const reserva = await tx.reserva.findFirst({
			where: { tripId, cupoDescontado: true },
			select: { id: true, tramoId: true, cantidadPasajeros: true },
		});
		if (!reserva) return;

		await restaurarCupo(tx, reserva.tramoId, reserva.cantidadPasajeros);
		await tx.reserva.update({
			where: { id: reserva.id },
			data: { estado: EstadoReserva.CANCELADA, cupoDescontado: false, reviewedAt: new Date() },
		});
	}

	private embarcacionHabilitada(embarcacion: {
		estado: EstadoEmbarcacion;
		propietario: { status: OwnerStatus; user: { status: string } };
	}) {
		return (
			embarcacion.estado === EstadoEmbarcacion.VERIFICADA &&
			embarcacion.propietario.status === OwnerStatus.APPROVED &&
			embarcacion.propietario.user.status === 'ACTIVE'
		);
	}
}

async function restaurarCupo(tx: Prisma.TransactionClient, tramoId: string, cantidad: number) {
	const tramo = await tx.tramo.findUnique({
		where: { id: tramoId },
		select: { cupo: true, estado: true },
	});
	if (!tramo) return;

	await tx.tramo.update({
		where: { id: tramoId },
		data: {
			cupo: { increment: cantidad },
			...(tramo.estado === EstadoTramo.CERRADO ? { estado: EstadoTramo.DISPONIBLE } : {}),
		},
	});
}

function finDeDia(date: Date) {
	const fin = new Date(date);
	fin.setHours(23, 59, 59, 999);
	return fin;
}
