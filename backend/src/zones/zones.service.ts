import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ZonesService {
	constructor(private readonly prisma: PrismaService) {}

	listActive() {
		return this.prisma.zona.findMany({
			where: { activa: true },
			orderBy: { nombre: 'asc' },
			select: { id: true, nombre: true, descripcion: true },
		});
	}
}
