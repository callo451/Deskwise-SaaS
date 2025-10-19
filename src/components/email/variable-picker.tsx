'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Braces, Search, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Variable {
  key: string
  label: string
  description: string
  example: string
}

interface VariableCategory {
  category: string
  variables: Variable[]
}

interface VariablePickerProps {
  onInsert: (variable: string) => void
  context?: 'ticket' | 'incident' | 'change' | 'project' | 'user' | 'organization'
}

const VARIABLE_CATEGORIES: VariableCategory[] = [
  {
    category: 'Ticket',
    variables: [
      { key: '{{ticket.id}}', label: 'Ticket ID', description: 'Unique ticket identifier', example: 'TKT-001' },
      { key: '{{ticket.title}}', label: 'Title', description: 'Ticket title/subject', example: 'Printer not working' },
      { key: '{{ticket.description}}', label: 'Description', description: 'Full ticket description', example: 'The office printer...' },
      { key: '{{ticket.status}}', label: 'Status', description: 'Current status', example: 'Open' },
      { key: '{{ticket.priority}}', label: 'Priority', description: 'Priority level', example: 'High' },
      { key: '{{ticket.category}}', label: 'Category', description: 'Ticket category', example: 'Hardware' },
      { key: '{{ticket.assignee}}', label: 'Assignee', description: 'Assigned technician', example: 'John Doe' },
      { key: '{{ticket.requester}}', label: 'Requester', description: 'Person who created ticket', example: 'Jane Smith' },
      { key: '{{ticket.createdAt}}', label: 'Created Date', description: 'When ticket was created', example: '2025-10-18' },
      { key: '{{ticket.updatedAt}}', label: 'Updated Date', description: 'Last update time', example: '2025-10-18 14:30' },
      { key: '{{ticket.url}}', label: 'Ticket URL', description: 'Link to view ticket', example: 'https://...' },
    ],
  },
  {
    category: 'User',
    variables: [
      { key: '{{user.firstName}}', label: 'First Name', description: 'User first name', example: 'John' },
      { key: '{{user.lastName}}', label: 'Last Name', description: 'User last name', example: 'Doe' },
      { key: '{{user.fullName}}', label: 'Full Name', description: 'Complete name', example: 'John Doe' },
      { key: '{{user.email}}', label: 'Email', description: 'User email address', example: 'john@example.com' },
      { key: '{{user.title}}', label: 'Title', description: 'Job title', example: 'IT Technician' },
      { key: '{{user.department}}', label: 'Department', description: 'Department name', example: 'IT Support' },
    ],
  },
  {
    category: 'Organization',
    variables: [
      { key: '{{org.name}}', label: 'Organization Name', description: 'Company name', example: 'Acme Corp' },
      { key: '{{org.domain}}', label: 'Domain', description: 'Company domain', example: 'acme.com' },
      { key: '{{org.supportEmail}}', label: 'Support Email', description: 'Support contact', example: 'support@acme.com' },
      { key: '{{org.portalUrl}}', label: 'Portal URL', description: 'Customer portal link', example: 'https://portal.acme.com' },
    ],
  },
  {
    category: 'System',
    variables: [
      { key: '{{system.date}}', label: 'Current Date', description: 'Today\'s date', example: '2025-10-18' },
      { key: '{{system.time}}', label: 'Current Time', description: 'Current time', example: '14:30' },
      { key: '{{system.year}}', label: 'Current Year', description: 'Year', example: '2025' },
    ],
  },
]

export function VariablePicker({ onInsert, context }: VariablePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const filteredCategories = VARIABLE_CATEGORIES.map((cat) => ({
    ...cat,
    variables: cat.variables.filter(
      (v) =>
        v.label.toLowerCase().includes(search.toLowerCase()) ||
        v.key.toLowerCase().includes(search.toLowerCase()) ||
        v.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.variables.length > 0)

  const handleInsert = (variable: string) => {
    onInsert(variable)
    setCopiedKey(variable)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Braces className="h-4 w-4 mr-2" />
          Insert Variable
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-semibold mb-2">Template Variables</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="h-96">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No variables found matching "{search}"
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredCategories.map((category) => (
                <div key={category.category}>
                  <h5 className="text-sm font-semibold mb-2 text-muted-foreground">
                    {category.category}
                  </h5>
                  <div className="space-y-1">
                    {category.variables.map((variable) => (
                      <button
                        key={variable.key}
                        onClick={() => handleInsert(variable.key)}
                        className={cn(
                          'w-full text-left p-2 rounded-md hover:bg-accent transition-colors',
                          'flex items-start justify-between gap-2 group'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                              {variable.key}
                            </code>
                            {copiedKey === variable.key && (
                              <Check className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm font-medium">{variable.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {variable.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Example: <span className="font-mono">{variable.example}</span>
                          </p>
                        </div>
                        <Copy className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground">
            Click a variable to insert it into your template. Variables are replaced with actual
            values when the email is sent.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
