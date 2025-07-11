'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Application } from '@/lib/types'
import { applicationApi } from '@/lib/api'
import { X, FileText, RefreshCw, Copy, CheckCheck } from 'lucide-react'

interface CoverLetterModalProps {
  application: Application
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function CoverLetterModal({ application, isOpen, onClose, onUpdate }: CoverLetterModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentApplication, setCurrentApplication] = useState(application)
  const [isCopied, setIsCopied] = useState(false)

  if (!isOpen) return null

  const handleGenerateCoverLetter = async () => {
    setIsGenerating(true)
    try {
      const updatedApplication = await applicationApi.generateCoverLetter(application.id)
      setCurrentApplication(updatedApplication)
      onUpdate() // Refresh the parent component
    } catch (error) {
      console.error('Error generating cover letter:', error)
      alert('Error generating cover letter. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyToClipboard = async () => {
    if (currentApplication.coverLetter) {
      try {
        await navigator.clipboard.writeText(currentApplication.coverLetter)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        alert('Failed to copy to clipboard')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">Cover Letter</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{currentApplication.company}</Badge>
              <Badge variant="outline">{currentApplication.role}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentApplication.coverLetter && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                disabled={isCopied}
              >
                {isCopied ? (
                  <>
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateCoverLetter}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {currentApplication.coverLetter ? 'Regenerate' : 'Generate'}
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {currentApplication.coverLetter ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                  {currentApplication.coverLetter}
                </pre>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Cover letter generated using AI. Please review and customize as needed.
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Cover Letter Generated
              </h3>
              <p className="text-gray-600 mb-6">
                Generate a personalized cover letter using AI based on your resume and job description.
              </p>
              <Button onClick={handleGenerateCoverLetter} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 