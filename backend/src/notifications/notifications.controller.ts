import { Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
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

  @Patch(':id/read')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Marca una notificación como leída' })
  @ApiOkResponse({ description: 'Notificación marcada como leída.' })
  @ApiNotFoundResponse({ description: 'Notificación inexistente o de otro usuario.' })
  @ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
  async markRead(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markRead(request.user!.id, id);
  }
}
