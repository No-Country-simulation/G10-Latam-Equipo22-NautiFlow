import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Carga de documentación en storage privado (US-04).
@ApiTags('documents')
@Controller('documents')
export class DocumentsController {}
