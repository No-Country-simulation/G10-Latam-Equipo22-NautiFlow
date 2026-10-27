import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller.js';
import { TripsService } from './trips.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  controllers: [TripsController],
  imports: [AuthModule],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
