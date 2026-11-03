import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ReviewLinkDto } from './reviews.responses.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('admin-review-links')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
@Controller('admin/trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CreateReviewLinkController {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Post(':id/review-link')
	@ApiOperation({ summary: 'Genera el enlace de reseña para un viaje COMPLETADO' })
	@ApiCreatedResponse({
		type: ReviewLinkDto,
		description: 'El token del enlace vence en 14 días y sirve una sola vez.',
	})
	@ApiNotFoundResponse({ description: 'Viaje inexistente.' })
	@ApiBadRequestResponse({ description: 'El viaje no está COMPLETADO o ya tiene reseña.' })
	create(@Param('id', ParseUUIDPipe) id: string) {
		return this.reviewsService.createLink(id);
	}
}
