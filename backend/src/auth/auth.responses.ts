import { ApiProperty } from '@nestjs/swagger';
import { OwnerStatus, Role } from '../generated/prisma/client.js';

export class SessionUserDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Ana Lanchera' })
  name: string;

  @ApiProperty({ example: 'lanchero@example.com' })
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({
    enum: OwnerStatus,
    nullable: true,
    example: OwnerStatus.APPROVED,
    description: 'Estado de la ficha de lanchero; null si el usuario no tiene ficha.',
  })
  ownerStatus: OwnerStatus | null;
}

export class LoginResponseDto {
  @ApiProperty({ type: SessionUserDto })
  user: SessionUserDto;
}

export class MeResponseDto {
  @ApiProperty({ type: SessionUserDto })
  user: SessionUserDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Contraseña actualizada.' })
  message: string;
}
