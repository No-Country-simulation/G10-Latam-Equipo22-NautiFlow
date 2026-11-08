import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiGoneResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto.js';
import {
	ReviewContextDto,
	ReviewEnviadaDto,
} from './reviews.responses.js';
import { ReviewsService } from './reviews.service.js';

// Enlace de reseña y envío público con token de un solo uso (US-09, US-10, US-11).
@ApiTags('reviews')
@Controller('public/reviews')
export class ReviewsController {
	constructor(@Inject(ReviewsService) private readonly reviewsService: ReviewsService) {}

	@Get(':token')
	@ApiOperation({ summary: 'Contexto del viaje a reseñar a partir del token del enlace' })
	@ApiOkResponse({ type: ReviewContextDto })
	@ApiNotFoundResponse({ description: 'Token desconocido.' })
	@ApiGoneResponse({ description: 'Token vencido o ya utilizado.' })
	getContext(@Param('token') token: string) {
		return this.reviewsService.getReviewContext(token);
	}

	@Post(':token')
	@ApiOperation({ summary: 'Envía la reseña usando el token de un solo uso' })
	@ApiCreatedResponse({ type: ReviewEnviadaDto })
	@ApiBadRequestResponse({ description: 'Rating fuera de rango o comentario inválido.' })
	@ApiGoneResponse({ description: 'Token vencido, usado o viaje no reseñable.' })
	submit(@Param('token') token: string, @Body() dto: CreateReviewDto) {
		return this.reviewsService.submit(token, dto.rating, dto.comment);
	}
}
