import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { addWeeks } from 'date-fns';

import { Application } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { BulkUpdateApplicationDto } from './dto/bulk-update-application.dto';
import { WorkflowService } from '../workflow/workflow.service';
import { LlmService } from '../llm/llm.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApplicationStatus } from '../workflow/types/application.types';

@Injectable()
export class ApplicationsService {
  private notificationsSent = new Map<string, Date>(); // Track last notification sent for each application

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly workflowService: WorkflowService,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
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
        try {
          await this.workflowService.signalStatusUpdate(
            application.workflowId,
            update.status,
          );
        } catch (error) {
          // Log but don't fail the bulk update if workflow signaling fails
          console.error(
            `Failed to signal status update to workflow ${application.workflowId}:`,
            error,
          );
        }

        updatedApplications.push(updatedApplication);

        // Send real-time notification via Socket.IO
        this.notificationsService.sendNotification({
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
      this.notificationsService.sendNotification({
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
      try {
        await this.workflowService.signalStatusUpdate(
          application.workflowId,
          updateApplicationDto.status,
        );
      } catch (error) {
        // Log but don't fail the update if workflow signaling fails
        console.error(
          `Failed to signal status update to workflow ${application.workflowId}:`,
          error,
        );
      }

      // Send real-time notification for status changes via Socket.IO
      if (oldStatus !== updateApplicationDto.status) {
        this.notificationsService.sendNotification({
          type: 'status_update',
          applicationId: application.id,
          company: application.company,
          role: application.role,
          status: updateApplicationDto.status,
          message: `Application status changed from ${oldStatus} to ${updateApplicationDto.status}`,
        });

        // Clear deadline notifications when status is updated (user took action)
        this.notificationsSent.delete(application.id);
      }
    }

    // Signal workflow about notes update
    if (updateApplicationDto.notes) {
      try {
        await this.workflowService.signalNotesUpdate(
          application.workflowId,
          updateApplicationDto.notes,
        );
      } catch (error) {
        // Log but don't fail the update if workflow signaling fails
        console.error(
          `Failed to signal notes update to workflow ${application.workflowId}:`,
          error,
        );
      }
    }

    return updatedApplication;
  }

  async remove(id: string): Promise<void> {
    const application = await this.findOne(id);

    try {
      // Cancel workflow - this will handle WorkflowNotFoundError internally
      await this.workflowService.cancelWorkflow(application.workflowId);
    } catch (error) {
      // Log but don't fail the deletion if workflow cancellation fails
      console.error(
        `Failed to cancel workflow ${application.workflowId} during deletion:`,
        error,
      );
      // Continue with database deletion
    }

    // Remove from database
    await this.applicationRepository.remove(application);

    // Send real-time notification for deletion via Socket.IO
    this.notificationsService.sendNotification({
      type: 'application_deleted',
      applicationId: application.id,
      company: application.company,
      role: application.role,
      message: `Application deleted: ${application.company} - ${application.role}`,
    });
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

  /**
   * Monitor all applications for approaching deadlines and trigger urgent reminders
   * This method can be called by a scheduler or monitoring service
   */
  async monitorDeadlineApproachingApplications(): Promise<{
    urgent: Application[];
    approaching: Application[];
    total: number;
  }> {
    try {
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000,
      );

      // Find applications with deadlines within 1 day that are still pending
      const urgentApplications = await this.applicationRepository.find({
        where: {
          deadline: LessThan(oneDayFromNow),
          status: ApplicationStatus.PENDING,
        },
        order: { deadline: 'ASC' },
      });

      // Find applications with deadlines within 3 days
      const approachingApplications = await this.applicationRepository.find({
        where: {
          deadline: LessThan(threeDaysFromNow),
          status: ApplicationStatus.PENDING,
        },
        order: { deadline: 'ASC' },
      });

      // Send urgent notifications for applications within 1 day
      for (const application of urgentApplications) {
        const timeRemaining = application.deadline.getTime() - now.getTime();
        const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));

        // Check if we've sent a notification recently to avoid spam
        const lastNotification = this.notificationsSent.get(application.id);
        const hoursSinceLastNotification = lastNotification
          ? (now.getTime() - lastNotification.getTime()) / (60 * 60 * 1000)
          : 24; // If never sent, treat as 24 hours ago

        // Send notification every 2 hours for urgent applications (< 24 hours)
        if (hoursSinceLastNotification >= 2) {
          this.notificationsService.sendNotification({
            type: 'deadline_monitor',
            applicationId: application.id,
            company: application.company,
            role: application.role,
            status: application.status,
            message: `🚨 URGENT: ${application.company} - ${application.role} deadline in ${hoursRemaining} hours! Take action immediately.`,
          });

          // Update last notification time
          this.notificationsSent.set(application.id, now);

          console.log(
            `Urgent deadline alert: Application ${application.id} for ${application.company} - ${application.role} has ${hoursRemaining} hours remaining`,
          );
        }
      }

      // Send regular notifications for approaching deadlines (2-3 days)
      for (const application of approachingApplications) {
        if (
          !urgentApplications.find((urgent) => urgent.id === application.id)
        ) {
          const timeRemaining = application.deadline.getTime() - now.getTime();
          const daysRemaining = Math.ceil(
            timeRemaining / (24 * 60 * 60 * 1000),
          );

          const lastNotification = this.notificationsSent.get(application.id);
          const hoursSinceLastNotification = lastNotification
            ? (now.getTime() - lastNotification.getTime()) / (60 * 60 * 1000)
            : 24;

          // Send notification once per day for approaching deadlines
          if (hoursSinceLastNotification >= 24) {
            this.notificationsService.sendNotification({
              type: 'deadline_reminder',
              applicationId: application.id,
              company: application.company,
              role: application.role,
              status: application.status,
              message: `⏰ Reminder: ${application.company} - ${application.role} deadline in ${daysRemaining} day(s)`,
            });

            this.notificationsSent.set(application.id, now);
          }
        }
      }

      return {
        urgent: urgentApplications,
        approaching: approachingApplications,
        total: approachingApplications.length,
      };
    } catch (error) {
      console.error(
        'Error monitoring deadline approaching applications:',
        error,
      );
      throw error;
    }
  }

