import { ApiProperty } from '@nestjs/swagger';
import {
  DocumentStatus,
  DocumentType,
  EstadoEmbarcacion,
  OwnerStatus,
  UserStatus,
} from '../generated/prisma/client.js';
import { PageMetaDto } from '../common/dto/page-meta.dto.js';
import { ZonaEmbarcacionDto } from '../reviews/reviews.responses.js';

export class UsuarioSolicitudDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Ana Lanchera' })
  name: string;

  @ApiProperty({ example: 'lanchero@example.com' })
  email: string;
}

export class UsuarioSolicitudListDto extends UsuarioSolicitudDto {
  @ApiProperty({ enum: UserStatus })
  status: UserStatus;
}

export class EmbarcacionSolicitudDto {
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

  @ApiProperty({ type: [ZonaEmbarcacionDto] })
  zonas: ZonaEmbarcacionDto[];
}

export class DocumentoSolicitudDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty({ example: 'licencia.pdf' })
  filename: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  reviewNote: string | null;

  @ApiProperty({ example: '2026-10-20T12:00:00.000Z' })
  createdAt: Date;
}

export class SolicitudPropiaDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: OwnerStatus })
  status: OwnerStatus;

  @ApiProperty({ type: String, nullable: true, example: null })
  reviewNote: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+5491155550000' })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+5491155550001' })
  whatsappPhone: string | null;

  @ApiProperty({ example: '2026-10-15T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: String, nullable: true, example: null, description: 'Fecha de revisión por administración.' })
  reviewedAt: Date | null;

  @ApiProperty({ type: UsuarioSolicitudDto })
  user: UsuarioSolicitudDto;

  @ApiProperty({ type: [EmbarcacionSolicitudDto] })
  embarcaciones: EmbarcacionSolicitudDto[];

  @ApiProperty({ type: [DocumentoSolicitudDto] })
  documents: DocumentoSolicitudDto[];
}

export class SolicitudListItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: OwnerStatus })
  status: OwnerStatus;

  @ApiProperty({ type: String, nullable: true, example: null })
  reviewNote: string | null;

  @ApiProperty({ example: '2026-10-15T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: UsuarioSolicitudListDto })
  user: UsuarioSolicitudListDto;

  @ApiProperty({ type: [EmbarcacionSolicitudDto] })
  embarcaciones: EmbarcacionSolicitudDto[];

  @ApiProperty({ type: [DocumentoSolicitudDto] })
  documents: DocumentoSolicitudDto[];
}

export class PaginatedSolicitudesDto {
  @ApiProperty({ type: [SolicitudListItemDto] })
  data: SolicitudListItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}

export class OwnerRecordDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  userId: string;

  @ApiProperty({ type: String, nullable: true, example: '+5491155550000' })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+5491155550001' })
  whatsappPhone: string | null;

  @ApiProperty({ enum: OwnerStatus })
  status: OwnerStatus;

  @ApiProperty({ type: String, nullable: true, example: null })
  reviewNote: string | null;

  @ApiProperty({ type: String, nullable: true, example: null })
  reviewedAt: Date | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true, example: null })
  reviewedById: string | null;

  @ApiProperty({ example: '2026-10-15T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-25T12:00:00.000Z' })
  updatedAt: Date;
}

export class ResenaEmbarcacionRefDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;
}

export class ResenaViajeRefDto {
  @ApiProperty({ example: 'Delta del Tigre' })
  origin: string;

  @ApiProperty({ example: 'Tigre Centro' })
  destination: string;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  scheduledAt: Date;
}

export class ResenaItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ type: String, nullable: true, example: 'Excelente travesía.' })
  comment: string | null;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  createdAt: Date;

  @ApiProperty({ type: ResenaEmbarcacionRefDto })
  embarcacion: ResenaEmbarcacionRefDto;

  @ApiProperty({ type: ResenaViajeRefDto })
  trip: ResenaViajeRefDto;
}

export class ResenaLanchaResumenDto {
  @ApiProperty({ type: String, format: 'uuid' })
  boatId: string;

  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;

  @ApiProperty({ type: Number, nullable: true, example: 4.8, description: 'Promedio de la lancha; null sin reseñas.' })
  promedio: number | null;

  @ApiProperty({ example: 3 })
  total: number;
}

export class ResenasPropiasDto {
  @ApiProperty({ type: Number, nullable: true, example: 4.7, description: 'Promedio general de las lanchas del lanchero.' })
  promedio: number | null;

  @ApiProperty({ example: 12, description: 'Total de reseñas recibidas por sus lanchas.' })
  total: number;

  @ApiProperty({ type: [ResenaLanchaResumenDto] })
  porLancha: ResenaLanchaResumenDto[];

  @ApiProperty({ type: [ResenaItemDto] })
  data: ResenaItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}
