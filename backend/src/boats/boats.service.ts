import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	EmptyLegStatus,
	EstadoEmbarcacion,
	OwnerStatus,
	Prisma,
	TripStatus,
} from '../generated/prisma/client.js';
import { buildPaginated } from '../common/dto/paginated-response.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BoatScheduleService } from './boat-schedule.service.js';
import { CreateBoatDto } from './create-boat.dto.js';
import { EstadoOperativoFlota, type FleetQueryDto } from './fleet-query.dto.js';
import { SearchBoatsQueryDto } from './search-boats-query.dto.js';
import { UpdateBoatDto } from './update-boat.dto.js';

const FLEET_BOAT_SELECT = {
	id: true,
	nombre: true,
	matricula: true,
	capacidad: true,
	estado: true,
	descripcion: true,
	propietario: {
		select: {
			phone: true,
			whatsappPhone: true,
			user: { select: { name: true } },
		},
	},
	zonas: { select: { zona: { select: { id: true, nombre: true } } } },
} satisfies Prisma.EmbarcacionSelect;

@Injectable()
export class BoatsService {
	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(BoatScheduleService) private readonly schedule: BoatScheduleService,
	) {}

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

	async search(query: SearchBoatsQueryDto) {
		const page = Number(query.page) || 1;
		const limit = Number(query.limit) || 20;
		const q = query.q?.trim();
		const where: Prisma.EmbarcacionWhereInput = {
			estado: query.estado ?? EstadoEmbarcacion.VERIFICADA,
			propietario: { status: OwnerStatus.APPROVED, user: { status: 'ACTIVE' } },
		};
		if (query.zonaId) {
			where.zonas = { some: { zonaId: query.zonaId } };
		}
		if (query.capacidadMin) {
			where.capacidad = { gte: Number(query.capacidadMin) };
		}
		if (q) {
			where.OR = [
				{ nombre: { contains: q, mode: 'insensitive' } },
				{ matricula: { contains: q, mode: 'insensitive' } },
				{ propietario: { user: { name: { contains: q, mode: 'insensitive' } } } },
			];
		}
		if (query.fechaHora) {
			const ocupadas = await this.schedule.findBusyBoatIds(new Date(query.fechaHora));
			if (ocupadas.length) {
				where.id = { notIn: ocupadas };
			}
		}

		const [data, total] = await Promise.all([
			this.prisma.embarcacion.findMany({
				where,
				orderBy: { nombre: 'asc' },
				skip: (page - 1) * limit,
				take: limit,
				select: FLEET_BOAT_SELECT,
			}),
			this.prisma.embarcacion.count({ where }),
		]);

		const withStatus = await this.attachOperationalStatus(data);
		return buildPaginated(withStatus, total, page, limit);
	}

	async listFleet(query: FleetQueryDto) {
		const page = Number(query.page) || 1;
		const limit = Number(query.limit) || 20;
		const q = query.q?.trim();
		const where: Prisma.EmbarcacionWhereInput = {
			estado: EstadoEmbarcacion.VERIFICADA,
			propietario: { status: OwnerStatus.APPROVED, user: { status: 'ACTIVE' } },
		};
		if (query.zonaId) {
			where.zonas = { some: { zonaId: query.zonaId } };
		}
		if (q) {
			where.OR = [
				{ nombre: { contains: q, mode: 'insensitive' } },
				{ matricula: { contains: q, mode: 'insensitive' } },
				{ propietario: { user: { name: { contains: q, mode: 'insensitive' } } } },
			];
		}

		const boats = await this.prisma.embarcacion.findMany({
			where,
			orderBy: { nombre: 'asc' },
			select: FLEET_BOAT_SELECT,
		});
		const withStatus = await this.attachOperationalStatus(boats);
		const filtered = query.estadoOperativo
			? withStatus.filter((boat) => boat.estadoOperativo === query.estadoOperativo)
			: withStatus;
		const total = filtered.length;
		const data = filtered.slice((page - 1) * limit, page * limit);
		return buildPaginated(data, total, page, limit);
	}

	private async attachOperationalStatus<T extends { id: string }>(boats: T[]) {
		if (!boats.length) {
			return boats.map((boat) => ({ ...boat, estadoOperativo: EstadoOperativoFlota.LIBRE }));
		}
		const ids = boats.map((boat) => boat.id);
		const [reserved, emptyLegs] = await Promise.all([
			this.prisma.trip.findMany({
				where: {
					embarcacionId: { in: ids },
					status: { in: [TripStatus.ASSIGNED, TripStatus.CONFIRMED] },
				},
				select: { embarcacionId: true },
			}),
			this.prisma.emptyLeg.findMany({
				where: {
					embarcacionId: { in: ids },
					status: { in: [EmptyLegStatus.AVAILABLE, EmptyLegStatus.OFFERED] },
				},
				select: { embarcacionId: true },
			}),
		]);
		const reservedIds = new Set(reserved.map((row) => row.embarcacionId).filter(Boolean));
		const emptyIds = new Set(emptyLegs.map((row) => row.embarcacionId));

		return boats.map((boat) => {
			const estadoOperativo = reservedIds.has(boat.id)
				? EstadoOperativoFlota.RESERVADA
				: emptyIds.has(boat.id)
					? EstadoOperativoFlota.RETORNO_VACIO
					: EstadoOperativoFlota.LIBRE;
			return { ...boat, estadoOperativo };
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