  /**
   * Get applications that need immediate attention (deadline within specified hours)
   */
  async getApplicationsRequiringAttention(
    hoursThreshold: number = 24,
  ): Promise<Application[]> {
    try {
      const thresholdDate = new Date(
        Date.now() + hoursThreshold * 60 * 60 * 1000,
      );

      return await this.applicationRepository.find({
        where: {
          deadline: LessThan(thresholdDate),
          status: ApplicationStatus.PENDING,
        },
        order: { deadline: 'ASC' },
      });
    } catch (error) {
      console.error('Error getting applications requiring attention:', error);
      throw error;
    }
  }

  /**
   * Manually trigger reminder for a specific application
   */
  async triggerManualReminder(applicationId: string): Promise<void> {
    try {
      const application = await this.findOne(applicationId);

      if (application.status !== ApplicationStatus.PENDING) {
        throw new BadRequestException(
          'Cannot send reminders for non-pending applications',
        );
      }

      const now = new Date();
      const timeRemaining = application.deadline.getTime() - now.getTime();

      if (timeRemaining <= 0) {
        throw new BadRequestException('Cannot send reminder for past deadline');
      }

      const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
      const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));

      this.notificationsService.sendNotification({
        type: 'manual_reminder',
        applicationId: application.id,
        company: application.company,
        role: application.role,
        status: application.status,
        message: `📢 Manual reminder: ${application.company} - ${application.role} deadline in ${daysRemaining > 1 ? `${daysRemaining} days` : `${hoursRemaining} hours`}`,
      });

      console.log(`Manual reminder triggered for application ${applicationId}`);
    } catch (error) {
      console.error(
        `Error triggering manual reminder for application ${applicationId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Test method to send cover letter generation notification
   */
  async sendTestCoverLetterNotification(
    application: Application,
  ): Promise<void> {
    this.notificationsService.sendNotification({
      type: 'cover_letter_generated',
      applicationId: application.id,
      company: application.company,
      role: application.role,
      message: `Cover letter generated for ${application.company} - ${application.role}`,
    });

    console.log(
      `📄 Test cover letter notification sent for application ${application.id}`,
    );
  }
}
