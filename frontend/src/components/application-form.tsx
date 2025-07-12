'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Application, CreateApplicationDto } from '@/lib/types';
import { applicationApi } from '@/lib/api';
import { addWeeks, format } from 'date-fns';

interface ApplicationFormProps {
  application?: Application;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ApplicationForm({ application, onSuccess, onCancel }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company: application?.company || '',
    role: application?.role || '',
    jobDescription: application?.jobDescription || '',
    resume: application?.resume || '',
    deadline: application?.deadline
      ? format(new Date(application.deadline), 'yyyy-MM-dd')
      : format(addWeeks(new Date(), 4), 'yyyy-MM-dd'),
    notes: application?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData: CreateApplicationDto = {
        ...formData,
        deadline: new Date(formData.deadline).toISOString(),
      };

      if (application) {
        // Update existing application
        await applicationApi.update(application.id, {
          notes: formData.notes,
        });
      } else {
        // Create new application
        await applicationApi.create(submitData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{application ? 'Edit Application' : 'Add New Job Application'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Company *
              </label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="e.g. Google"
                required
                disabled={!!application}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role *
              </label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                placeholder="e.g. Software Engineer"
                required
                disabled={!!application}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="jobDescription" className="text-sm font-medium">
              Job Description *
            </label>
            <Textarea
              id="jobDescription"
              value={formData.jobDescription}
              onChange={(e) => handleChange('jobDescription', e.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-[120px]"
              required
              disabled={!!application}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="resume" className="text-sm font-medium">
              Resume Content *
            </label>
            <Textarea
              id="resume"
              value={formData.resume}
              onChange={(e) => handleChange('resume', e.target.value)}
              placeholder="Paste your resume content here..."
              className="min-h-[120px]"
              required
              disabled={!!application}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="deadline" className="text-sm font-medium">
              Application Deadline
            </label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleChange('deadline', e.target.value)}
              disabled={!!application}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : application ? 'Update Notes' : 'Create Application'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
