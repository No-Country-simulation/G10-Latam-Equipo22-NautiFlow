import { Injectable } from '@nestjs/common';
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common';
import {
	DocumentStatus,
	DocumentType,
	EstadoEmbarcacion,
	OwnerStatus,
	Role,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { safeFilename, validateUploadedFile } from './file-validation.js';
import type { OwnerRegistrationFiles, UploadedDocumentFile } from './file.types.js';

@Injectable()
export class DocumentsService {
	constructor(private readonly prisma: PrismaService) {}

	listPending() {
		return this.prisma.ownerDocument.findMany({
			where: { status: DocumentStatus.PENDING },
			orderBy: { createdAt: 'asc' },
			select: {
				id: true,
				ownerId: true,
				boatId: true,
				type: true,
				status: true,
				filename: true,
				mimeType: true,
				size: true,
				createdAt: true,
				owner: { select: { user: { select: { name: true, email: true } } } },
				boat: { select: { nombre: true, matricula: true } },
			},
		});
	}

	async review(id: string, decision: 'APPROVED' | 'REJECTED', note: string, reviewerId: string) {
		const document = await this.prisma.ownerDocument.findUnique({
			where: { id },
			select: { id: true, status: true },
		});
		if (!document) throw new NotFoundException('No se encontró el documento.');
		if (document.status !== DocumentStatus.PENDING) {
			throw new NotFoundException('El documento ya fue revisado.');
		}
		return this.prisma.ownerDocument.update({
			where: { id },
			data: {
				status: decision === 'APPROVED' ? DocumentStatus.APPROVED : DocumentStatus.REJECTED,
				reviewNote: note.trim(),
				reviewedAt: new Date(),
				reviewedById: reviewerId,
			},
			select: { id: true, type: true, status: true, reviewNote: true, reviewedAt: true },
		});
	}

	async uploadOwnDocuments(userId: string, files: OwnerRegistrationFiles) {
		const uploads = this.collectUploads(files);
		const owner = await this.prisma.owner.findUnique({
			where: { userId },
			select: {
				id: true,
				status: true,
				embarcaciones: { select: { id: true }, orderBy: { createdAt: 'asc' }, take: 1 },
			},
		});
		if (!owner) throw new NotFoundException('No se encontró la ficha del propietario.');
		if (owner.status === OwnerStatus.APPROVED) {
			throw new ConflictException(
				'La solicitud ya está aprobada; contactá al administrador para cambiar la documentación.',
			);
		}

		const boatId = owner.embarcaciones[0]?.id;
		return this.prisma.$transaction(async (transaction) => {
			for (const { type, file } of uploads.filter((upload) => upload.type !== DocumentType.PHOTO)) {
				const existing = await transaction.ownerDocument.findFirst({
					where: { ownerId: owner.id, type },
					orderBy: { createdAt: 'desc' },
					select: { id: true },
				});
				const data = {
					filename: safeFilename(file.originalname),
					mimeType: file.mimetype,
					size: file.size,
					content: new Uint8Array(file.buffer),
					status: DocumentStatus.PENDING,
					reviewNote: null,
					reviewedAt: null,
					reviewedById: null,
				};
				if (existing) {
					await transaction.ownerDocument.update({ where: { id: existing.id }, data });
				} else {
					await transaction.ownerDocument.create({
						data: { ownerId: owner.id, boatId, type, ...data },
					});
				}
			}

			const photos = uploads.filter((upload) => upload.type === DocumentType.PHOTO);
			if (photos.length) {
				await transaction.ownerDocument.deleteMany({
					where: { ownerId: owner.id, type: DocumentType.PHOTO },
				});
				await transaction.ownerDocument.createMany({
					data: photos.map(({ file }) => ({
						ownerId: owner.id,
						boatId,
						type: DocumentType.PHOTO,
						filename: safeFilename(file.originalname),
						mimeType: file.mimetype,
						size: file.size,
						content: new Uint8Array(file.buffer),
					})),
				});
			}

			if (owner.status === OwnerStatus.REJECTED) {
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
			}

			const documents = await transaction.ownerDocument.findMany({
				where: { ownerId: owner.id },
				orderBy: { createdAt: 'asc' },
				select: {
					id: true,
					type: true,
					status: true,
					filename: true,
					size: true,
					reviewNote: true,
					createdAt: true,
				},
			});
			return {
				ownerStatus: owner.status === OwnerStatus.REJECTED ? OwnerStatus.PENDING : owner.status,
				documents,
			};
		});
	}

	private collectUploads(files: OwnerRegistrationFiles) {
		const required: Array<[keyof OwnerRegistrationFiles, DocumentType]> = [
			['license', DocumentType.LICENSE],
			['insurance', DocumentType.INSURANCE],
			['backgroundCheck', DocumentType.BACKGROUND_CHECK],
		];
		const uploads: Array<{ type: DocumentType; file: UploadedDocumentFile }> = [];

		for (const [field, type] of required) {
			const file = files[field]?.[0];
			if (!file) continue;
			validateUploadedFile(file);
			uploads.push({ type, file });
		}
		for (const file of files.photos ?? []) {
			validateUploadedFile(file, false);
			uploads.push({ type: DocumentType.PHOTO, file });
		}
		if (!uploads.length) {
			throw new BadRequestException('Enviá al menos un documento.');
		}
		return uploads;
	}

	async getPrivateDocument(id: string, user: AuthenticatedUser) {
		const document = await this.prisma.ownerDocument.findUnique({
			where: { id },
			select: {
				owner: { select: { userId: true } },
				filename: true,
				mimeType: true,
				content: true,
			},
		});
		if (!document) throw new NotFoundException('No se encontró el documento.');
		if (user.role !== Role.ADMIN && document.owner.userId !== user.id) {
			throw new ForbiddenException('No tenés permisos para consultar este documento.');
		}
		return document;
	}
}
