'use client'

import { formatDistanceToNow, format } from 'date-fns'
import {
  CheckCircle2,
  XCircle,
  UserPlus,
  MessageSquare,
  Paperclip,
  Timer,
  AlertCircle,
  Edit3,
  Clock,
  Plus,
  ArrowUpDown,
  Folder,
  FileText,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface ActivityEvent {
  id: string
  type:
    | 'creation'
    | 'status_change'
    | 'assignment'
    | 'comment'
    | 'attachment'
    | 'time_entry'
    | 'approval'
    | 'rejection'
    | 'priority_change'
    | 'category_change'
    | 'edit'
    | 'sla_breach'
  timestamp: Date
  userId: string
  userName: string
  userAvatar?: string
  metadata?: {
    // Status change
    oldStatus?: string
    newStatus?: string

    // Assignment
    assignedToId?: string
    assignedToName?: string
    previousAssigneeId?: string
    previousAssigneeName?: string

    // Comment
    commentPreview?: string
    isInternal?: boolean

    // Attachment
    fileName?: string
    fileSize?: number
    fileCount?: number

    // Time entry
    timeHours?: number
    timeMinutes?: number
    timeDescription?: string

    // Approval/Rejection
    approvalReason?: string
    rejectionReason?: string
    approverName?: string

    // Priority/Category change
    oldValue?: string
    newValue?: string

    // Edit
    fieldsEdited?: string[]

    // SLA
    slaType?: 'response' | 'resolution'
    breachDuration?: number
  }
}

interface TimelineEventItemProps {
  event: ActivityEvent
  isFirst?: boolean
  isLast?: boolean
}

const EVENT_CONFIG = {
  creation: {
    icon: Plus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    label: 'Created',
  },
  status_change: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-700',
    label: 'Status Changed',
  },
  assignment: {
    icon: UserPlus,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-300 dark:border-purple-700',
    label: 'Assigned',
  },
  comment: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    label: 'Commented',
  },
  attachment: {
    icon: Paperclip,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-300 dark:border-gray-700',
    label: 'Attached Files',
  },
  time_entry: {
    icon: Timer,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
    label: 'Time Logged',
  },
  approval: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-700',
    label: 'Approved',
  },
  rejection: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-700',
    label: 'Rejected',
  },
  priority_change: {
    icon: ArrowUpDown,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
    label: 'Priority Changed',
  },
  category_change: {
    icon: Folder,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    borderColor: 'border-teal-300 dark:border-teal-700',
    label: 'Category Changed',
  },
  edit: {
    icon: Edit3,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-300 dark:border-gray-700',
    label: 'Edited',
  },
  sla_breach: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-700',
    label: 'SLA Breached',
  },
}

