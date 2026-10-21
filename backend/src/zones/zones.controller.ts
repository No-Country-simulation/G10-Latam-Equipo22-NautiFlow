import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Zonas de cobertura del Delta y su relación con las embarcaciones.
@ApiTags('zones')
@Controller('zones')
export class ZonesController {}
