import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Perfil del lanchero y su estado de verificación (US-02, US-05).
@ApiTags('owners')
@Controller('owners')
export class OwnersController {}
