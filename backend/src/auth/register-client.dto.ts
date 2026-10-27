import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterClientDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  phone: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password: string;
}