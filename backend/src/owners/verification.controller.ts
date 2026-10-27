import { Body, Controller, Get, Param, ParseEnumPipe, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OwnerStatus, Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { OwnersService } from './owners.service.js';
import { ReviewRequestDto } from './review-request.dto.js';

@ApiTags('admin-solicitudes')
@Controller('admin/solicitudes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class VerificationController {
	constructor(private readonly ownersService: OwnersService) {}

	@Get()
	list(@Query('status', new ParseEnumPipe(OwnerStatus, { optional: true })) status?: OwnerStatus) {
		return this.ownersService.listRequests(status);
	}

	@Patch(':id/aprobar')
	approve(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: ReviewRequestDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.ownersService.reviewRequest(id, 'APPROVED', dto.note, request.user!.id);
	}

	@Patch(':id/rechazar')
	reject(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: ReviewRequestDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.ownersService.reviewRequest(id, 'REJECTED', dto.note, request.user!.id);
	}
}