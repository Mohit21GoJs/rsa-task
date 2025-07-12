'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Application, ApplicationStatus } from '@/lib/types';
import { applicationApi } from '@/lib/api';
import { formatDate, isOverdue, daysUntilDeadline } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RemindersDashboardProps {
  applications: Application[];
  onUpdateApplication: (id: string, status: ApplicationStatus) => void;
  onRefresh: () => void;
}

export function RemindersDashboard({
  applications,
  onUpdateApplication,
  onRefresh,
}: RemindersDashboardProps) {
  const [overdueApplications, setOverdueApplications] = useState<Application[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Filter overdue applications (pending status only)
    const overdue = applications.filter(
      (app) => app.status === ApplicationStatus.PENDING && isOverdue(app.deadline),
    );

    // Filter upcoming deadlines (within 3 days)
    const upcoming = applications.filter(
      (app) =>
        app.status === ApplicationStatus.PENDING &&
        !isOverdue(app.deadline) &&
        new Date(app.deadline) <= threeDaysFromNow,
    );

    setOverdueApplications(overdue);
    setUpcomingDeadlines(upcoming);
  }, [applications]);

  const handleArchiveExpired = async () => {
    setLoading(true);
    try {
      const result = await applicationApi.archiveExpired();
      console.log(`Archived ${result.archived} expired applications`);
      onRefresh();
    } catch (error) {
      console.error('Error archiving expired applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (applicationId: string, status: ApplicationStatus) => {
    try {
      await applicationApi.update(applicationId, { status });
      onUpdateApplication(applicationId, status);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  if (overdueApplications.length === 0 && upcomingDeadlines.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Clock className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">All caught up! 🎉</h3>
            <p className="text-gray-600">No overdue applications or urgent deadlines.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overdue Applications */}
      {overdueApplications.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Overdue Applications ({overdueApplications.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleArchiveExpired} disabled={loading}>
                {loading ? 'Archiving...' : 'Archive Expired'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueApplications.map((application) => {
              const daysPast = Math.abs(daysUntilDeadline(application.deadline));
              return (
                <div
                  key={application.id}
                  className="p-4 border border-red-200 bg-red-50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-red-900">{application.role}</h4>
                      <p className="text-sm text-red-700">{application.company}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Overdue by {daysPast} day{daysPast !== 1 ? 's' : ''}
                        (was due {formatDate(application.deadline)})
                      </p>
                    </div>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleQuickStatusUpdate(application.id, ApplicationStatus.INTERVIEW)
                      }
                    >
                      Mark as Interview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleQuickStatusUpdate(application.id, ApplicationStatus.REJECTED)
                      }
                    >
                      Mark as Rejected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleQuickStatusUpdate(application.id, ApplicationStatus.WITHDRAWN)
                      }
                    >
                      Withdraw
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="h-5 w-5" />
              Upcoming Deadlines ({upcomingDeadlines.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.map((application) => {
              const daysLeft = daysUntilDeadline(application.deadline);
              return (
                <div
                  key={application.id}
                  className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-yellow-900">{application.role}</h4>
                      <p className="text-sm text-yellow-700">{application.company}</p>
                      <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {daysLeft === 0
                          ? 'Due today!'
                          : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}{' '}
                        ({formatDate(application.deadline)})
                      </p>
                    </div>
                    <Badge variant={daysLeft === 0 ? 'destructive' : 'warning'}>
                      {daysLeft === 0 ? 'Due Today' : `${daysLeft}d left`}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleQuickStatusUpdate(application.id, ApplicationStatus.INTERVIEW)
                      }
                    >
                      Got Interview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleQuickStatusUpdate(application.id, ApplicationStatus.REJECTED)
                      }
                    >
                      Rejected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleQuickStatusUpdate(application.id, ApplicationStatus.WITHDRAWN)
                      }
                    >
                      Withdraw
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Summary Actions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">Quick Actions</h4>
              <p className="text-sm text-blue-700">Manage multiple applications at once</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onRefresh}>
                Refresh Data
              </Button>
              <Button size="sm" variant="outline" onClick={handleArchiveExpired} disabled={loading}>
                Archive All Expired
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
