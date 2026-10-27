import { Controller, Get, Param, ParseUUIDPipe, Req, StreamableFile, UseGuards, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { DocumentsService } from './documents.service.js';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
	constructor(private readonly documentsService: DocumentsService) {}

	@Get(':id/file')
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
