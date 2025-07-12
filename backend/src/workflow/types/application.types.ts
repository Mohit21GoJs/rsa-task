export enum ApplicationStatus {
  PENDING = 'pending',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  ARCHIVED = 'archived',
}

export interface JobApplicationWorkflowInput {
  applicationId: string;
  company: string;
  role: string;
  jobDescription: string;
  resume: string;
  deadline: Date;
  gracePeriodDays: number;
}
