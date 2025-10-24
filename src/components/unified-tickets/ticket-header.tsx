'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Ticket,
  AlertTriangle,
  Settings,
  HelpCircle,
  GitBranch,
  Printer,
  Share2,
  Copy,
  UserPlus,
  MoreVertical,
  ChevronRight,
  Flame,
  AlertOctagon,
  TrendingUp,
  Info,
} from 'lucide-react'
import { InlineEdit } from '@/components/tickets/inline-edit'
import { UnifiedTicket, TicketType, UnifiedTicketStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ModernStatusBadge } from '@/components/tickets/modern-status-badge'
import { ModernPriorityBadge } from '@/components/tickets/modern-priority-badge'

interface TicketHeaderProps {
  ticket: UnifiedTicket
  onTitleSave: (title: string) => Promise<void>
  onStatusChange: (status: UnifiedTicketStatus) => Promise<void>
  onPriorityChange: (priority: string) => Promise<void>
  onAssignToMe: () => Promise<void>
  onClone?: () => void
  onPrint?: () => void
  onShare?: () => void
  currentUserId?: string
}

const TYPE_CONFIGS: Record<TicketType, {
  icon: any
  color: string
  gradient: string
  label: string
}> = {
  ticket: {
    icon: Ticket,
    color: 'bg-blue-500',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    label: 'Ticket',
  },
  incident: {
    icon: AlertTriangle,
    color: 'bg-red-500',
    gradient: 'bg-gradient-to-br from-red-500 to-red-600',
    label: 'Incident',
  },
  change: {
    icon: Settings,
    color: 'bg-green-500',
    gradient: 'bg-gradient-to-br from-green-500 to-green-600',
    label: 'Change Request',
  },
  service_request: {
    icon: HelpCircle,
    color: 'bg-orange-500',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
    label: 'Service Request',
  },
  problem: {
    icon: GitBranch,
    color: 'bg-purple-500',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
    label: 'Problem',
  },
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  investigating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  implementing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
}

const STATUS_OPTIONS_BY_TYPE: Record<TicketType, UnifiedTicketStatus[]> = {
  ticket: ['new', 'open', 'pending', 'resolved', 'closed'],
  incident: ['new', 'investigating', 'pending', 'resolved', 'closed'],
  change: ['draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'implementing', 'completed', 'cancelled'],
  service_request: ['new', 'pending_approval', 'approved', 'rejected', 'open', 'completed', 'cancelled'],
  problem: ['new', 'investigating', 'pending', 'resolved', 'closed'],
}

export function TicketHeader({
  ticket,
  onTitleSave,
  onStatusChange,
  onPriorityChange,
  onAssignToMe,
  onClone,
  onPrint,
  onShare,
  currentUserId,
}: TicketHeaderProps) {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false)

  const typeConfig = TYPE_CONFIGS[ticket.ticketType]
  const TypeIcon = typeConfig.icon
  const availableStatuses = STATUS_OPTIONS_BY_TYPE[ticket.ticketType]
  const isAssignedToMe = ticket.assignedTo === currentUserId

  const handleStatusSelect = async (status: string) => {
    setStatusDropdownOpen(false)
    await onStatusChange(status as UnifiedTicketStatus)
  }

  const handlePrioritySelect = async (priority: string) => {
    setPriorityDropdownOpen(false)
    await onPriorityChange(priority)
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/unified-tickets" className="hover:text-foreground transition-colors font-medium">
          Unified Tickets
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/unified-tickets?type=${ticket.ticketType}`}
          className="hover:text-foreground transition-colors capitalize font-medium"
        >
          {typeConfig.label}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-semibold">{ticket.ticketNumber}</span>
      </div>

      {/* Main Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Back Button */}
          <Link href="/unified-tickets">
            <Button variant="ghost" size="icon" className="shrink-0 mt-1 hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          {/* Ticket Info */}
          <div className="flex-1 min-w-0">
            {/* Ticket Number and Type Badge */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg shadow-md', typeConfig.gradient)}>
                  <TypeIcon className="h-6 w-6 text-white drop-shadow-sm" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {ticket.ticketNumber}
                </h1>
              </div>

              {/* Status Badge with Dropdown - Use Modern Component */}
              <DropdownMenu open={statusDropdownOpen} onOpenChange={setStatusDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none focus:ring-2 focus:ring-ring rounded-lg">
                    <div className="cursor-pointer hover:scale-105 transition-transform">
                      <ModernStatusBadge status={ticket.status} size="lg" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {availableStatuses.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleStatusSelect(status)}
                      className={cn(
                        'cursor-pointer',
                        ticket.status === status && 'bg-muted'
                      )}
                    >
                      <ModernStatusBadge status={status} size="md" />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority Badge with Dropdown - Use Modern Component */}
              <DropdownMenu open={priorityDropdownOpen} onOpenChange={setPriorityDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none focus:ring-2 focus:ring-ring rounded-lg">
                    <div className="cursor-pointer hover:scale-105 transition-transform">
                      <ModernPriorityBadge priority={String(ticket.priority).toLowerCase()} size="lg" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {['critical', 'high', 'medium', 'low'].map((priority) => (
                    <DropdownMenuItem
                      key={priority}
                      onClick={() => handlePrioritySelect(priority)}
                      className={cn(
                        'cursor-pointer',
                        String(ticket.priority).toLowerCase() === priority && 'bg-muted'
                      )}
                    >
                      <ModernPriorityBadge priority={priority} size="md" />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Title (Inline Editable) */}
            <div data-inline-edit="title" className="mt-2">
              <InlineEdit
                value={ticket.title}
                onSave={onTitleSave}
                placeholder="Ticket title"
                displayClassName="text-xl font-semibold text-foreground leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isAssignedToMe && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAssignToMe}
              className="border-2 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to Me
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={onPrint} className="hover:bg-accent">
            <Printer className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={onShare} className="hover:bg-accent">
            <Share2 className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onClone}>
                <Copy className="h-4 w-4 mr-2" />
                Clone Ticket
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Delete Ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
