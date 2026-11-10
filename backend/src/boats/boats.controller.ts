import {
	Body,
	Controller,
	Get,
	Inject,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBadRequestResponse,
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
import { CreateBoatDto } from './create-boat.dto.js';
import {
	BoatOptionDto,
	EmbarcacionPropiaDto,
	PaginatedBoatsDto,
} from './boats.responses.js';
import { FleetQueryDto } from './fleet-query.dto.js';
import { SearchBoatsQueryDto } from './search-boats-query.dto.js';
import { UpdateBoatDto } from './update-boat.dto.js';
import { BoatsService } from './boats.service.js';

// Alta y edición de embarcaciones, y búsqueda del admin (US-03, US-06).
@ApiTags('boats')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@Controller('boats')
export class BoatsController {
	constructor(@Inject(BoatsService) private readonly boatsService: BoatsService) {}

	@Get('admin/approved')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Lanchas aprobadas para asignar a viajes' })
	@ApiOkResponse({ type: [BoatOptionDto] })
	@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
	listApproved() {
		return this.boatsService.listApproved();
	}

	@Get('admin/fleet')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	@ApiOperation({
		summary: 'Flota verificada con disponibilidad operativa calculada (libre, reservada o retorno vacío)',
	})
	@ApiOkResponse({ type: PaginatedBoatsDto })
	@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
	listFleet(@Query() query: FleetQueryDto) {
		return this.boatsService.listFleet(query);
	}

	@Get()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	@ApiOperation({
		summary: 'Busca lanchas aprobadas con filtros (texto, zona, capacidad, disponibilidad horaria)',
	})
	@ApiOkResponse({ type: PaginatedBoatsDto })
	@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
	search(@Query() query: SearchBoatsQueryDto) {
		return this.boatsService.search(query);
	}

	@Get('mine')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	@ApiOperation({ summary: 'Lanchas propias del lanchero autenticado' })
	@ApiOkResponse({ type: [EmbarcacionPropiaDto] })
	@ApiForbiddenResponse({ description: 'Requiere rol OWNER.' })
	listMine(@Req() request: AuthenticatedRequest) {
		return this.boatsService.listMine(request.user!.id);
	}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	@ApiOperation({ summary: 'Registra una lancha propia (queda PENDIENTE de verificación)' })
	@ApiCreatedResponse({ type: EmbarcacionPropiaDto })
	@ApiForbiddenResponse({ description: 'Requiere rol OWNER.' })
	@ApiBadRequestResponse({ description: 'Zona inexistente o datos inválidos.' })
	@ApiConflictResponse({ description: 'Matrícula ya registrada.' })
	create(@Req() request: AuthenticatedRequest, @Body() datos: CreateBoatDto) {
		return this.boatsService.create(request.user!.id, datos);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	@ApiOperation({ summary: 'Detalle de una lancha propia' })
	@ApiOkResponse({ type: EmbarcacionPropiaDto })
	@ApiForbiddenResponse({ description: 'Requiere rol OWNER.' })
	@ApiNotFoundResponse({ description: 'Lancha inexistente o de otro propietario.' })
	getMine(@Param('id', ParseUUIDPipe) id: string, @Req() request: AuthenticatedRequest) {
		return this.boatsService.getMine(id, request.user!.id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	@ApiOperation({ summary: 'Actualiza una lancha propia y sus zonas' })
	@ApiOkResponse({ type: EmbarcacionPropiaDto })
	@ApiForbiddenResponse({ description: 'Requiere rol OWNER.' })
	@ApiNotFoundResponse({ description: 'Lancha inexistente, de otro propietario o zona inexistente.' })
	@ApiBadRequestResponse({ description: 'Datos inválidos.' })
	@ApiConflictResponse({ description: 'Matrícula ya registrada.' })
	update(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: AuthenticatedRequest,
		@Body() datos: UpdateBoatDto,
	) {
		return this.boatsService.update(id, request.user!.id, datos);
	}
}
