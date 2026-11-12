import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { EmptyLegStatus } from '../generated/prisma/client.js';

export class ListOwnerEmptyLegsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: EmptyLegStatus,
    description: 'Filtra por estado; sin filtro devuelve todos los retornos del lanchero',
  })
  @IsOptional()
  @IsEnum(EmptyLegStatus)
  status?: EmptyLegStatus;
}
