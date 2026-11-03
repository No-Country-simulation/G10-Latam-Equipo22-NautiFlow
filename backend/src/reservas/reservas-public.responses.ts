import { ApiProperty } from '@nestjs/swagger';
import { EstadoReserva } from '../generated/prisma/client.js';

export class CreateReservaResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: EstadoReserva, example: EstadoReserva.PENDIENTE })
  estado: EstadoReserva;

  @ApiProperty({ example: 'Ana Turista' })
  nombre: string;

  @ApiProperty({ example: '+5491122334455' })
  telefono: string;

  @ApiProperty({ type: String, nullable: true, example: 'ana@example.com' })
  email: string | null;

  @ApiProperty({ example: 2 })
  cantidadPasajeros: number;

  @ApiProperty({ type: String, nullable: true, example: 'Somos 2 adultos.' })
  mensaje: string | null;

  @ApiProperty({ example: 'Delta del Tigre' })
  origen: string;

  @ApiProperty({ example: 'Tigre Centro' })
  destino: string;

  @ApiProperty({ example: '2026-11-08T21:00:00.000Z' })
  fechaHora: Date;

  @ApiProperty({ example: 50000, description: 'Precio en centavos.' })
  precioCentavos: number;

  @ApiProperty({ example: '2026-11-02T15:00:00.000Z' })
  createdAt: Date;
}
