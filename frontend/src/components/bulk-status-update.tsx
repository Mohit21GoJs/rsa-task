'use client';

import { useState } from 'react';
import { Check, Users, ArrowRight } from 'lucide-react';
import { Application, ApplicationStatus } from '@/lib/types';
import { applicationApi, BulkUpdateDto } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BulkStatusUpdateProps {
  applications: Application[];
  onSuccess: () => void;
  onCancel: () => void;
}

const statusOptions = [
  { status: ApplicationStatus.INTERVIEW, label: 'Interview', variant: 'warning' as const },
  { status: ApplicationStatus.OFFER, label: 'Offer', variant: 'success' as const },
  { status: ApplicationStatus.REJECTED, label: 'Rejected', variant: 'destructive' as const },
  { status: ApplicationStatus.WITHDRAWN, label: 'Withdrawn', variant: 'secondary' as const },
  { status: ApplicationStatus.ARCHIVED, label: 'Archived', variant: 'secondary' as const },
];

export function BulkStatusUpdate({ applications, onSuccess, onCancel }: BulkStatusUpdateProps) {
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApplicationSelect = (applicationId: string) => {
    setSelectedApplications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        newSet.add(applicationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const eligibleApplications = applications.filter(
      (app) =>
        app.status === ApplicationStatus.PENDING || app.status === ApplicationStatus.INTERVIEW,
    );
    setSelectedApplications(new Set(eligibleApplications.map((app) => app.id)));
  };

  const handleDeselectAll = () => {
    setSelectedApplications(new Set());
  };

  const handleBulkUpdate = async () => {
    if (!selectedStatus || selectedApplications.size === 0) return;

    setIsUpdating(true);
    try {
      const updates = Array.from(selectedApplications).map((id) => ({
        id,
        status: selectedStatus,
      }));

      const bulkUpdateDto: BulkUpdateDto = { updates };
      await applicationApi.bulkUpdate(bulkUpdateDto);

      onSuccess();
    } catch (error) {
      console.error('Error performing bulk update:', error);
      alert('Error updating applications. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const eligibleApplications = applications.filter(
    (app) => app.status === ApplicationStatus.PENDING || app.status === ApplicationStatus.INTERVIEW,
  );

  const selectedCount = selectedApplications.size;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Status Update
        </CardTitle>
        <p className="text-sm text-gray-600">
          Select applications and choose a new status to update multiple applications at once.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selection Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All Eligible ({eligibleApplications.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            {selectedCount} application{selectedCount !== 1 ? 's' : ''} selected
          </div>
        </div>

        {/* Application List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {eligibleApplications.map((application) => (
            <div
              key={application.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedApplications.has(application.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleApplicationSelect(application.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedApplications.has(application.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedApplications.has(application.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{application.role}</p>
                    <p className="text-sm text-gray-600">{application.company}</p>
                  </div>
                </div>
                <Badge
                  variant={application.status === ApplicationStatus.PENDING ? 'pending' : 'warning'}
                >
                  {application.status}
                </Badge>
              </div>
            </div>
          ))}

          {eligibleApplications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No eligible applications for bulk update.
              <br />
              Only pending and interview applications can be bulk updated.
            </div>
          )}
        </div>

        {/* Status Selection */}
        {selectedCount > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Update to:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.status}
                  variant={selectedStatus === option.status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(option.status)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleBulkUpdate}
            disabled={!selectedStatus || selectedCount === 0 || isUpdating}
            className="flex-1"
          >
            {isUpdating
              ? 'Updating...'
              : `Update ${selectedCount} Application${selectedCount !== 1 ? 's' : ''}`}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {/* Summary */}
        {selectedCount > 0 && selectedStatus && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Preview:</strong> {selectedCount} application{selectedCount !== 1 ? 's' : ''}{' '}
              will be updated to <Badge variant="secondary">{selectedStatus}</Badge>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
