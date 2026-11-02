import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReservaDto {
	@ApiProperty({ description: 'Tramo del catálogo que se desea reservar' })
	@IsUUID('4')
	tramoId: string;

	@ApiProperty({ example: 'María Pérez' })
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	nombre: string;

	@ApiProperty({ example: '+5491100000000' })
	@IsString()
	@MinLength(8)
	@MaxLength(30)
	telefono: string;

	@ApiPropertyOptional({ example: 'maria@correo.com' })
	@IsOptional()
	@IsEmail()
	@MaxLength(254)
	email?: string;

	@ApiProperty({ example: 2, minimum: 1, maximum: 100 })
	@IsInt()
	@Min(1)
	@Max(100)
	cantidadPasajeros: number;

	@ApiPropertyOptional({ example: 'Llegamos con carrito de bebés.' })
	@IsOptional()
	@IsString()
	@MaxLength(500)
	mensaje?: string;
}
