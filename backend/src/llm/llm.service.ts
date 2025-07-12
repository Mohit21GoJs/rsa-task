import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface CoverLetterRequest {
  company: string;
  role: string;
  jobDescription: string;
  resume: string;
}

@Injectable()
export class LlmService {
  private genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn(
        '⚠️  GEMINI_API_KEY not configured. Cover letter generation will be mocked.',
      );
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateCoverLetter(request: CoverLetterRequest): Promise<string> {
    try {
      if (!this.genAI) {
        return this.generateMockCoverLetter(request);
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });

      const prompt = this.buildCoverLetterPrompt(request);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Generated cover letter is empty');
      }

      return text.trim();
    } catch (error) {
      console.error('Failed to generate cover letter with Gemini:', error);

      // Fallback to mock generation
      return this.generateMockCoverLetter(request);
    }
  }

  private buildCoverLetterPrompt(request: CoverLetterRequest): string {
    return `
You are a professional career counselor. Generate a compelling cover letter for a job application.

Company: ${request.company}
Position: ${request.role}

Job Description:
${request.jobDescription}

Candidate's Resume/Background:
${request.resume}

Please write a professional, personalized cover letter that:
1. Addresses the hiring manager at ${request.company}
2. Shows enthusiasm for the ${request.role} position
3. Highlights relevant experience from the candidate's background
4. Connects the candidate's skills to the job requirements
5. Demonstrates knowledge of the company
6. Is approximately 3-4 paragraphs long
7. Has a professional but engaging tone

Format the response as a complete cover letter with proper structure.
    `.trim();
  }

  private generateMockCoverLetter(request: CoverLetterRequest): string {
    return `
Dear Hiring Manager,

I am writing to express my strong interest in the ${request.role} position at ${request.company}. Having reviewed the job description, I am excited about the opportunity to contribute to your team and help drive ${request.company}'s continued success.

Based on my background and experience outlined in my resume, I believe I would be an excellent fit for this role. My skills and experience align well with the requirements you've outlined, and I am particularly drawn to ${request.company}'s commitment to innovation and excellence in the industry.

I would welcome the opportunity to discuss how my background and enthusiasm can contribute to your team. Thank you for considering my application, and I look forward to hearing from you soon.

Sincerely,
[Your Name]

---
Note: This is a mock cover letter. Please configure GEMINI_API_KEY for AI-generated content.
    `.trim();
  }

  async improveCoverLetter(
    originalLetter: string,
    feedback: string,
  ): Promise<string> {
    try {
      if (!this.genAI) {
        return `${originalLetter}\n\n[Improvement suggestions: ${feedback}]`;
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });

      const prompt = `
Please improve the following cover letter based on this feedback: "${feedback}"

Original Cover Letter:
${originalLetter}

Provide an improved version that addresses the feedback while maintaining a professional tone.
      `.trim();

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text.trim() || originalLetter;
    } catch (error) {
      console.error('Failed to improve cover letter:', error);
      return originalLetter;
    }
  }
}
