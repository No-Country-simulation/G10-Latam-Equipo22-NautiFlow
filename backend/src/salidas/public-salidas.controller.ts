import { Controller, Get, Inject, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicSalidasQueryDto } from './public-salidas-query.dto.js';
import {
	PaginatedSalidasPublicasDto,
	SalidaPublicaDetalleDto,
} from './salidas-public.responses.js';
import { SalidasService } from './salidas.service.js';

// Catálogo público de salidas y tramos (US-17).
@ApiTags('public-salidas')
@Controller('public/salidas')
export class PublicSalidasController {
	constructor(@Inject(SalidasService) private readonly salidasService: SalidasService) {}

	@Get()
	@ApiOperation({ summary: 'Lista salidas PROGRAMADAS futuras de lanchas elegibles' })
	@ApiOkResponse({
		type: PaginatedSalidasPublicasDto,
		description: 'Cada item incluye lancha pública, rating, tramos y disponibilidad.',
	})
	list(@Query() query: PublicSalidasQueryDto) {
		return this.salidasService.listPublic(query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Detalle de una salida pública con las últimas reseñas de la lancha' })
	@ApiOkResponse({ type: SalidaPublicaDetalleDto })
	@ApiNotFoundResponse({ description: 'Salida inexistente, pasada o de lancha no elegible.' })
	detail(@Param('id', ParseUUIDPipe) id: string) {
		return this.salidasService.getPublic(id);
	}
}
