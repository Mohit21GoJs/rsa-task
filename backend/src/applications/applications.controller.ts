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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

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

  @Post(':id/test-cover-letter-notification')
  @ApiOperation({ summary: 'Test cover letter generation notification (for testing)' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent successfully',
  })
  @HttpCode(HttpStatus.OK)
  async testCoverLetterNotification(@Param('id') id: string): Promise<{ message: string }> {
    const application = await this.applicationsService.findOne(id);
    
    // Send a test cover letter generation notification
    await this.applicationsService.sendTestCoverLetterNotification(application);
    
    return { 
      message: `Test cover letter notification sent for ${application.company} - ${application.role}` 
    };
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
