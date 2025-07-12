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

    try {
      this.notificationsGateway.broadcastNotification(notificationData);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send notification: ${error.message}`,
        error.stack,
      );
      // Don't throw the error - just log it so the activity doesn't fail
      this.logger.warn(`⚠️ Notification service continuing despite error`);
    }
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

    try {
      this.notificationsGateway.sendToClient(clientId, notificationData);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send notification to client ${clientId}: ${error.message}`,
        error.stack,
      );
      // Don't throw the error - just log it so the activity doesn't fail
      this.logger.warn(`⚠️ Notification service continuing despite error`);
    }
  }

  // Get connection statistics
  getConnectionStats() {
    try {
      return this.notificationsGateway.getConnectionStats();
    } catch (error) {
      this.logger.error(
        `❌ Failed to get connection stats: ${error.message}`,
        error.stack,
      );
      return {
        totalConnections: 0,
        activeConnections: 0,
        connections: [],
      };
    }
  }

  // Get notification history
  getNotificationHistory() {
    try {
      return this.notificationsGateway.getNotificationHistory();
    } catch (error) {
      this.logger.error(
        `❌ Failed to get notification history: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  // Clear notification history
  clearNotificationHistory() {
    try {
      this.notificationsGateway.clearNotificationHistory();
    } catch (error) {
      this.logger.error(
        `❌ Failed to clear notification history: ${error.message}`,
        error.stack,
      );
    }
  }

  // Get health status
  getHealthStatus() {
    try {
      return this.notificationsGateway.getHealthStatus();
    } catch (error) {
      this.logger.error(
        `❌ Failed to get health status: ${error.message}`,
        error.stack,
      );
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        connections: 0,
        uptime: '0',
        serverInitialized: false,
      };
    }
  }
}
