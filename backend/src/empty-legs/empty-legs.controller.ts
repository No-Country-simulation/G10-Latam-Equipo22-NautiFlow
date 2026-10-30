import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../generated/prisma/client.js';
import { CreateEmptyLegDto } from './create-empty-leg.dto.js';
import { EmptyLegsService } from './empty-legs.service.js';
import { ListEmptyLegsQueryDto } from './list-empty-legs-query.dto.js';

// Bolsa interna de tramos vacíos (US-12).
@ApiTags('empty-legs')
@Controller('admin/empty-legs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class EmptyLegsController {
  constructor(private readonly emptyLegsService: EmptyLegsService) {}

  @Get()
  list(@Query() query: ListEmptyLegsQueryDto) {
    return this.emptyLegsService.list(query);
  }

  @Post()
  create(@Body() dto: CreateEmptyLegDto) {
    return this.emptyLegsService.create(dto);
  }
}
