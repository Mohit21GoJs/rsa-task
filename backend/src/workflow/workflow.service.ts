import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  Connection,
  WorkflowHandle,
  WorkflowNotFoundError,
} from '@temporalio/client';
import { Application } from '../applications/entities/application.entity';
import { ApplicationStatus } from './types/application.types';
import {
  jobApplicationWorkflow,
  statusUpdateSignal,
  notesUpdateSignal,
} from './workflows/job-application.workflow';

@Injectable()
export class WorkflowService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private connection: Connection;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      // Create connection to Temporal server
      this.connection = await Connection.connect({
        address: this.configService.get('TEMPORAL_ADDRESS', 'localhost:7233'),
      });

      // Create Temporal client
      this.client = new Client({
        connection: this.connection,
        namespace: this.configService.get('TEMPORAL_NAMESPACE', 'default'),
      });

      console.log('✅ Connected to Temporal server');
    } catch (error) {
      console.error('❌ Failed to connect to Temporal server:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
      console.log('🔌 Disconnected from Temporal server');
    }
  }

  async startJobApplicationWorkflow(
    application: Application,
  ): Promise<WorkflowHandle> {
    try {
      const handle = await this.client.workflow.start(jobApplicationWorkflow, {
        taskQueue: 'job-application-queue',
        workflowId: application.workflowId,
        args: [
          {
            applicationId: application.id,
            company: application.company,
            role: application.role,
            jobDescription: application.jobDescription,
            resume: application.resume,
            deadline: application.deadline,
            gracePeriodDays: parseInt(
              this.configService.get('GRACE_PERIOD_DAYS', '7'),
            ),
          },
        ],
      });

      console.log(
        `🚀 Started workflow for application ${application.id} with workflow ID: ${application.workflowId}`,
      );

      return handle;
    } catch (error) {
      console.error('Failed to start workflow:', error);
      throw error;
    }
  }

  async signalStatusUpdate(
    workflowId: string,
    status: ApplicationStatus,
  ): Promise<void> {
    try {
      const handle = this.client.workflow.getHandle(workflowId);
      await handle.signal(statusUpdateSignal, status);

      console.log(
        `📡 Sent status update signal to workflow ${workflowId}: ${status}`,
      );
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        console.warn(
          `⚠️  Workflow ${workflowId} not found - cannot send status update signal`,
        );
        return;
      }

      console.error('Failed to send status update signal:', error);
      throw error;
    }
  }

  async signalNotesUpdate(workflowId: string, notes: string): Promise<void> {
    try {
      const handle = this.client.workflow.getHandle(workflowId);
      await handle.signal(notesUpdateSignal, notes);

      console.log(`📡 Sent notes update signal to workflow ${workflowId}`);
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        console.warn(
          `⚠️  Workflow ${workflowId} not found - cannot send notes update signal`,
        );
        return;
      }

      console.error('Failed to send notes update signal:', error);
      throw error;
    }
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    try {
      const handle = this.client.workflow.getHandle(workflowId);
      await handle.cancel();

      console.log(`🛑 Cancelled workflow ${workflowId}`);
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        console.warn(
          `⚠️  Workflow ${workflowId} not found - may have already been cancelled or completed`,
        );
        // Don't throw error for non-existent workflows as it's not a failure condition
        return;
      }

      console.error('Failed to cancel workflow:', error);
      throw error;
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<any> {
    try {
      const handle = this.client.workflow.getHandle(workflowId);
      const result = await handle.query('getWorkflowInfo');

      return result;
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        console.warn(
          `⚠️  Workflow ${workflowId} not found - cannot get status`,
        );
        return null;
      }

      console.error('Failed to get workflow status:', error);
      throw error;
    }
  }

  async describeWorkflow(workflowId: string): Promise<any> {
    try {
      const handle = this.client.workflow.getHandle(workflowId);
      return await handle.describe();
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        console.warn(`⚠️  Workflow ${workflowId} not found - cannot describe`);
        return null;
      }

      console.error('Failed to describe workflow:', error);
      throw error;
    }
  }
}
