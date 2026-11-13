import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { TripStatus } from '../generated/prisma/client.js';

export class ListTripsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TripStatus, description: 'Estado del viaje' })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional({
    example: 'active',
    description:
      'Alcance del listado: active (PENDING/ASSIGNED/CONFIRMED), history (COMPLETED/CANCELLED) u upcoming (activos con fecha ≥ hoy, orden ascendente)',
  })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({
    example: 'delta',
    description: 'Texto en cliente (nombre, teléfono o email), origen o destino',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    example: '2026-11-01',
    description: 'Fecha y hora mínima de salida (inclusive); si es solo fecha se usa el inicio del día en UTC',
  })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({
    example: '2026-11-30',
    description: 'Fecha y hora máxima de salida (inclusive); si es solo fecha se usa el fin del día en UTC',
  })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
