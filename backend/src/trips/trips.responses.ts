import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from '../generated/prisma/client.js';
import { PageMetaDto } from '../common/dto/page-meta.dto.js';

export class ClienteViajeDto {
  @ApiProperty({ example: 'Ana Turista' })
  nombre: string;

  @ApiProperty({ example: '+5491122334455' })
  telefono: string;

  @ApiProperty({ type: String, nullable: true, example: 'ana@example.com' })
  email: string | null;
}

export class EmbarcacionViajeRefDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;

  @ApiProperty({ example: 'ABC-123' })
  matricula: string;
}

export class TripListItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  scheduledAt: Date;

  @ApiProperty({ example: 4 })
  passengerCount: number;

  @ApiProperty({ example: 'Delta del Tigre' })
  origin: string;

  @ApiProperty({ example: 'Tigre Centro' })
  destination: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty({ type: ClienteViajeDto })
  cliente: ClienteViajeDto;

  @ApiProperty({
    type: EmbarcacionViajeRefDto,
    nullable: true,
    example: null,
    description: 'null mientras el viaje no tenga embarcación asignada.',
  })
  embarcacion: EmbarcacionViajeRefDto | null;
}

export class PaginatedTripsDto {
  @ApiProperty({ type: [TripListItemDto] })
  data: TripListItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}

export class TripResumenDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  scheduledAt: Date;

  @ApiProperty({ example: 'Delta del Tigre' })
  origin: string;

  @ApiProperty({ example: 'Tigre Centro' })
  destination: string;
}

export class TripEstadoDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  scheduledAt: Date;
}

export class TripAsignadoDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty({ type: String, format: 'uuid', description: 'Embarcación aprobada asignada.' })
  embarcacionId: string;
}
