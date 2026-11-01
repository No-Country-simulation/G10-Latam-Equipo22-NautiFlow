import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EmptyLegsController } from './empty-legs.controller.js';
import { EmptyLegsService } from './empty-legs.service.js';

@Module({
  imports: [AuthModule],
  controllers: [EmptyLegsController],
  providers: [EmptyLegsService],
  exports: [EmptyLegsService],
})
export class EmptyLegsModule {}
