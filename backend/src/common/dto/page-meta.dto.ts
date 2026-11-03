import { ApiProperty } from '@nestjs/swagger';

export class PageMetaDto {
  @ApiProperty({ example: 1, description: 'Página actual (base 1).' })
  page: number;

  @ApiProperty({ example: 20, description: 'Tamaño de página.' })
  limit: number;

  @ApiProperty({ example: 57, description: 'Cantidad total de registros.' })
  total: number;

  @ApiProperty({ example: 3, description: 'Cantidad total de páginas.' })
  totalPages: number;
}
