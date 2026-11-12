import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Role, UserStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const NOTICIAS_RECIENTES = 50;

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getNotifications(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: NOTICIAS_RECIENTES,
        select: { id: true, title: true, message: true, read: true, createdAt: true },
      }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);
    return { notifications, unreadCount };
  }

  async markRead(userId: string, id: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    if (count === 0) {
      throw new NotFoundException('No se encontró la notificación.');
    }
    return this.prisma.notification.findUniqueOrThrow({
      where: { id },
      select: { id: true, title: true, message: true, read: true, createdAt: true },
    });
  }

  async notify(userId: string, title: string, message: string) {
    await this.prisma.notification.create({ data: { userId, title, message } });
  }

  async notifyAdmins(title: string, message: string) {
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({ userId: admin.id, title, message })),
    });
  }
}
