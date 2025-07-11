import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ description: 'Company name', example: 'Google' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ description: 'Job role/position', example: 'Software Engineer' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ 
    description: 'Job description',
    example: 'We are looking for a talented software engineer to join our team...' 
  })
  @IsString()
  @IsNotEmpty()
  jobDescription: string;

  @ApiProperty({ 
    description: 'Resume content or file path',
    example: 'Experienced software engineer with 5+ years...' 
  })
  @IsString()
  @IsNotEmpty()
  resume: string;

  @ApiPropertyOptional({ 
    description: 'Application deadline (ISO string)',
    example: '2024-03-15T00:00:00.000Z' 
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ 
    description: 'Additional notes',
    example: 'Applied through LinkedIn' 
  })
  @IsOptional()
  @IsString()
  notes?: string;
} 