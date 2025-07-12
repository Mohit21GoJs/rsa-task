import {
  defineSignal,
  defineQuery,
  setHandler,
  sleep,
  proxyActivities,
  workflowInfo,
  CancellationScope,
  isCancellation,
} from '@temporalio/workflow';
import { ApplicationStatus, JobApplicationWorkflowInput } from '../types/application.types';

import type * as activities from '../activities/application.activities';

// Signals for workflow communication
export const statusUpdateSignal =
  defineSignal<[ApplicationStatus]>('statusUpdate');
export const notesUpdateSignal = defineSignal<[string]>('notesUpdate');

// Queries for workflow state inspection
export const getCurrentStatusQuery =
  defineQuery<ApplicationStatus>('getCurrentStatus');
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

export async function jobApplicationWorkflow(
  input: JobApplicationWorkflowInput,
): Promise<void> {
  let currentStatus = ApplicationStatus.PENDING;
  let workflowCompleted = false;
  let reminderCancelScope: CancellationScope | null = null;

  // Set up signal and query handlers
  setHandler(statusUpdateSignal, (newStatus: ApplicationStatus) => {
    const previousStatus = currentStatus;
    currentStatus = newStatus;
    
    if (
      newStatus === ApplicationStatus.REJECTED ||
      newStatus === ApplicationStatus.WITHDRAWN ||
      newStatus === ApplicationStatus.OFFER
    ) {
      workflowCompleted = true;
      // Cancel any active reminder loops
      if (reminderCancelScope) {
        reminderCancelScope.cancel();
        reminderCancelScope = null;
      }
    }
    
    console.log(`Status updated from ${previousStatus} to ${newStatus} for application ${input.applicationId}`);
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
    console.log(
      `Generating cover letter for application ${input.applicationId}`,
    );
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

    // Step 3: Enhanced deadline monitoring with proactive reminders
    const deadlineTime = new Date(input.deadline).getTime();
    const currentTime = Date.now();
    const timeToDeadline = deadlineTime - currentTime;
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const oneMinuteInMs = 60 * 1000; // 1 minute in milliseconds

    if (timeToDeadline > 0) {
      // Check if deadline is within 1 day
      if (timeToDeadline <= oneDayInMs) {
        console.log(`Deadline is within 1 day for application ${input.applicationId}, starting immediate reminders`);
        
        // Start immediate reminder loop since deadline is within 1 day
        reminderCancelScope = new CancellationScope();
        await reminderCancelScope.run(async () => {
          await startReminderLoop(input, oneMinuteInMs, currentStatus, workflowCompleted);
        });
      } else {
        // Sleep until 1 day before deadline
        const timeUntilReminderStart = timeToDeadline - oneDayInMs;
        console.log(`Sleeping ${timeUntilReminderStart}ms until reminder period starts for application ${input.applicationId}`);
        
        await Promise.race([
          sleep(timeUntilReminderStart),
          new Promise<void>((resolve) => {
            const checkCompletion = () => {
              if (workflowCompleted) {
                resolve();
              } else {
                setTimeout(checkCompletion, 1000);
              }
            };
            checkCompletion();
          }),
        ]);

        // If workflow is not completed and we're now within 1 day of deadline, start reminders
        if (!workflowCompleted && currentStatus === ApplicationStatus.PENDING) {
          console.log(`Starting reminder period for application ${input.applicationId}`);
          
          reminderCancelScope = new CancellationScope();
          try {
            await reminderCancelScope.run(async () => {
              await startReminderLoop(input, oneMinuteInMs, currentStatus, workflowCompleted);
            });
          } catch (error) {
            if (!isCancellation(error)) {
              throw error;
            }
            console.log(`Reminder loop cancelled for application ${input.applicationId}`);
          }
        }
      }
    }

    // Step 4: Handle deadline reached (existing logic)
    if (!workflowCompleted && currentStatus === ApplicationStatus.PENDING) {
      const now = Date.now();
      const deadlineReached = now >= deadlineTime;
      
      if (deadlineReached) {
        // Send final deadline notification
        await sendNotification({
          applicationId: input.applicationId,
          message: `DEADLINE REACHED for ${input.company} - ${input.role}. Immediate action required!`,
          type: 'deadline',
        });

        // Wait for grace period
        const gracePeriodMs = input.gracePeriodDays * 24 * 60 * 60 * 1000;
        console.log(`Starting grace period of ${input.gracePeriodDays} days for application ${input.applicationId}`);
        
        await Promise.race([
          sleep(gracePeriodMs),
          new Promise<void>((resolve) => {
            const checkCompletion = () => {
              if (workflowCompleted) {
                resolve();
              } else {
                setTimeout(checkCompletion, 1000);
              }
            };
            checkCompletion();
          }),
        ]);

        // Check status after grace period
        if (!workflowCompleted && currentStatus === ApplicationStatus.PENDING) {
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
      }
    }

    console.log(`Workflow completed for application ${input.applicationId}`);
  } catch (error) {
    console.error(
      `Workflow failed for application ${input.applicationId}:`,
      error,
    );

    // Send error notification
    await sendNotification({
      applicationId: input.applicationId,
      message: `Workflow error for ${input.company} - ${input.role}: ${error.message}`,
      type: 'error',
    });

    throw error;
  }
}

/**
 * Sends reminder notifications every minute until deadline is reached or workflow is completed
 */
async function startReminderLoop(
  input: JobApplicationWorkflowInput,
  intervalMs: number,
  currentStatus: ApplicationStatus,
  workflowCompleted: boolean,
): Promise<void> {
  const deadlineTime = new Date(input.deadline).getTime();
  let reminderCount = 0;
  
  while (!workflowCompleted && currentStatus === ApplicationStatus.PENDING) {
    const now = Date.now();
    const timeRemaining = deadlineTime - now;
    
    // Stop if deadline has passed
    if (timeRemaining <= 0) {
      console.log(`Deadline reached, stopping reminders for application ${input.applicationId}`);
      break;
    }
    
    reminderCount++;
    const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
    const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
    
    let timeMessage = '';
    if (hoursRemaining > 1) {
      timeMessage = `${hoursRemaining} hours remaining`;
    } else {
      timeMessage = `${minutesRemaining} minutes remaining`;
    }
    
    // Send reminder notification
    await sendNotification({
      applicationId: input.applicationId,
      message: `⚠️ URGENT REMINDER #${reminderCount}: Application deadline for ${input.company} - ${input.role} is approaching! ${timeMessage}. Please update your application status.`,
      type: 'urgent_reminder',
    });
    
    console.log(`Sent reminder #${reminderCount} for application ${input.applicationId}, ${timeMessage}`);
    
    // Sleep for the specified interval (default 1 minute)
    await sleep(intervalMs);
    
    // Re-check status in case it was updated during the sleep
    // Note: In Temporal, we rely on signals to update the status,
    // but we also check here to be safe
    if (workflowCompleted || currentStatus !== ApplicationStatus.PENDING) {
      console.log(`Status changed or workflow completed, stopping reminders for application ${input.applicationId}`);
      break;
    }
  }
}
