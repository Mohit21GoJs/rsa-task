import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { ApplicationsModule } from './applications/applications.module';
import { WorkflowModule } from './workflow/workflow.module';
import { LlmModule } from './llm/llm.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Database module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: parseInt(configService.get('DATABASE_PORT', '5432'), 10),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: String(configService.get('DATABASE_PASSWORD', 'postgres')),
        database: configService.get('DATABASE_NAME', 'job_assistant'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV', 'development') === 'development',
        logging: configService.get('NODE_ENV', 'development') === 'development',
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false, // Disable auto migration run for now
        retryAttempts: 5,
        retryDelay: 3000,
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    CommonModule,
    ApplicationsModule,
    WorkflowModule,
    LlmModule,
  ],
})
export class AppModule {} 