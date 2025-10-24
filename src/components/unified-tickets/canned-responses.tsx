'use client'

import { useState } from 'react'
import { FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export interface CannedResponse {
  id: string
  title: string
  content: string
  category?: string
  usageCount?: number
}

interface CannedResponsesProps {
  onSelect: (content: string) => void
  disabled?: boolean
  className?: string
  variables?: Record<string, any>
}

// Default canned responses
const DEFAULT_RESPONSES: CannedResponse[] = [
  {
    id: 'investigating',
    title: 'Investigating Issue',
    content: "We're currently investigating this issue and will provide an update as soon as we have more information. Thank you for your patience.",
    category: 'Status Updates',
    usageCount: 0,
  },
  {
    id: 'resolved',
    title: 'Issue Resolved',
    content: "This issue has been resolved. Please verify that everything is working as expected and let us know if you continue to experience any problems.",
    category: 'Status Updates',
    usageCount: 0,
  },
  {
    id: 'more-info',
    title: 'Need More Information',
    content: "We need more information to help resolve this issue. Could you please provide:\n\n- Additional details about the problem\n- Steps to reproduce\n- Any error messages you're seeing\n- Screenshots if applicable\n\nThank you!",
    category: 'Information Request',
    usageCount: 0,
  },
  {
    id: 'scheduled',
    title: 'Scheduled for Maintenance',
    content: "This has been scheduled for our next maintenance window. We'll notify you before we begin and once the work is complete.",
    category: 'Scheduling',
    usageCount: 0,
  },
  {
    id: 'workaround',
    title: 'Temporary Workaround',
    content: "While we work on a permanent solution, please try the following workaround:\n\n[Describe workaround steps here]\n\nWe'll update you once a permanent fix is implemented.",
    category: 'Solutions',
    usageCount: 0,
  },
  {
    id: 'escalated',
    title: 'Escalated to Senior Team',
    content: "This issue has been escalated to our senior technical team for further investigation. We'll keep you updated on the progress.",
    category: 'Status Updates',
    usageCount: 0,
  },
  {
    id: 'password-reset',
    title: 'Password Reset',
    content: "I've initiated a password reset for your account. You should receive an email with instructions shortly. The link will be valid for 24 hours.\n\nIf you don't receive the email within a few minutes, please check your spam folder.",
    category: 'Common Tasks',
    usageCount: 0,
  },
  {
    id: 'access-granted',
    title: 'Access Granted',
    content: "Access has been granted as requested. You should now be able to access the requested resources. Please try logging in and let us know if you encounter any issues.",
    category: 'Common Tasks',
    usageCount: 0,
  },
  {
    id: 'testing',
    title: 'Testing in Progress',
    content: "We're currently testing the proposed solution in our staging environment. Once testing is complete and successful, we'll schedule the deployment to production.",
    category: 'Status Updates',
    usageCount: 0,
  },
  {
    id: 'third-party',
    title: 'Third-Party Vendor Issue',
    content: "This appears to be related to a third-party service. We've opened a ticket with the vendor and are monitoring the situation. We'll update you as soon as we have more information from them.",
    category: 'Status Updates',
    usageCount: 0,
  },
]

export function CannedResponses({
  onSelect,
  disabled,
  className,
  variables = {},
}: CannedResponsesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [responses] = useState<CannedResponse[]>(DEFAULT_RESPONSES)

  const replaceVariables = (content: string): string => {
    let result = content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      result = result.replace(new RegExp(placeholder, 'g'), String(value))
    })
    return result
  }

  const filteredResponses = responses.filter(
    (response) =>
      response.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedResponses = filteredResponses.reduce((acc, response) => {
    const category = response.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(response)
    return acc
  }, {} as Record<string, CannedResponse[]>)

  const handleSelect = (response: CannedResponse) => {
    const processedContent = replaceVariables(response.content)
    onSelect(processedContent)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className={className}>
          <FileText className="w-4 h-4 mr-2" />
          Canned Responses
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Quick Responses</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Responses grouped by category */}
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedResponses).length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No responses found
            </div>
          ) : (
            Object.entries(groupedResponses).map(([category, categoryResponses]) => (
              <DropdownMenuGroup key={category}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {category}
                </DropdownMenuLabel>
                {categoryResponses.map((response) => (
                  <DropdownMenuItem
                    key={response.id}
                    onClick={() => handleSelect(response)}
                    className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="font-medium text-sm">{response.title}</span>
                      {response.usageCount && response.usageCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {response.usageCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 w-full">
                      {replaceVariables(response.content)}
                    </p>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
