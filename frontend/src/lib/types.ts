export enum ApplicationStatus {
  PENDING = 'pending',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  ARCHIVED = 'archived',
}

export interface Application {
  id: string
  company: string
  role: string
  jobDescription: string
  resume: string
  coverLetter?: string
  deadline: string
  status: ApplicationStatus
  notes?: string
  workflowId: string
  createdAt: string
  updatedAt: string
}

export interface CreateApplicationDto {
  company: string
  role: string
  jobDescription: string
  resume: string
  deadline?: string
  notes?: string
}

export interface UpdateApplicationDto {
  status?: ApplicationStatus
  notes?: string
  coverLetter?: string
} 