import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role, UserStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from './notifications.service.js';

function createService({
  notifications = [] as object[],
  unreadCount = 0,
  updateMany = { count: 1 },
  admins = [{ id: 'admin-1' }],
} = {}) {
  const prisma = {
    notification: {
      findMany: vi.fn().mockResolvedValue(notifications),
      count: vi.fn().mockResolvedValue(unreadCount),
      updateMany: vi.fn().mockResolvedValue(updateMany),
      findUniqueOrThrow: vi.fn().mockResolvedValue(notifications[0] ?? { id: 'notif-1', read: true }),
      create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    user: {
      findMany: vi.fn().mockResolvedValue(admins),
    },
  };
  const service = new NotificationsService(prisma as unknown as PrismaService);
  return { service, prisma };
}

describe('NotificationsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lista las notificaciones más recientes con el contador de no leídas', async () => {
    const { service, prisma } = createService({
      notifications: [{ id: 'notif-1', title: 'Retorno publicado', message: 'Hola', read: false, createdAt: new Date() }],
      unreadCount: 3,
    });

    const result = await service.getNotifications('user-1');

    expect(result.unreadCount).toBe(3);
    expect(result.notifications).toHaveLength(1);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    );
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
    });
  });

  it('marca como leída una notificación propia', async () => {
    const { service, prisma } = createService();

    await service.markRead('user-1', 'notif-1');

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notif-1', userId: 'user-1' },
      data: { read: true },
    });
  });

  it('lanza 404 si la notificación no existe o es de otro usuario', async () => {
    const { service } = createService({ updateMany: { count: 0 } });

    await expect(service.markRead('user-1', 'notif-otro')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('crea una notificación individual', async () => {
    const { service, prisma } = createService();

    await service.notify('user-2', 'Estado de retorno actualizado', 'Tu retorno pasó a Cerrado.');

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { userId: 'user-2', title: 'Estado de retorno actualizado', message: 'Tu retorno pasó a Cerrado.' },
    });
  });

  it('notifica a todos los admins activos', async () => {
    const { service, prisma } = createService({
      admins: [{ id: 'admin-1' }, { id: 'admin-2' }],
    });

    await service.notifyAdmins('Salida modificada', 'Ana modificó una salida.');

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { role: Role.ADMIN, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'admin-1', title: 'Salida modificada', message: 'Ana modificó una salida.' },
        { userId: 'admin-2', title: 'Salida modificada', message: 'Ana modificó una salida.' },
      ],
    });
  });

  it('no intenta crear notificaciones si no hay admins', async () => {
    const { service, prisma } = createService({ admins: [] });

    await service.notifyAdmins('Salida modificada', 'Ana modificó una salida.');

    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });
});
