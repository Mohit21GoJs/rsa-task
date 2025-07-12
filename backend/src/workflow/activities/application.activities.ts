import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Application } from '../../applications/entities/application.entity';
import { ApplicationStatus } from '../types/application.types';
import { LlmService } from '../../llm/llm.service';
import { NotificationsService } from '../../notifications/notifications.service';

export interface CoverLetterInput {
  applicationId: string;
  company: string;
  role: string;
  jobDescription: string;
  resume: string;
}

export interface NotificationInput {
  applicationId: string;
  message: string;
  type: 'reminder' | 'deadline' | 'archive' | 'error' | 'urgent_reminder';
}

// Activity functions for Temporal workflows
export async function generateCoverLetter(
  input: CoverLetterInput,
): Promise<string> {
  // These will be injected by the worker setup
  const applicationRepository = (global as any).applicationRepository;
  const llmService = (global as any).llmService;
  const notificationsService = (global as any).notificationsService;

  try {
    const coverLetter = await llmService.generateCoverLetter({
      company: input.company,
      role: input.role,
      jobDescription: input.jobDescription,
      resume: input.resume,
    });

    // Update application with generated cover letter
    await applicationRepository.update(
      { id: input.applicationId },
      { coverLetter },
    );

    // Send Socket.IO notification for cover letter generation
    if (notificationsService) {
      notificationsService.sendNotification({
        type: 'cover_letter_generated',
        applicationId: input.applicationId,
        company: input.company,
        role: input.role,
        message: `Cover letter generated for ${input.company} - ${input.role}`,
      });

      console.log(
        `📄 Cover letter notification sent for application ${input.applicationId}`,
      );
    } else {
      console.warn('NotificationsService not available in worker context');
    }

    return coverLetter;
  } catch (error) {
    console.error('Failed to generate cover letter:', error);
    throw error;
  }
}

export async function sendNotification(
  input: NotificationInput,
): Promise<void> {
  const notificationsService = (global as any).notificationsService;
  const applicationRepository = (global as any).applicationRepository;

  try {
    console.log('Sending notification:', input);

    // Send via Socket.IO if NotificationsService is available
    if (notificationsService) {
      // Try to get application details for better notification context
      let company = 'Workflow';
      let role = 'System';

      if (applicationRepository) {
        try {
          const application = await applicationRepository.findOne({
            where: { id: input.applicationId },
          });
          if (application) {
            company = application.company;
            role = application.role;
          }
        } catch (error) {
          console.warn(
            'Could not fetch application details for notification:',
            error,
          );
        }
      }

      notificationsService.sendNotification({
        type: input.type,
        applicationId: input.applicationId,
        company,
        role,
        message: input.message,
      });
    } else {
      // Fallback to console logging
      console.log(
        `[${input.type.toUpperCase()}] Application ${input.applicationId}: ${input.message}`,
      );
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}

export async function checkApplicationStatus(
  applicationId: string,
): Promise<ApplicationStatus> {
  const applicationRepository = (global as any).applicationRepository;

  try {
    const application = await applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    return application.status;
  } catch (error) {
    console.error('Failed to check application status:', error);
    throw error;
  }
}

export async function archiveApplication(applicationId: string): Promise<void> {
  const applicationRepository = (global as any).applicationRepository;

  try {
    await applicationRepository.update(
      { id: applicationId },
      { status: ApplicationStatus.ARCHIVED },
    );

    console.log(`Application ${applicationId} has been archived`);
  } catch (error) {
    console.error('Failed to archive application:', error);
    throw error;
  }
}

export async function updateApplicationNotes(
  applicationId: string,
  notes: string,
): Promise<void> {
  const applicationRepository = (global as any).applicationRepository;

  try {
    await applicationRepository.update({ id: applicationId }, { notes });
  } catch (error) {
    console.error('Failed to update application notes:', error);
    throw error;
  }
}

@Injectable()
export class ApplicationActivities {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    // Inject dependencies into global scope for activities
    (global as any).applicationRepository = this.applicationRepository;
    (global as any).llmService = this.llmService;
    (global as any).configService = this.configService;
    (global as any).notificationsService = this.notificationsService;
  }
}
