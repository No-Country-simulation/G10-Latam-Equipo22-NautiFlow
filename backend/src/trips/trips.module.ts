import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller.js';
import { TripsService } from './trips.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { BoatsModule } from '../boats/boats.module.js';
import { ReservasModule } from '../reservas/reservas.module.js';

@Module({
	controllers: [TripsController],
	imports: [AuthModule, BoatsModule, ReservasModule],
	providers: [TripsService],
	exports: [TripsService],
})
export class TripsModule {}
