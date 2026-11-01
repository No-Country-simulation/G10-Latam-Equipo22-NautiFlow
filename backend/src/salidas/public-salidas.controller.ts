import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicSalidasQueryDto } from './public-salidas-query.dto.js';
import { SalidasService } from './salidas.service.js';

// Catálogo público de salidas y tramos (US-17).
@ApiTags('public-salidas')
@Controller('public/salidas')
export class PublicSalidasController {
	constructor(private readonly salidasService: SalidasService) {}

	@Get()
	list(@Query() query: PublicSalidasQueryDto) {
		return this.salidasService.listPublic(query);
	}

	@Get(':id')
	detail(@Param('id', ParseUUIDPipe) id: string) {
		return this.salidasService.getPublic(id);
	}
}
