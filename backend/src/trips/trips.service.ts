import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EstadoEmbarcacion, OwnerStatus, Prisma, TripStatus } from '../generated/prisma/client.js';
import { buildPaginated } from '../common/dto/paginated-response.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BoatScheduleService } from '../boats/boat-schedule.service.js';
import { ReservasService } from '../reservas/reservas.service.js';
import type { CreateTripDto } from './create-trip.dto.js';
import type { ListTripsQueryDto } from './list-trips-query.dto.js';

@Injectable()
export class TripsService {
	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(BoatScheduleService) private readonly schedule: BoatScheduleService,
		@Inject(ReservasService) private readonly reservas: ReservasService,
	) {}

	async list(query: ListTripsQueryDto) {
		const page = Number(query.page) || 1;
		const limit = Number(query.limit) || 20;
		const where: Prisma.TripWhereInput = {};
		if (query.scope === 'active') {
			where.status = { in: [TripStatus.PENDING, TripStatus.ASSIGNED, TripStatus.CONFIRMED] };
		} else if (query.scope === 'history') {
			where.status = { in: [TripStatus.COMPLETED, TripStatus.CANCELLED] };
		} else if (query.status) {
			where.status = query.status;
		}

		const q = query.q?.trim();
		if (q) {
			where.OR = [
				{
					cliente: {
						OR: [
							{ nombre: { contains: q, mode: 'insensitive' } },
							{ telefono: { contains: q, mode: 'insensitive' } },
							{ email: { contains: q, mode: 'insensitive' } },
						],
					},
				},
				{ origin: { contains: q, mode: 'insensitive' } },
				{ destination: { contains: q, mode: 'insensitive' } },
			];
		}

		const scheduledAt: Prisma.DateTimeFilter = {};
		if (query.fechaDesde) scheduledAt.gte = new Date(query.fechaDesde);
		if (query.fechaHasta) scheduledAt.lte = finDeDia(query.fechaHasta);
		if (query.fechaDesde || query.fechaHasta) where.scheduledAt = scheduledAt;

		const [data, total] = await Promise.all([
			this.prisma.trip.findMany({
				where,
				orderBy: { scheduledAt: 'desc' },
				skip: (page - 1) * limit,
				take: limit,
				select: {
					id: true,
					scheduledAt: true,
					passengerCount: true,
					origin: true,
					destination: true,
					status: true,
					cliente: { select: { nombre: true, telefono: true, email: true } },
					embarcacion: {
						select: {
							id: true,
							nombre: true,
							matricula: true,
							capacidad: true,
							propietario: {
								select: {
									phone: true,
									whatsappPhone: true,
									user: { select: { name: true } },
								},
							},
						},
					},
				},
			}),
			this.prisma.trip.count({ where }),
		]);

		return buildPaginated(data, total, page, limit);
	}

	async create(dto: CreateTripDto, adminId: string) {
		const scheduledAt = new Date(dto.scheduledAt);
		const boat = dto.boatId ? await this.getApprovedBoat(dto.boatId, dto.passengerCount) : null;
		if (boat) {
			await this.schedule.assertSlotsAvailable(boat.id, [scheduledAt]);
		}
		return this.prisma.$transaction(async (transaction) => {
			const client = dto.clientEmail
				? await transaction.cliente.upsert({
						where: { email: dto.clientEmail.trim().toLowerCase() },
						update: { nombre: dto.clientName.trim(), telefono: dto.clientPhone.trim() },
						create: {
							nombre: dto.clientName.trim(),
							telefono: dto.clientPhone.trim(),
							email: dto.clientEmail.trim().toLowerCase(),
						},
					})
				: await transaction.cliente.create({
						data: { nombre: dto.clientName.trim(), telefono: dto.clientPhone.trim() },
					});

			return transaction.trip.create({
				data: {
					clienteId: client.id,
					createdById: adminId,
					embarcacionId: boat?.id,
					scheduledAt,
					passengerCount: dto.passengerCount,
					origin: dto.origin.trim(),
					destination: dto.destination.trim(),
					status: boat ? TripStatus.ASSIGNED : TripStatus.PENDING,
				},
				select: { id: true, status: true, scheduledAt: true, origin: true, destination: true },
			});
		});
	}

	async updateStatus(id: string, status: TripStatus) {
		const trip = await this.prisma.trip.findUnique({
			where: { id },
			select: { id: true, status: true, embarcacionId: true, review: { select: { id: true } } },
		});
		if (!trip) throw new NotFoundException('No se encontró el viaje.');
		const assignedStatuses: TripStatus[] = [
			TripStatus.ASSIGNED,
			TripStatus.CONFIRMED,
			TripStatus.COMPLETED,
		];
		if (assignedStatuses.includes(status) && !trip.embarcacionId) {
			throw new BadRequestException('Asigná una embarcación aprobada antes de avanzar el viaje.');
		}
		if (trip.review && status !== TripStatus.COMPLETED) {
			throw new BadRequestException('No se puede reabrir un viaje con reseña enviada.');
		}
		const allowedTransitions: Record<TripStatus, TripStatus[]> = {
			[TripStatus.PENDING]: [TripStatus.CANCELLED],
			[TripStatus.ASSIGNED]: [TripStatus.CONFIRMED, TripStatus.CANCELLED],
			[TripStatus.CONFIRMED]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
			[TripStatus.COMPLETED]: [],
			[TripStatus.CANCELLED]: [],
		};
		if (!allowedTransitions[trip.status].includes(status)) {
			throw new BadRequestException('La transición de estado del viaje no está permitida.');
		}
		return this.prisma.$transaction(async (transaction) => {
			const actualizado = await transaction.trip.update({
				where: { id },
				data: { status },
				select: { id: true, status: true, scheduledAt: true },
			});
			if (status === TripStatus.CANCELLED) {
				await this.reservas.anularPorViaje(transaction, id);
			}
			return actualizado;
		});
	}

	async assignBoat(id: string, boatId: string) {
		const trip = await this.prisma.trip.findUnique({
			where: { id },
			select: { id: true, status: true, passengerCount: true, scheduledAt: true, tramoId: true, salidaId: true },
		});
		if (!trip) throw new NotFoundException('No se encontró el viaje.');
		if (trip.status !== TripStatus.PENDING) throw new BadRequestException('El viaje ya fue asignado o cerrado.');
		const boat = await this.getApprovedBoat(boatId, trip.passengerCount);
		await this.schedule.assertSlotsAvailable(boat.id, [trip.scheduledAt], {
			excludeTripId: trip.id,
			excludeTramoId: trip.tramoId ?? undefined,
			excludeSalidaId: trip.salidaId ?? undefined,
		});
		return this.prisma.trip.update({
			where: { id },
			data: { embarcacionId: boat.id, status: TripStatus.ASSIGNED },
			select: { id: true, status: true, embarcacionId: true },
		});
	}

	private async getApprovedBoat(id: string, passengers: number) {
		const boat = await this.prisma.embarcacion.findUnique({
			where: { id },
			select: { id: true, capacidad: true, estado: true, propietario: { select: { status: true } } },
		});
		if (!boat) throw new NotFoundException('No se encontró la embarcación.');
		if (boat.estado !== EstadoEmbarcacion.VERIFICADA || boat.propietario.status !== OwnerStatus.APPROVED) {
			throw new BadRequestException('Solo se pueden asignar lanchas y lancheros aprobados.');
		}
		if (boat.capacidad < passengers) throw new BadRequestException('La embarcación no tiene capacidad suficiente.');
		return boat;
	}
}

function finDeDia(value: string): Date {
	const date = new Date(value);
	if (value.includes('T')) return date;
	return new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1);
}
