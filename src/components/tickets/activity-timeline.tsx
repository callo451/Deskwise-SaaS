'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Timer,
  Star,
  UserPlus,
  Edit3,
  Paperclip,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type TimelineEvent = {
  id: string
  type: 'comment' | 'status_change' | 'assignment' | 'priority_change' | 'attachment' | 'time_entry' | 'sla_breach' | 'linked_asset' | 'csat_rating' | 'edit' | 'internal_note'
  title: string
  description?: string
  timestamp: Date
  user: string
  metadata?: {
    oldValue?: string
    newValue?: string
    duration?: number
    rating?: number
    fileName?: string
    fileCount?: number
    assetName?: string
  }
  isInternal?: boolean
}

interface ActivityTimelineProps {
  events: TimelineEvent[]
  className?: string
}

const eventConfig = {
  comment: {
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  internal_note: {
    icon: MessageSquare,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
  },
  status_change: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  assignment: {
    icon: UserPlus,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    borderColor: 'border-purple-300 dark:border-purple-700',
  },
  priority_change: {
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    borderColor: 'border-orange-300 dark:border-orange-700',
  },
  attachment: {
    icon: Paperclip,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    borderColor: 'border-gray-300 dark:border-gray-700',
  },
  time_entry: {
    icon: Timer,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
  },
  sla_breach: {
    icon: Clock,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    borderColor: 'border-red-300 dark:border-red-700',
  },
  linked_asset: {
    icon: LinkIcon,
    color: 'text-teal-500',
    bgColor: 'bg-teal-100 dark:bg-teal-900/20',
    borderColor: 'border-teal-300 dark:border-teal-700',
  },
  csat_rating: {
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
  },
  edit: {
    icon: Edit3,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    borderColor: 'border-gray-300 dark:border-gray-700',
  },
}

export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No activity yet</p>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

      {/* Events */}
      <div className="space-y-4">
        {events.map((event, index) => {
          const config = eventConfig[event.type]
          const Icon = config.icon

          return (
            <div key={event.id} className="relative pl-10 pb-4">
              {/* Icon container */}
              <div
                className={cn(
                  'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <Icon className={cn('w-4 h-4', config.color)} />
              </div>

              {/* Event content */}
              <div
                className={cn(
                  'bg-card border rounded-lg p-4 shadow-sm transition-all hover:shadow-md',
                  event.isInternal && 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10'
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium leading-tight">
                      {event.title}
                      {event.isInternal && (
                        <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 font-normal">
                          (Internal)
                        </span>
                      )}
                    </h4>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <time
                    className="text-xs text-muted-foreground whitespace-nowrap"
                    dateTime={event.timestamp.toISOString()}
                  >
                    {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                  </time>
                </div>

                {/* Metadata rendering */}
                {event.metadata && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{event.user}</span>
                    </div>

                    {event.metadata.oldValue && event.metadata.newValue && (
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-muted">
                          {event.metadata.oldValue}
                        </span>
                        <span>→</span>
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          {event.metadata.newValue}
                        </span>
                      </div>
                    )}

                    {event.metadata.duration !== undefined && (
                      <div className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        <span>{event.metadata.duration} minutes</span>
                      </div>
                    )}

                    {event.metadata.rating !== undefined && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{event.metadata.rating}/5</span>
                      </div>
                    )}

                    {event.metadata.fileName && (
                      <div className="flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        <span>{event.metadata.fileName}</span>
                      </div>
                    )}

                    {event.metadata.fileCount && (
                      <div className="flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        <span>{event.metadata.fileCount} files</span>
                      </div>
                    )}

                    {event.metadata.assetName && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        <span>{event.metadata.assetName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
