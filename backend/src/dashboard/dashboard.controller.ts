import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ResumenResponseDto } from './dashboard.responses.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('admin-dashboard')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol ADMIN.' })
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DashboardController {
	constructor(@Inject(DashboardService) private readonly dashboardService: DashboardService) {}

	@Get('resumen')
	@ApiOperation({ summary: 'Contadores operativos del panel de administración' })
	@ApiOkResponse({ type: ResumenResponseDto })
	resumen() {
		return this.dashboardService.resumen();
	}
}
