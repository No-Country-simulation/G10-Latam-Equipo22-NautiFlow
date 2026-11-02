import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EstadoTramo } from '../generated/prisma/client.js';

export class UpdateTramoDto {
  @ApiPropertyOptional({ enum: EstadoTramo })
  @IsOptional()
  @IsEnum(EstadoTramo)
  estado?: EstadoTramo;

  @ApiPropertyOptional({ example: 10, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  cupo?: number;

  @ApiPropertyOptional({ example: 50000, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  precioCentavos?: number;

  @ApiPropertyOptional({ example: '2026-11-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fechaHora?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sinTuristas?: boolean;
}
