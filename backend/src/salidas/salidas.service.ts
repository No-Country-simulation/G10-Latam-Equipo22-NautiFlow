import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
	EstadoEmbarcacion,
	EstadoSalida,
	EstadoTramo,
	OwnerStatus,
	Prisma,
} from '../generated/prisma/client.js';
import { buildPaginated } from '../common/dto/paginated-response.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BoatScheduleService } from '../boats/boat-schedule.service.js';
import type { CreateSalidaDto } from './create-salida.dto.js';
import type { ListSalidasQueryDto } from './list-salidas-query.dto.js';
import type { PublicSalidasQueryDto } from './public-salidas-query.dto.js';
import type { UpdateSalidaDto } from './update-salida.dto.js';
import type { UpdateTramoDto } from './update-tramo.dto.js';

const EMBARCACION_ELEGIBLE: Prisma.EmbarcacionWhereInput = {
	estado: EstadoEmbarcacion.VERIFICADA,
	propietario: { status: OwnerStatus.APPROVED, user: { status: 'ACTIVE' } },
};

const CAMPOS_PUBLICOS_EMBARCACION = {
	id: true,
	nombre: true,
	capacidad: true,
	descripcion: true,
	propietario: {
		select: { whatsappPhone: true, user: { select: { name: true } } },
	},
	zonas: { select: { zona: { select: { id: true, nombre: true } } } },
} satisfies Prisma.EmbarcacionSelect;

type Rating = { average: number | null; total: number };

const SIN_RATING: Rating = { average: null, total: 0 };

function construirRating(average: number | null, total: number): Rating {
	return {
		average: average === null ? null : Math.round(average * 10) / 10,
		total,
	};
}

@Injectable()
export class SalidasService {
	constructor(
		@Inject(PrismaService) private readonly prisma: PrismaService,
		@Inject(BoatScheduleService) private readonly schedule: BoatScheduleService,
	) {}

	async create(dto: CreateSalidaDto, adminId: string) {
		const fechaSalida = new Date(dto.fechaSalida);
		if (fechaSalida <= new Date()) {
			throw new BadRequestException('La fecha de salida debe ser futura.');
		}

		const boat = await this.prisma.embarcacion.findUnique({
			where: { id: dto.embarcacionId },
			select: {
				id: true,
				capacidad: true,
				estado: true,
				propietario: { select: { status: true, user: { select: { status: true } } } },
			},
		});
		if (!boat) throw new NotFoundException('No se encontró la embarcación.');
		if (
			boat.estado !== EstadoEmbarcacion.VERIFICADA ||
			boat.propietario.status !== OwnerStatus.APPROVED ||
			boat.propietario.user.status !== 'ACTIVE'
		) {
			throw new BadRequestException('Solo se pueden publicar salidas de lanchas y lancheros aprobados.');
		}

		this.validarTramos(dto.tramos, fechaSalida);

		const fechas = [fechaSalida, ...dto.tramos.map((t) => new Date(t.fechaHora))];
		await this.schedule.assertSlotsAvailable(boat.id, fechas);

		const salida = await this.prisma.$transaction(async (tx) => {
			const nueva = await tx.salida.create({
				data: {
					embarcacionId: boat.id,
					createdById: adminId,
					fechaSalida,
					estado: EstadoSalida.PROGRAMADA,
				},
			});

			await tx.tramo.createMany({
				data: dto.tramos.map((t) => ({
					salidaId: nueva.id,
					tipo: t.tipo,
					origen: t.origen.trim(),
					destino: t.destino.trim(),
					fechaHora: new Date(t.fechaHora),
					cupo: t.cupo ?? boat.capacidad,
					precioCentavos: t.precioCentavos,
					sinTuristas: t.sinTuristas ?? false,
					estado: EstadoTramo.DISPONIBLE,
				})),
			});

			return nueva;
		});

		return this.adminDetail(salida.id);
	}

