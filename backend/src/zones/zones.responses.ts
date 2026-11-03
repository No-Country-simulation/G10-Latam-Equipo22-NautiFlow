import { ApiProperty } from '@nestjs/swagger';

export class ZonaActivaDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Delta del Tigre' })
  nombre: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  descripcion: string | null;
}

export class ZonaDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Delta del Tigre' })
  nombre: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  descripcion: string | null;

  @ApiProperty({ example: true })
  activa: boolean;

  @ApiProperty({ example: '2026-10-15T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-20T12:00:00.000Z' })
  updatedAt: Date;
}
