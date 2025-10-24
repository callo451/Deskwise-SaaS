'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  MoreHorizontal,
  User,
  Clock,
  TrendingUp,
  Copy,
  Printer,
  Share2,
  Trash2,
  Edit3,
  Link as LinkIcon,
  Send,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ModernStatusBadge } from './modern-status-badge'
import { ModernPriorityBadge } from './modern-priority-badge'

interface StickyTicketHeaderProps {
  ticketNumber: string
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo?: string
  assignedToName?: string
  onStatusChange?: (status: string) => void
  onAssignToMe?: () => void
  onEscalate?: () => void
  isScrolled?: boolean
  currentUserId?: string
}

export function StickyTicketHeader({
  ticketNumber,
  status,
  priority,
  assignedTo,
  assignedToName,
  onStatusChange,
  onAssignToMe,
  onEscalate,
  isScrolled = false,
  currentUserId
}: StickyTicketHeaderProps) {
  const [isHovered, setIsHovered] = useState(false)

  const isAssignedToMe = assignedTo === currentUserId

  const handleCopyTicketNumber = () => {
    navigator.clipboard.writeText(ticketNumber)
    // TODO: Add toast notification
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    // TODO: Add toast notification
  }

  const quickActions = [
    {
      key: 'assign',
      label: isAssignedToMe ? 'Assigned to me' : 'Assign to me',
      icon: User,
      onClick: onAssignToMe,
      disabled: isAssignedToMe,
      variant: isAssignedToMe ? 'secondary' : 'outline' as const,
      show: true
    },
    {
      key: 'resolve',
      label: 'Mark Resolved',
      icon: CheckCircle2,
      onClick: () => onStatusChange?.('resolved'),
      disabled: status === 'resolved' || status === 'closed',
      variant: 'outline' as const,
      show: status !== 'resolved' && status !== 'closed'
    },
    {
      key: 'escalate',
      label: 'Escalate',
      icon: TrendingUp,
      onClick: onEscalate,
      disabled: priority === 'critical',
      variant: 'outline' as const,
      show: true
    },
  ]

  return (
    <div
      className={cn(
        'sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200',
        isScrolled && 'shadow-md',
        isHovered && 'shadow-lg'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href="/tickets">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <div className="h-6 w-px bg-border" />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Link href="/tickets" className="hover:text-foreground transition-colors">
                Tickets
              </Link>
              <span>/</span>
              <span className="font-medium text-foreground truncate">{ticketNumber}</span>
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Status & Priority Badges */}
            <div className="hidden sm:flex items-center gap-2">
              <ModernStatusBadge status={status} size="sm" />
              <ModernPriorityBadge priority={priority} size="sm" />
            </div>
          </div>

          {/* Right Section - Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Action Buttons (hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-2">
              {quickActions.filter(a => a.show).map((action) => (
                <Button
                  key={action.key}
                  variant={action.variant}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="h-9"
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Assignment Display (Desktop) */}
            {assignedToName && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50 border">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{assignedToName}</span>
              </div>
            )}

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Mobile Quick Actions */}
                <div className="lg:hidden">
                  {quickActions.filter(a => a.show).map((action) => (
                    <DropdownMenuItem
                      key={action.key}
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      <action.icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem onClick={handleCopyTicketNumber}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Ticket #
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Link to Issue
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Ticket
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Status/Priority Row */}
        <div className="sm:hidden flex items-center gap-2 pb-3">
          <ModernStatusBadge status={status} size="sm" />
          <ModernPriorityBadge priority={priority} size="sm" />
          {assignedToName && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span className="truncate">{assignedToName}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
