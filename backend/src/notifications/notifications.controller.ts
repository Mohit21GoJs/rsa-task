import { Controller, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get WebSocket connection statistics' })
  @ApiResponse({
    status: 200,
    description: 'WebSocket connection statistics',
  })
  getConnectionStats() {
    return this.notificationsService.getConnectionStats();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for WebSocket notification service' })
  @ApiResponse({
    status: 200,
    description: 'WebSocket service health information',
  })
  getHealthStatus() {
    return this.notificationsService.getHealthStatus();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get notification history' })
  @ApiResponse({
    status: 200,
    description: 'Recent notification history',
  })
  getNotificationHistory() {
    return {
      notifications: this.notificationsService.getNotificationHistory(),
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('history')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear notification history' })
  @ApiResponse({
    status: 204,
    description: 'Notification history cleared',
  })
  clearNotificationHistory() {
    this.notificationsService.clearNotificationHistory();
  }
} 