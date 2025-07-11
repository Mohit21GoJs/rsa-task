import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../entities/application.entity';

export class UpdateApplicationDto {
  @ApiPropertyOptional({
    description: 'Application status',
    enum: ApplicationStatus,
    example: ApplicationStatus.INTERVIEW,
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Had first interview, waiting for next round',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Updated cover letter',
    example: 'Dear Hiring Manager...',
  })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}
