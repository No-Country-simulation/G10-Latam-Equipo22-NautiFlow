import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { CreateSalidaDto } from './create-salida.dto.js';
import { ListSalidasQueryDto } from './list-salidas-query.dto.js';
import {
	PaginatedSalidasDto,
	SalidaDetailDto,
	SalidaResumenDto,
	TramoAdminDto,
} from './salidas.responses.js';
import { SalidasService } from './salidas.service.js';
import { UpdateSalidaDto } from './update-salida.dto.js';
import { UpdateTramoDto } from './update-tramo.dto.js';

@ApiTags('salidas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
@Controller('admin/salidas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SalidasController {
	constructor(private readonly salidasService: SalidasService) {}

	@Get()
	@ApiOperation({ summary: 'Salidas paginadas con sus tramos (por defecto todas)' })
	@ApiOkResponse({ type: PaginatedSalidasDto })
	list(@Query() query: ListSalidasQueryDto) {
		return this.salidasService.list(query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Detalle de una salida con su creador' })
	@ApiOkResponse({ type: SalidaDetailDto })
	@ApiNotFoundResponse({ description: 'Salida inexistente.' })
	detail(@Param('id', ParseUUIDPipe) id: string) {
		return this.salidasService.adminDetail(id);
	}

	@Post()
	@ApiOperation({ summary: 'Crea una salida con sus tramos en una transacción' })
	@ApiCreatedResponse({ type: SalidaDetailDto })
	@ApiBadRequestResponse({ description: 'Fechas inválidas o solapamiento con otra salida/viaje.' })
	@ApiNotFoundResponse({ description: 'Embarcación inexistente o no elegible.' })
	create(@Body() dto: CreateSalidaDto, @Req() request: AuthenticatedRequest) {
		return this.salidasService.create(dto, request.user!.id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Actualiza estado o fecha de la salida (desplaza sus tramos)' })
	@ApiOkResponse({ type: SalidaResumenDto })
	@ApiNotFoundResponse({ description: 'Salida inexistente.' })
	@ApiBadRequestResponse({ description: 'Fecha no futura o solapamiento al re-validar.' })
	update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSalidaDto) {
		return this.salidasService.update(id, dto);
	}

	@Patch(':salidaId/tramos/:tramoId')
	@ApiOperation({ summary: 'Actualiza estado, cupo, precio o fecha de un tramo' })
	@ApiOkResponse({ type: TramoAdminDto })
	@ApiNotFoundResponse({ description: 'Salida o tramo inexistente.' })
	@ApiBadRequestResponse({ description: 'Cupo/fecha inválidos o solapamiento.' })
	updateTramo(
		@Param('salidaId', ParseUUIDPipe) salidaId: string,
		@Param('tramoId', ParseUUIDPipe) tramoId: string,
		@Body() dto: UpdateTramoDto,
	) {
		return this.salidasService.updateTramo(salidaId, tramoId, dto);
	}
}
