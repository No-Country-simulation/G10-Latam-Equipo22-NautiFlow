import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiConflictResponse,
	ApiForbiddenResponse,
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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { OwnersService } from './owners.service.js';
import { ResenasPropiasDto, SolicitudPropiaDto } from './owners.responses.js';
import { UpdateProfileDto } from './update-profile.dto.js';

@ApiTags('owners')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol OWNER.' })
@Controller('owners')
export class OwnersController {
	constructor(@Inject(OwnersService) private readonly ownersService: OwnersService) {}

	@Get('me/solicitud')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	@ApiOperation({ summary: 'Ficha de lanchero del usuario autenticado (perfil, lanchas y documentos)' })
	@ApiOkResponse({ type: SolicitudPropiaDto })
	getMyRequest(@Req() request: AuthenticatedRequest) {
		return this.ownersService.getMyRequest(request.user!.id);
	}

	@Post('me/solicitud/reabrir')
	@HttpCode(HttpStatus.OK)
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	@ApiOperation({ summary: 'Reabre una solicitud RECHAZADA para volver a revisión' })
	@ApiOkResponse({ type: SolicitudPropiaDto })
	@ApiConflictResponse({ description: 'La solicitud no está RECHAZADA.' })
	reopenMyRequest(@Req() request: AuthenticatedRequest) {
		return this.ownersService.reopenMyRequest(request.user!.id);
	}

	@Get('me/reviews')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	@ApiOperation({ summary: 'Reseñas de las lanchas del lanchero autenticado (promedio y paginado)' })
	@ApiOkResponse({ type: ResenasPropiasDto })
	listMyReviews(@Req() request: AuthenticatedRequest, @Query() query: PaginationQueryDto) {
		return this.ownersService.getMyReviews(request.user!.id, query);
	}

	@Patch('me')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	@ApiOperation({ summary: 'Actualiza nombre, teléfono y WhatsApp del lanchero' })
	@ApiOkResponse({ type: SolicitudPropiaDto })
	updateProfile(@Req() request: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
		return this.ownersService.updateProfile(request.user!.id, dto);
	}
}
