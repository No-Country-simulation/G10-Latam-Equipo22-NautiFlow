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
		reserva: { count: vi.fn().mockResolvedValue(3) },
		trip: { count: vi.fn().mockResolvedValue(5) },
		owner: { count: vi.fn().mockResolvedValue(2) },
		ownerDocument: { count: vi.fn().mockResolvedValue(7) },
		salida: { count: vi.fn().mockResolvedValue(4) },
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

		expect(result).toEqual({
			reservasPendientes: 3,
			viajesPorOperar: 5,
			solicitudesLancheroPendientes: 2,
			documentosPendientes: 7,
			salidasProgramadas: 4,
		});
		expect(prisma.reserva.count).toHaveBeenCalledWith({ where: { estado: 'PENDIENTE' } });
		expect(prisma.trip.count).toHaveBeenCalledWith({
			where: { status: { in: [TripStatus.PENDING, TripStatus.ASSIGNED] } },
		});
		expect(prisma.owner.count).toHaveBeenCalledWith({ where: { status: OwnerStatus.PENDING } });
		expect(prisma.ownerDocument.count).toHaveBeenCalledWith({
			where: { status: DocumentStatus.PENDING },
		});
		expect(prisma.salida.count).toHaveBeenCalledWith({
			where: { estado: EstadoSalida.PROGRAMADA, fechaSalida: { gte: expect.any(Date) } },
		});
	});
});
