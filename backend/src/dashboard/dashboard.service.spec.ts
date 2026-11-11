import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	DocumentStatus,
	EstadoSalida,
	OwnerStatus,
	TripStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DashboardService } from './dashboard.service.js';

function createService() {
	const prisma = {
		embarcacion: { count: vi.fn().mockResolvedValue(10) },
		reserva: { count: vi.fn().mockResolvedValue(3) },
		trip: {
			count: vi.fn().mockResolvedValue(5),
			findMany: vi.fn().mockResolvedValue([]),
		},
		owner: {
			count: vi.fn().mockResolvedValue(2),
			findMany: vi.fn().mockResolvedValue([]),
		},
		emptyLeg: { count: vi.fn().mockResolvedValue(1) },
		ownerDocument: { count: vi.fn().mockResolvedValue(7) },
		salida: { count: vi.fn().mockResolvedValue(4) },
		review: {
			aggregate: vi.fn().mockResolvedValue({ _avg: { rating: 4.8 }, _count: { _all: 6 } }),
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

		expect(result).toMatchObject({
			totalLanchas: 10,
			solicitudesPendientes: 2,
			retornosDisponibles: 1,
			viajesPendientes: 5,
			calificacionPromedio: 4.8,
			totalResenas: 6,
			reservasPendientes: 3,
			viajesPorOperar: 5,
			solicitudesLancheroPendientes: 2,
			documentosPendientes: 7,
			salidasProgramadas: 4,
		});
		expect(Array.isArray(result.actividadSemanal)).toBe(true);
		expect(Array.isArray(result.actividadReciente)).toBe(true);
		expect(prisma.reserva.count).toHaveBeenCalledWith({ where: { estado: 'PENDIENTE' } });
		expect(prisma.owner.count).toHaveBeenCalledWith({ where: { status: OwnerStatus.PENDING } });
	});
});
