import { NestFactory } from '@nestjs/core';
import { Worker, NativeConnection } from '@temporalio/worker';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import * as activities from '../workflow/activities/application.activities';

async function runWorker() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get ConfigService to access environment variables
  const configService = app.get(ConfigService);

  // Initialize the activities class to set up dependency injection
  app.get(activities.ApplicationActivities);

  // Create connection to Temporal server
  const connection = await NativeConnection.connect({
    address: configService.get('TEMPORAL_ADDRESS', 'localhost:7233'),
  });

  try {
    // Create Temporal worker with connection and exported activity functions
    const worker = await Worker.create({
      connection,
      workflowsPath: require.resolve('../workflow/workflows'),
      activities,
      taskQueue: 'job-application-queue',
      namespace: configService.get('TEMPORAL_NAMESPACE', 'default'),
    });

    console.log('🔄 Starting Temporal worker...');
    await worker.run();
  } finally {
    // Close connection when worker shuts down
    await connection.close();
  }
}

runWorker().catch((err) => {
  console.error('❌ Worker failed:', err);
  process.exit(1);
});
