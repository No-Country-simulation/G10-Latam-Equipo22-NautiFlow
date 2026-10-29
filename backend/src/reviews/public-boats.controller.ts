import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { PublicBoatsQueryDto } from './public-boats-query.dto.js';
import { ReviewsService } from './reviews.service.js';

// Reputación pública de embarcaciones verificadas (US-11).
@ApiTags('public-boats')
@Controller('public/boats')
export class PublicBoatsController {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Get()
	list(@Query() query: PublicBoatsQueryDto) {
		return this.reviewsService.listPublicBoats(query);
	}

	@Get(':id')
	detail(@Param('id', ParseUUIDPipe) id: string) {
		return this.reviewsService.getPublicBoat(id);
	}

	@Get(':id/reviews')
	reviews(@Param('id', ParseUUIDPipe) id: string, @Query() query: PaginationQueryDto) {
		return this.reviewsService.listPublicBoatReviews(id, query);
	}
}
