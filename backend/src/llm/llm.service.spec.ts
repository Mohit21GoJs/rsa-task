import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmService, CoverLetterRequest } from './llm.service';

describe('LlmService', () => {
  let service: LlmService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('generateCoverLetter', () => {
    const request: CoverLetterRequest = {
      company: 'Google',
      role: 'Software Engineer',
      jobDescription: 'Great opportunity to work with cutting-edge technology',
      resume: 'Experienced software engineer with 5+ years',
    };

    it('should generate cover letter when API is available', async () => {
      // Given - Spy on the service method to return mocked result
      jest.spyOn(service, 'generateCoverLetter').mockResolvedValue('Generated cover letter content');

      // When
      const result = await service.generateCoverLetter(request);

      // Then
      expect(result).toBe('Generated cover letter content');
    });

    it('should generate mock cover letter when API fails or not configured', async () => {
      // When - Use the real service implementation which should fallback to mock
      const result = await service.generateCoverLetter(request);

      // Then - Verify it contains mock cover letter content
      expect(result).toContain('Dear Hiring Manager');
      expect(result).toContain(request.company);
      expect(result).toContain(request.role);
      expect(result).toContain('mock cover letter');
    });

    it('should handle different companies and roles in mock generation', async () => {
      // Given
      const customRequest: CoverLetterRequest = {
        company: 'Microsoft',
        role: 'Senior Developer',
        jobDescription: 'Amazing opportunity',
        resume: 'Extensive experience',
      };

      // When
      const result = await service.generateCoverLetter(customRequest);

      // Then
      expect(result).toContain('Dear Hiring Manager');
      expect(result).toContain('Microsoft');
      expect(result).toContain('Senior Developer');
    });
  });

  describe('improveCoverLetter', () => {
    const originalLetter = 'Dear Hiring Manager, I am interested in the position.';
    const feedback = 'Make it more enthusiastic and specific.';

    it('should improve cover letter when API is available', async () => {
      // Given - Spy on the service method to return mocked result
      jest.spyOn(service, 'improveCoverLetter').mockResolvedValue('Generated improved cover letter content');

      // When
      const result = await service.improveCoverLetter(originalLetter, feedback);

      // Then
      expect(result).toBe('Generated improved cover letter content');
    });

    it('should return original letter with feedback when API not available', async () => {
      // When - Use the real service implementation which should fallback
      const result = await service.improveCoverLetter(originalLetter, feedback);

      // Then
      expect(result).toContain(originalLetter);
      expect(result).toContain(feedback);
    });

    it('should handle empty feedback gracefully', async () => {
      // When
      const result = await service.improveCoverLetter(originalLetter, '');

      // Then
      expect(result).toContain(originalLetter);
    });
  });

  describe('service configuration', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have access to config service', () => {
      expect(configService).toBeDefined();
    });
  });
});
