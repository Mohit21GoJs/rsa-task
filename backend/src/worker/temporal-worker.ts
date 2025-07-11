import { NestFactory } from '@nestjs/core';
import { Worker } from '@temporalio/worker';
import { AppModule } from '../app.module';
import * as activities from '../workflow/activities/application.activities';

async function runWorker() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Initialize the activities class to set up dependency injection
  app.get(activities.ApplicationActivities);

  // Create Temporal worker with exported activity functions
  const worker = await Worker.create({
    workflowsPath: require.resolve('../workflow/workflows'),
    activities,
    taskQueue: 'job-application-queue',
  });

  console.log('🔄 Starting Temporal worker...');
  await worker.run();
}

runWorker().catch((err) => {
  console.error('❌ Worker failed:', err);
  process.exit(1);
});