	async list(query: ListSalidasQueryDto) {
		const where: Prisma.SalidaWhereInput = {};
		if (query.estado) where.estado = query.estado;

		const [data, total] = await Promise.all([
			this.prisma.salida.findMany({
				where,
				orderBy: { fechaSalida: 'asc' },
				skip: (query.page - 1) * query.limit,
				take: query.limit,
				select: {
					id: true,
					fechaSalida: true,
					estado: true,
					createdAt: true,
					embarcacion: {
						select: { id: true, nombre: true, matricula: true, capacidad: true },
					},
					tramos: {
						orderBy: { fechaHora: 'asc' },
						select: {
							id: true,
							tipo: true,
							origen: true,
							destino: true,
							fechaHora: true,
							cupo: true,
							precioCentavos: true,
							sinTuristas: true,
							estado: true,
						},
					},
				},
			}),
			this.prisma.salida.count({ where }),
		]);

		return buildPaginated(data, total, query.page, query.limit);
	}

	async adminDetail(id: string) {
		const salida = await this.prisma.salida.findUnique({
			where: { id },
			select: {
				id: true,
				fechaSalida: true,
				estado: true,
				createdAt: true,
				embarcacion: {
					select: { id: true, nombre: true, matricula: true, capacidad: true },
				},
				createdBy: { select: { name: true } },
				tramos: {
					orderBy: { fechaHora: 'asc' },
					select: {
						id: true,
						tipo: true,
						origen: true,
						destino: true,
						fechaHora: true,
						cupo: true,
						precioCentavos: true,
						sinTuristas: true,
						estado: true,
					},
				},
			},
		});
		if (!salida) throw new NotFoundException('No se encontró la salida.');
		return salida;
	}

	async update(id: string, dto: UpdateSalidaDto) {
		const salida = await this.prisma.salida.findUnique({
			where: { id },
			select: {
				id: true,
				fechaSalida: true,
				estado: true,
				embarcacionId: true,
				tramos: { select: { id: true, fechaHora: true } },
			},
		});
		if (!salida) throw new NotFoundException('No se encontró la salida.');

		const data: Prisma.SalidaUpdateInput = {};
		let fechasAValidar: Date[] = [];

		if (dto.estado !== undefined) data.estado = dto.estado;

		if (dto.fechaSalida !== undefined) {
			const nuevaFecha = new Date(dto.fechaSalida);
			if (nuevaFecha <= new Date()) {
				throw new BadRequestException('La fecha de salida debe ser futura.');
			}

			const delta = nuevaFecha.getTime() - salida.fechaSalida.getTime();
			const tramosNuevos = salida.tramos.map((t) => ({
				id: t.id,
				fechaHora: new Date(t.fechaHora.getTime() + delta),
			}));

			for (const tramo of tramosNuevos) {
				if (tramo.fechaHora <= nuevaFecha) {
					throw new BadRequestException(
						'El tramo de ida no puede quedar anterior o igual a la nueva fecha de salida.',
					);
				}
			}

			fechasAValidar = [nuevaFecha, ...tramosNuevos.map((t) => t.fechaHora)];
			await this.schedule.assertSlotsAvailable(salida.embarcacionId, fechasAValidar, {
				excludeSalidaId: salida.id,
			});

			data.fechaSalida = nuevaFecha;
			data.tramos = {
				update: tramosNuevos.map((t) => ({
					where: { id: t.id },
					data: { fechaHora: t.fechaHora },
				})),
			};
		}

		return this.prisma.salida.update({
			where: { id },
			data,
			select: { id: true, fechaSalida: true, estado: true },
		});
	}

