import {
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { DocumentsService } from './documents.service.js';
import type { OwnerRegistrationFiles } from './file.types.js';

// Reenvío de documentación tras un rechazo (US-04).
@ApiTags('documents')
@Controller('owners/me/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class OwnerDocumentsController {
	constructor(private readonly documentsService: DocumentsService) {}

	@Post()
	@HttpCode(HttpStatus.OK)
	@UseInterceptors(
		FileFieldsInterceptor(
			[
				{ name: 'license', maxCount: 1 },
				{ name: 'insurance', maxCount: 1 },
				{ name: 'backgroundCheck', maxCount: 1 },
				{ name: 'photos', maxCount: 5 },
			],
			{ limits: { fileSize: 5 * 1024 * 1024, files: 8, fields: 5 } },
		),
	)
	upload(
		@Req() request: AuthenticatedRequest,
		@UploadedFiles() files: OwnerRegistrationFiles | undefined,
	) {
		return this.documentsService.uploadOwnDocuments(request.user!.id, files ?? {});
	}
}
