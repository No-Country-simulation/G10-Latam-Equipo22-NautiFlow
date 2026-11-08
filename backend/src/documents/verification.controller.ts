import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBadRequestResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { DocumentsService } from './documents.service.js';
import { DocumentoRevisadoDto, PaginatedDocumentsDto } from './documents.responses.js';
import { ListDocumentsQueryDto } from './list-documents-query.dto.js';
import { ReviewDocumentDto } from './review-document.dto.js';

@ApiTags('admin-documents')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
@Controller('admin/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminDocumentsController {
	constructor(@Inject(DocumentsService) private readonly documentsService: DocumentsService) {}

	@Get()
	@ApiOperation({ summary: 'Documentos de lanchero paginados (por defecto PENDIENTES)' })
	@ApiOkResponse({ type: PaginatedDocumentsDto })
	list(@Query() query: ListDocumentsQueryDto) {
		return this.documentsService.list(query);
	}

	@Patch(':id/review')
	@ApiOperation({ summary: 'Aprueba o rechaza un documento pendiente' })
	@ApiOkResponse({ type: DocumentoRevisadoDto })
	@ApiNotFoundResponse({ description: 'Documento inexistente o ya revisado.' })
	@ApiBadRequestResponse({ description: 'Decisión o nota inválida.' })
	review(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: ReviewDocumentDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.documentsService.review(id, dto.decision, dto.note, request.user!.id);
	}
}