function getUserInitials(name: string): string {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function TimelineEventItem({ event, isFirst, isLast }: TimelineEventItemProps) {
  const config = EVENT_CONFIG[event.type]
  const Icon = config.icon

  const renderEventDescription = () => {
    const { metadata } = event

    switch (event.type) {
      case 'creation':
        return (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{event.userName}</span> created this ticket
          </p>
        )

      case 'status_change':
        return (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{event.userName}</span> changed status
            </p>
            {metadata?.oldStatus && metadata?.newStatus && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="bg-muted">
                  {metadata.oldStatus.replace(/_/g, ' ')}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {metadata.newStatus.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
          </div>
        )

      case 'assignment':
        return (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{event.userName}</span> assigned to{' '}
            <span className="font-medium text-foreground">
              {metadata?.assignedToName || 'Unassigned'}
            </span>
            {metadata?.previousAssigneeName && (
              <span className="text-xs text-muted-foreground ml-1">
                (previously {metadata.previousAssigneeName})
              </span>
            )}
          </p>
        )

      case 'comment':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{event.userName}</span> commented
              {metadata?.isInternal && (
                <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Lock className="w-3 h-3 mr-1" />
                  Internal
                </Badge>
              )}
            </p>
            {metadata?.commentPreview && (
              <div className="pl-3 border-l-2 border-muted">
                <p className="text-sm text-muted-foreground italic line-clamp-2">
                  {metadata.commentPreview}
                </p>
              </div>
            )}
          </div>
        )

      case 'attachment':
        return (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{event.userName}</span> uploaded{' '}
            {metadata?.fileCount ? (
              <span>
                <span className="font-medium text-foreground">{metadata.fileCount}</span> file
                {metadata.fileCount > 1 ? 's' : ''}
              </span>
            ) : metadata?.fileName ? (
              <span>
                <span className="font-medium text-foreground">{metadata.fileName}</span>
                {metadata?.fileSize && (
                  <span className="text-xs ml-1">({formatFileSize(metadata.fileSize)})</span>
                )}
              </span>
            ) : (
              'a file'
            )}
          </p>
        )

      case 'time_entry':
        const totalMinutes = (metadata?.timeHours || 0) * 60 + (metadata?.timeMinutes || 0)
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        return (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{event.userName}</span> logged{' '}
              <span className="font-medium text-foreground">
                {hours > 0 && `${hours}h `}
                {minutes > 0 && `${minutes}m`}
              </span>
            </p>
            {metadata?.timeDescription && (
              <p className="text-xs text-muted-foreground pl-3 border-l-2 border-muted">
                {metadata.timeDescription}
              </p>
            )}
          </div>
        )

      case 'approval':
        return (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {metadata?.approverName || event.userName}
              </span>{' '}
              approved this ticket
            </p>
            {metadata?.approvalReason && (
              <p className="text-xs text-muted-foreground pl-3 border-l-2 border-green-300">
                {metadata.approvalReason}
              </p>
            )}
          </div>
        )

      case 'rejection':
        return (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {metadata?.approverName || event.userName}
              </span>{' '}
              rejected this ticket
            </p>
            {metadata?.rejectionReason && (
              <p className="text-xs text-muted-foreground pl-3 border-l-2 border-red-300">
                {metadata.rejectionReason}
              </p>
            )}
          </div>
        )

      case 'priority_change':
        return (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{event.userName}</span> changed priority
            </p>
            {metadata?.oldValue && metadata?.newValue && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="bg-muted capitalize">
                  {metadata.oldValue}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
                  {metadata.newValue}
                </Badge>
              </div>
            )}
          </div>
        )

      case 'category_change':
        return (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{event.userName}</span> changed category
            </p>
            {metadata?.oldValue && metadata?.newValue && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="bg-muted">
                  {metadata.oldValue}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {metadata.newValue}
                </Badge>
              </div>
            )}
          </div>
        )

      case 'edit':
        return (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{event.userName}</span> edited the ticket
            </p>
            {metadata?.fieldsEdited && metadata.fieldsEdited.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {metadata.fieldsEdited.map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )

      case 'sla_breach':
        return (
          <div className="space-y-1">
            <p className="text-sm text-red-600 font-medium">
              {metadata?.slaType === 'response' ? 'Response' : 'Resolution'} SLA Breached
            </p>
            {metadata?.breachDuration && (
              <p className="text-xs text-muted-foreground">
                Exceeded by {metadata.breachDuration} minutes
              </p>
            )}
          </div>
        )

      default:
        return (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{event.userName}</span> performed an action
          </p>
        )
    }
  }

  return (
    <div className="relative pl-12 group">
      {/* Icon container with gradient and shadow */}
      <div
        className={cn(
          'absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-md transition-all group-hover:scale-110 group-hover:shadow-lg',
          config.bgColor,
          config.borderColor
        )}
      >
        <Icon className={cn('w-5 h-5', config.color)} />
      </div>

      {/* Event card with modern styling */}
      <div
        className={cn(
          'bg-card border-2 rounded-lg p-4 shadow-sm transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5',
          event.metadata?.isInternal &&
            event.type === 'comment' &&
            'border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10'
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* User avatar with better styling */}
            {event.userAvatar ? (
              <img
                src={event.userAvatar}
                alt={event.userName}
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-background shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 shadow-md">
                {getUserInitials(event.userName)}
              </div>
            )}

            {/* Event type label with modern badge */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-medium border-2">
                  {config.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Timestamp with better styling */}
          <div className="text-right shrink-0">
            <time
              className="text-xs text-muted-foreground whitespace-nowrap font-medium"
              dateTime={event.timestamp.toISOString()}
              title={format(event.timestamp, 'PPpp')}
            >
              {formatDistanceToNow(event.timestamp, { addSuffix: true })}
            </time>
          </div>
        </div>

        {/* Event description */}
        <div className="pl-12">{renderEventDescription()}</div>
      </div>
    </div>
  )
}
