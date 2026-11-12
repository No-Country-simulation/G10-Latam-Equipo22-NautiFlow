import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateOwnerEmptyLegDto {
  @ApiProperty({ type: String, format: 'uuid', description: 'Embarcación propia del lanchero' })
  @IsUUID('4')
  embarcacionId: string;

  @ApiProperty({ example: 'Tigre Centro' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  origin: string;

  @ApiProperty({ example: 'Delta del Tigre' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  destination: string;

  @ApiProperty({ example: '2026-11-09T18:00:00.000Z', description: 'Fecha y hora estimada del retorno; debe ser futura' })
  @IsDateString()
  scheduledAt: string;
}
