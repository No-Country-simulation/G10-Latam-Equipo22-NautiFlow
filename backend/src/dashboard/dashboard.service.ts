import { Injectable } from '@nestjs/common';
import { DocumentStatus, EstadoSalida, OwnerStatus, TripStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
	constructor(private readonly prisma: PrismaService) {}

	async resumen() {
		const ahora = new Date();
		const [
			reservasPendientes,
			viajesPorOperar,
			solicitudesLancheroPendientes,
			documentosPendientes,
			salidasProgramadas,
		] = await Promise.all([
			this.prisma.reserva.count({ where: { estado: 'PENDIENTE' } }),
			this.prisma.trip.count({
				where: { status: { in: [TripStatus.PENDING, TripStatus.ASSIGNED] } },
			}),
			this.prisma.owner.count({ where: { status: OwnerStatus.PENDING } }),
			this.prisma.ownerDocument.count({ where: { status: DocumentStatus.PENDING } }),
			this.prisma.salida.count({
				where: { estado: EstadoSalida.PROGRAMADA, fechaSalida: { gte: ahora } },
			}),
		]);

		return {
			reservasPendientes,
			viajesPorOperar,
			solicitudesLancheroPendientes,
			documentosPendientes,
			salidasProgramadas,
		};
	}
}
