import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateZoneDto } from './create-zone.dto.js';
import { UpdateZoneDto } from './update-zone.dto.js';
import { ZonesService } from './zones.service.js';

// Zonas de cobertura del Delta y su relación con las embarcaciones.
@ApiTags('zones')
@Controller('zones')
export class ZonesController {
	constructor(private readonly zonesService: ZonesService) {}

	@Get()
	listActive() {
		return this.zonesService.listActive();
	}

	@Get('admin')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	listAll() {
		return this.zonesService.listAll();
	}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	create(@Body() datos: CreateZoneDto) {
		return this.zonesService.create(datos);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	update(@Param('id', ParseUUIDPipe) id: string, @Body() datos: UpdateZoneDto) {
		return this.zonesService.update(id, datos);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	deactivate(@Param('id', ParseUUIDPipe) id: string) {
		return this.zonesService.deactivate(id);
	}
}
