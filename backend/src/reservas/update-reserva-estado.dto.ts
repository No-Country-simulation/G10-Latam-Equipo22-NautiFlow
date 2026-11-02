import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateReservaEstadoDto {
	@ApiProperty({ enum: ['RECHAZADA', 'CANCELADA'] })
	@IsIn(['RECHAZADA', 'CANCELADA'])
	estado: 'RECHAZADA' | 'CANCELADA';

	@ApiPropertyOptional({ description: 'Observación interna del administrador' })
	@IsOptional()
	@IsString()
	@MinLength(3)
	@MaxLength(1000)
	nota?: string;
}
