import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { TripStatus } from '../generated/prisma/client.js';

function toStatusList(value: unknown): TripStatus[] | undefined {
  if (Array.isArray(value)) return value as TripStatus[];
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()) as TripStatus[];
  }
  return undefined;
}

export class ListTripsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TripStatus, description: 'Estado del viaje' })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional({
    example: 'PENDING,ASSIGNED,CONFIRMED',
    description: 'Lista de estados separados por coma; se ignora si se envía status',
  })
  @IsOptional()
  @Transform(({ value }) => toStatusList(value))
  @IsEnum(TripStatus, { each: true })
  statusIn?: TripStatus[];

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
