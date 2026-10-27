import { Injectable } from '@nestjs/common';
import { BadRequestException, GoneException, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { TripStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

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
