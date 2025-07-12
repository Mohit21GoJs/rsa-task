import {
  Injectable,
  NotFoundException,
  BadRequestException,
  MessageEvent,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { addWeeks } from 'date-fns';
import { Observable, Subject } from 'rxjs';

import { Application } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { BulkUpdateApplicationDto } from './dto/bulk-update-application.dto';
import { WorkflowService } from '../workflow/workflow.service';
import { LlmService } from '../llm/llm.service';
import { ApplicationStatus } from '../workflow/types/application.types';

// Enhanced SSE Connection interface
interface SSEConnection {
  id: string;
  subject: Subject<MessageEvent>;
  connectedAt: Date;
  isActive: boolean;
}

@Injectable()
export class ApplicationsService implements OnModuleDestroy {
  private connections = new Map<string, SSEConnection>();
  private notificationsHistory: any[] = []; // Store recent notifications
  private readonly MAX_HISTORY_SIZE = 100; // Keep last 100 notifications
  private connectionCleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly workflowService: WorkflowService,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
  ) {
    // Start connection cleanup interval
    this.startConnectionCleanup();
  }

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
    const connectionId = uuidv4();
    console.log(`📡 Creating new SSE connection: ${connectionId}`);

    // Create a new Subject for this connection
    const subject = new Subject<MessageEvent>();
    
    // Store the connection
    const connection: SSEConnection = {
      id: connectionId,
      subject,
      connectedAt: new Date(),
      isActive: true,
    };
    
    this.connections.set(connectionId, connection);
    console.log(`📊 Total active connections: ${this.connections.size}`);

    // Return an Observable that handles cleanup on completion/error
    return new Observable<MessageEvent>((observer) => {
      const subscription = subject.subscribe({
        next: (event) => {
          try {
            observer.next(event);
          } catch (error) {
            console.error(`❌ Error sending to connection ${connectionId}:`, error);
            // Mark connection as inactive if there's an error
            connection.isActive = false;
            this.cleanupConnection(connectionId);
          }
        },
        error: (error) => {
          console.error(`❌ Connection ${connectionId} error:`, error);
          observer.error(error);
          this.cleanupConnection(connectionId);
        },
        complete: () => {
          console.log(`✅ Connection ${connectionId} completed`);
          observer.complete();
          this.cleanupConnection(connectionId);
        },
      });

      // Cleanup function called when the observable is unsubscribed
      return () => {
        console.log(`🔌 Client disconnected: ${connectionId}`);
        subscription.unsubscribe();
        this.cleanupConnection(connectionId);
      };
    });
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

    // Send real-time notification for deletion
    this.sendNotification({
      type: 'application_deleted',
      applicationId: application.id,
      company: application.company,
      role: application.role,
      message: `Application deleted: ${application.company} - ${application.role}`,
    });
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
    console.log('📤 Sending notification to SSE clients:', notification);
    
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

    // Send to all active connections
    this.broadcastToConnections(messageEvent);
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
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

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

        this.sendNotification({
          type: 'deadline_monitor',
          applicationId: application.id,
          company: application.company,
          role: application.role,
          status: application.status,
          message: `🚨 URGENT: ${application.company} - ${application.role} deadline in ${hoursRemaining} hours! Take action immediately.`,
        });

        console.log(
          `Urgent deadline alert: Application ${application.id} for ${application.company} - ${application.role} has ${hoursRemaining} hours remaining`,
        );
      }

      return {
        urgent: urgentApplications,
        approaching: approachingApplications,
        total: approachingApplications.length,
      };
    } catch (error) {
      console.error('Error monitoring deadline approaching applications:', error);
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
      const thresholdDate = new Date(Date.now() + hoursThreshold * 60 * 60 * 1000);

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
        throw new BadRequestException('Cannot send reminders for non-pending applications');
      }

      const now = new Date();
      const timeRemaining = application.deadline.getTime() - now.getTime();
      
      if (timeRemaining <= 0) {
        throw new BadRequestException('Cannot send reminder for past deadline');
      }

      const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
      const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));

      let urgencyLevel = 'normal';
      if (hoursRemaining <= 24) urgencyLevel = 'urgent';
      else if (daysRemaining <= 3) urgencyLevel = 'high';

      this.sendNotification({
        type: 'manual_reminder',
        applicationId: application.id,
        company: application.company,
        role: application.role,
        status: application.status,
        message: `📢 Manual reminder: ${application.company} - ${application.role} deadline in ${daysRemaining > 1 ? `${daysRemaining} days` : `${hoursRemaining} hours`}`,
      });

      console.log(`Manual reminder triggered for application ${applicationId}`);
    } catch (error) {
      console.error(`Error triggering manual reminder for application ${applicationId}:`, error);
      throw error;
    }
  }

  // Enhanced connection management methods
  private broadcastToConnections(messageEvent: MessageEvent): void {
    const activeConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.isActive
    );

    console.log(`📡 Broadcasting to ${activeConnections.length} active connections`);

    activeConnections.forEach((connection) => {
      try {
        connection.subject.next(messageEvent);
      } catch (error) {
        console.error(`❌ Error broadcasting to connection ${connection.id}:`, error);
        // Mark connection as inactive and clean it up
        connection.isActive = false;
        this.cleanupConnection(connection.id);
      }
    });
  }

  private cleanupConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      console.log(`🧹 Cleaning up connection: ${connectionId}`);
      connection.isActive = false;
      connection.subject.complete();
      this.connections.delete(connectionId);
      console.log(`📊 Remaining active connections: ${this.connections.size}`);
    }
  }

  private startConnectionCleanup(): void {
    // Clean up inactive connections every 30 seconds
    this.connectionCleanupInterval = setInterval(() => {
      const now = new Date();
      const connectionTimeout = 5 * 60 * 1000; // 5 minutes timeout

      const connectionsToCleanup: string[] = [];

      for (const [id, connection] of this.connections.entries()) {
        // Clean up inactive connections or connections older than timeout
        if (
          !connection.isActive ||
          now.getTime() - connection.connectedAt.getTime() > connectionTimeout
        ) {
          connectionsToCleanup.push(id);
        }
      }

      if (connectionsToCleanup.length > 0) {
        console.log(`🧹 Cleaning up ${connectionsToCleanup.length} inactive connections`);
        connectionsToCleanup.forEach((id) => this.cleanupConnection(id));
      }
    }, 30000); // Run every 30 seconds
  }

  // Get connection statistics
  getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    connections: Array<{
      id: string;
      connectedAt: Date;
      isActive: boolean;
    }>;
  } {
    const connections = Array.from(this.connections.values()).map((conn) => ({
      id: conn.id,
      connectedAt: conn.connectedAt,
      isActive: conn.isActive,
    }));

    return {
      totalConnections: this.connections.size,
      activeConnections: connections.filter((conn) => conn.isActive).length,
      connections,
    };
  }

  // Cleanup method for service shutdown
  onModuleDestroy(): void {
    console.log('🔄 Shutting down ApplicationsService...');
    
    // Stop connection cleanup interval
    if (this.connectionCleanupInterval) {
      clearInterval(this.connectionCleanupInterval);
    }

    // Clean up all connections
    this.connections.forEach((connection, id) => {
      this.cleanupConnection(id);
    });

    console.log('✅ ApplicationsService shutdown complete');
  }
}
