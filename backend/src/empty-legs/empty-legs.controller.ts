import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { EmptyLegStatus, Role } from '../generated/prisma/client.js';
import { CreateEmptyLegDto } from './create-empty-leg.dto.js';
import { EmptyLegCreadoDto, PaginatedEmptyLegsDto } from './empty-legs.responses.js';
import { EmptyLegsService } from './empty-legs.service.js';
import { ListEmptyLegsQueryDto } from './list-empty-legs-query.dto.js';

// Bolsa interna de tramos vacíos (US-12).
@ApiTags('empty-legs')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
@Controller('admin/empty-legs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class EmptyLegsController {
  constructor(@Inject(EmptyLegsService) private readonly emptyLegsService: EmptyLegsService) {}

  @Get()
  @ApiOperation({ summary: 'Tramos vacíos paginados (por defecto AVAILABLE)' })
  @ApiOkResponse({ type: PaginatedEmptyLegsDto })
  list(@Query() query: ListEmptyLegsQueryDto) {
    return this.emptyLegsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Registra el regreso en vacío de un viaje de ida' })
  @ApiCreatedResponse({
    type: EmptyLegCreadoDto,
    description: 'Origin/destination se derivan del viaje de origen.',
  })
  @ApiNotFoundResponse({ description: 'Viaje inexistente.' })
  @ApiBadRequestResponse({ description: 'Viaje sin embarcación, no asignado/confirmado o fecha inválida.' })
  @ApiConflictResponse({ description: 'El viaje ya tiene un tramo vacío activo.' })
  create(@Body() dto: CreateEmptyLegDto) {
    return this.emptyLegsService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualiza el estado de un tramo vacío (AVAILABLE, OFFERED, ASSIGNED, CLOSED)' })
  @ApiOkResponse({ description: 'Estado actualizado con éxito.' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: EmptyLegStatus,
  ) {
    return this.emptyLegsService.updateStatus(id, status);
  }
}
