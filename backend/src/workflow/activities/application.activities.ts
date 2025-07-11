import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Application, ApplicationStatus } from '../../applications/entities/application.entity';
import { LlmService } from '../../llm/llm.service';

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
  type: 'reminder' | 'deadline' | 'archive';
}

// Activity functions for Temporal workflows
export async function generateCoverLetter(input: CoverLetterInput): Promise<string> {
  // These will be injected by the worker setup
  const applicationRepository = (global as any).applicationRepository;
  const llmService = (global as any).llmService;

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

    return coverLetter;
  } catch (error) {
    console.error('Failed to generate cover letter:', error);
    throw error;
  }
}

export async function sendNotification(input: NotificationInput): Promise<void> {
  try {
    // In a real implementation, this would send emails, push notifications, etc.
    console.log(`[${input.type.toUpperCase()}] Application ${input.applicationId}: ${input.message}`);
    
    // For now, just log the notification
    // In production, integrate with email service, Slack, etc.
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}

export async function checkApplicationStatus(applicationId: string): Promise<ApplicationStatus> {
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

export async function updateApplicationNotes(applicationId: string, notes: string): Promise<void> {
  const applicationRepository = (global as any).applicationRepository;

  try {
    await applicationRepository.update(
      { id: applicationId },
      { notes },
    );
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
  ) {
    // Inject dependencies into global scope for activities
    (global as any).applicationRepository = this.applicationRepository;
    (global as any).llmService = this.llmService;
    (global as any).configService = this.configService;
  }
} 