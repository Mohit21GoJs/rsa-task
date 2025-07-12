import {
  Application,
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationStatus,
} from './types';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(`API Error: ${response.statusText}`, response.status);
  }

  return response.json();
}

export interface BulkUpdateItem {
  id: string;
  status: ApplicationStatus;
}

export interface BulkUpdateDto {
  updates: BulkUpdateItem[];
}

export interface NotificationEvent {
  type: string;
  applicationId: string;
  company: string;
  role: string;
  status?: ApplicationStatus;
  message: string;
  timestamp: string;
}

export const applicationApi = {
  // Get all applications
  getAll: async (status?: ApplicationStatus): Promise<Application[]> => {
    const params = status ? `?status=${status}` : '';
    return fetchApi<Application[]>(`/applications${params}`);
  },

  // Get single application
  getById: async (id: string): Promise<Application> => {
    return fetchApi<Application>(`/applications/${id}`);
  },

  // Create new application
  create: async (data: CreateApplicationDto): Promise<Application> => {
    return fetchApi<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update application
  update: async (id: string, data: UpdateApplicationDto): Promise<Application> => {
    return fetchApi<Application>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Generate cover letter
  generateCoverLetter: async (id: string): Promise<Application> => {
    return fetchApi<Application>(`/applications/${id}/generate-cover-letter`, {
      method: 'POST',
    });
  },

  // Bulk update applications
  bulkUpdate: async (data: BulkUpdateDto): Promise<Application[]> => {
    return fetchApi<Application[]>('/applications/bulk-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Delete application
  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/applications/${id}`, {
      method: 'DELETE',
    });
  },

  // Archive expired applications
  archiveExpired: async (): Promise<{ archived: number }> => {
    return fetchApi<{ archived: number }>('/applications/archive-expired', {
      method: 'POST',
    });
  },

  // Get overdue applications
  getOverdue: async (): Promise<Application[]> => {
    return fetchApi<Application[]>('/applications/overdue');
  },

  // Create Socket.IO connection for notifications
  createNotificationStream: (
    onMessage: (event: { data: string }) => void,
    onError?: (error: unknown) => void,
    onOpen?: () => void,
  ) => {
    const socket: Socket = io(`${WS_BASE_URL}/notifications`, {
      transports: ['websocket'],
      upgrade: true,
    });

    // Connection established
    socket.on('connect', () => {
      console.log('📡 Connected to notification stream via Socket.IO');
      onOpen?.();
      
      // Subscribe to notifications
      socket.emit('subscribe-notifications', {});
    });

    // Handle incoming notifications
    socket.on('notification', (notification: NotificationEvent) => {
      // Convert to the format expected by the existing logic
      onMessage({ data: JSON.stringify(notification) });
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      onError?.(error);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    // Handle subscription confirmation
    socket.on('subscription-confirmed', (data) => {
      console.log('Subscription confirmed:', data);
    });

    // Handle notifications history
    socket.on('notifications-history', (data) => {
      console.log('Received notifications history:', data);
    });

    // Return an object with close method for cleanup
    return {
      close: () => {
        socket.disconnect();
      },
    };
  },

  // Get Socket.IO connection statistics
  getSocketStats: async (): Promise<{
    totalConnections: number;
    activeConnections: number;
    connections: Array<{
      id: string;
      connectedAt: string;
      isActive: boolean;
    }>;
  }> => {
    const response = await fetch(`${API_BASE_URL}/notifications/stats`, {
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};
