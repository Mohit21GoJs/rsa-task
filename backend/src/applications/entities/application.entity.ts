import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum ApplicationStatus {
  PENDING = 'pending',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  ARCHIVED = 'archived',
}

@Entity('applications')
export class Application {
  @ApiProperty({ description: 'Unique identifier for the application' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Company name' })
  @Column()
  company: string;

  @ApiProperty({ description: 'Job role/position' })
  @Column()
  role: string;

  @ApiProperty({ description: 'Job description' })
  @Column('text')
  jobDescription: string;

  @ApiProperty({ description: 'Resume content or file path' })
  @Column('text')
  resume: string;

  @ApiProperty({ description: 'Generated cover letter' })
  @Column('text', { nullable: true })
  coverLetter?: string;

  @ApiProperty({ description: 'Application deadline' })
  @Column('timestamp')
  deadline: Date;

  @ApiProperty({ 
    description: 'Application status',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING 
  })
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @ApiProperty({ description: 'Notes about the application' })
  @Column('text', { nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Temporal workflow ID' })
  @Column({ unique: true })
  workflowId: string;

  @ApiProperty({ description: 'Application creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Application last update date' })
  @UpdateDateColumn()
  updatedAt: Date;
} 