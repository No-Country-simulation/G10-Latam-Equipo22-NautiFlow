import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateBoatDto {
  @ApiProperty({ example: 'Lancha Delta 1' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'ABC-123' })
  @IsString()
  @IsNotEmpty()
  matricula: string;

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(1)
  capacidad: number;

  @ApiPropertyOptional({ example: 'Lancha con cubierta y techo retráctil' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    example: ['uuid-zona-1', 'uuid-zona-2'],
    description: 'IDs de las zonas activas que cubre la embarcación',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  zonaIds?: string[];
}
