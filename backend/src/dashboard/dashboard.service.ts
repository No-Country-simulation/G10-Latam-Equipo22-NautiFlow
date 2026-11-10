import { Inject, Injectable } from '@nestjs/common';
import {
	DocumentStatus,
	EmptyLegStatus,
	EstadoEmbarcacion,
	EstadoSalida,
	OwnerStatus,
	TripStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const WEEKDAY_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;

@Injectable()
export class DashboardService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

	async resumen() {
		const ahora = new Date();
		const semanaDesde = inicioDeDiaLocal(addDays(ahora, -6));
		const [
			reservasPendientes,
			viajesPorOperar,
			solicitudesLancheroPendientes,
			documentosPendientes,
			salidasProgramadas,
			totalEmbarcaciones,
			embarcacionesVerificadas,
			retornosActivos,
			viajesCompletados,
			calificacionAggregate,
			viajesSemana,
			recentOwners,
			recentVerifications,
			recentDocuments,
			recentTrips,
			recentReviews,
			recentEmptyLegs,
		] = await Promise.all([
			this.prisma.reserva.count({ where: { estado: 'PENDIENTE' } }),
			this.prisma.trip.count({
				where: { status: { in: [TripStatus.PENDING, TripStatus.ASSIGNED, TripStatus.CONFIRMED] } },
			}),
			this.prisma.owner.count({ where: { status: OwnerStatus.PENDING } }),
			this.prisma.ownerDocument.count({ where: { status: DocumentStatus.PENDING } }),
			this.prisma.salida.count({
				where: { estado: EstadoSalida.PROGRAMADA, fechaSalida: { gte: ahora } },
			}),
			this.prisma.embarcacion.count(),
			this.prisma.embarcacion.count({ where: { estado: EstadoEmbarcacion.VERIFICADA } }),
			this.prisma.emptyLeg.count({
				where: { status: { in: [EmptyLegStatus.AVAILABLE, EmptyLegStatus.OFFERED] } },
			}),
			this.prisma.trip.count({ where: { status: TripStatus.COMPLETED } }),
			this.prisma.review.aggregate({ _avg: { rating: true } }),
			this.prisma.trip.findMany({
				where: { scheduledAt: { gte: semanaDesde } },
				select: { scheduledAt: true },
			}),
			this.prisma.owner.findMany({
				take: 5,
				orderBy: { createdAt: 'desc' },
				select: {
					createdAt: true,
					status: true,
					user: { select: { name: true, email: true } },
				},
			}),
			this.prisma.owner.findMany({
				where: { reviewedAt: { not: null } },
				take: 5,
				orderBy: { reviewedAt: 'desc' },
				select: {
					reviewedAt: true,
					status: true,
					user: { select: { name: true } },
				},
			}),
			this.prisma.ownerDocument.findMany({
				where: { reviewedAt: { not: null }, status: { in: [DocumentStatus.APPROVED, DocumentStatus.REJECTED] } },
				take: 5,
				orderBy: { reviewedAt: 'desc' },
				select: {
					type: true,
					status: true,
					reviewedAt: true,
					owner: { select: { user: { select: { name: true } } } },
					boat: { select: { nombre: true } },
				},
			}),
			this.prisma.trip.findMany({
				take: 5,
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					scheduledAt: true,
					status: true,
					createdAt: true,
					cliente: { select: { nombre: true } },
				},
			}),
			this.prisma.review.findMany({
				take: 5,
				orderBy: { createdAt: 'desc' },
				select: {
					rating: true,
					createdAt: true,
					embarcacion: { select: { nombre: true } },
				},
			}),
			this.prisma.emptyLeg.findMany({
				take: 5,
				orderBy: { createdAt: 'desc' },
				select: {
					origin: true,
					destination: true,
					scheduledAt: true,
					createdAt: true,
					embarcacion: { select: { nombre: true } },
				},
			}),
		]);

		const avgRating = calificacionAggregate._avg.rating;
		const calificacionPromedio: number | null =
			avgRating != null ? Math.round(avgRating * 10) / 10 : null;

		type ActivityEvent = {
			type: 'owner' | 'verification' | 'document' | 'trip' | 'review' | 'emptyLeg';
			at: Date;
			[key: string]: unknown;
		};

		const events: ActivityEvent[] = [
			...recentOwners.map((o) => ({
				type: 'owner' as const,
				at: o.createdAt,
				nombre: o.user.name,
				name: o.user.name,
				email: o.user.email,
				status: o.status,
			})),
			...recentVerifications.map((o) => ({
				type: 'verification' as const,
				at: o.reviewedAt as Date,
				nombre: o.user.name,
				status: o.status,
			})),
			...recentDocuments.map((d) => ({
				type: 'document' as const,
				at: d.reviewedAt as Date,
				nombre: d.owner.user.name,
				documentType: d.type,
				status: d.status,
				embarcacion: d.boat?.nombre ?? null,
			})),
			...recentTrips.map((t) => ({
				type: 'trip' as const,
				at: t.createdAt,
				id: t.id.slice(0, 8),
				cliente: t.cliente.nombre,
				clienteNombre: t.cliente.nombre,
				scheduledAt: t.scheduledAt,
				status: t.status,
			})),
			...recentReviews.map((r) => ({
				type: 'review' as const,
				at: r.createdAt,
				rating: r.rating,
				embarcacion: r.embarcacion?.nombre ?? null,
				embarcacionNombre: r.embarcacion?.nombre ?? null,
			})),
			...recentEmptyLegs.map((e) => ({
				type: 'emptyLeg' as const,
				at: e.createdAt,
				origin: e.origin,
				destination: e.destination,
				scheduledAt: e.scheduledAt,
				embarcacion: e.embarcacion.nombre,
				embarcacionNombre: e.embarcacion.nombre,
			})),
		];

		events.sort((a, b) => b.at.getTime() - a.at.getTime());
		const actividadReciente = events.slice(0, 12);
		const actividadSemanal = construirActividadSemanal(viajesSemana, ahora);

		return {
			reservasPendientes,
			viajesPorOperar,
			solicitudesLancheroPendientes,
			documentosPendientes,
			salidasProgramadas,
			totalEmbarcaciones,
			embarcacionesVerificadas,
			retornosActivos,
			viajesCompletados,
			calificacionPromedio,
			actividadReciente,
			actividadSemanal,
		};
	}
}

function addDays(date: Date, amount: number) {
	const next = new Date(date);
	next.setDate(next.getDate() + amount);
	return next;
}

function inicioDeDiaLocal(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function claveDia(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function construirActividadSemanal(viajes: Array<{ scheduledAt: Date }>, ahora: Date) {
	const counts = new Map<string, number>();
	for (const viaje of viajes) {
		const key = claveDia(viaje.scheduledAt);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	return Array.from({ length: 7 }, (_, index) => {
		const day = addDays(ahora, index - 6);
		const local = inicioDeDiaLocal(day);
		return {
			key: WEEKDAY_KEYS[local.getDay()],
			label: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][local.getDay()],
			count: counts.get(claveDia(local)) ?? 0,
		};
	});
}
