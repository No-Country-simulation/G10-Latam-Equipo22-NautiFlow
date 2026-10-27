import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto.js';
import { ReviewsService } from './reviews.service.js';

// Enlace de reseña y envío público con token de un solo uso (US-09, US-10, US-11).
@ApiTags('reviews')
@Controller('public/reviews')
export class ReviewsController {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Get(':token')
	getContext(@Param('token') token: string) {
		return this.reviewsService.getReviewContext(token);
	}

	@Post(':token')
	submit(@Param('token') token: string, @Body() dto: CreateReviewDto) {
		return this.reviewsService.submit(token, dto.rating, dto.comment);
	}
}
