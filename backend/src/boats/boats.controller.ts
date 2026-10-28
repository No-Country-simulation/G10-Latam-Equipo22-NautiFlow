import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { CreateBoatDto } from './create-boat.dto.js';
import { UpdateBoatDto } from './update-boat.dto.js';
import { BoatsService } from './boats.service.js';

// Alta y edición de embarcaciones, y búsqueda del admin (US-03, US-06).
@ApiTags('boats')
@Controller('boats')
export class BoatsController {
	constructor(private readonly boatsService: BoatsService) {}

	@Get('admin/approved')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	listApproved() {
		return this.boatsService.listApproved();
	}

	@Get('mine')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	listMine(@Req() request: AuthenticatedRequest) {
		return this.boatsService.listMine(request.user!.id);
	}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	create(@Req() request: AuthenticatedRequest, @Body() datos: CreateBoatDto) {
		return this.boatsService.create(request.user!.id, datos);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	getMine(@Param('id', ParseUUIDPipe) id: string, @Req() request: AuthenticatedRequest) {
		return this.boatsService.getMine(id, request.user!.id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	update(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: AuthenticatedRequest,
		@Body() datos: UpdateBoatDto,
	) {
		return this.boatsService.update(id, request.user!.id, datos);
	}
}
