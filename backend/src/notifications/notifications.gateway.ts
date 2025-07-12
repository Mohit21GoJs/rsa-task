import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ApplicationStatus } from '../workflow/types/application.types';

export interface NotificationData {
  type: string;
  applicationId: string;
  company: string;
  role: string;
  status?: ApplicationStatus;
  message: string;
  timestamp: string;
}

interface ClientConnection {
  id: string;
  socket: Socket;
  connectedAt: Date;
  isActive: boolean;
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connections = new Map<string, ClientConnection>();
  private notificationsHistory: NotificationData[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  afterInit() {
    this.logger.log('🔌 Socket.IO Gateway initialized');
  }

  handleConnection(client: Socket) {
    const clientId = client.id;
    this.logger.log(`📱 Client connected: ${clientId}`);

    // Store connection info
    const connection: ClientConnection = {
      id: clientId,
      socket: client,
      connectedAt: new Date(),
      isActive: true,
    };

    this.connections.set(clientId, connection);
    this.logger.log(`📊 Total active connections: ${this.connections.size}`);

    // Send connection acknowledgment
    client.emit('connected', {
      clientId,
      timestamp: new Date().toISOString(),
      message: 'Connected to notifications service',
    });

    // Send recent notifications history to new client
    if (this.notificationsHistory.length > 0) {
      client.emit('notifications-history', {
        notifications: this.notificationsHistory.slice(-10), // Send last 10 notifications
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.logger.log(`🔌 Client disconnected: ${clientId}`);

    this.connections.delete(clientId);
    this.logger.log(`📊 Remaining connections: ${this.connections.size}`);
  }

  @SubscribeMessage('subscribe-notifications')
  handleSubscribeNotifications(
    @MessageBody() data: { userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const connection = this.connections.get(client.id);
    if (connection) {
      connection.userId = data.userId;
      this.logger.log(`🔔 Client ${client.id} subscribed to notifications`);
      
      client.emit('subscription-confirmed', {
        clientId: client.id,
        subscribed: true,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('get-connection-stats')
  handleGetConnectionStats(@ConnectedSocket() client: Socket) {
    const stats = this.getConnectionStats();
    client.emit('connection-stats', stats);
  }

  // Method to broadcast notification to all connected clients
  broadcastNotification(notification: NotificationData): void {
    this.logger.log(`📤 Broadcasting notification: ${notification.type}`);

    // Add to history
    this.notificationsHistory.push(notification);

    // Keep history size manageable
    if (this.notificationsHistory.length > this.MAX_HISTORY_SIZE) {
      this.notificationsHistory.shift();
    }

    // Broadcast to all connected clients
    this.server.emit('notification', notification);

    // Log broadcast stats
    const activeConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.isActive,
    );
    this.logger.log(
      `📡 Notification sent to ${activeConnections.length} clients`,
    );
  }

  // Method to send notification to specific client
  sendToClient(clientId: string, notification: NotificationData): void {
    const connection = this.connections.get(clientId);
    if (connection && connection.isActive) {
      connection.socket.emit('notification', notification);
      this.logger.log(`📨 Notification sent to client: ${clientId}`);
    }
  }

  // Method to get connection statistics
  getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    connections: Array<{
      id: string;
      connectedAt: string;
      isActive: boolean;
      userId?: string;
    }>;
  } {
    const connections = Array.from(this.connections.values()).map((conn) => ({
      id: conn.id,
      connectedAt: conn.connectedAt.toISOString(),
      isActive: conn.isActive,
      userId: conn.userId,
    }));

    return {
      totalConnections: this.connections.size,
      activeConnections: connections.filter((conn) => conn.isActive).length,
      connections,
    };
  }

  // Method to get notification history
  getNotificationHistory(): NotificationData[] {
    return this.notificationsHistory;
  }

  // Method to clear notification history
  clearNotificationHistory(): void {
    this.notificationsHistory = [];
    this.logger.log('🗑️ Notification history cleared');
  }

  // Health check method
  getHealthStatus(): {
    status: string;
    timestamp: string;
    connections: number;
    uptime: string;
  } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connections: this.connections.size,
      uptime: process.uptime().toString(),
    };
  }
} 