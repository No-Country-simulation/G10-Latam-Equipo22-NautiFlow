import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('admin-review-links')
@Controller('admin/trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CreateReviewLinkController {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Post(':id/review-link')
	create(@Param('id', ParseUUIDPipe) id: string) {
		return this.reviewsService.createLink(id);
	}
}