import { Controller, Get, Param, ParseUUIDPipe, Req, StreamableFile, UseGuards, Res } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiProduces,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { DocumentsService } from './documents.service.js';

@ApiTags('documents')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
	constructor(private readonly documentsService: DocumentsService) {}

	@Get(':id/file')
	@ApiOperation({ summary: 'Descarga el archivo original de un documento (lanchero dueño o admin)' })
	@ApiProduces('application/octet-stream')
	@ApiOkResponse({
		description: 'Archivo binario con el nombre original como Content-Disposition.',
		schema: { type: 'string', format: 'binary' },
	})
	@ApiNotFoundResponse({ description: 'Documento inexistente o sin acceso.' })
	@ApiForbiddenResponse({ description: 'El documento pertenece a otro usuario.' })
	async download(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: AuthenticatedRequest,
		@Res({ passthrough: true }) response: Response,
	) {
		const document = await this.documentsService.getPrivateDocument(id, request.user!);
		response.setHeader('Content-Type', document.mimeType);
		response.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
		response.setHeader('X-Content-Type-Options', 'nosniff');
		response.setHeader('Cache-Control', 'private, no-store');
		return new StreamableFile(Buffer.from(document.content));
	}
}
