import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role, TripStatus } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { TripsService } from './trips.service.js';
import { CreateTripDto } from './create-trip.dto.js';
import { UpdateTripStatusDto } from './update-trip-status.dto.js';
import { AssignBoatDto } from './assign-boat.dto.js';

@ApiTags('trips')
@Controller('admin/trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class TripsController {
	constructor(private readonly tripsService: TripsService) {}

	@Get()
	list() {
		return this.tripsService.list();
	}

	@Post()
	create(@Body() dto: CreateTripDto, @Req() request: AuthenticatedRequest) {
		return this.tripsService.create(dto, request.user!.id);
	}

	@Patch(':id/status')
	updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTripStatusDto) {
		return this.tripsService.updateStatus(id, dto.status as TripStatus);
	}

	@Patch(':id/assign')
	assignBoat(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignBoatDto) {
		return this.tripsService.assignBoat(id, dto.boatId);
	}
}
