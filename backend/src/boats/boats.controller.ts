import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Alta y edición de embarcaciones, y búsqueda del admin (US-03, US-06).
@ApiTags('boats')
@Controller('boats')
export class BoatsController {}
