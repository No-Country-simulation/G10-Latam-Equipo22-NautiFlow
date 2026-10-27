import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateTripDto {
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	clientName: string;

	@IsString()
	@MinLength(8)
	@MaxLength(30)
	clientPhone: string;

	@IsOptional()
	@IsEmail()
	@MaxLength(254)
	clientEmail?: string;

	@IsDateString()
	scheduledAt: string;

	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	passengerCount: number;

	@IsString()
	@MinLength(2)
	@MaxLength(160)
	origin: string;

	@IsString()
	@MinLength(2)
	@MaxLength(160)
	destination: string;

	@IsOptional()
	@IsUUID('4')
	boatId?: string;
}