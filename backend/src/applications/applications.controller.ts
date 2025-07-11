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
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { BulkUpdateApplicationDto } from './dto/bulk-update-application.dto';
import { Application, ApplicationStatus } from './entities/application.entity';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

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

  @Get('notifications/history')
  @ApiOperation({ summary: 'Get recent notifications history' })
  @ApiResponse({
    status: 200,
    description: 'List of recent notifications',
  })
  getNotificationsHistory(): Promise<any[]> {
    return this.applicationsService.getNotificationsHistory();
  }

  @Sse('notifications')
  @ApiOperation({ summary: 'Server-sent events for real-time notifications' })
  @ApiResponse({
    status: 200,
    description: 'Real-time notification stream',
  })
  notifications(): Observable<MessageEvent> {
    return this.applicationsService.getNotificationStream();
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
