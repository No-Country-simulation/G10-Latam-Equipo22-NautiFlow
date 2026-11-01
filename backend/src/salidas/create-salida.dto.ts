import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class TramoInputDto {
  @ApiProperty({ enum: ['IDA', 'VUELTA'] })
  @IsIn(['IDA', 'VUELTA'])
  tipo: 'IDA' | 'VUELTA';

  @ApiProperty({ example: 'Delta del Tigre' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  origen: string;

  @ApiProperty({ example: 'Tigre Centro' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  destino: string;

  @ApiProperty({ example: '2026-11-01T10:00:00.000Z' })
  @IsDateString()
  fechaHora: string;

  @ApiProperty({ example: 10, description: 'Cupo del tramo; por defecto la capacidad de la lancha' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  cupo?: number;

  @ApiProperty({ example: 50000, description: 'Precio en centavos' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  precioCentavos: number;

  @ApiProperty({ default: false, description: 'Marca el tramo como vacío (regreso sin pasajeros originales)' })
  @IsOptional()
  @IsBoolean()
  sinTuristas?: boolean;
}

export class CreateSalidaDto {
  @ApiProperty({ description: 'Embarcación verificada que realiza la salida' })
  @IsUUID('4')
  embarcacionId: string;

  @ApiProperty({ example: '2026-11-01T10:00:00.000Z' })
  @IsDateString()
  fechaSalida: string;

  @ApiProperty({ type: [TramoInputDto], description: 'Al menos un tramo IDA' })
  @ValidateNested({ each: true })
  @Type(() => TramoInputDto)
  tramos: TramoInputDto[];
}
