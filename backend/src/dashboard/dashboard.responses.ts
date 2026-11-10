import { ApiProperty } from '@nestjs/swagger';

export class WeeklyActivityDto {
  @ApiProperty({ example: 'lun' })
  key: string;

  @ApiProperty({ example: 'L' })
  label: string;

  @ApiProperty({ example: 3, description: 'Viajes con fecha de salida en ese día.' })
  count: number;
}

export class ActivityItemDto {
  @ApiProperty({
    example: 'owner',
    description: 'Tipo de evento: owner | verification | document | trip | review | emptyLeg.',
  })
  type: 'owner' | 'verification' | 'document' | 'trip' | 'review' | 'emptyLeg';

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Fecha y hora del evento.' })
  at: Date;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del usuario (solo para type=owner).', required: false })
  name?: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Email del usuario (solo para type=owner).', required: false })
  email?: string;

  @ApiProperty({ example: 'PENDING', description: 'Estado (para type=owner o type=trip).', required: false })
  status?: string;

  @ApiProperty({ example: 'a1b2c3d4', description: 'ID corto del viaje (solo para type=trip).', required: false })
  id?: string;

  @ApiProperty({ example: 'María García', description: 'Nombre del cliente (solo para type=trip).', required: false })
  clienteNombre?: string;

  @ApiProperty({ example: '2024-02-01T08:00:00.000Z', description: 'Fecha programada (para type=trip o type=emptyLeg).', required: false })
  scheduledAt?: Date;

  @ApiProperty({ example: 4, description: 'Calificación (solo para type=review).', required: false })
  rating?: number;

  @ApiProperty({ example: 'La Perla', description: 'Nombre de la embarcación (para type=review o type=emptyLeg).', required: false })
  embarcacionNombre?: string | null;

  @ApiProperty({ example: 'Buenos Aires', description: 'Origen (solo para type=emptyLeg).', required: false })
  origin?: string;

  @ApiProperty({ example: 'Montevideo', description: 'Destino (solo para type=emptyLeg).', required: false })
  destination?: string;
}

export class ResumenResponseDto {
  @ApiProperty({ example: 3, description: 'Reservas esperando confirmación.' })
  reservasPendientes: number;

  @ApiProperty({ example: 5, description: 'Viajes PENDING o ASSIGNED por operar.' })
  viajesPorOperar: number;

  @ApiProperty({ example: 2, description: 'Solicitudes de lanchero en revisión.' })
  solicitudesLancheroPendientes: number;

  @ApiProperty({ example: 4, description: 'Documentos de lanchero pendientes de revisión.' })
  documentosPendientes: number;

  @ApiProperty({ example: 7, description: 'Salidas PROGRAMADAS a partir de ahora.' })
  salidasProgramadas: number;

  @ApiProperty({ example: 15, description: 'Total de embarcaciones registradas.' })
  totalEmbarcaciones: number;

  @ApiProperty({ example: 10, description: 'Embarcaciones en estado VERIFICADA.' })
  embarcacionesVerificadas: number;

  @ApiProperty({ example: 3, description: 'Empty legs con status AVAILABLE.' })
  retornosActivos: number;

  @ApiProperty({ example: 42, description: 'Viajes con status COMPLETED.' })
  viajesCompletados: number;

  @ApiProperty({ example: 4.3, nullable: true, description: 'Promedio de calificaciones (null si no hay reseñas).' })
  calificacionPromedio: number | null;

  @ApiProperty({ type: [ActivityItemDto], description: 'Hasta 12 eventos recientes ordenados por fecha descendente.' })
  actividadReciente: ActivityItemDto[];

  @ApiProperty({ type: [WeeklyActivityDto], description: 'Conteo de viajes programados en los últimos 7 días.' })
  actividadSemanal: WeeklyActivityDto[];
}
