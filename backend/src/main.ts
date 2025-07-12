import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { apiReference } from '@scalar/nestjs-api-reference';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security headers with Helmet
  if (configService.get('HELMET_ENABLED', 'true') === 'true') {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              'https://fonts.googleapis.com',
            ],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'",
              "'unsafe-eval'",
              'https://cdn.jsdelivr.net',
            ], // Needed for Swagger and Scalar API reference
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
          },
        },
        crossOriginEmbedderPolicy: false, // Disable for API
      }),
    );
  }

  // Compression middleware
  if (configService.get('COMPRESSION_ENABLED', 'true') === 'true') {
    app.use(
      compression({
        threshold: 1024, // Only compress responses larger than 1KB
        level: 6, // Compression level (1-9)
      }),
    );
  }

  // Request logging middleware
  const requestLoggerMiddleware = new RequestLoggerMiddleware();
  app.use(requestLoggerMiddleware.use.bind(requestLoggerMiddleware));

  // Enhanced CORS configuration
  const corsOrigins = configService
    .get('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: configService.get('CORS_CREDENTIALS', 'true') === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-requested-with',
      'x-forwarded-for',
      'user-agent',
    ],
    exposedHeaders: [
      'X-Response-Time',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
    ],
    maxAge: 86400, // 24 hours
  });

  // Global validation pipe with comprehensive settings
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 422,
    }),
  );

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  const port = configService.get('PORT', 3000);

  // Enhanced Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Job Application Assistant API')
    .setDescription(
      'API for managing job applications with Temporal.io workflows\n\n' +
        '## Authentication\n' +
        'This API uses API key authentication. Include your API key in the `x-api-key` header.\n\n' +
        '## Rate Limiting\n' +
        'The API implements multi-tier rate limiting:\n' +
        '- 10 requests per second\n' +
        '- 100 requests per minute\n' +
        '- 1000 requests per hour\n\n' +
        '## Security\n' +
        'All endpoints are protected by default. Use the `@Public()` decorator for public endpoints.',
    )
    .setVersion('1.0')
    .addTag('applications', 'Job application management')
    .addTag('workflow', 'Workflow operations')
    .addTag('health', 'Health check endpoints')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key for authentication',
      },
      'apikey',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // API playground
  app.use(
    '/api/playground',
    apiReference({
      theme: 'laserwave',
      content: document,
    }),
  );

  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🎮 API Playground: http://localhost:${port}/api/playground`);
  console.log(`💚 Health Check: http://localhost:${port}/health`);
  console.log(`🔐 API Key Header: x-api-key`);
  console.log(`📈 Rate Limits: 10/sec, 100/min, 1000/hour`);
}

bootstrap().catch((err) => {
  console.error('❌ Application failed to start:', err);
  process.exit(1);
});
