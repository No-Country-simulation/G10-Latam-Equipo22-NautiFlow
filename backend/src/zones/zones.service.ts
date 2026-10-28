import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ZoneInput {
	nombre: string;
	descripcion?: string;
	activa?: boolean;
}

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

	listAll() {
		return this.prisma.zona.findMany({ orderBy: { nombre: 'asc' } });
	}

	async getById(id: string) {
		const zona = await this.prisma.zona.findUnique({ where: { id } });
		if (!zona) {
			throw new NotFoundException('Zona no encontrada');
		}
		return zona;
	}

	async create(datos: ZoneInput) {
		const existente = await this.prisma.zona.findUnique({
			where: { nombre: datos.nombre },
		});
		if (existente) {
			throw new ConflictException('Ya existe una zona con ese nombre');
		}
		return this.prisma.zona.create({
			data: {
				nombre: datos.nombre,
				descripcion: datos.descripcion,
				activa: datos.activa ?? true,
			},
		});
	}

	async update(id: string, datos: Partial<ZoneInput>) {
		const zona = await this.getById(id);
		if (datos.nombre && datos.nombre !== zona.nombre) {
			const duplicada = await this.prisma.zona.findUnique({
				where: { nombre: datos.nombre },
			});
			if (duplicada) {
				throw new ConflictException('Ya existe una zona con ese nombre');
			}
		}
		return this.prisma.zona.update({ where: { id }, data: { ...datos } });
	}

	async deactivate(id: string) {
		await this.getById(id);
		return this.prisma.zona.update({ where: { id }, data: { activa: false } });
	}
}
