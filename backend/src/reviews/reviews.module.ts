import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import { AdminReviewsController } from './admin-reviews.controller.js';
import { CreateReviewLinkController } from './create-review-link.controller.js';
import { PublicBoatsController } from './public-boats.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ReviewsController, CreateReviewLinkController, PublicBoatsController, AdminReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
