import { PartialType } from '@nestjs/swagger';
import { CrearEmbarcacionDto } from './crear-embarcacion.dto.js';

export class ActualizarEmbarcacionDto extends PartialType(CrearEmbarcacionDto) {}
