'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Monitor, Smartphone, Code, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmailPreviewProps {
  subject: string
  htmlBody: string
  sampleData?: Record<string, any>
  className?: string
}

export function EmailPreview({ subject, htmlBody, sampleData, className }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [previewMode, setPreviewMode] = useState<'rendered' | 'code'>('rendered')

  // Replace template variables with sample data
  const renderTemplate = (template: string) => {
    if (!sampleData) return template

    let rendered = template
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(regex, String(value))
    })
    return rendered
  }

  const renderedSubject = renderTemplate(subject)
  const renderedBody = renderTemplate(htmlBody)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Email Preview</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border">
              <Button
                variant={previewMode === 'rendered' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('rendered')}
                className="rounded-r-none"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant={previewMode === 'code' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('code')}
                className="rounded-l-none"
              >
                <Code className="h-4 w-4 mr-2" />
                HTML
              </Button>
            </div>
            <div className="flex items-center rounded-md border">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('desktop')}
                className="rounded-r-none"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mobile')}
                className="rounded-l-none"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {previewMode === 'rendered' ? (
          <div
            className={cn(
              'mx-auto border rounded-lg bg-white overflow-hidden transition-all',
              viewMode === 'desktop' ? 'max-w-full' : 'max-w-[375px]'
            )}
          >
            {/* Email Header */}
            <div className="border-b bg-gray-50 p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Subject</div>
                    <div className="font-semibold">{renderedSubject || '(No subject)'}</div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {viewMode === 'desktop' ? 'Desktop' : 'Mobile'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>From: {sampleData?.['org.supportEmail'] || 'support@example.com'}</div>
                  <div>To: {sampleData?.['user.email'] || 'user@example.com'}</div>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-6">
              {renderedBody ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedBody }}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Email body will appear here</p>
                  <p className="text-sm mt-2">Start typing to see a preview</p>
                </div>
              )}
            </div>

            {/* Email Footer */}
            <div className="border-t bg-gray-50 p-4 text-xs text-muted-foreground">
              <p>This is a preview with sample data. Actual emails will contain real values.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-gray-950">
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm text-gray-100">{renderedBody || '<!-- HTML code will appear here -->'}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
