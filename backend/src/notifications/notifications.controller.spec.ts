import { describe, expect, it, vi } from 'vitest';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedRequest } from '../auth/types.js';

function createService() {
  const prisma = {
    notification: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  };
  return {
    service: new NotificationsService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('NotificationsController', () => {
  it('devuelve la lista de notificaciones del usuario autenticado', async () => {
    const { service } = createService();
    const controller = new NotificationsController(service);

    const req = {
      user: { id: 'user-123', email: 'user@test.com', role: 'ADMIN' },
    } as unknown as AuthenticatedRequest;

    const result = await controller.getNotifications(req);
    expect(result).toEqual({ notifications: [], unreadCount: 0 });
  });
});
