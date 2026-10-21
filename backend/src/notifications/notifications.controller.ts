import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Notificaciones internas del sistema (fuera del MVP mínimo).
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {}
