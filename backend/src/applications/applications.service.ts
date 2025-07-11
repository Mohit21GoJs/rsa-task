import {
  Injectable,
  NotFoundException,
  BadRequestException,
  MessageEvent,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { addWeeks } from 'date-fns';
import { Observable, Subject } from 'rxjs';

import { Application, ApplicationStatus } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { BulkUpdateApplicationDto } from './dto/bulk-update-application.dto';
import { WorkflowService } from '../workflow/workflow.service';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class ApplicationsService {
  private notificationSubject = new Subject<MessageEvent>();
  private notificationsHistory: any[] = []; // Store recent notifications
  private readonly MAX_HISTORY_SIZE = 100; // Keep last 100 notifications

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly workflowService: WorkflowService,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    createApplicationDto: CreateApplicationDto,
  ): Promise<Application> {
    try {
      // Generate unique workflow ID
      const workflowId = `job-app-${uuidv4()}`;

      // Calculate deadline if not provided
      const deadline = createApplicationDto.deadline
        ? new Date(createApplicationDto.deadline)
        : addWeeks(
            new Date(),
            parseInt(this.configService.get('DEFAULT_DEADLINE_WEEKS', '4')),
          );

      // Create application entity
      const application = this.applicationRepository.create({
        ...createApplicationDto,
        deadline,
        workflowId,
        status: ApplicationStatus.PENDING,
      });

      // Save to database
      const savedApplication =
        await this.applicationRepository.save(application);

      // Start Temporal workflow
      await this.workflowService.startJobApplicationWorkflow(savedApplication);

      return savedApplication;
    } catch (error) {
      throw new BadRequestException(
        'Failed to create application: ' + error.message,
      );
    }
  }

  async findAll(): Promise<Application[]> {
    return this.applicationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  async bulkUpdate(
    bulkUpdateDto: BulkUpdateApplicationDto,
  ): Promise<Application[]> {
    const updatedApplications: Application[] = [];

    for (const update of bulkUpdateDto.updates) {
      try {
        const application = await this.findOne(update.id);
        application.status = update.status;

        const updatedApplication =
          await this.applicationRepository.save(application);

        // Signal workflow about status change
        await this.workflowService.signalStatusUpdate(
          application.workflowId,
          update.status,
        );

        updatedApplications.push(updatedApplication);

        // Send real-time notification
        this.sendNotification({
          type: 'status_update',
          applicationId: application.id,
          company: application.company,
          role: application.role,
          status: update.status,
          message: `Application status updated to ${update.status}`,
        });
      } catch (error) {
        console.error(`Failed to update application ${update.id}:`, error);
      }
    }

    return updatedApplications;
  }

  getNotificationStream(): Observable<MessageEvent> {
    return this.notificationSubject.asObservable();
  }

  async getNotificationsHistory(): Promise<any[]> {
    return this.notificationsHistory.slice().reverse(); // Return most recent first
  }

  async getOverdueApplications(): Promise<Application[]> {
    const now = new Date();
    return this.applicationRepository.find({
      where: {
        deadline: LessThan(now),
        status: ApplicationStatus.PENDING,
      },
      order: { deadline: 'ASC' },
    });
  }

  // Enhanced update method with notifications
  async update(
    id: string,
    updateApplicationDto: UpdateApplicationDto,
  ): Promise<Application> {
    const application = await this.findOne(id);
    const oldStatus = application.status;

    // Update the application
    Object.assign(application, updateApplicationDto);
    const updatedApplication =
      await this.applicationRepository.save(application);

    // Signal workflow about status change
    if (updateApplicationDto.status) {
      await this.workflowService.signalStatusUpdate(
        application.workflowId,
        updateApplicationDto.status,
      );

      // Send real-time notification for status changes
      if (oldStatus !== updateApplicationDto.status) {
        this.sendNotification({
          type: 'status_update',
          applicationId: application.id,
          company: application.company,
          role: application.role,
          status: updateApplicationDto.status,
          message: `Application status changed from ${oldStatus} to ${updateApplicationDto.status}`,
        });
      }
    }

    // Signal workflow about notes update
    if (updateApplicationDto.notes) {
      await this.workflowService.signalNotesUpdate(
        application.workflowId,
        updateApplicationDto.notes,
      );
    }

    return updatedApplication;
  }

  async remove(id: string): Promise<void> {
    const application = await this.findOne(id);

    // Cancel workflow
    await this.workflowService.cancelWorkflow(application.workflowId);

    // Remove from database
    await this.applicationRepository.remove(application);
  }

  async findByStatus(status: ApplicationStatus): Promise<Application[]> {
    return this.applicationRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async archiveExpired(): Promise<number> {
    const expiredApplications = await this.applicationRepository
      .createQueryBuilder('application')
      .where('application.deadline < :now', { now: new Date() })
      .andWhere('application.status = :status', {
        status: ApplicationStatus.PENDING,
      })
      .getMany();

    if (expiredApplications.length === 0) {
      return 0;
    }

    await this.applicationRepository.update(
      { id: { $in: expiredApplications.map((app) => app.id) } as any },
      { status: ApplicationStatus.ARCHIVED },
    );

    return expiredApplications.length;
  }

  async generateCoverLetter(id: string): Promise<Application> {
    const application = await this.findOne(id);

    try {
      // Generate cover letter using LLM service
      const coverLetter = await this.llmService.generateCoverLetter({
        company: application.company,
        role: application.role,
        jobDescription: application.jobDescription,
        resume: application.resume,
      });

      // Update the application with the generated cover letter
      application.coverLetter = coverLetter;
      const updatedApplication =
        await this.applicationRepository.save(application);

      // Send real-time notification
      this.sendNotification({
        type: 'cover_letter_generated',
        applicationId: application.id,
        company: application.company,
        role: application.role,
        message: `Cover letter generated for ${application.company} - ${application.role}`,
      });

      return updatedApplication;
    } catch (error) {
      throw new BadRequestException(
        'Failed to generate cover letter: ' + error.message,
      );
    }
  }

  // Method to send notifications to SSE stream
  private sendNotification(notification: {
    type: string;
    applicationId: string;
    company: string;
    role: string;
    status?: ApplicationStatus;
    message: string;
  }): void {
    const notificationWithTimestamp = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    const messageEvent: MessageEvent = {
      data: JSON.stringify(notificationWithTimestamp),
      type: notification.type,
    };

    // Add to history
    this.notificationsHistory.push(notificationWithTimestamp);

    // Keep history size manageable
    if (this.notificationsHistory.length > this.MAX_HISTORY_SIZE) {
      this.notificationsHistory.shift();
    }

    this.notificationSubject.next(messageEvent);
  }

  // Method to check and send deadline reminders
  async sendDeadlineReminders(): Promise<void> {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingDeadlines = await this.applicationRepository.find({
      where: {
        deadline: LessThan(threeDaysFromNow),
        status: ApplicationStatus.PENDING,
      },
    });

    for (const application of upcomingDeadlines) {
      const daysLeft = Math.ceil(
        (application.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      if (daysLeft <= 3 && daysLeft > 0) {
        this.sendNotification({
          type: 'deadline_reminder',
          applicationId: application.id,
          company: application.company,
          role: application.role,
          message: `Application deadline in ${daysLeft} day(s) for ${application.company} - ${application.role}`,
        });
      } else if (daysLeft <= 0) {
        this.sendNotification({
          type: 'deadline_overdue',
          applicationId: application.id,
          company: application.company,
          role: application.role,
          message: `Application deadline has passed for ${application.company} - ${application.role}`,
        });
      }
    }
  }
}
