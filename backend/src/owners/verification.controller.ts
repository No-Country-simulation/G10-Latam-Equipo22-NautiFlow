import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBadRequestResponse,
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
import { OwnersService } from './owners.service.js';
import { ListSolicitudesQueryDto } from './list-solicitudes-query.dto.js';
import { OwnerRecordDto, PaginatedSolicitudesDto } from './owners.responses.js';
import { ReviewRequestDto } from './review-request.dto.js';

@ApiTags('admin-solicitudes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
@Controller('admin/solicitudes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class VerificationController {
	constructor(private readonly ownersService: OwnersService) {}

	@Get()
	@ApiOperation({ summary: 'Solicitudes de lanchero paginadas (por defecto todas)' })
	@ApiOkResponse({ type: PaginatedSolicitudesDto })
	list(@Query() query: ListSolicitudesQueryDto) {
		return this.ownersService.listRequests(query);
	}

	@Patch(':id/aprobar')
	@ApiOperation({ summary: 'Aprueba una solicitud con sus tres documentos requeridos' })
	@ApiOkResponse({ type: OwnerRecordDto })
	@ApiNotFoundResponse({ description: 'Solicitud inexistente.' })
	@ApiBadRequestResponse({ description: 'No está PENDIENTA o faltan documentos aprobados.' })
	approve(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: ReviewRequestDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.ownersService.reviewRequest(id, 'APPROVED', dto.note, request.user!.id);
	}

	@Patch(':id/rechazar')
	@ApiOperation({ summary: 'Rechaza una solicitud indicando el motivo' })
	@ApiOkResponse({ type: OwnerRecordDto })
	@ApiNotFoundResponse({ description: 'Solicitud inexistente.' })
	@ApiBadRequestResponse({ description: 'No está PENDIENTA.' })
	reject(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: ReviewRequestDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.ownersService.reviewRequest(id, 'REJECTED', dto.note, request.user!.id);
	}
}