	async updateTramo(salidaId: string, tramoId: string, dto: UpdateTramoDto) {
		const salida = await this.prisma.salida.findUnique({
			where: { id: salidaId },
			select: {
				id: true,
				fechaSalida: true,
				estado: true,
				embarcacionId: true,
				embarcacion: { select: { capacidad: true } },
				tramos: { select: { id: true, fechaHora: true } },
			},
		});
		if (!salida) throw new NotFoundException('No se encontró la salida.');

		const tramo = await this.prisma.tramo.findUnique({
			where: { id: tramoId },
			select: { id: true, salidaId: true, fechaHora: true, cupo: true },
		});
		if (!tramo) throw new NotFoundException('No se encontró el tramo.');
		if (tramo.salidaId !== salidaId) {
			throw new NotFoundException('El tramo no pertenece a esta salida.');
		}

		if (dto.cupo !== undefined && dto.cupo > salida.embarcacion.capacidad) {
			throw new BadRequestException(
				`El cupo no puede superar la capacidad de la embarcación (${salida.embarcacion.capacidad}).`,
			);
		}

		const data: Prisma.TramoUpdateInput = {};
		if (dto.estado !== undefined) data.estado = dto.estado;
		if (dto.cupo !== undefined) data.cupo = dto.cupo;
		if (dto.precioCentavos !== undefined) data.precioCentavos = dto.precioCentavos;
		if (dto.sinTuristas !== undefined) data.sinTuristas = dto.sinTuristas;

		if (dto.fechaHora !== undefined) {
			const nuevaFecha = new Date(dto.fechaHora);
			if (nuevaFecha <= new Date()) {
				throw new BadRequestException('La fecha del tramo debe ser futura.');
			}
			const esIda = tramo.fechaHora.getTime() === salida.fechaSalida.getTime();
			if (esIda && nuevaFecha < salida.fechaSalida) {
				throw new BadRequestException('El tramo de ida no puede ser anterior a la salida.');
			}
			if (!esIda && nuevaFecha <= salida.fechaSalida) {
				throw new BadRequestException('El tramo de vuelta debe ser posterior a la salida.');
			}

			const otrosTramos = salida.tramos
				.filter((t) => t.id !== tramoId)
				.map((t) => t.fechaHora);
			await this.schedule.assertSlotsAvailable(
				salida.embarcacionId,
				[nuevaFecha, ...otrosTramos],
				{ excludeSalidaId: salida.id },
			);

			data.fechaHora = nuevaFecha;
		}

		return this.prisma.tramo.update({
			where: { id: tramoId },
			data,
			select: {
				id: true,
				tipo: true,
				origen: true,
				destino: true,
				fechaHora: true,
				cupo: true,
				precioCentavos: true,
				sinTuristas: true,
				estado: true,
			},
		});
	}

	async listPublic(query: PublicSalidasQueryDto) {
		const now = new Date();
		const where: Prisma.SalidaWhereInput = {
			estado: EstadoSalida.PROGRAMADA,
			fechaSalida: { gte: now },
			embarcacion: { ...EMBARCACION_ELEGIBLE },
		};

		if (query.zonaId) {
			where.embarcacion = {
				...EMBARCACION_ELEGIBLE,
				zonas: { some: { zonaId: query.zonaId } },
			};
		}
		if (query.fechaDesde) {
			where.fechaSalida = { ...(where.fechaSalida as Prisma.DateTimeFilter), gte: new Date(query.fechaDesde) };
		}
		if (query.fechaHasta) {
			const hasta = new Date(query.fechaHasta);
			hasta.setHours(23, 59, 59, 999);
			where.fechaSalida = { ...(where.fechaSalida as Prisma.DateTimeFilter), lte: hasta };
		}
		if (query.origen || query.destino) {
			where.tramos = {
				some: {
					tipo: 'IDA',
					...(query.origen ? { origen: { contains: query.origen, mode: 'insensitive' } } : {}),
					...(query.destino ? { destino: { contains: query.destino, mode: 'insensitive' } } : {}),
				},
			};
		}

		const [salidas, total] = await Promise.all([
			this.prisma.salida.findMany({
				where,
				orderBy: { fechaSalida: 'asc' },
				skip: (query.page - 1) * query.limit,
				take: query.limit,
				select: {
					id: true,
					fechaSalida: true,
					embarcacion: { select: CAMPOS_PUBLICOS_EMBARCACION },
					tramos: {
						orderBy: { fechaHora: 'asc' },
						select: {
							id: true,
							tipo: true,
							origen: true,
							destino: true,
							fechaHora: true,
							cupo: true,
							precioCentavos: true,
							sinTuristas: true,
							estado: true,
						},
					},
				},
			}),
			this.prisma.salida.count({ where }),
		]);

		const ratings = await this.ratingsByBoat(salidas.map((s) => s.embarcacion.id));
		return buildPaginated(
			salidas.map((s) => ({
				...s,
				rating: ratings.get(s.embarcacion.id) ?? SIN_RATING,
				disponible: s.tramos.some(
					(t) => t.estado === EstadoTramo.DISPONIBLE && t.cupo > 0,
				),
			})),
			total,
			query.page,
			query.limit,
		);
	}

