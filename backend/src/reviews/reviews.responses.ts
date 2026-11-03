import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../common/dto/page-meta.dto.js';

export class RatingDto {
  @ApiProperty({
    example: 4.7,
    nullable: true,
    description: 'Promedio a un decimal; null cuando la embarcación no tiene reseñas.',
  })
  average: number | null;

  @ApiProperty({ example: 3, description: 'Cantidad de reseñas.' })
  total: number;
}

export class UsuarioNombreDto {
  @ApiProperty({ example: 'Ana Lanchera' })
  name: string;
}

export class PropietarioPublicoDto {
  @ApiProperty({ example: '+5491155550000', nullable: true, description: 'Solo se expone WhatsApp de contacto.' })
  whatsappPhone: string | null;

  @ApiProperty({ type: UsuarioNombreDto })
  user: UsuarioNombreDto;
}

export class ZonaRefDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Delta del Tigre' })
  nombre: string;
}

export class ZonaEmbarcacionDto {
  @ApiProperty({ type: ZonaRefDto })
  zona: ZonaRefDto;
}

export class EmbarcacionPublicaDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Lancha Delta 1' })
  nombre: string;

  @ApiProperty({ example: 8 })
  capacidad: number;

  @ApiProperty({ type: String, nullable: true, example: null })
  descripcion: string | null;

  @ApiProperty({ type: PropietarioPublicoDto })
  propietario: PropietarioPublicoDto;

  @ApiProperty({ type: [ZonaEmbarcacionDto] })
  zonas: ZonaEmbarcacionDto[];
}

export class EmbarcacionPublicaRatingDto extends EmbarcacionPublicaDto {
  @ApiProperty({ type: RatingDto })
  rating: RatingDto;
}

export class ReviewResumenDto {
  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ type: String, nullable: true, example: 'Paseo excelente.' })
  comment: string | null;

  @ApiProperty({ example: '2026-10-01T12:00:00.000Z' })
  createdAt: Date;
}

export class EmbarcacionDetallePublicaDto extends EmbarcacionPublicaRatingDto {
  @ApiProperty({ type: [ReviewResumenDto], description: 'Últimas cinco reseñas.' })
  reviews: ReviewResumenDto[];
}

export class PaginatedPublicBoatsDto {
  @ApiProperty({ type: [EmbarcacionPublicaRatingDto] })
  data: EmbarcacionPublicaRatingDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}

export class PaginatedPublicReviewsDto {
  @ApiProperty({ type: [ReviewResumenDto] })
  data: ReviewResumenDto[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;
}

export class ReviewContextTripDto {
  @ApiProperty({ example: 'Delta del Tigre' })
  origin: string;

  @ApiProperty({ example: 'Tigre Centro' })
  destination: string;

  @ApiProperty({ example: '2026-11-08T20:47:48.000Z' })
  scheduledAt: Date;

  @ApiProperty({ type: String, nullable: true, example: 'Lancha Delta 1' })
  boatName: string | null;
}

export class ReviewContextDto {
  @ApiProperty({ type: ReviewContextTripDto })
  trip: ReviewContextTripDto;
}

export class ReviewEnviadaDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: '2026-11-02T15:00:00.000Z' })
  createdAt: Date;
}

export class ReviewLinkDto {
  @ApiProperty({
    example: 'https://app.example.com/reviews/abc123',
    description: 'URL pública de la reseña; el token caduca en 14 días.',
  })
  reviewUrl: string;

  @ApiProperty({ example: '2026-11-16T15:00:00.000Z' })
  expiresAt: Date;
}
