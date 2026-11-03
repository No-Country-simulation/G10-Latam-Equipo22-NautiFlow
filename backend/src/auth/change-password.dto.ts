import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual de la cuenta' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword: string;

  @ApiProperty({ example: 'NuevaClaveSegura123', minLength: 10, description: 'Nueva contraseña (mínimo 10 caracteres)' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  newPassword: string;
}
