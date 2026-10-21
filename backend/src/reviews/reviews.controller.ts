import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Enlace de reseña y envío público con token de un solo uso (US-09, US-10, US-11).
@ApiTags('reviews')
@Controller('public/reviews')
export class ReviewsController {}
