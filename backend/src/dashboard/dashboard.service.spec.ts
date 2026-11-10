import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	DocumentStatus,
	EmptyLegStatus,
	EstadoEmbarcacion,
	EstadoSalida,
	OwnerStatus,
	TripStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DashboardService } from './dashboard.service.js';

function createService() {
	const prisma = {
		reserva: { count: vi.fn().mockResolvedValue(3) },
		trip: {
			count: vi.fn().mockResolvedValue(5),
			findMany: vi.fn().mockResolvedValue([]),
		},
		owner: {
			count: vi.fn().mockResolvedValue(2),
			findMany: vi.fn().mockResolvedValue([]),
		},
		ownerDocument: {
			count: vi.fn().mockResolvedValue(7),
			findMany: vi.fn().mockResolvedValue([]),
		},
		salida: { count: vi.fn().mockResolvedValue(4) },
		embarcacion: {
			count: vi.fn().mockResolvedValueOnce(15).mockResolvedValueOnce(10),
		},
		emptyLeg: {
			count: vi.fn().mockResolvedValue(3),
			findMany: vi.fn().mockResolvedValue([]),
		},
		review: {
			aggregate: vi.fn().mockResolvedValue({ _avg: { rating: 4.26 } }),
			findMany: vi.fn().mockResolvedValue([]),
		},
	};
	return { service: new DashboardService(prisma as unknown as PrismaService), prisma };
}

describe('DashboardService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('resume los contadores administrativos', async () => {
		const { service, prisma } = createService();

		const result = await service.resumen();

		expect(result).toEqual(
			expect.objectContaining({
				reservasPendientes: 3,
				viajesPorOperar: 5,
				solicitudesLancheroPendientes: 2,
				documentosPendientes: 7,
				salidasProgramadas: 4,
				totalEmbarcaciones: 15,
				embarcacionesVerificadas: 10,
				retornosActivos: 3,
				viajesCompletados: 5,
				calificacionPromedio: 4.3,
				actividadReciente: [],
				actividadSemanal: expect.arrayContaining([expect.objectContaining({ count: 0 })]),
			}),
		);
		expect(prisma.reserva.count).toHaveBeenCalledWith({ where: { estado: 'PENDIENTE' } });
		expect(prisma.trip.count).toHaveBeenCalledWith({
			where: {
				status: { in: [TripStatus.PENDING, TripStatus.ASSIGNED, TripStatus.CONFIRMED] },
			},
		});
		expect(prisma.owner.count).toHaveBeenCalledWith({ where: { status: OwnerStatus.PENDING } });
		expect(prisma.ownerDocument.count).toHaveBeenCalledWith({
			where: { status: DocumentStatus.PENDING },
		});
		expect(prisma.salida.count).toHaveBeenCalledWith({
			where: { estado: EstadoSalida.PROGRAMADA, fechaSalida: { gte: expect.any(Date) } },
		});
		expect(prisma.embarcacion.count).toHaveBeenNthCalledWith(1);
		expect(prisma.embarcacion.count).toHaveBeenNthCalledWith(2, {
			where: { estado: EstadoEmbarcacion.VERIFICADA },
		});
		expect(prisma.emptyLeg.count).toHaveBeenCalledWith({
			where: { status: { in: [EmptyLegStatus.AVAILABLE, EmptyLegStatus.OFFERED] } },
		});
		expect(prisma.trip.count).toHaveBeenCalledWith({ where: { status: TripStatus.COMPLETED } });
	});
});
