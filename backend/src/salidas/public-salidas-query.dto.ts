import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { EstadoSalida } from '../generated/prisma/client.js';

export class PublicSalidasQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: EstadoSalida,
    description: 'Estado exacto de la salida; por defecto excluye las COMPLETADA',
  })
  @IsOptional()
  @IsEnum(EstadoSalida)
  estado?: EstadoSalida;

  @ApiPropertyOptional({ description: 'ID de la zona que debe cubrir la lancha' })
  @IsOptional()
  @IsUUID()
  zonaId?: string;

  @ApiPropertyOptional({ example: '2026-11-01', description: 'Fecha mínima de salida (inclusive)' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ example: '2026-11-30', description: 'Fecha máxima de salida (inclusive)' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({ example: 'Delta', description: 'Filtro por origen del tramo IDA' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  origen?: string;

  @ApiPropertyOptional({ example: 'Tigre', description: 'Filtro por destino del tramo IDA' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  destino?: string;
}
