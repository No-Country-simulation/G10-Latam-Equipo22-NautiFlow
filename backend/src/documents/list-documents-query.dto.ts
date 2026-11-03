import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { DocumentStatus, DocumentType } from '../generated/prisma/client.js';

export class ListDocumentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
    description: 'Estado del documento; por defecto solo los pendientes',
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ enum: DocumentType, description: 'Tipo de documento' })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;
}
