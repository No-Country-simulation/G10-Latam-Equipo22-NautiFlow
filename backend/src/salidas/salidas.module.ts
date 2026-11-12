import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BoatsModule } from '../boats/boats.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { OwnerSalidasController } from './owner-salidas.controller.js';
import { PublicSalidasController } from './public-salidas.controller.js';
import { SalidasController } from './salidas.controller.js';
import { SalidasService } from './salidas.service.js';

@Module({
	imports: [AuthModule, BoatsModule, NotificationsModule],
	controllers: [SalidasController, PublicSalidasController, OwnerSalidasController],
	providers: [SalidasService],
	exports: [SalidasService],
})
export class SalidasModule {}
