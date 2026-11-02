import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RateLimitGuard } from '../common/guards/rate-limit.guard.js';
import { CreateReservaDto } from './create-reserva.dto.js';
import { ReservasService } from './reservas.service.js';

// Solicitud de reserva de un turista sin cuenta (US-18).
@ApiTags('public-reservas')
@Controller('public/reservas')
export class PublicReservasController {
	constructor(private readonly reservasService: ReservasService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(RateLimitGuard)
	create(@Body() dto: CreateReservaDto) {
		return this.reservasService.create(dto);
	}
}
