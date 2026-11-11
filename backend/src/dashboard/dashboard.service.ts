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

const WEEK_DAY_LABELS = [
	{ key: 'lun', label: 'L' },
	{ key: 'mar', label: 'M' },
	{ key: 'mie', label: 'M' },
	{ key: 'jue', label: 'J' },
	{ key: 'vie', label: 'V' },
	{ key: 'sab', label: 'S' },
	{ key: 'dom', label: 'D' },
];

@Injectable()
export class DashboardService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) { }

	async resumen() {
		const ahora = new Date();
		const sieteDiasAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

		const [
			totalLanchas,
			lanchasVerificadas,
			solicitudesPendientes,
			retornosDisponibles,
			viajesPendientes,
			viajesCompletados,
			reviewSummary,
			reservasPendientes,
			viajesPorOperar,
			documentosPendientes,
			salidasProgramadas,
			tripsSemana,
			ultimosLancheros,
			ultimosViajes,
			ultimasResenas,
		] = await Promise.all([
			this.prisma.embarcacion.count(),
			this.prisma.embarcacion.count({ where: { estado: EstadoEmbarcacion.VERIFICADA } }),
			this.prisma.owner.count({ where: { status: OwnerStatus.PENDING } }),
			this.prisma.emptyLeg.count({ where: { status: EmptyLegStatus.AVAILABLE } }),
			this.prisma.trip.count({
				where: { status: { in: [TripStatus.PENDING, TripStatus.ASSIGNED, TripStatus.CONFIRMED] } },
			}),
			this.prisma.trip.count({ where: { status: TripStatus.COMPLETED } }),
			this.prisma.review.aggregate({
				_avg: { rating: true },
				_count: { _all: true },
			}),
			this.prisma.reserva.count({ where: { estado: 'PENDIENTE' } }),
			this.prisma.trip.count({
				where: { status: { in: [TripStatus.PENDING, TripStatus.ASSIGNED] } },
			}),
			this.prisma.ownerDocument.count({ where: { status: DocumentStatus.PENDING } }),
			this.prisma.salida.count({
				where: { estado: EstadoSalida.PROGRAMADA, fechaSalida: { gte: ahora } },
			}),
			this.prisma.trip.findMany({
				where: { scheduledAt: { gte: sieteDiasAtras } },
				select: { scheduledAt: true },
			}),
			this.prisma.owner.findMany({
				orderBy: { createdAt: 'desc' },
				take: 5,
				include: {
					user: { select: { name: true, email: true } },
					embarcaciones: { select: { nombre: true } },
				},
			}),
			this.prisma.trip.findMany({
				orderBy: { updatedAt: 'desc' },
				take: 5,
				include: {
					cliente: { select: { nombre: true } },
					embarcacion: { select: { nombre: true } },
				},
			}),
			this.prisma.review.findMany({
				orderBy: { createdAt: 'desc' },
				take: 5,
				include: {
					embarcacion: { select: { nombre: true } },
					trip: { select: { origin: true, destination: true } },
				},
			}),
		]);

		// Distribución semanal (L a D)
		const countsPorDia: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
		for (const t of tripsSemana) {
			const dayOfWeek = t.scheduledAt.getDay(); // 0 = dom, 1 = lun, ...
			countsPorDia[dayOfWeek] = (countsPorDia[dayOfWeek] ?? 0) + 1;
		}

		// Orden: Lun (1), Mar (2), Mie (3), Jue (4), Vie (5), Sab (6), Dom (0)
		const order = [1, 2, 3, 4, 5, 6, 0];
		const actividadSemanal = WEEK_DAY_LABELS.map((item, index) => ({
			key: item.key,
			label: item.label,
			count: countsPorDia[order[index]] ?? 0,
		}));

		// Actividad reciente unificada
		const actividadReciente: Array<{
			id: string;
			tipo: string;
			titulo: string;
			descripcion: string;
			fecha: Date;
			estado?: string;
		}> = [];

		for (const o of ultimosLancheros) {
			const boatName = o.embarcaciones[0]?.nombre ? ` (${o.embarcaciones[0].nombre})` : '';
			if (o.status === OwnerStatus.APPROVED) {
				actividadReciente.push({
					id: `owner-${o.id}`,
					tipo: 'LANCHERO_VERIFICADO',
					titulo: 'Lanchero verificado',
					descripcion: `${o.user.name}${boatName} fue aprobado en la red.`,
					fecha: o.reviewedAt ?? o.createdAt,
					estado: 'APPROVED',
				});
			} else if (o.status === OwnerStatus.REJECTED) {
				actividadReciente.push({
					id: `owner-${o.id}`,
					tipo: 'LANCHERO_RECHAZADO',
					titulo: 'Solicitud rechazada',
					descripcion: `Se rechazó la solicitud de ${o.user.name}${boatName}.`,
					fecha: o.reviewedAt ?? o.createdAt,
					estado: 'REJECTED',
				});
			} else {
				actividadReciente.push({
					id: `owner-${o.id}`,
					tipo: 'NUEVA_SOLICITUD',
					titulo: 'Nueva solicitud de lanchero',
					descripcion: `${o.user.name} registró su perfil y documentación${boatName}.`,
					fecha: o.createdAt,
					estado: 'PENDING',
				});
			}
		}

		for (const t of ultimosViajes) {
			const boat = t.embarcacion?.nombre ? ` con ${t.embarcacion.nombre}` : '';
			if (t.status === TripStatus.COMPLETED) {
				actividadReciente.push({
					id: `trip-${t.id}`,
					tipo: 'VIAJE_COMPLETADO',
					titulo: 'Viaje finalizado',
					descripcion: `Servicio de ${t.cliente.nombre}${boat} completado exitosamente.`,
					fecha: t.updatedAt,
					estado: 'COMPLETED',
				});
			} else if (t.status === TripStatus.ASSIGNED || t.status === TripStatus.CONFIRMED) {
				actividadReciente.push({
					id: `trip-${t.id}`,
					tipo: 'VIAJE_ASIGNADO',
					titulo: 'Viaje coordinado',
					descripcion: `Viaje de ${t.cliente.nombre} asignado a ${t.embarcacion?.nombre ?? 'lancha'}.`,
					fecha: t.updatedAt,
					estado: t.status,
				});
			}
		}

		for (const r of ultimasResenas) {
			actividadReciente.push({
				id: `review-${r.id}`,
				tipo: 'RESENA_RECIBIDA',
				titulo: `Nueva reseña ★ ${r.rating}`,
				descripcion: `${r.embarcacion?.nombre ?? 'Embarcación'}: "${r.comment ? (r.comment.length > 50 ? r.comment.slice(0, 47) + '...' : r.comment) : 'Sin comentario'}"`,
				fecha: r.createdAt,
			});
		}

		// Ordenar cronológicamente descendente
		actividadReciente.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

		const avgRating = reviewSummary._avg.rating;
		const calificacionPromedio = avgRating !== null ? Math.round(avgRating * 10) / 10 : null;

		return {
			totalLanchas,
			lanchasVerificadas,
			solicitudesPendientes,
			retornosDisponibles,
			viajesPendientes,
			viajesCompletados,
			calificacionPromedio,
			totalResenas: reviewSummary._count._all,
			actividadSemanal,
			actividadReciente: actividadReciente.slice(0, 10),

			// Compatibilidad con endpoints existentes
			reservasPendientes,
			viajesPorOperar,
			solicitudesLancheroPendientes: solicitudesPendientes,
			documentosPendientes,
			salidasProgramadas,
		};
	}
}
