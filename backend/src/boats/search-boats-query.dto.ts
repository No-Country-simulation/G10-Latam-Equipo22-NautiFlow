import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { EstadoEmbarcacion } from '../generated/prisma/client.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

export class SearchBoatsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID de la zona que debe cubrir la embarcación' })
  @IsOptional()
  @IsUUID()
  zonaId?: string;

  @ApiPropertyOptional({ example: 6, description: 'Capacidad mínima de pasajeros' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacidadMin?: number;

  @ApiPropertyOptional({
    enum: EstadoEmbarcacion,
    default: EstadoEmbarcacion.VERIFICADA,
    description: 'Estado de la embarcación; por defecto solo las verificadas',
  })
  @IsOptional()
  @IsEnum(EstadoEmbarcacion)
  estado?: EstadoEmbarcacion;

  @ApiPropertyOptional({ example: 'delta', description: 'Texto a buscar en nombre o matrícula' })
  @IsOptional()
  @IsString()
  q?: string;
}
