import { Injectable } from '@nestjs/common';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OwnerStatus, DocumentStatus, DocumentType, EstadoEmbarcacion, Prisma } from '../generated/prisma/client.js';
import { buildPaginated } from '../common/dto/paginated-response.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ListSolicitudesQueryDto } from './list-solicitudes-query.dto.js';
import type { UpdateProfileDto } from './update-profile.dto.js';

@Injectable()
export class OwnersService {
	constructor(private readonly prisma: PrismaService) {}

	getMyRequest(userId: string) {
		return this.prisma.owner.findUniqueOrThrow({
			where: { userId },
			select: {
				id: true,
				status: true,
				reviewNote: true,
				phone: true,
				whatsappPhone: true,
				createdAt: true,
				reviewedAt: true,
				user: { select: { id: true, name: true, email: true } },
				embarcaciones: {
					select: {
						id: true,
						nombre: true,
						matricula: true,
						capacidad: true,
						estado: true,
						zonas: { select: { zona: { select: { id: true, nombre: true } } } },
					},
				},
				documents: {
					select: { id: true, type: true, status: true, filename: true, reviewNote: true, createdAt: true },
				},
			},
		});
	}

	async updateProfile(userId: string, dto: UpdateProfileDto) {
		const owner = await this.prisma.owner.findUnique({
			where: { userId },
			select: { id: true },
		});
		if (!owner) throw new NotFoundException('No se encontró la ficha del propietario.');

		const ownerData: { phone?: string; whatsappPhone?: string | null } = {};
		if (dto.phone !== undefined) ownerData.phone = dto.phone.trim();
		if (dto.whatsappPhone !== undefined) ownerData.whatsappPhone = dto.whatsappPhone?.trim() ?? null;

		await this.prisma.$transaction(async (transaction) => {
			if (dto.name !== undefined) {
				await transaction.user.update({ where: { id: userId }, data: { name: dto.name.trim() } });
			}
			if (ownerData.phone !== undefined || ownerData.whatsappPhone !== undefined) {
				await transaction.owner.update({ where: { id: owner.id }, data: ownerData });
			}
		});

		return this.getMyRequest(userId);
	}

	async reopenMyRequest(userId: string) {
		const owner = await this.prisma.owner.findUnique({
			where: { userId },
			select: { id: true, status: true },
		});
		if (!owner) throw new NotFoundException('No se encontró la solicitud.');
		if (owner.status !== OwnerStatus.REJECTED) {
			throw new ConflictException('Solo se puede reabrir una solicitud rechazada.');
		}

		await this.prisma.$transaction(async (transaction) => {
			await transaction.owner.update({
				where: { id: owner.id },
				data: {
					status: OwnerStatus.PENDING,
					reviewNote: null,
					reviewedAt: null,
					reviewedById: null,
				},
			});
			await transaction.embarcacion.updateMany({
				where: { propietarioId: owner.id, estado: EstadoEmbarcacion.RECHAZADA },
				data: { estado: EstadoEmbarcacion.PENDIENTE },
			});
		});

		return this.getMyRequest(userId);
	}

	async listRequests(query: ListSolicitudesQueryDto) {
		const where: Prisma.OwnerWhereInput = query.status ? { status: query.status } : {};

		const [data, total] = await Promise.all([
			this.prisma.owner.findMany({
				where,
				orderBy: { createdAt: 'asc' },
				skip: (query.page - 1) * query.limit,
				take: query.limit,
				select: {
					id: true,
					status: true,
					reviewNote: true,
					createdAt: true,
					user: { select: { id: true, name: true, email: true, status: true } },
					embarcaciones: {
						select: {
							id: true,
							nombre: true,
							matricula: true,
							capacidad: true,
							estado: true,
							zonas: { select: { zona: { select: { id: true, nombre: true } } } },
						},
					},
					documents: {
						select: { id: true, type: true, status: true, filename: true, reviewNote: true, createdAt: true },
					},
				},
			}),
			this.prisma.owner.count({ where }),
		]);

		return buildPaginated(data, total, query.page, query.limit);
	}

	async reviewRequest(id: string, decision: 'APPROVED' | 'REJECTED', note: string, reviewerId: string) {
		const owner = await this.prisma.owner.findUnique({
			where: { id },
			include: { documents: true, embarcaciones: true },
		});
		if (!owner) throw new NotFoundException('No se encontró la solicitud.');
		if (owner.status !== OwnerStatus.PENDING) throw new BadRequestException('La solicitud ya fue revisada.');
		if (decision === 'APPROVED') {
			const requiredTypes = [DocumentType.LICENSE, DocumentType.INSURANCE, DocumentType.BACKGROUND_CHECK];
			const hasApprovedDocuments = requiredTypes.every((type) =>
				owner.documents.some((document) => document.type === type && document.status === DocumentStatus.APPROVED),
			);
			if (!hasApprovedDocuments) {
				throw new BadRequestException('Aprobá primero la licencia, el seguro y los antecedentes.');
			}
		}

		return this.prisma.$transaction(async (transaction) => {
			const updated = await transaction.owner.update({
				where: { id },
				data: {
					status: decision === 'APPROVED' ? OwnerStatus.APPROVED : OwnerStatus.REJECTED,
					reviewNote: note.trim(),
					reviewedAt: new Date(),
					reviewedById: reviewerId,
				},
			});
			await transaction.embarcacion.updateMany({
				where: { propietarioId: id },
				data: {
					estado: decision === 'APPROVED' ? EstadoEmbarcacion.VERIFICADA : EstadoEmbarcacion.RECHAZADA,
				},
			});
			return updated;
		});
	}
}