	async getPublic(id: string) {
		const now = new Date();
		const salida = await this.prisma.salida.findFirst({
			where: {
				id,
				estado: EstadoSalida.PROGRAMADA,
				fechaSalida: { gte: now },
				embarcacion: { ...EMBARCACION_ELEGIBLE },
			},
			select: {
				id: true,
				fechaSalida: true,
				embarcacion: {
					select: {
						...CAMPOS_PUBLICOS_EMBARCACION,
						reviews: {
							orderBy: { createdAt: 'desc' },
							take: 5,
							select: { rating: true, comment: true, createdAt: true },
						},
					},
				},
				tramos: {
					orderBy: { fechaHora: 'asc' },
					select: {
						id: true,
						tipo: true,
						origen: true,
						destino: true,
						fechaHora: true,
						cupo: true,
						precioCentavos: true,
						sinTuristas: true,
						estado: true,
					},
				},
			},
		});
		if (!salida) throw new NotFoundException('No se encontró la salida.');

		const summary = await this.prisma.review.aggregate({
			where: { embarcacionId: salida.embarcacion.id },
			_avg: { rating: true },
			_count: { _all: true },
		});

		return {
			...salida,
			rating: construirRating(summary._avg.rating, summary._count._all),
			disponible: salida.tramos.some(
				(t) => t.estado === EstadoTramo.DISPONIBLE && t.cupo > 0,
			),
		};
	}

	private validarTramos(tramos: CreateSalidaDto['tramos'], fechaSalida: Date) {
		if (!tramos.length) {
			throw new BadRequestException('La salida debe tener al menos un tramo.');
		}

		const idas = tramos.filter((t) => t.tipo === 'IDA');
		const vueltas = tramos.filter((t) => t.tipo === 'VUELTA');
		if (idas.length !== 1) {
			throw new BadRequestException('La salida debe tener exactamente un tramo de ida.');
		}
		if (vueltas.length > 1) {
			throw new BadRequestException('La salida puede tener como máximo un tramo de vuelta.');
		}

		for (const tramo of tramos) {
			const fecha = new Date(tramo.fechaHora);
			if (tramo.tipo === 'IDA' && fecha < fechaSalida) {
				throw new BadRequestException('El tramo de ida no puede ser anterior a la salida.');
			}
			if (tramo.tipo === 'VUELTA' && fecha <= fechaSalida) {
				throw new BadRequestException('El tramo de vuelta debe ser posterior a la salida.');
			}
		}
	}

	private async ratingsByBoat(ids: string[]) {
		const ratings = new Map<string, Rating>();
		if (!ids.length) return ratings;

		const groups = await this.prisma.review.groupBy({
			by: ['embarcacionId'],
			where: { embarcacionId: { in: ids } },
			_avg: { rating: true },
			_count: { _all: true },
		});
		for (const group of groups) {
			if (!group.embarcacionId) continue;
			ratings.set(
				group.embarcacionId,
				construirRating(group._avg.rating, group._count._all),
			);
		}
		return ratings;
	}
}
