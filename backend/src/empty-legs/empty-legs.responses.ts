import { ApiProperty } from '@nestjs/swagger';
import { EmptyLegStatus } from '../generated/prisma/client.js';
import { PageMetaDto } from '../common/dto/page-meta.dto.js';

export class EmptyLegCreadoDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true, description: 'Viaje de origen; nulo en retornos publicados por el lanchero.' })
  tripId: string | null;

  @ApiProperty({ type: String, format: 'uuid' })
  embarcacionId: string;

  @ApiProperty({ example: 'Tigre Centro' })
  origin: string;

  @ApiProperty({ example: 'Delta del Tigre' })
  destination: string;

  @ApiProperty({ example: '2026-11-09T18:00:00.000Z' })
  scheduledAt: Date;

  @ApiProperty({ enum: EmptyLegStatus })
  status: EmptyLegStatus;
}

export class UsuarioEmptyLegDto {
  @ApiProperty({ example: 'Ana Lanchera' })
  name: string;
}

export class PropietarioEmptyLegDto {
  @ApiProperty({ type: String, nullable: true, example: '+5491155550000' })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+5491155550001' })
  whatsappPhone: string | null;

  @ApiProperty({ type: UsuarioEmptyLegDto })
  user: UsuarioEmptyLegDto;
}

export class EmbarcacionEmptyLegDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;

  @ApiProperty({ example: 'ABC-123' })
  matricula: string;

  @ApiProperty({ example: 8 })
  capacidad: number;

  @ApiProperty({ type: PropietarioEmptyLegDto })
  propietario: PropietarioEmptyLegDto;
}

export class ClienteEmptyLegDto {
  @ApiProperty({ example: 'Ana Turista' })
  nombre: string;

  @ApiProperty({ example: '+5491122334455' })
  telefono: string;
}

export class TripEmptyLegRefDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  scheduledAt: Date;

  @ApiProperty({ example: 4 })
  passengerCount: number;

  @ApiProperty({ type: ClienteEmptyLegDto })
  cliente: ClienteEmptyLegDto;
}

export class EmptyLegListItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Tigre Centro' })
  origin: string;

  @ApiProperty({ example: 'Delta del Tigre' })
  destination: string;

  @ApiProperty({ example: '2026-11-09T18:00:00.000Z' })
  scheduledAt: Date;

  @ApiProperty({ enum: EmptyLegStatus })
  status: EmptyLegStatus;

  @ApiProperty({ type: EmbarcacionEmptyLegDto })
  embarcacion: EmbarcacionEmptyLegDto;

  @ApiProperty({ type: TripEmptyLegRefDto, nullable: true })
  trip: TripEmptyLegRefDto | null;
}

export class PaginatedEmptyLegsDto {
  @ApiProperty({ type: [EmptyLegListItemDto] })
  data: EmptyLegListItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}
