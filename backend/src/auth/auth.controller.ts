import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Acá van registro, login y sesión del lanchero (US-01, US-01b).
@ApiTags('auth')
@Controller('auth')
export class AuthController {}
