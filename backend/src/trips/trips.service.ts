import { Injectable } from '@nestjs/common';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoEmbarcacion, OwnerStatus, TripStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTripDto } from './create-trip.dto.js';

@Injectable()
export class TripsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly config: ConfigService,
	) {}

	list() {
		return this.prisma.trip.findMany({
			orderBy: { scheduledAt: 'desc' },
			select: {
				id: true,
				scheduledAt: true,
				passengerCount: true,
				origin: true,
				destination: true,
				status: true,
				cliente: { select: { nombre: true, telefono: true, email: true } },
				embarcacion: { select: { id: true, nombre: true, matricula: true } },
			},
		});
	}

	async create(dto: CreateTripDto, adminId: string) {
		const scheduledAt = new Date(dto.scheduledAt);
		const boat = dto.boatId ? await this.getApprovedBoat(dto.boatId, dto.passengerCount) : null;
		if (boat) {
			await this.assertBoatSlotAvailable(boat.id, scheduledAt);
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
		return this.prisma.trip.update({
			where: { id },
			data: { status },
			select: { id: true, status: true, scheduledAt: true },
		});
	}

	async assignBoat(id: string, boatId: string) {
		const trip = await this.prisma.trip.findUnique({
			where: { id },
			select: { id: true, status: true, passengerCount: true, scheduledAt: true },
		});
		if (!trip) throw new NotFoundException('No se encontró el viaje.');
		if (trip.status !== TripStatus.PENDING) throw new BadRequestException('El viaje ya fue asignado o cerrado.');
		const boat = await this.getApprovedBoat(boatId, trip.passengerCount);
		await this.assertBoatSlotAvailable(boat.id, trip.scheduledAt, trip.id);
		return this.prisma.trip.update({
			where: { id },
			data: { embarcacionId: boat.id, status: TripStatus.ASSIGNED },
			select: { id: true, status: true, embarcacionId: true },
		});
	}

	private async assertBoatSlotAvailable(boatId: string, scheduledAt: Date, excludeTripId?: string) {
		const hours = this.config.get<number>('TRIP_SLOT_HOURS') ?? 2;
		const margin = hours * 60 * 60 * 1000;
		const conflict = await this.prisma.trip.findFirst({
			where: {
				embarcacionId: boatId,
				...(excludeTripId ? { id: { not: excludeTripId } } : {}),
				status: { notIn: [TripStatus.CANCELLED, TripStatus.COMPLETED] },
				scheduledAt: {
					gte: new Date(scheduledAt.getTime() - margin),
					lte: new Date(scheduledAt.getTime() + margin),
				},
			},
			select: { id: true },
		});
		if (conflict) {
			throw new ConflictException('La embarcación ya tiene un viaje asignado en esa franja horaria.');
		}
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
