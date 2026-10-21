import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Datos de usuario y perfil propio (US-02).
@ApiTags('users')
@Controller('users')
export class UsersController {}
