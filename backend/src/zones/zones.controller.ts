import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZonesService } from './zones.service.js';

// Zonas de cobertura del Delta y su relación con las embarcaciones.
@ApiTags('zones')
@Controller('zones')
export class ZonesController {
	constructor(private readonly zonesService: ZonesService) {}

	@Get()
	listActive() {
		return this.zonesService.listActive();
	}
}
