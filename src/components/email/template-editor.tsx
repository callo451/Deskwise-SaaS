'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Code, Eye, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function TemplateEditor({
  value,
  onChange,
  placeholder = 'Enter your email template HTML...',
  className,
  minHeight = '300px',
}: TemplateEditorProps) {
  const [mode, setMode] = useState<'code' | 'preview'>('code')

  const insertBasicTemplate = () => {
    const template = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2563eb;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{org.name}}</h1>
  </div>
  <div class="content">
    <h2>Hello {{user.firstName}},</h2>
    <p>Your message content goes here.</p>
    <a href="{{ticket.url}}" class="button">View Ticket</a>
  </div>
  <div class="footer">
    <p>&copy; {{system.year}} {{org.name}}. All rights reserved.</p>
    <p>{{org.supportEmail}}</p>
  </div>
</body>
</html>`
    onChange(template)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label>Email Template (HTML)</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={insertBasicTemplate}
            type="button"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Insert Basic Template
          </Button>
          <div className="flex items-center rounded-md border">
            <Button
              variant={mode === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('code')}
              type="button"
              className="rounded-r-none"
            >
              <Code className="h-4 w-4 mr-2" />
              Code
            </Button>
            <Button
              variant={mode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('preview')}
              type="button"
              className="rounded-l-none"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </div>

      {mode === 'code' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono text-sm"
          style={{ minHeight }}
          rows={15}
        />
      ) : (
        <div
          className="border rounded-md p-4 bg-white overflow-auto"
          style={{ minHeight }}
        >
          {value ? (
            <div dangerouslySetInnerHTML={{ __html: value }} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Preview will appear here</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Use HTML to design your email template. Include template variables like{' '}
        <code className="bg-muted px-1 py-0.5 rounded">{'{{ticket.title}}'}</code> which will be
        replaced with actual values.
      </p>
    </div>
  )
}
