import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
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
}
