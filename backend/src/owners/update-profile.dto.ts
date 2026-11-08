import 'reflect-metadata';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ana Navegante', description: 'Nombre visible del lanchero' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '+541112345678', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    example: '+541198765432',
    description: 'WhatsApp opcional; enviar vacío o null lo limpia',
    nullable: true,
  })
  @Transform(({ value }) => (value === '' ? null : value))
  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsappPhone?: string | null;
}
