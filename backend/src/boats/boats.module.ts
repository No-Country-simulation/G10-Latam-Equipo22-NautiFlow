import { Module } from '@nestjs/common';
import { BoatsController } from './boats.controller.js';
import { BoatsService } from './boats.service.js';
import { BoatScheduleService } from './boat-schedule.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  controllers: [BoatsController],
  imports: [AuthModule],
  providers: [BoatsService, BoatScheduleService],
  exports: [BoatsService, BoatScheduleService],
})
export class BoatsModule {}
