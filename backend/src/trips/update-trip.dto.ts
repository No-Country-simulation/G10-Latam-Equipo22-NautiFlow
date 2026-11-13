import 'reflect-metadata';
import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateTripDto {
	@IsOptional()
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	clientName?: string;

	@IsOptional()
	@IsString()
	@MinLength(8)
	@MaxLength(30)
	clientPhone?: string;

	@IsOptional()
	@IsEmail()
	@MaxLength(254)
	clientEmail?: string;

	@IsOptional()
	@IsDateString()
	scheduledAt?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	passengerCount?: number;

	@IsOptional()
	@IsString()
	@MinLength(2)
	@MaxLength(160)
	origin?: string;

	@IsOptional()
	@IsString()
	@MinLength(2)
	@MaxLength(160)
	destination?: string;
}
