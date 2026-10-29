import { Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { OwnersService } from './owners.service.js';

@ApiTags('owners')
@Controller('owners')
export class OwnersController {
	constructor(private readonly ownersService: OwnersService) {}

	@Get('me/solicitud')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	getMyRequest(@Req() request: AuthenticatedRequest) {
		return this.ownersService.getMyRequest(request.user!.id);
	}

	@Post('me/solicitud/reabrir')
	@HttpCode(HttpStatus.OK)
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.OWNER)
	reopenMyRequest(@Req() request: AuthenticatedRequest) {
		return this.ownersService.reopenMyRequest(request.user!.id);
	}
}
