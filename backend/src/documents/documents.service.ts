import { Injectable } from '@nestjs/common';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DocumentStatus, Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/types.js';

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
