import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

export enum EstadoOperativoFlota {
  LIBRE = 'LIBRE',
  RESERVADA = 'RESERVADA',
  RETORNO_VACIO = 'RETORNO_VACIO',
}

export class FleetQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'ID de la zona que debe cubrir la embarcación' })
  @IsOptional()
  @IsUUID()
  zonaId?: string;

  @ApiPropertyOptional({ example: 'delta', description: 'Texto a buscar en nombre, matrícula o propietario' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: EstadoOperativoFlota })
  @IsOptional()
  @IsEnum(EstadoOperativoFlota)
  estadoOperativo?: EstadoOperativoFlota;
}
