import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { EstadoSalida } from '../generated/prisma/client.js';

export class UpdateSalidaDto {
  @ApiPropertyOptional({ enum: EstadoSalida })
  @IsOptional()
  @IsEnum(EstadoSalida)
  estado?: EstadoSalida;

  @ApiPropertyOptional({ example: '2026-11-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fechaSalida?: string;
}
