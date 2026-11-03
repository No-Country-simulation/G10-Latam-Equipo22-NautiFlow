import { ApiProperty } from '@nestjs/swagger';
import { EstadoSalida, EstadoTramo, TipoTramo } from '../generated/prisma/client.js';
import { PageMetaDto } from '../common/dto/page-meta.dto.js';

export class EmbarcacionSalidaAdminDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;

  @ApiProperty({ example: 'ABC-123' })
  matricula: string;

  @ApiProperty({ example: 8 })
  capacidad: number;
}

export class TramoAdminDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ enum: TipoTramo })
  tipo: TipoTramo;

  @ApiProperty({ example: 'Delta del Tigre' })
  origen: string;

  @ApiProperty({ example: 'Tigre Centro' })
  destino: string;

  @ApiProperty({ example: '2026-11-08T21:00:00.000Z' })
  fechaHora: Date;

  @ApiProperty({ example: 8 })
  cupo: number;

  @ApiProperty({ example: 50000 })
  precioCentavos: number;

  @ApiProperty({ example: false })
  sinTuristas: boolean;

  @ApiProperty({ enum: EstadoTramo })
  estado: EstadoTramo;
}

export class SalidaListItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  fechaSalida: Date;

  @ApiProperty({ enum: EstadoSalida })
  estado: EstadoSalida;

  @ApiProperty({ example: '2026-10-20T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: EmbarcacionSalidaAdminDto })
  embarcacion: EmbarcacionSalidaAdminDto;

  @ApiProperty({ type: [TramoAdminDto] })
  tramos: TramoAdminDto[];
}

export class PaginatedSalidasDto {
  @ApiProperty({ type: [SalidaListItemDto] })
  data: SalidaListItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}

export class CreadorSalidaDto {
  @ApiProperty({ example: 'Admin NautiFlow' })
  name: string;
}

export class SalidaDetailDto extends SalidaListItemDto {
  @ApiProperty({ type: CreadorSalidaDto })
  createdBy: CreadorSalidaDto;
}

export class SalidaResumenDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  fechaSalida: Date;

  @ApiProperty({ enum: EstadoSalida })
  estado: EstadoSalida;
}
