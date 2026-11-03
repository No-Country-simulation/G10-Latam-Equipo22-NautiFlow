import { ApiProperty } from '@nestjs/swagger';
import {
  DocumentStatus,
  DocumentType,
  OwnerStatus,
} from '../generated/prisma/client.js';
import { PageMetaDto } from '../common/dto/page-meta.dto.js';

export class UsuarioDocumentoDto {
  @ApiProperty({ example: 'Ana Lanchera' })
  name: string;

  @ApiProperty({ example: 'lanchero@example.com' })
  email: string;
}

export class OwnerDocumentoRefDto {
  @ApiProperty({ type: UsuarioDocumentoDto })
  user: UsuarioDocumentoDto;
}

export class EmbarcacionDocumentoRefDto {
  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;

  @ApiProperty({ example: 'ABC-123' })
  matricula: string;
}

export class DocumentListItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  ownerId: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    example: null,
    description: 'null si el documento no pertenece a una embarcación puntual.',
  })
  boatId: string | null;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty({ example: 'licencia.pdf' })
  filename: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 102400, description: 'Tamaño en bytes.' })
  size: number;

  @ApiProperty({ example: '2026-10-20T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: OwnerDocumentoRefDto })
  owner: OwnerDocumentoRefDto;

  @ApiProperty({
    type: EmbarcacionDocumentoRefDto,
    nullable: true,
    example: null,
  })
  boat: EmbarcacionDocumentoRefDto | null;
}

export class PaginatedDocumentsDto {
  @ApiProperty({ type: [DocumentListItemDto] })
  data: DocumentListItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}

export class DocumentoRevisadoDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty({ type: String, nullable: true, example: 'Falta vigencia.' })
  reviewNote: string | null;

  @ApiProperty({ example: '2026-10-25T12:00:00.000Z' })
  reviewedAt: Date;
}

export class DocumentoSubidoDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty({ example: 'licencia.pdf' })
  filename: string;

  @ApiProperty({ example: 102400 })
  size: number;

  @ApiProperty({ type: String, nullable: true, example: null })
  reviewNote: string | null;

  @ApiProperty({ example: '2026-10-20T12:00:00.000Z' })
  createdAt: Date;
}

export class UploadDocumentsResponseDto {
  @ApiProperty({
    enum: OwnerStatus,
    description: 'Al reenviar documentación, una ficha RECHAZADA vuelve a PENDIENTE.',
  })
  ownerStatus: OwnerStatus;

  @ApiProperty({ type: [DocumentoSubidoDto] })
  documents: DocumentoSubidoDto[];
}
