import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { Role } from '../generated/prisma/client.js';
import { CreateOwnerEmptyLegDto } from './create-owner-empty-leg.dto.js';
import { EmptyLegCreadoDto, PaginatedEmptyLegsDto } from './empty-legs.responses.js';
import { EmptyLegsService } from './empty-legs.service.js';
import { ListOwnerEmptyLegsQueryDto } from './list-owner-empty-legs-query.dto.js';
import { UpdateOwnerEmptyLegDto } from './update-owner-empty-leg.dto.js';

@ApiTags('empty-legs')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol OWNER.' })
@Controller('owners/me/empty-legs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class OwnerEmptyLegsController {
  constructor(@Inject(EmptyLegsService) private readonly emptyLegsService: EmptyLegsService) {}

  @Get()
  @ApiOperation({ summary: 'Retornos del lanchero autenticado (todos los estados)' })
  @ApiOkResponse({ type: PaginatedEmptyLegsDto })
  listMine(@Req() request: AuthenticatedRequest, @Query() query: ListOwnerEmptyLegsQueryDto) {
    return this.emptyLegsService.listMine(request.user!.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Publica un retorno en vacío de una de sus embarcaciones' })
  @ApiCreatedResponse({ type: EmptyLegCreadoDto })
  @ApiNotFoundResponse({ description: 'Embarcación inexistente o de otro lanchero.' })
  @ApiBadRequestResponse({ description: 'Fecha no futura.' })
  createMine(@Req() request: AuthenticatedRequest, @Body() dto: CreateOwnerEmptyLegDto) {
    return this.emptyLegsService.createMine(request.user!.id, request.user!.name, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifica la fecha o el estado (Disponible/Cerrado) de su retorno' })
  @ApiOkResponse({ type: EmptyLegCreadoDto })
  @ApiNotFoundResponse({ description: 'Retorno inexistente o de otro lanchero.' })
  @ApiBadRequestResponse({ description: 'Retorno asignado/ofrecido, estado no permitido o fecha pasada.' })
  updateMine(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOwnerEmptyLegDto,
  ) {
    return this.emptyLegsService.updateMine(request.user!.id, request.user!.name, id, dto);
  }
}
