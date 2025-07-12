import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { Application } from '../src/applications/entities/application.entity';
import { ApplicationStatus } from '../src/workflow/types/application.types';
import { WorkflowService } from '../src/workflow/workflow.service';
import { LlmService } from '../src/llm/llm.service';

describe('ApplicationsController (e2e)', () => {
  let app: INestApplication;

  // Mock services
  const mockWorkflowService = {
    startJobApplicationWorkflow: jest.fn().mockResolvedValue(undefined),
    signalStatusUpdate: jest.fn().mockResolvedValue(undefined),
    cancelWorkflow: jest.fn().mockResolvedValue(undefined),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  const mockLlmService = {
    generateCoverLetter: jest.fn().mockResolvedValue('Mock cover letter'),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WorkflowService)
      .useValue(mockWorkflowService)
      .overrideProvider(LlmService)
      .useValue(mockLlmService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Set global prefix (same as in main.ts)
    app.setGlobalPrefix('api');

    moduleFixture.get<Repository<Application>>(getRepositoryToken(Application));

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/applications (POST)', () => {
    const createApplicationDto = {
      company: 'Google',
      role: 'Software Engineer',
      jobDescription: 'Great opportunity to work with cutting-edge technology',
      resume: 'Experienced software engineer with 5+ years',
    };

    it('should create a new application', () => {
      return request(app.getHttpServer())
        .post('/api/applications')
        .send(createApplicationDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.company).toBe(createApplicationDto.company);
          expect(res.body.role).toBe(createApplicationDto.role);
          expect(res.body.status).toBe(ApplicationStatus.PENDING);
          expect(res.body).toHaveProperty('workflowId');
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/applications')
        .send({
          company: '', // Invalid empty company
          role: 'Software Engineer',
        })
        .expect(400);
    });
  });

  describe('/api/applications (GET)', () => {
    it('should return all applications', () => {
      return request(app.getHttpServer())
        .get('/api/applications')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should filter applications by status', () => {
      return request(app.getHttpServer())
        .get('/api/applications')
        .query({ status: ApplicationStatus.PENDING })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/applications/:id (GET)', () => {
    it('should return 404 for non-existent application', () => {
      return request(app.getHttpServer())
        .get('/api/applications/non-existent-id')
        .expect(404);
    });
  });

  describe('/api/applications/:id (PATCH)', () => {
    const updateDto = {
      status: ApplicationStatus.INTERVIEW,
      notes: 'First interview scheduled for next week',
    };

    it('should return 404 when updating non-existent application', () => {
      return request(app.getHttpServer())
        .patch('/api/applications/non-existent-id')
        .send(updateDto)
        .expect(404);
    });
  });

  describe('/api/applications/:id (DELETE)', () => {
    it('should return 404 when deleting non-existent application', () => {
      return request(app.getHttpServer())
        .delete('/api/applications/non-existent-id')
        .expect(404);
    });
  });

  describe('/api/applications/archive-expired (POST)', () => {
    it('should archive expired applications', () => {
      return request(app.getHttpServer())
        .post('/api/applications/archive-expired')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('archived');
          expect(typeof res.body.archived).toBe('number');
        });
    });
  });
});
