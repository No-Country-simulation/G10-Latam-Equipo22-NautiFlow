import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { EmptyLegStatus } from '../generated/prisma/client.js';

export class UpdateOwnerEmptyLegDto {
  @ApiPropertyOptional({ example: '2026-11-09T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    enum: EmptyLegStatus,
    description: 'El lanchero solo puede marcarlo como AVAILABLE o CLOSED',
  })
  @IsOptional()
  @IsEnum(EmptyLegStatus)
  status?: EmptyLegStatus;
}
