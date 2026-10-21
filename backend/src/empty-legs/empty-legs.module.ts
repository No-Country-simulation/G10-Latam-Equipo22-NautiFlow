import { Module } from '@nestjs/common';
import { EmptyLegsController } from './empty-legs.controller.js';
import { EmptyLegsService } from './empty-legs.service.js';

@Module({
  controllers: [EmptyLegsController],
  providers: [EmptyLegsService],
  exports: [EmptyLegsService],
})
export class EmptyLegsModule {}
