import { ApiProperty } from '@nestjs/swagger';
import { EstadoEmbarcacion } from '../generated/prisma/client.js';
import { PageMetaDto } from '../common/dto/page-meta.dto.js';
import { ZonaEmbarcacionDto } from '../reviews/reviews.responses.js';

export class BoatOptionDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;

  @ApiProperty({ example: 'ABC-123' })
  matricula: string;

  @ApiProperty({ example: 8 })
  capacidad: number;
}

export class UsuarioNombreBoatDto {
  @ApiProperty({ example: 'Ana Lanchera' })
  name: string;
}

export class PropietarioBoatDto {
  @ApiProperty({ type: String, nullable: true, example: '+5491155550000' })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+5491155550001' })
  whatsappPhone: string | null;

  @ApiProperty({ type: UsuarioNombreBoatDto })
  user: UsuarioNombreBoatDto;
}

export class BoatSearchItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;

  @ApiProperty({ example: 'ABC-123' })
  matricula: string;

  @ApiProperty({ example: 8 })
  capacidad: number;

  @ApiProperty({ enum: EstadoEmbarcacion })
  estado: EstadoEmbarcacion;

  @ApiProperty({ type: String, nullable: true, example: null })
  descripcion: string | null;

  @ApiProperty({ type: PropietarioBoatDto })
  propietario: PropietarioBoatDto;

  @ApiProperty({ type: [ZonaEmbarcacionDto] })
  zonas: ZonaEmbarcacionDto[];
}

export class PaginatedBoatsDto {
  @ApiProperty({ type: [BoatSearchItemDto] })
  data: BoatSearchItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}

export class ZonaCompletaDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Delta del Tigre' })
  nombre: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  descripcion: string | null;

  @ApiProperty({ example: true })
  activa: boolean;
}

export class EmbarcacionZonaPropiaDto {
  @ApiProperty({ type: String, format: 'uuid' })
  embarcacionId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  zonaId: string;

  @ApiProperty({ type: ZonaCompletaDto })
  zona: ZonaCompletaDto;
}

export class EmbarcacionPropiaDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  propietarioId: string;

  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;

  @ApiProperty({ example: 'ABC-123' })
  matricula: string;

  @ApiProperty({ example: 8 })
  capacidad: number;

  @ApiProperty({ type: String, nullable: true, example: null })
  descripcion: string | null;

  @ApiProperty({ enum: EstadoEmbarcacion })
  estado: EstadoEmbarcacion;

  @ApiProperty({ example: '2026-10-15T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-20T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: [EmbarcacionZonaPropiaDto] })
  zonas: EmbarcacionZonaPropiaDto[];
}
