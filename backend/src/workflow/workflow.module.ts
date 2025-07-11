import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkflowService } from './workflow.service';
import { ApplicationActivities } from './activities/application.activities';
import { Application } from '../applications/entities/application.entity';
import { LlmModule } from '../llm/llm.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    LlmModule,
    NotificationsModule,
  ],
  providers: [WorkflowService, ApplicationActivities],
  exports: [WorkflowService],
})
export class WorkflowModule {}
