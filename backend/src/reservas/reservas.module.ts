import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BoatsModule } from '../boats/boats.module.js';
import { RateLimitGuard } from '../common/guards/rate-limit.guard.js';
import { PublicReservasController } from './public-reservas.controller.js';
import { ReservasController } from './reservas.controller.js';
import { ReservasService } from './reservas.service.js';

@Module({
	imports: [AuthModule, BoatsModule],
	controllers: [ReservasController, PublicReservasController],
	providers: [ReservasService, RateLimitGuard],
	exports: [ReservasService],
})
export class ReservasModule {}
