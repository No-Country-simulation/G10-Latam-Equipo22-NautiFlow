import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
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
import { ListSalidasQueryDto } from './list-salidas-query.dto.js';
import { PaginatedSalidasDto, SalidaResumenDto, TramoAdminDto } from './salidas.responses.js';
import { SalidasService } from './salidas.service.js';
import { UpdateSalidaDto } from './update-salida.dto.js';
import { UpdateTramoDto } from './update-tramo.dto.js';

@ApiTags('salidas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol OWNER.' })
@Controller('owners/me/salidas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class OwnerSalidasController {
	constructor(@Inject(SalidasService) private readonly salidasService: SalidasService) {}

	@Get()
	@ApiOperation({ summary: 'Salidas de las embarcaciones del lanchero autenticado' })
	@ApiOkResponse({ type: PaginatedSalidasDto })
	listMine(@Req() request: AuthenticatedRequest, @Query() query: ListSalidasQueryDto) {
		return this.salidasService.listMine(request.user!.id, query);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Actualiza estado o fecha de su salida (desplaza sus tramos)' })
	@ApiOkResponse({ type: SalidaResumenDto })
	@ApiNotFoundResponse({ description: 'Salida inexistente o de otra embarcación.' })
	@ApiBadRequestResponse({ description: 'Fecha no futura o solapamiento al re-validar.' })
	updateMine(
		@Req() request: AuthenticatedRequest,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateSalidaDto,
	) {
		return this.salidasService.updateMine(request.user!.id, request.user!.name, id, dto);
	}

	@Patch(':salidaId/tramos/:tramoId')
	@ApiOperation({ summary: 'Actualiza estado, cupo, precio o fecha de un tramo de su salida' })
	@ApiOkResponse({ type: TramoAdminDto })
	@ApiNotFoundResponse({ description: 'Salida o tramo inexistente o de otra embarcación.' })
	@ApiBadRequestResponse({ description: 'Cupo/fecha inválidos, solapamiento o estado reservado.' })
	updateTramoMine(
		@Req() request: AuthenticatedRequest,
		@Param('salidaId', ParseUUIDPipe) salidaId: string,
		@Param('tramoId', ParseUUIDPipe) tramoId: string,
		@Body() dto: UpdateTramoDto,
	) {
		return this.salidasService.updateTramoMine(request.user!.id, request.user!.name, salidaId, tramoId, dto);
	}
}
