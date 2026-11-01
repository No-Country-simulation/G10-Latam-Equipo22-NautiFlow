import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BoatsModule } from '../boats/boats.module.js';
import { PublicSalidasController } from './public-salidas.controller.js';
import { SalidasController } from './salidas.controller.js';
import { SalidasService } from './salidas.service.js';

@Module({
	imports: [AuthModule, BoatsModule],
	controllers: [SalidasController, PublicSalidasController],
	providers: [SalidasService],
	exports: [SalidasService],
})
export class SalidasModule {}
