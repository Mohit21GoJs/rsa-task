import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { ApplicationsService } from './applications.service';
import { Application, ApplicationStatus } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { WorkflowService } from '../workflow/workflow.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let repository: Repository<Application>;
  let workflowService: WorkflowService;
  let configService: ConfigService;

  const mockApplication: Application = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    company: 'Google',
    role: 'Software Engineer',
    jobDescription: 'Great opportunity',
    resume: 'Strong background',
    deadline: new Date('2024-03-15'),
    status: ApplicationStatus.PENDING,
    workflowId: 'job-app-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockWorkflowService = {
    startJobApplicationWorkflow: jest.fn(),
    signalStatusUpdate: jest.fn(),
    cancelWorkflow: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getRepositoryToken(Application),
          useValue: mockRepository,
        },
        {
          provide: WorkflowService,
          useValue: mockWorkflowService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    repository = module.get<Repository<Application>>(getRepositoryToken(Application));
    workflowService = module.get<WorkflowService>(WorkflowService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateApplicationDto = {
      company: 'Google',
      role: 'Software Engineer',
      jobDescription: 'Great opportunity',
      resume: 'Strong background',
    };

    it('should create a new application successfully', async () => {
      // Given
      mockConfigService.get.mockReturnValue('4');
      mockRepository.create.mockReturnValue(mockApplication);
      mockRepository.save.mockResolvedValue(mockApplication);
      mockWorkflowService.startJobApplicationWorkflow.mockResolvedValue(undefined);

      // When
      const result = await service.create(createDto);

      // Then
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          company: createDto.company,
          role: createDto.role,
          jobDescription: createDto.jobDescription,
          resume: createDto.resume,
          status: ApplicationStatus.PENDING,
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(mockApplication);
      expect(workflowService.startJobApplicationWorkflow).toHaveBeenCalledWith(mockApplication);
      expect(result).toEqual(mockApplication);
    });

    it('should throw BadRequestException when save fails', async () => {
      // Given
      mockConfigService.get.mockReturnValue('4');
      mockRepository.create.mockReturnValue(mockApplication);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // When & Then
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return an application when found', async () => {
      // Given
      mockRepository.findOne.mockResolvedValue(mockApplication);

      // When
      const result = await service.findOne(mockApplication.id);

      // Then
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: mockApplication.id } });
      expect(result).toEqual(mockApplication);
    });

    it('should throw NotFoundException when application not found', async () => {
      // Given
      mockRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateApplicationDto = {
      status: ApplicationStatus.INTERVIEW,
      notes: 'First interview scheduled',
    };

    it('should update application and signal workflow', async () => {
      // Given
      const updatedApplication = { ...mockApplication, ...updateDto };
      mockRepository.findOne.mockResolvedValue(mockApplication);
      mockRepository.save.mockResolvedValue(updatedApplication);
      mockWorkflowService.signalStatusUpdate.mockResolvedValue(undefined);

      // When
      const result = await service.update(mockApplication.id, updateDto);

      // Then
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
      expect(workflowService.signalStatusUpdate).toHaveBeenCalledWith(
        mockApplication.workflowId,
        updateDto.status,
      );
      expect(result).toEqual(updatedApplication);
    });
  });

  describe('remove', () => {
    it('should remove application and cancel workflow', async () => {
      // Given
      mockRepository.findOne.mockResolvedValue(mockApplication);
      mockRepository.remove.mockResolvedValue(mockApplication);
      mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

      // When
      await service.remove(mockApplication.id);

      // Then
      expect(workflowService.cancelWorkflow).toHaveBeenCalledWith(mockApplication.workflowId);
      expect(repository.remove).toHaveBeenCalledWith(mockApplication);
    });
  });

  describe('findByStatus', () => {
    it('should return applications filtered by status', async () => {
      // Given
      const applications = [mockApplication];
      mockRepository.find.mockResolvedValue(applications);

      // When
      const result = await service.findByStatus(ApplicationStatus.PENDING);

      // Then
      expect(repository.find).toHaveBeenCalledWith({
        where: { status: ApplicationStatus.PENDING },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(applications);
    });
  });
}); 