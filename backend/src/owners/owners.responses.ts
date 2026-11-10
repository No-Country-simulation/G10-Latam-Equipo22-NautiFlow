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

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 102400 })
  size: number;

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

  @ApiProperty({ type: String, nullable: true, example: '+5491155550000' })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+5491155550001' })
  whatsappPhone: string | null;

  @ApiProperty({ example: '2026-10-15T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: String, nullable: true, example: null })
  reviewedAt: Date | null;

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
