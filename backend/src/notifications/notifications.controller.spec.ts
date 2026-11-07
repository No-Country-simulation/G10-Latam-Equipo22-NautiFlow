import { describe, expect, it } from 'vitest';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import type { AuthenticatedRequest } from '../auth/types.js';

describe('NotificationsController', () => {
  it('devuelve la lista de notificaciones del usuario autenticado', async () => {
    const service = new NotificationsService();
    const controller = new NotificationsController(service);

    const req = {
      user: { id: 'user-123', email: 'user@test.com', role: 'ADMIN' },
    } as unknown as AuthenticatedRequest;

    const result = await controller.getNotifications(req);
    expect(result).toEqual({ notifications: [] });
  });
});
