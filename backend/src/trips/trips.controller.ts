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
import { Role, TripStatus } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { TripsService } from './trips.service.js';
import { CreateTripDto } from './create-trip.dto.js';
import { ListTripsQueryDto } from './list-trips-query.dto.js';
import {
	PaginatedTripsDto,
	TripAsignadoDto,
	TripEstadoDto,
	TripResumenDto,
} from './trips.responses.js';
import { UpdateTripStatusDto } from './update-trip-status.dto.js';
import { AssignBoatDto } from './assign-boat.dto.js';

@ApiTags('trips')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
@Controller('admin/trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class TripsController {
	constructor(private readonly tripsService: TripsService) {}

	@Get()
	@ApiOperation({ summary: 'Viajes paginados con filtros de estado, texto y fechas' })
	@ApiOkResponse({ type: PaginatedTripsDto })
	list(@Query() query: ListTripsQueryDto) {
		return this.tripsService.list(query);
	}

	@Post()
	@ApiOperation({ summary: 'Crea un viaje, con embarcación opcional ya asignada' })
	@ApiCreatedResponse({
		type: TripResumenDto,
		description: 'ASSIGNED si se asignó embarcación; PENDING en caso contrario.',
	})
	@ApiBadRequestResponse({ description: 'Embarcación no aprobada, sin capacidad u ocupada.' })
	@ApiNotFoundResponse({ description: 'Embarcación inexistente.' })
	create(@Body() dto: CreateTripDto, @Req() request: AuthenticatedRequest) {
		return this.tripsService.create(dto, request.user!.id);
	}

	@Patch(':id/status')
	@ApiOperation({ summary: 'Avanza o cancela un viaje según las transiciones permitidas' })
	@ApiOkResponse({ type: TripEstadoDto })
	@ApiNotFoundResponse({ description: 'Viaje inexistente.' })
	@ApiBadRequestResponse({ description: 'Transición no permitida o viaje sin embarcación.' })
	updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTripStatusDto) {
		return this.tripsService.updateStatus(id, dto.status as TripStatus);
	}

	@Patch(':id/assign')
	@ApiOperation({ summary: 'Asigna una embarcación aprobada a un viaje PENDING' })
	@ApiOkResponse({ type: TripAsignadoDto })
	@ApiNotFoundResponse({ description: 'Viaje o embarcación inexistente.' })
	@ApiBadRequestResponse({ description: 'Viaje ya asignado o embarcación sin capacidad/disponibilidad.' })
	assignBoat(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignBoatDto) {
		return this.tripsService.assignBoat(id, dto.boatId);
	}
}
