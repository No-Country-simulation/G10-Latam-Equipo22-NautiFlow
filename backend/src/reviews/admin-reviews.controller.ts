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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ListAdminReviewsQueryDto } from './list-admin-reviews-query.dto.js';
import {
	PaginatedAdminReviewsDto,
	PaginatedPendingReviewTripsDto,
} from './reviews.responses.js';
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

	@Get('pending-trips')
	@ApiOperation({ summary: 'Viajes completados que todavía no tienen reseña' })
	@ApiOkResponse({ type: PaginatedPendingReviewTripsDto })
	listPending(@Query() query: PaginationQueryDto) {
		return this.reviewsService.listPendingReviewTrips(query);
	}

	@Get()
	@ApiOperation({ summary: 'Reseñas recibidas, con filtros de lancha, calificación y fecha' })
	@ApiOkResponse({ type: PaginatedAdminReviewsDto })
	list(@Query() query: ListAdminReviewsQueryDto) {
		return this.reviewsService.listAdminReviews(query);
	}
}
