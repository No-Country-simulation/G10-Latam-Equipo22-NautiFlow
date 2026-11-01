import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { EstadoSalida } from '../generated/prisma/client.js';

export class ListSalidasQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoSalida, description: 'Estado de la salida' })
  @IsOptional()
  @IsEnum(EstadoSalida)
  estado?: EstadoSalida;
}
