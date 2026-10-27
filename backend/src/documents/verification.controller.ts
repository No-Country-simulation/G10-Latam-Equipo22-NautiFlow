import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { DocumentsService } from './documents.service.js';
import { ReviewDocumentDto } from './review-document.dto.js';

@ApiTags('admin-documents')
@Controller('admin/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminDocumentsController {
	constructor(private readonly documentsService: DocumentsService) {}

	@Get()
	listPending() {
		return this.documentsService.listPending();
	}

	@Patch(':id/review')
	review(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: ReviewDocumentDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.documentsService.review(id, dto.decision, dto.note, request.user!.id);
	}
}