import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { DeadlineSchedulerService } from './deadline-scheduler.service';
import { Application } from './entities/application.entity';
import { WorkflowModule } from '../workflow/workflow.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [TypeOrmModule.forFeature([Application]), WorkflowModule, LlmModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, DeadlineSchedulerService],
  exports: [ApplicationsService, DeadlineSchedulerService],
})
export class ApplicationsModule {}
