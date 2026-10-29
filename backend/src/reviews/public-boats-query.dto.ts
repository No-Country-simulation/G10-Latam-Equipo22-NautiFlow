import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

export class PublicBoatsQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({ description: 'ID de la zona que debe cubrir la embarcación' })
	@IsOptional()
	@IsUUID()
	zonaId?: string;
}
