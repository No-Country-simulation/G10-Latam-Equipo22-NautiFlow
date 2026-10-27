import { Injectable } from '@nestjs/common';
import { EstadoEmbarcacion, OwnerStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BoatsService {
	constructor(private readonly prisma: PrismaService) {}

	listApproved() {
		return this.prisma.embarcacion.findMany({
			where: {
				estado: EstadoEmbarcacion.VERIFICADA,
				propietario: { status: OwnerStatus.APPROVED, user: { status: 'ACTIVE' } },
			},
			orderBy: { nombre: 'asc' },
			select: { id: true, nombre: true, matricula: true, capacidad: true },
		});
	}
}
