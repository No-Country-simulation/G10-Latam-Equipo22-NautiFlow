import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiOperation,
	ApiTags,
	ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { RateLimitGuard } from '../common/guards/rate-limit.guard.js';
import { CreateReservaDto } from './create-reserva.dto.js';
import { CreateReservaResponseDto } from './reservas-public.responses.js';
import { ReservasService } from './reservas.service.js';

// Solicitud de reserva de un turista sin cuenta (US-18).
@ApiTags('public-reservas')
@Controller('public/reservas')
export class PublicReservasController {
	constructor(private readonly reservasService: ReservasService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(RateLimitGuard)
	@ApiOperation({ summary: 'Crea una reserva de turista para un tramo disponible' })
	@ApiCreatedResponse({
		type: CreateReservaResponseDto,
		description: 'La reserva queda PENDIENTE hasta que administración la confirme.',
	})
	@ApiBadRequestResponse({ description: 'Datos inválidos o capacidad superada.' })
	@ApiConflictResponse({ description: 'Salida/tramo sin cupo o ya iniciado.' })
	@ApiTooManyRequestsResponse({ description: 'Demasiadas solicitudes desde este origen.' })
	create(@Body() dto: CreateReservaDto) {
		return this.reservasService.create(dto);
	}
}
