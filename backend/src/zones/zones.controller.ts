import { Body, Controller, Delete, Get, Inject, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
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
import { CreateZoneDto } from './create-zone.dto.js';
import { UpdateZoneDto } from './update-zone.dto.js';
import { ZonaActivaDto, ZonaDto } from './zones.responses.js';
import { ZonesService } from './zones.service.js';

// Zonas de cobertura del Delta y su relación con las embarcaciones.
@ApiTags('zones')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@Controller('zones')
export class ZonesController {
	constructor(@Inject(ZonesService) private readonly zonesService: ZonesService) {}

	@Get()
	@ApiOperation({ summary: 'Zonas activas para el catálogo público' })
	@ApiOkResponse({ type: [ZonaActivaDto] })
	listActive() {
		return this.zonesService.listActive();
	}

	@Get('admin')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Todas las zonas, incluidas inactivas' })
	@ApiOkResponse({ type: [ZonaDto] })
	@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
	listAll() {
		return this.zonesService.listAll();
	}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Crea una zona de cobertura' })
	@ApiCreatedResponse({ type: ZonaDto })
	@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
	@ApiConflictResponse({ description: 'Ya existe una zona con ese nombre.' })
	create(@Body() datos: CreateZoneDto) {
		return this.zonesService.create(datos);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Actualiza nombre o descripción de una zona' })
	@ApiOkResponse({ type: ZonaDto })
	@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
	@ApiNotFoundResponse({ description: 'Zona inexistente.' })
	@ApiBadRequestResponse({ description: 'Datos inválidos.' })
	@ApiConflictResponse({ description: 'Ya existe otra zona con ese nombre.' })
	update(@Param('id', ParseUUIDPipe) id: string, @Body() datos: UpdateZoneDto) {
		return this.zonesService.update(id, datos);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Desactiva una zona (borrado lógico)' })
	@ApiOkResponse({ type: ZonaDto })
	@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
	@ApiNotFoundResponse({ description: 'Zona inexistente.' })
	deactivate(@Param('id', ParseUUIDPipe) id: string) {
		return this.zonesService.deactivate(id);
	}
}
