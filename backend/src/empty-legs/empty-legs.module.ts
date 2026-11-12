import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { EmptyLegsController } from './empty-legs.controller.js';
import { EmptyLegsService } from './empty-legs.service.js';
import { OwnerEmptyLegsController } from './owner-empty-legs.controller.js';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [EmptyLegsController, OwnerEmptyLegsController],
  providers: [EmptyLegsService],
  exports: [EmptyLegsService],
})
export class EmptyLegsModule {}
