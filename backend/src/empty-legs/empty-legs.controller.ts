import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Bolsa interna de tramos vacíos (US-12).
@ApiTags('empty-legs')
@Controller('admin/empty-legs')
export class EmptyLegsController {}
