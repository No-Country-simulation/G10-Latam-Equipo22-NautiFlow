import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { EmptyLegStatus } from '../generated/prisma/client.js';

export class ListEmptyLegsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: EmptyLegStatus,
    default: EmptyLegStatus.AVAILABLE,
    description: 'Estado del tramo; por defecto solo los disponibles',
  })
  @IsOptional()
  @IsEnum(EmptyLegStatus)
  status?: EmptyLegStatus;
}
