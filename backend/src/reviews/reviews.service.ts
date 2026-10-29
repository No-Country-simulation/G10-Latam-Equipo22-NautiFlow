import { Injectable } from '@nestjs/common';
import { BadRequestException, GoneException, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import {
	EstadoEmbarcacion,
	OwnerStatus,
	Prisma,
	TripStatus,
} from '../generated/prisma/client.js';
import { buildPaginated } from '../common/dto/paginated-response.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PublicBoatsQueryDto } from './public-boats-query.dto.js';

const EMBARCACION_ELEGIBLE: Prisma.EmbarcacionWhereInput = {
	estado: EstadoEmbarcacion.VERIFICADA,
	propietario: { status: OwnerStatus.APPROVED, user: { status: 'ACTIVE' } },
};

const CAMPOS_PUBLICOS = {
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
export class ReviewsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly config: ConfigService,
	) {}

	async createLink(tripId: string) {
		const trip = await this.prisma.trip.findUnique({
			where: { id: tripId },
			select: { id: true, status: true, review: { select: { id: true } } },
		});
		if (!trip) throw new NotFoundException('No se encontró el viaje.');
		if (trip.status !== TripStatus.COMPLETED || trip.review) {
			throw new BadRequestException('Solo se puede invitar a reseñar un viaje completado sin reseña.');
		}

		const token = randomBytes(32).toString('base64url');
		const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
		await this.prisma.reviewToken.upsert({
			where: { tripId },
			create: { tripId, tokenHash: this.hash(token), expiresAt },
			update: { tokenHash: this.hash(token), expiresAt, usedAt: null },
		});

		const baseUrl = this.config.get<string>('PUBLIC_APP_URL')?.replace(/\/$/, '');
		return { reviewUrl: `${baseUrl ?? ''}/reviews/${token}`, expiresAt };
	}

	async getReviewContext(token: string) {
		const record = await this.findValidToken(token);
		return {
			trip: {
				origin: record.trip.origin,
				destination: record.trip.destination,
				scheduledAt: record.trip.scheduledAt,
				boatName: record.trip.embarcacion?.nombre ?? null,
			},
		};
	}

	async submit(token: string, rating: number, comment?: string) {
		const tokenHash = this.hash(token);
		return this.prisma.$transaction(async (transaction) => {
			const claimed = await transaction.reviewToken.updateMany({
				where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
				data: { usedAt: new Date() },
			});
			if (claimed.count !== 1) throw new GoneException('El enlace no es válido, venció o ya fue utilizado.');

			const record = await transaction.reviewToken.findUnique({
				where: { tokenHash },
				select: {
					trip: { select: { id: true, status: true, embarcacionId: true, review: { select: { id: true } } } },
				},
			});
			if (!record || record.trip.status !== TripStatus.COMPLETED || record.trip.review) {
				throw new GoneException('El enlace no corresponde a un viaje disponible para reseñar.');
			}

			return transaction.review.create({
				data: {
					tripId: record.trip.id,
					embarcacionId: record.trip.embarcacionId,
					rating,
					comment: comment?.trim() || null,
				},
				select: { id: true, rating: true, createdAt: true },
			});
		});
	}

	async listPublicBoats(query: PublicBoatsQueryDto) {
		const where: Prisma.EmbarcacionWhereInput = { ...EMBARCACION_ELEGIBLE };
		if (query.zonaId) {
			where.zonas = { some: { zonaId: query.zonaId } };
		}

		const [boats, total] = await Promise.all([
			this.prisma.embarcacion.findMany({
				where,
				orderBy: { nombre: 'asc' },
				skip: (query.page - 1) * query.limit,
				take: query.limit,
				select: CAMPOS_PUBLICOS,
			}),
			this.prisma.embarcacion.count({ where }),
		]);

		const ratings = await this.ratingsByBoat(boats.map((boat) => boat.id));
		return buildPaginated(
			boats.map((boat) => ({ ...boat, rating: ratings.get(boat.id) ?? SIN_RATING })),
			total,
			query.page,
			query.limit,
		);
	}

	async getPublicBoat(id: string) {
		const boat = await this.prisma.embarcacion.findFirst({
			where: { id, ...EMBARCACION_ELEGIBLE },
			select: {
				...CAMPOS_PUBLICOS,
				reviews: {
					orderBy: { createdAt: 'desc' },
					take: 5,
					select: { rating: true, comment: true, createdAt: true },
				},
			},
		});
		if (!boat) throw new NotFoundException('No se encontró la embarcación.');

		const summary = await this.prisma.review.aggregate({
			where: { embarcacionId: id },
			_avg: { rating: true },
			_count: { _all: true },
		});
		return {
			...boat,
			rating: construirRating(summary._avg.rating, summary._count._all),
		};
	}

	async listPublicBoatReviews(id: string, query: PaginationQueryDto) {
		const boat = await this.prisma.embarcacion.findFirst({
			where: { id, ...EMBARCACION_ELEGIBLE },
			select: { id: true },
		});
		if (!boat) throw new NotFoundException('No se encontró la embarcación.');

		const [reviews, total] = await Promise.all([
			this.prisma.review.findMany({
				where: { embarcacionId: id },
				orderBy: { createdAt: 'desc' },
				skip: (query.page - 1) * query.limit,
				take: query.limit,
				select: { rating: true, comment: true, createdAt: true },
			}),
			this.prisma.review.count({ where: { embarcacionId: id } }),
		]);
		return buildPaginated(reviews, total, query.page, query.limit);
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

	private async findValidToken(token: string) {
		const record = await this.prisma.reviewToken.findUnique({
			where: { tokenHash: this.hash(token) },
			select: {
				usedAt: true,
				expiresAt: true,
				trip: {
					select: {
						status: true,
						origin: true,
						destination: true,
						scheduledAt: true,
						embarcacion: { select: { nombre: true } },
						review: { select: { id: true } },
					},
				},
			},
		});
		if (
			!record || record.usedAt || record.expiresAt <= new Date() ||
			record.trip.status !== TripStatus.COMPLETED || record.trip.review
		) {
			throw new GoneException('El enlace no es válido, venció o ya fue utilizado.');
		}
		return record;
	}

	private hash(token: string) {
		if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) throw new NotFoundException('No se encontró el enlace.');
		return createHash('sha256').update(token).digest('hex');
	}
}
