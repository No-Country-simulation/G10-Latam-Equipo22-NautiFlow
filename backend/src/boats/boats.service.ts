import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoEmbarcacion, OwnerStatus, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBoatDto } from './create-boat.dto.js';
import { UpdateBoatDto } from './update-boat.dto.js';

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

	async listMine(userId: string) {
		const propietarioId = await this.resolveOwnerId(userId);
		return this.prisma.embarcacion.findMany({
			where: { propietarioId },
			include: { zonas: { include: { zona: true } } },
			orderBy: { createdAt: 'desc' },
		});
	}

	async getMine(id: string, userId: string) {
		const propietarioId = await this.resolveOwnerId(userId);
		return this.findOwn(id, propietarioId);
	}

	async create(userId: string, datos: CreateBoatDto) {
		const propietarioId = await this.resolveOwnerId(userId);
		await this.validateZones(datos.zonaIds);

		try {
			return await this.prisma.embarcacion.create({
				data: {
					propietarioId,
					nombre: datos.nombre,
					matricula: datos.matricula,
					capacidad: datos.capacidad,
					descripcion: datos.descripcion,
					zonas: this.connectZones(datos.zonaIds),
				},
				include: { zonas: { include: { zona: true } } },
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				throw new ConflictException('Ya existe una embarcación con esa matrícula');
			}
			throw error;
		}
	}

	async update(id: string, userId: string, datos: UpdateBoatDto) {
		const propietarioId = await this.resolveOwnerId(userId);
		const { zonaIds, ...campos } = datos;
		await this.findOwn(id, propietarioId);
		await this.validateZones(zonaIds);

		try {
			return await this.prisma.embarcacion.update({
				where: { id },
				data: {
					...campos,
					zonas: this.replaceZones(zonaIds),
				},
				include: { zonas: { include: { zona: true } } },
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				throw new ConflictException('Ya existe una embarcación con esa matrícula');
			}
			throw error;
		}
	}

	private async resolveOwnerId(userId: string) {
		const owner = await this.prisma.owner.findUnique({
			where: { userId },
			select: { id: true },
		});
		if (!owner) {
			throw new NotFoundException('No se encontró la ficha del propietario');
		}
		return owner.id;
	}

	private async findOwn(id: string, propietarioId: string) {
		const embarcacion = await this.prisma.embarcacion.findFirst({
			where: { id, propietarioId },
		});
		if (!embarcacion) {
			throw new NotFoundException('Embarcación no encontrada');
		}
		return embarcacion;
	}

	private connectZones(zonaIds?: string[]): Prisma.EmbarcacionZonaCreateNestedManyWithoutEmbarcacionInput | undefined {
		if (!zonaIds?.length) {
			return undefined;
		}
		return { create: zonaIds.map((zonaId) => ({ zona: { connect: { id: zonaId } } })) };
	}

	private replaceZones(zonaIds?: string[]): Prisma.EmbarcacionZonaUpdateManyWithoutEmbarcacionNestedInput | undefined {
		if (!zonaIds) {
			return undefined;
		}
		return { deleteMany: {}, create: zonaIds.map((zonaId) => ({ zona: { connect: { id: zonaId } } })) };
	}

	private async validateZones(zonaIds?: string[]) {
		if (!zonaIds?.length) {
			return;
		}
		const encontradas = await this.prisma.zona.findMany({
			where: { id: { in: zonaIds }, activa: true },
			select: { id: true },
		});
		if (encontradas.length !== zonaIds.length) {
			throw new NotFoundException('Alguna zona indicada no existe o está inactiva');
		}
	}
}
