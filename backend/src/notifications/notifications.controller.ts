import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/types.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Consultar notificaciones del usuario autenticado' })
  @ApiOkResponse({ description: 'Lista de notificaciones del usuario.' })
  @ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
  async getNotifications(@Req() request: AuthenticatedRequest) {
    return this.notificationsService.getNotifications(request.user!.id);
  }
}
