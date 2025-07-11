import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  environment: string;
  version: string;
  services: {
    database: 'healthy' | 'unhealthy';
    temporal: 'healthy' | 'unhealthy';
    gemini: 'configured' | 'not_configured';
  };
  uptime: number;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  private startTime = Date.now();

  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        timestamp: { type: 'string' },
        environment: { type: 'string' },
        version: { type: 'string' },
        services: {
          type: 'object',
          properties: {
            database: { type: 'string', enum: ['healthy', 'unhealthy'] },
            temporal: { type: 'string', enum: ['healthy', 'unhealthy'] },
            gemini: { type: 'string', enum: ['configured', 'not_configured'] },
          },
        },
        uptime: { type: 'number' },
      },
    },
  })
  async getHealth(): Promise<HealthCheckResponse> {
    const now = Date.now();
    const uptime = Math.floor((now - this.startTime) / 1000);

    try {
      // Basic health check - in a real app you'd check actual service connectivity
      const services = {
        database: this.checkDatabaseConfig(),
        temporal: this.checkTemporalConfig(),
        gemini: this.checkGeminiConfig(),
      };

      const allHealthy = Object.values(services).every(
        (service) => service === 'healthy' || service === 'configured',
      );

      return {
        status: allHealthy ? 'ok' : 'error',
        timestamp: new Date(now).toISOString(),
        environment: this.configService.get('NODE_ENV', 'development'),
        version: process.env.npm_package_version || '1.0.0',
        services,
        uptime,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date(now).toISOString(),
        environment: this.configService.get('NODE_ENV', 'development'),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'unhealthy',
          temporal: 'unhealthy',
          gemini: 'not_configured',
        },
        uptime,
      };
    }
  }

  private checkDatabaseConfig(): 'healthy' | 'unhealthy' {
    const dbHost = this.configService.get('DATABASE_HOST');
    const dbUrl = this.configService.get('DATABASE_URL');

    return dbHost || dbUrl ? 'healthy' : 'unhealthy';
  }

  private checkTemporalConfig(): 'healthy' | 'unhealthy' {
    const temporalAddress = this.configService.get('TEMPORAL_ADDRESS');

    return temporalAddress ? 'healthy' : 'unhealthy';
  }

  private checkGeminiConfig(): 'configured' | 'not_configured' {
    const geminiApiKey = this.configService.get('GEMINI_API_KEY');

    return geminiApiKey ? 'configured' : 'not_configured';
  }
}
