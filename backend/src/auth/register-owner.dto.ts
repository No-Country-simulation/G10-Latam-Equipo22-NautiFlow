import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterOwnerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsappPhone?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  boatName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  matricula: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacidad: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  zonaIds: string[];
}