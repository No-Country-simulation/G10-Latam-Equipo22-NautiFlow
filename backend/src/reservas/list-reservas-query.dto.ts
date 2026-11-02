import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { EstadoReserva } from '../generated/prisma/client.js';

export class ListReservasQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({ enum: EstadoReserva, description: 'Estado de la reserva' })
	@IsOptional()
	@IsEnum(EstadoReserva)
	estado?: EstadoReserva;

	@ApiPropertyOptional({ description: 'Filtra por salida de origen' })
	@IsOptional()
	@IsUUID()
	salidaId?: string;

	@ApiPropertyOptional({ description: 'Filtra por tramo solicitado' })
	@IsOptional()
	@IsUUID()
	tramoId?: string;

	@ApiPropertyOptional({ example: '2026-11-01', description: 'Fecha mínima de solicitud (inclusive)' })
	@IsOptional()
	@IsDateString()
	fechaDesde?: string;

	@ApiPropertyOptional({ example: '2026-11-30', description: 'Fecha máxima de solicitud (inclusive)' })
	@IsOptional()
	@IsDateString()
	fechaHasta?: string;

	@ApiPropertyOptional({ description: 'Busca por nombre, teléfono o email del solicitante' })
	@IsOptional()
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	q?: string;
}
