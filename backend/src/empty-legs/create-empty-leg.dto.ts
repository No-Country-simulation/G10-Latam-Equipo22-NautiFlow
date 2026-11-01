import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CreateEmptyLegDto {
  @ApiProperty({ description: 'Viaje de ida que origina el regreso en vacío' })
  @IsUUID('4')
  tripId: string;

  @ApiProperty({
    example: '2026-11-01T18:00:00.000Z',
    description: 'Fecha y hora estimada del regreso; debe ser posterior a la salida',
  })
  @IsDateString()
  scheduledAt: string;
}
