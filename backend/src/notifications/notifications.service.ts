import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  async getNotifications(_userId: string) {
    return { notifications: [] };
  }
}
