import { ApiProperty } from '@nestjs/swagger';

export class ActividadSemanalDto {
  @ApiProperty({ example: 'lun' })
  key: string;

  @ApiProperty({ example: 'L' })
  label: string;

  @ApiProperty({ example: 4 })
  count: number;
}

export class EventoActividadDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'VIAJE_COMPLETADO' })
  tipo: string;

  @ApiProperty({ example: 'Viaje completado' })
  titulo: string;

  @ApiProperty({ example: 'Lancha Delta 1 completó el viaje a Tigre Centro' })
  descripcion: string;

  @ApiProperty({ example: '2026-11-10T15:30:00.000Z' })
  fecha: Date;

  @ApiProperty({ example: 'COMPLETED', required: false })
  estado?: string;
}

export class ResumenResponseDto {
  @ApiProperty({ example: 12, description: 'Total de lanchas registradas en la plataforma.' })
  totalLanchas: number;

  @ApiProperty({ example: 8, description: 'Total de lanchas verificadas y activas.' })
  lanchasVerificadas: number;

  @ApiProperty({ example: 2, description: 'Solicitudes de lancheros pendientes de revisión.' })
  solicitudesPendientes: number;

  @ApiProperty({ example: 3, description: 'Retornos vacíos disponibles.' })
  retornosDisponibles: number;

  @ApiProperty({ example: 5, description: 'Viajes pendientes o programados.' })
  viajesPendientes: number;

  @ApiProperty({ example: 14, description: 'Viajes completados con éxito.' })
  viajesCompletados: number;

  @ApiProperty({ example: 4.8, description: 'Calificación promedio de la flota.', nullable: true })
  calificacionPromedio: number | null;

  @ApiProperty({ example: 10, description: 'Total de reseñas recibidas.' })
  totalResenas: number;

  @ApiProperty({ type: [ActividadSemanalDto], description: 'Actividad de viajes por día de la semana.' })
  actividadSemanal: ActividadSemanalDto[];

  @ApiProperty({ type: [EventoActividadDto], description: 'Acontecimientos relevantes recientes.' })
  actividadReciente: EventoActividadDto[];

  // Campos legados para retrocompatibilidad
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
}
