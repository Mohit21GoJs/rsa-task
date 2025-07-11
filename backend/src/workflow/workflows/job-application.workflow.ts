import {
  defineSignal,
  defineQuery,
  setHandler,
  sleep,
  proxyActivities,
  continueAsNew,
  workflowInfo,
} from '@temporalio/workflow';
import { ApplicationStatus } from '../../applications/entities/application.entity';

import type * as activities from '../activities/application.activities';

// Signals for workflow communication
export const statusUpdateSignal = defineSignal<[ApplicationStatus]>('statusUpdate');
export const notesUpdateSignal = defineSignal<[string]>('notesUpdate');

// Queries for workflow state inspection
export const getCurrentStatusQuery = defineQuery<ApplicationStatus>('getCurrentStatus');
export const getWorkflowInfoQuery = defineQuery<any>('getWorkflowInfo');

// Activity proxies
const {
  generateCoverLetter,
  sendNotification,
  checkApplicationStatus,
  archiveApplication,
  updateApplicationNotes,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '1s',
    maximumInterval: '100s',
    maximumAttempts: 3,
  },
});

export interface JobApplicationWorkflowInput {
  applicationId: string;
  company: string;
  role: string;
  jobDescription: string;
  resume: string;
  deadline: Date;
  gracePeriodDays: number;
}

export async function jobApplicationWorkflow(
  input: JobApplicationWorkflowInput,
): Promise<void> {
  let currentStatus = ApplicationStatus.PENDING;
  let workflowCompleted = false;

  // Set up signal and query handlers
  setHandler(statusUpdateSignal, (newStatus: ApplicationStatus) => {
    currentStatus = newStatus;
    if (newStatus === ApplicationStatus.REJECTED || 
        newStatus === ApplicationStatus.WITHDRAWN || 
        newStatus === ApplicationStatus.OFFER) {
      workflowCompleted = true;
    }
  });

  setHandler(notesUpdateSignal, async (notes: string) => {
    await updateApplicationNotes(input.applicationId, notes);
  });

  setHandler(getCurrentStatusQuery, () => currentStatus);
  setHandler(getWorkflowInfoQuery, () => ({
    workflowId: workflowInfo().workflowId,
    runId: workflowInfo().runId,
    status: currentStatus,
    applicationId: input.applicationId,
  }));

  try {
    // Step 1: Generate cover letter
    console.log(`Generating cover letter for application ${input.applicationId}`);
    await generateCoverLetter({
      applicationId: input.applicationId,
      company: input.company,
      role: input.role,
      jobDescription: input.jobDescription,
      resume: input.resume,
    });

    // Step 2: Send initial confirmation notification
    await sendNotification({
      applicationId: input.applicationId,
      message: `Cover letter generated for ${input.company} - ${input.role} position`,
      type: 'reminder',
    });

    // Step 3: Wait until deadline or status change
    const deadlineTime = new Date(input.deadline).getTime();
    const currentTime = Date.now();
    const timeToDeadline = deadlineTime - currentTime;

    if (timeToDeadline > 0) {
      // Sleep until deadline or until status changes
      const sleepPromise = sleep(timeToDeadline);
      
      // Wait for either deadline or workflow completion
      await Promise.race([
        sleepPromise,
        new Promise<void>((resolve) => {
          const checkStatus = () => {
            if (workflowCompleted) {
              resolve();
            } else {
              setTimeout(checkStatus, 1000); // Check every second
            }
          };
          checkStatus();
        }),
      ]);
    }

    // Step 4: Handle deadline reached
    if (!workflowCompleted && currentStatus === ApplicationStatus.PENDING) {
      // Send deadline reminder
      await sendNotification({
        applicationId: input.applicationId,
        message: `Deadline reached for ${input.company} - ${input.role}. Consider following up or updating status.`,
        type: 'deadline',
      });

      // Wait for grace period
      const gracePeriodMs = input.gracePeriodDays * 24 * 60 * 60 * 1000;
      await sleep(gracePeriodMs);

      // Check status after grace period
      const finalStatus = await checkApplicationStatus(input.applicationId);
      
      if (finalStatus === ApplicationStatus.PENDING) {
        // Auto-archive if still pending
        await archiveApplication(input.applicationId);
        await sendNotification({
          applicationId: input.applicationId,
          message: `Application for ${input.company} - ${input.role} has been automatically archived after grace period.`,
          type: 'archive',
        });
      }
    }

    console.log(`Workflow completed for application ${input.applicationId}`);
  } catch (error) {
    console.error(`Workflow failed for application ${input.applicationId}:`, error);
    
    // Send error notification
    await sendNotification({
      applicationId: input.applicationId,
      message: `Workflow error for ${input.company} - ${input.role}: ${error.message}`,
      type: 'reminder',
    });
    
    throw error;
  }
} 