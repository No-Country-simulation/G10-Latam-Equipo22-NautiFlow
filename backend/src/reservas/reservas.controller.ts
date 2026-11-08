import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiConflictResponse,
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
import { ListReservasQueryDto } from './list-reservas-query.dto.js';
import {
	ConfirmarReservaResponseDto,
	PaginatedReservasDto,
	ReservaDetailDto,
	ReservaListItemDto,
} from './reservas.responses.js';
import { ReservasService } from './reservas.service.js';
import { UpdateReservaEstadoDto } from './update-reserva-estado.dto.js';

@ApiTags('reservas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
@Controller('admin/reservas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReservasController {
	constructor(@Inject(ReservasService) private readonly reservasService: ReservasService) {}

	@Get()
	@ApiOperation({ summary: 'Reservas paginadas con filtros de estado y tramo' })
	@ApiOkResponse({ type: PaginatedReservasDto })
	list(@Query() query: ListReservasQueryDto) {
		return this.reservasService.list(query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Detalle de una reserva con su revisor' })
	@ApiOkResponse({ type: ReservaDetailDto })
	@ApiNotFoundResponse({ description: 'Reserva inexistente.' })
	detail(@Param('id', ParseUUIDPipe) id: string) {
		return this.reservasService.detail(id);
	}

	@Post(':id/confirmar')
	@ApiOperation({ summary: 'Confirma una reserva PENDIENTE y crea el viaje asociado' })
	@ApiCreatedResponse({
		type: ConfirmarReservaResponseDto,
		description: 'Descuenta cupo en el tramo y devuelve la reserva con el viaje creado.',
	})
	@ApiNotFoundResponse({ description: 'Reserva, tramo o salida inexistente.' })
	@ApiConflictResponse({ description: 'Reserva ya procesada o salida/tramo no disponible.' })
	@ApiBadRequestResponse({ description: 'Transición o datos inválidos.' })
	confirmar(@Param('id', ParseUUIDPipe) id: string, @Req() request: AuthenticatedRequest) {
		return this.reservasService.confirmar(id, request.user!.id);
	}

	@Patch(':id/estado')
	@ApiOperation({ summary: 'Rechaza o cancela una reserva (restaura cupo al cancelar)' })
	@ApiOkResponse({ type: ReservaListItemDto })
	@ApiNotFoundResponse({ description: 'Reserva inexistente.' })
	@ApiBadRequestResponse({ description: 'Transición de estado no permitida.' })
	@ApiConflictResponse({ description: 'No se puede cancelar una reserva con viaje COMPLETADO.' })
	updateEstado(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateReservaEstadoDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.reservasService.updateEstado(id, dto.estado, dto.nota, request.user!.id);
	}
}
