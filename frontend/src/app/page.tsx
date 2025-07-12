'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Bell } from 'lucide-react';
import { Application, ApplicationStatus } from '@/lib/types';
import { applicationApi, NotificationEvent } from '@/lib/api';
import { ApplicationCard } from '@/components/application-card';
import { ApplicationForm } from '@/components/application-form';
import { BulkStatusUpdate } from '@/components/bulk-status-update';
import { RemindersDashboard } from '@/components/reminders-dashboard';
import { NotificationSystem } from '@/components/notification-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'dashboard' | 'form' | 'bulk-update' | 'reminders';

export default function HomePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [lastNotification, setLastNotification] = useState<NotificationEvent | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await applicationApi.getAll();
      setApplications(data);
      setFilteredApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter((app) => app.status === statusFilter));
    }
  }, [applications, statusFilter]);

  const handleFormSuccess = () => {
    setViewMode('dashboard');
    setEditingApplication(null);
    fetchApplications();
  };

  const handleFormCancel = () => {
    setViewMode('dashboard');
    setEditingApplication(null);
  };

  const handleEdit = (application: Application) => {
    setEditingApplication(application);
    setViewMode('form');
  };

  const handleApplicationUpdate = (id: string, status: ApplicationStatus) => {
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status } : app)));
  };

  const handleNotificationReceived = (notification: NotificationEvent) => {
    setLastNotification(notification);

    // Auto-refresh applications when status updates or deletions are received
    if (notification.type === 'status_update' || notification.type === 'application_deleted') {
      setTimeout(fetchApplications, 500);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: applications.length,
      [ApplicationStatus.PENDING]: 0,
      [ApplicationStatus.INTERVIEW]: 0,
      [ApplicationStatus.OFFER]: 0,
      [ApplicationStatus.REJECTED]: 0,
      [ApplicationStatus.WITHDRAWN]: 0,
      [ApplicationStatus.ARCHIVED]: 0,
    };

    applications.forEach((app) => {
      counts[app.status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  // Dashboard view
  if (viewMode === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Header with Notification System */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Your Applications ({applications.length})
            </h2>
            <p className="text-gray-600">Track and manage your job applications</p>
          </div>

          <div className="flex gap-2 items-center">
            <NotificationSystem onNotificationReceived={handleNotificationReceived} />
            <Button variant="outline" onClick={fetchApplications} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setViewMode('form')}>
              <Plus className="h-4 w-4" />
              Add Application
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => setViewMode('form')}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <Plus className="h-6 w-6" />
            <span>Add New Application</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setViewMode('bulk-update')}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <RefreshCw className="h-6 w-6" />
            <span>Bulk Update Status</span>
          </Button>

          <Button
            variant="outline"
            onClick={fetchApplications}
            disabled={loading}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <RefreshCw className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="flex items-center gap-2"
          >
            All
            <Badge variant="secondary">{statusCounts.all}</Badge>
          </Button>

          {Object.values(ApplicationStatus).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="flex items-center gap-2"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <Badge variant="secondary">{statusCounts[status]}</Badge>
            </Button>
          ))}
        </div>

        {/* Applications Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {statusFilter === 'all'
                ? "No applications yet. Click 'Add Application' to get started!"
                : `No applications with status: ${statusFilter}`}
            </div>
            {statusFilter === 'all' && (
              <Button onClick={() => setViewMode('form')}>
                <Plus className="h-4 w-4" />
                Add Your First Application
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onUpdate={fetchApplications}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

        {/* Last Notification Toast */}
        {lastNotification && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <Bell className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{lastNotification.message}</p>
                  <p className="text-xs text-gray-500">
                    {lastNotification.company} - {lastNotification.role}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setLastNotification(null)}>
                  ×
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Form view
  if (viewMode === 'form') {
    return (
      <div className="space-y-6">
        <ApplicationForm
          application={editingApplication || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  // Bulk update view
  if (viewMode === 'bulk-update') {
    return (
      <div className="space-y-6">
        <BulkStatusUpdate
          applications={applications}
          onSuccess={() => {
            setViewMode('dashboard');
            fetchApplications();
          }}
          onCancel={() => setViewMode('dashboard')}
        />
      </div>
    );
  }

  // Reminders view
  if (viewMode === 'reminders') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewMode('dashboard')}>
            ← Back to Dashboard
          </Button>
          <h2 className="text-xl font-semibold">Reminders & Deadlines</h2>
        </div>

        <RemindersDashboard
          applications={applications}
          onUpdateApplication={handleApplicationUpdate}
          onRefresh={fetchApplications}
        />
      </div>
    );
  }

  return null;
}
