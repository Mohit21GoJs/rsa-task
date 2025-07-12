'use client';

import { useState } from 'react';
import { Pencil, Trash2, Calendar, Building2, FileText } from 'lucide-react';
import { Application, ApplicationStatus } from '@/lib/types';
import { formatDate, isOverdue, daysUntilDeadline } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { applicationApi } from '@/lib/api';
import { CoverLetterModal } from './cover-letter-modal';

interface ApplicationCardProps {
  application: Application;
  onUpdate: () => void;
  onEdit: (application: Application) => void;
}

export function ApplicationCard({ application, onUpdate, onEdit }: ApplicationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false);

  const overdue = isOverdue(application.deadline);
  const daysLeft = daysUntilDeadline(application.deadline);

  const statusActions = [
    { status: ApplicationStatus.INTERVIEW, label: 'Interview' },
    { status: ApplicationStatus.OFFER, label: 'Offer' },
    { status: ApplicationStatus.REJECTED, label: 'Rejected' },
    { status: ApplicationStatus.WITHDRAWN, label: 'Withdrawn' },
  ];

  const statusVariants = {
    [ApplicationStatus.PENDING]: 'secondary' as const,
    [ApplicationStatus.INTERVIEW]: 'default' as const,
    [ApplicationStatus.OFFER]: 'default' as const,
    [ApplicationStatus.REJECTED]: 'destructive' as const,
    [ApplicationStatus.WITHDRAWN]: 'outline' as const,
    [ApplicationStatus.ARCHIVED]: 'outline' as const,
  };

  const handleStatusUpdate = async (newStatus: ApplicationStatus) => {
    setIsUpdating(true);
    try {
      await applicationApi.update(application.id, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this application?')) {
      setIsDeleting(true);
      try {
        await applicationApi.delete(application.id);
        onUpdate();
      } catch (error) {
        console.error('Error deleting application:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">{application.role}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                {application.company}
              </div>
            </div>
            <Badge variant={statusVariants[application.status]}>{application.status}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span className={overdue ? 'text-red-600 font-medium' : ''}>
              Deadline: {formatDate(application.deadline)}
              {overdue && ' (Overdue)'}
              {!overdue && daysLeft <= 7 && ` (${daysLeft} days left)`}
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">{application.jobDescription}</p>

          {application.notes && (
            <div className="p-2 bg-gray-50 rounded text-sm">
              <strong>Notes:</strong> {application.notes}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCoverLetterModalOpen(true)}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {application.coverLetter ? (
                <span className="text-green-600">View Cover Letter</span>
              ) : (
                <span>Generate Cover Letter</span>
              )}
            </Button>
            {application.coverLetter && <div className="text-xs text-green-600">✓ Generated</div>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2">
          {application.status === ApplicationStatus.PENDING && (
            <>
              {statusActions.map((action) => (
                <Button
                  key={action.status}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(action.status)}
                  disabled={isUpdating}
                >
                  {action.label}
                </Button>
              ))}
            </>
          )}

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => onEdit(application)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      <CoverLetterModal
        application={application}
        isOpen={isCoverLetterModalOpen}
        onClose={() => setIsCoverLetterModalOpen(false)}
        onUpdate={onUpdate}
      />
    </>
  );
}
