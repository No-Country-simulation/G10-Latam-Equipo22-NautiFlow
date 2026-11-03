import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { PublicBoatsQueryDto } from './public-boats-query.dto.js';
import {
	EmbarcacionDetallePublicaDto,
	PaginatedPublicBoatsDto,
	PaginatedPublicReviewsDto,
} from './reviews.responses.js';
import { ReviewsService } from './reviews.service.js';

// Reputación pública de embarcaciones verificadas (US-11).
@ApiTags('public-boats')
@Controller('public/boats')
export class PublicBoatsController {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Get()
	@ApiOperation({ summary: 'Catálogo público de embarcaciones elegibles con reputación' })
	@ApiOkResponse({ type: PaginatedPublicBoatsDto })
	list(@Query() query: PublicBoatsQueryDto) {
		return this.reviewsService.listPublicBoats(query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Detalle público de una embarcación con sus últimas cinco reseñas' })
	@ApiOkResponse({ type: EmbarcacionDetallePublicaDto })
	@ApiNotFoundResponse({ description: 'Embarcación inexistente o no elegible.' })
	detail(@Param('id', ParseUUIDPipe) id: string) {
		return this.reviewsService.getPublicBoat(id);
	}

	@Get(':id/reviews')
	@ApiOperation({ summary: 'Reseñas paginadas de una embarcación' })
	@ApiOkResponse({ type: PaginatedPublicReviewsDto })
	@ApiNotFoundResponse({ description: 'Embarcación inexistente o no elegible.' })
	reviews(@Param('id', ParseUUIDPipe) id: string, @Query() query: PaginationQueryDto) {
		return this.reviewsService.listPublicBoatReviews(id, query);
	}
}
