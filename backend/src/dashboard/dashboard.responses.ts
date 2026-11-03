import { ApiProperty } from '@nestjs/swagger';

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
}
