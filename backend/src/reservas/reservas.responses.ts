import { ApiProperty } from '@nestjs/swagger';
import {
  EstadoReserva,
  EstadoSalida,
  EstadoTramo,
  TipoTramo,
  TripStatus,
} from '../generated/prisma/client.js';
import { PageMetaDto } from '../common/dto/page-meta.dto.js';

export class TramoReservaRefDto {
  @ApiProperty({ enum: TipoTramo })
  tipo: TipoTramo;

  @ApiProperty({ example: 8 })
  cupo: number;

  @ApiProperty({ enum: EstadoTramo })
  estado: EstadoTramo;

  @ApiProperty({ example: false })
  sinTuristas: boolean;
}

export class EmbarcacionReservaRefDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;

  @ApiProperty({ example: 'ABC-123' })
  matricula: string;

  @ApiProperty({ example: 8 })
  capacidad: number;
}

export class SalidaReservaRefDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  fechaSalida: Date;

  @ApiProperty({ enum: EstadoSalida })
  estado: EstadoSalida;

  @ApiProperty({ type: EmbarcacionReservaRefDto })
  embarcacion: EmbarcacionReservaRefDto;
}

export class TripReservaRefDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty({ example: '2026-11-08T21:00:00.000Z' })
  scheduledAt: Date;
}

export class ReservaListItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  tramoId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  salidaId: string;

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

  @ApiProperty({ example: 50000 })
  precioCentavos: number;

  @ApiProperty({ enum: EstadoReserva })
  estado: EstadoReserva;

  @ApiProperty({ example: false, description: 'Indica si el cupo del tramo ya fue descontado.' })
  cupoDescontado: boolean;

  @ApiProperty({ type: String, nullable: true, example: null })
  adminNote: string | null;

  @ApiProperty({ type: String, nullable: true, example: null })
  reviewedAt: Date | null;

  @ApiProperty({ example: '2026-11-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-11-02T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: TramoReservaRefDto })
  tramo: TramoReservaRefDto;

  @ApiProperty({ type: SalidaReservaRefDto })
  salida: SalidaReservaRefDto;

  @ApiProperty({
    type: TripReservaRefDto,
    nullable: true,
    example: null,
    description: 'Viaje generado al confirmar la reserva.',
  })
  trip: TripReservaRefDto | null;
}

export class UsuarioRevisorDto {
  @ApiProperty({ example: 'Admin NautiFlow' })
  name: string;
}

export class ReservaDetailDto extends ReservaListItemDto {
  @ApiProperty({
    type: UsuarioRevisorDto,
    nullable: true,
    example: null,
    description: 'Administrador que revisó la reserva.',
  })
  reviewedBy: UsuarioRevisorDto | null;
}

export class PaginatedReservasDto {
  @ApiProperty({ type: [ReservaListItemDto] })
  data: ReservaListItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}

export class TripConfirmadoDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty({ example: '2026-11-08T21:00:00.000Z' })
  scheduledAt: Date;

  @ApiProperty({ example: 'Delta del Tigre' })
  origin: string;

  @ApiProperty({ example: 'Tigre Centro' })
  destination: string;
}

export class ConfirmarReservaResponseDto {
  @ApiProperty({ type: ReservaListItemDto })
  reserva: ReservaListItemDto;

  @ApiProperty({ type: TripConfirmadoDto })
  trip: TripConfirmadoDto;
}
