import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';

import { ApplicationsService } from './applications.service';
import { DeadlineSchedulerService } from './deadline-scheduler.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { BulkUpdateApplicationDto } from './dto/bulk-update-application.dto';
import { Application } from './entities/application.entity';
import { ApplicationStatus } from '../workflow/types/application.types';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly deadlineSchedulerService: DeadlineSchedulerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job application' })
  @ApiResponse({
    status: 201,
    description: 'Application created successfully',
    type: Application,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(
    @Body() createApplicationDto: CreateApplicationDto,
  ): Promise<Application> {
    return this.applicationsService.create(createApplicationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all job applications' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ApplicationStatus,
    description: 'Filter by application status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of applications',
    type: [Application],
  })
  findAll(@Query('status') status?: ApplicationStatus): Promise<Application[]> {
    if (status) {
      return this.applicationsService.findByStatus(status);
    }
    return this.applicationsService.findAll();
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue applications' })
  @ApiResponse({
    status: 200,
    description: 'List of overdue applications',
    type: [Application],
  })
  getOverdueApplications(): Promise<Application[]> {
    return this.applicationsService.getOverdueApplications();
  }

  @Sse('notifications')
  @ApiOperation({ summary: 'Server-sent events for real-time notifications' })
  @ApiResponse({
    status: 200,
    description: 'Real-time notification stream',
    headers: {
      'Content-Type': { description: 'text/event-stream' },
      'Cache-Control': { description: 'no-cache' },
      Connection: { description: 'keep-alive' },
    },
  })
  notifications(): Observable<MessageEvent> {
    console.log('📡 New SSE client connecting...');
    try {
      return this.applicationsService.getNotificationStream();
    } catch (error) {
      console.error('❌ Error creating notification stream:', error);
      throw error;
    }
  }

  @Get('notifications/history')
  @ApiOperation({ summary: 'Get notification history' })
  @ApiResponse({
    status: 200,
    description: 'Notification history retrieved successfully',
  })
  getNotificationHistory(): Promise<any[]> {
    return this.applicationsService.getNotificationsHistory();
  }

  @Get('monitor/deadlines')
  @ApiOperation({ summary: 'Monitor applications with approaching deadlines' })
  @ApiResponse({
    status: 200,
    description: 'Applications requiring attention grouped by urgency',
  })
  monitorDeadlines(): Promise<{
    urgent: Application[];
    approaching: Application[];
    total: number;
  }> {
    return this.applicationsService.monitorDeadlineApproachingApplications();
  }

  @Get('requiring-attention')
  @ApiOperation({ summary: 'Get applications requiring immediate attention' })
  @ApiQuery({
    name: 'hours',
    type: Number,
    description: 'Hours threshold for urgent attention (default: 24)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of applications requiring attention',
    type: [Application],
  })
  getApplicationsRequiringAttention(
    @Query('hours') hours?: number,
  ): Promise<Application[]> {
    return this.applicationsService.getApplicationsRequiringAttention(hours);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Update multiple applications status' })
  @ApiResponse({
    status: 200,
    description: 'Applications updated successfully',
    type: [Application],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async bulkUpdate(
    @Body() bulkUpdateDto: BulkUpdateApplicationDto,
  ): Promise<Application[]> {
    return this.applicationsService.bulkUpdate(bulkUpdateDto);
  }

  @Post('archive-expired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive expired applications' })
  @ApiResponse({
    status: 200,
    description: 'Number of applications archived',
    schema: { type: 'object', properties: { archived: { type: 'number' } } },
  })
  async archiveExpired(): Promise<{ archived: number }> {
    const archived = await this.applicationsService.archiveExpired();
    return { archived };
  }

  @Post('monitor/trigger')
  @ApiOperation({ summary: 'Manually trigger deadline monitoring' })
  @ApiResponse({
    status: 200,
    description: 'Monitoring triggered successfully',
  })
  @HttpCode(HttpStatus.OK)
  triggerDeadlineMonitoring(): Promise<{
    urgent: number;
    approaching: number;
    overdue: number;
  }> {
    return this.deadlineSchedulerService.triggerManualMonitoring();
  }

  @Get('notifications/stats')
  @ApiOperation({ summary: 'Get SSE connection statistics' })
  @ApiResponse({
    status: 200,
    description: 'SSE connection statistics',
    schema: {
      type: 'object',
      properties: {
        totalConnections: { type: 'number' },
        activeConnections: { type: 'number' },
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              connectedAt: { type: 'string' },
              isActive: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  getSSEStats(): any {
    return this.applicationsService.getConnectionStats();
  }

  @Get('notifications/health')
  @ApiOperation({ summary: 'Health check for SSE service' })
  @ApiResponse({
    status: 200,
    description: 'SSE service health information',
  })
  getSSEHealth(): any {
    const stats = this.applicationsService.getConnectionStats();
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connections: stats,
      message: 'SSE service is operational',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific job application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application details',
    type: Application,
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  findOne(@Param('id') id: string): Promise<Application> {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job application status or details' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application updated successfully',
    type: Application,
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ): Promise<Application> {
    return this.applicationsService.update(id, updateApplicationDto);
  }

  @Post(':id/generate-cover-letter')
  @ApiOperation({ summary: 'Generate cover letter for an application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Cover letter generated successfully',
    type: Application,
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async generateCoverLetter(@Param('id') id: string): Promise<Application> {
    return this.applicationsService.generateCoverLetter(id);
  }

  @Post(':id/remind')
  @ApiOperation({ summary: 'Manually trigger reminder for an application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder triggered successfully',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot send reminder for this application',
  })
  @HttpCode(HttpStatus.OK)
  triggerReminder(@Param('id') id: string): Promise<void> {
    return this.applicationsService.triggerManualReminder(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a job application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({ status: 204, description: 'Application deleted successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.applicationsService.remove(id);
  }
}
