import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { ListReservasQueryDto } from './list-reservas-query.dto.js';
import { ReservasService } from './reservas.service.js';
import { UpdateReservaEstadoDto } from './update-reserva-estado.dto.js';

@ApiTags('reservas')
@Controller('admin/reservas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReservasController {
	constructor(private readonly reservasService: ReservasService) {}

	@Get()
	list(@Query() query: ListReservasQueryDto) {
		return this.reservasService.list(query);
	}

	@Get(':id')
	detail(@Param('id', ParseUUIDPipe) id: string) {
		return this.reservasService.detail(id);
	}

	@Post(':id/confirmar')
	confirmar(@Param('id', ParseUUIDPipe) id: string, @Req() request: AuthenticatedRequest) {
		return this.reservasService.confirmar(id, request.user!.id);
	}

	@Patch(':id/estado')
	updateEstado(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateReservaEstadoDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.reservasService.updateEstado(id, dto.estado, dto.nota, request.user!.id);
	}
}
