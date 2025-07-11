import { Application, CreateApplicationDto, UpdateApplicationDto, ApplicationStatus } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new ApiError(`API Error: ${response.statusText}`, response.status)
  }

  return response.json()
}

export interface BulkUpdateItem {
  id: string
  status: ApplicationStatus
}

export interface BulkUpdateDto {
  updates: BulkUpdateItem[]
}

export interface NotificationEvent {
  type: string
  applicationId: string
  company: string
  role: string
  status?: ApplicationStatus
  message: string
  timestamp: string
}

export const applicationApi = {
  // Get all applications
  getAll: async (status?: ApplicationStatus): Promise<Application[]> => {
    const params = status ? `?status=${status}` : ''
    return fetchApi<Application[]>(`/applications${params}`)
  },

  // Get single application
  getById: async (id: string): Promise<Application> => {
    return fetchApi<Application>(`/applications/${id}`)
  },

  // Create new application
  create: async (data: CreateApplicationDto): Promise<Application> => {
    return fetchApi<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update application
  update: async (id: string, data: UpdateApplicationDto): Promise<Application> => {
    return fetchApi<Application>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Bulk update applications
  bulkUpdate: async (data: BulkUpdateDto): Promise<Application[]> => {
    return fetchApi<Application[]>('/applications/bulk-update', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Delete application
  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/applications/${id}`, {
      method: 'DELETE',
    })
  },

  // Archive expired applications
  archiveExpired: async (): Promise<{ archived: number }> => {
    return fetchApi<{ archived: number }>('/applications/archive-expired', {
      method: 'POST',
    })
  },

  // Get overdue applications
  getOverdue: async (): Promise<Application[]> => {
    return fetchApi<Application[]>('/applications/overdue')
  },

  // Create SSE connection for notifications
  createNotificationStream: (): EventSource => {
    return new EventSource(`${API_BASE_URL}/applications/notifications`)
  },
} 