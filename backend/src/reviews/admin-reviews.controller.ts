import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('admin-reviews')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminReviewsController {
	constructor(@Inject(ReviewsService) private readonly reviewsService: ReviewsService) {}

	@Get()
	@ApiOperation({ summary: 'Reseñas recibidas por las embarcaciones con filtros' })
	listReviews(
		@Query() query: { boatId?: string; ratingMin?: string; fechaDesde?: string; fechaHasta?: string; page?: string; limit?: string },
	) {
		return this.reviewsService.listAdminReviews(query);
	}

	@Get('pending')
	@ApiOperation({ summary: 'Viajes completados pendientes de recibir o enviar reseña' })
	listPending(
		@Query() query: { page?: string; limit?: string; q?: string },
	) {
		return this.reviewsService.listPendingReviewTrips(query);
	}
}

