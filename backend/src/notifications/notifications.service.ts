import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationsGateway,
  NotificationData,
} from './notifications.gateway';
import { ApplicationStatus } from '../workflow/types/application.types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  // Send notification to all connected clients
  sendNotification(notification: {
    type: string;
    applicationId: string;
    company: string;
    role: string;
    status?: ApplicationStatus;
    message: string;
  }): void {
    this.logger.log(`📤 Sending notification: ${notification.type}`);

    const notificationData: NotificationData = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.broadcastNotification(notificationData);
  }

  // Send notification to specific client
  sendToClient(
    clientId: string,
    notification: {
      type: string;
      applicationId: string;
      company: string;
      role: string;
      status?: ApplicationStatus;
      message: string;
    },
  ): void {
    this.logger.log(`📨 Sending notification to client ${clientId}`);

    const notificationData: NotificationData = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.sendToClient(clientId, notificationData);
  }

  // Get connection statistics
  getConnectionStats() {
    return this.notificationsGateway.getConnectionStats();
  }

  // Get notification history
  getNotificationHistory() {
    return this.notificationsGateway.getNotificationHistory();
  }

  // Clear notification history
  clearNotificationHistory() {
    this.notificationsGateway.clearNotificationHistory();
  }

  // Get health status
  getHealthStatus() {
    return this.notificationsGateway.getHealthStatus();
  }
}
