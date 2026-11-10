import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { OwnerStatus } from '../generated/prisma/client.js';

export class ListSolicitudesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OwnerStatus, description: 'Estado de la solicitud' })
  @IsOptional()
  @IsEnum(OwnerStatus)
  status?: OwnerStatus;

  @ApiPropertyOptional({ example: 'ana', description: 'Busca por nombre o email del lanchero' })
  @IsOptional()
  @IsString()
  q?: string;
}
