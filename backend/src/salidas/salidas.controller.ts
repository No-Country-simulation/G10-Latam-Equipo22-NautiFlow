import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { CreateSalidaDto } from './create-salida.dto.js';
import { ListSalidasQueryDto } from './list-salidas-query.dto.js';
import { SalidasService } from './salidas.service.js';
import { UpdateSalidaDto } from './update-salida.dto.js';
import { UpdateTramoDto } from './update-tramo.dto.js';

@ApiTags('salidas')
@Controller('admin/salidas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SalidasController {
	constructor(private readonly salidasService: SalidasService) {}

	@Get()
	list(@Query() query: ListSalidasQueryDto) {
		return this.salidasService.list(query);
	}

	@Get(':id')
	detail(@Param('id', ParseUUIDPipe) id: string) {
		return this.salidasService.adminDetail(id);
	}

	@Post()
	create(@Body() dto: CreateSalidaDto, @Req() request: AuthenticatedRequest) {
		return this.salidasService.create(dto, request.user!.id);
	}

	@Patch(':id')
	update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSalidaDto) {
		return this.salidasService.update(id, dto);
	}

	@Patch(':salidaId/tramos/:tramoId')
	updateTramo(
		@Param('salidaId', ParseUUIDPipe) salidaId: string,
		@Param('tramoId', ParseUUIDPipe) tramoId: string,
		@Body() dto: UpdateTramoDto,
	) {
		return this.salidasService.updateTramo(salidaId, tramoId, dto);
	}
}
