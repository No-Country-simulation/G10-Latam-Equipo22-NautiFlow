import { ApiProperty } from '@nestjs/swagger';
import { EstadoSalida, EstadoTramo, TipoTramo } from '../generated/prisma/client.js';
import { PageMetaDto } from '../common/dto/page-meta.dto.js';
import {
  EmbarcacionDetallePublicaDto,
  EmbarcacionPublicaDto,
  RatingDto,
} from '../reviews/reviews.responses.js';

export class TramoPublicoDto {
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

  @ApiProperty({ example: 50000, description: 'Precio en centavos.' })
  precioCentavos: number;

  @ApiProperty({ example: false, description: 'Regreso sin turistas.' })
  sinTuristas: boolean;

  @ApiProperty({ enum: EstadoTramo })
  estado: EstadoTramo;
}

export class SalidaPublicaItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  fechaSalida: Date;

  @ApiProperty({ enum: EstadoSalida })
  estado: EstadoSalida;

  @ApiProperty({ type: EmbarcacionPublicaDto })
  embarcacion: EmbarcacionPublicaDto;

  @ApiProperty({ type: [TramoPublicoDto] })
  tramos: TramoPublicoDto[];

  @ApiProperty({ type: RatingDto })
  rating: RatingDto;

  @ApiProperty({
    description: 'true si algún tramo está DISPONIBLE con cupo > 0.',
    example: true,
  })
  disponible: boolean;
}

export class SalidaPublicaDetalleDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  fechaSalida: Date;

  @ApiProperty({ enum: EstadoSalida })
  estado: EstadoSalida;

  @ApiProperty({
    type: EmbarcacionDetallePublicaDto,
    description: 'Lancha pública con las últimas cinco reseñas.',
  })
  embarcacion: EmbarcacionDetallePublicaDto;

  @ApiProperty({ type: [TramoPublicoDto] })
  tramos: TramoPublicoDto[];

  @ApiProperty({ type: RatingDto })
  rating: RatingDto;

  @ApiProperty({
    description: 'true si algún tramo está DISPONIBLE con cupo > 0.',
    example: true,
  })
  disponible: boolean;
}

export class PaginatedSalidasPublicasDto {
  @ApiProperty({ type: [SalidaPublicaItemDto] })
  data: SalidaPublicaItemDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}
