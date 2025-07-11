import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmService, CoverLetterRequest } from './llm.service';

// Mock the Google Generative AI module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(),
}));

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

    describe('when Gemini API is configured', () => {
      beforeEach(() => {
        mockConfigService.get.mockReturnValue('mock-api-key');
        
        // Mock GoogleGenerativeAI
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        GoogleGenerativeAI.mockImplementation(() => ({
          getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
              response: {
                text: jest.fn().mockReturnValue('Generated cover letter content'),
              },
            }),
          }),
        }));
      });

      it('should generate cover letter using Gemini API', async () => {
        // When
        const result = await service.generateCoverLetter(request);

        // Then
        expect(result).toBe('Generated cover letter content');
        expect(configService.get).toHaveBeenCalledWith('GEMINI_API_KEY');
      });

      it('should fallback to mock when API fails', async () => {
        // Given - Mock API to throw error
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        GoogleGenerativeAI.mockImplementation(() => ({
          getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockRejectedValue(new Error('API Error')),
          }),
        }));

        // Create new service with failing API
        const module: TestingModule = await Test.createTestingModule({
          providers: [
            LlmService,
            {
              provide: ConfigService,
              useValue: mockConfigService,
            },
          ],
        }).compile();

        const failingService = module.get<LlmService>(LlmService);

        // When
        const result = await failingService.generateCoverLetter(request);

        // Then
        expect(result).toContain('Dear Hiring Manager');
        expect(result).toContain(request.company);
        expect(result).toContain(request.role);
        expect(result).toContain('mock cover letter');
      });
    });

    describe('when Gemini API is not configured', () => {
      beforeEach(() => {
        mockConfigService.get.mockReturnValue(undefined);
      });

      it('should generate mock cover letter', async () => {
        // When
        const result = await service.generateCoverLetter(request);

        // Then
        expect(result).toContain('Dear Hiring Manager');
        expect(result).toContain(request.company);
        expect(result).toContain(request.role);
        expect(result).toContain('mock cover letter');
      });
    });
  });

  describe('improveCoverLetter', () => {
    const originalLetter = 'Dear Hiring Manager, I am interested in the position.';
    const feedback = 'Make it more enthusiastic and specific.';

    describe('when Gemini API is configured', () => {
      beforeEach(() => {
        mockConfigService.get.mockReturnValue('mock-api-key');
        
        // Mock GoogleGenerativeAI
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        GoogleGenerativeAI.mockImplementation(() => ({
          getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
              response: {
                text: jest.fn().mockReturnValue('Generated cover letter content'),
              },
            }),
          }),
        }));
      });

      it('should improve cover letter using Gemini API', async () => {
        // When
        const result = await service.improveCoverLetter(originalLetter, feedback);

        // Then
        expect(result).toBe('Generated cover letter content');
      });
    });

    describe('when Gemini API is not configured', () => {
      beforeEach(() => {
        mockConfigService.get.mockReturnValue(undefined);
      });

      it('should return original letter with feedback', async () => {
        // When
        const result = await service.improveCoverLetter(originalLetter, feedback);

        // Then
        expect(result).toContain(originalLetter);
        expect(result).toContain(feedback);
      });
    });
  });
}); 