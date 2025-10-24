'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  MessageSquare,
  Lock,
  Paperclip,
  User,
  GitBranch,
  Clock,
  Star,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

interface TimelineEvent {
  id: string
  type: 'comment' | 'status_change' | 'assignment' | 'attachment' | 'internal_note' | 'csat_rating' | 'created'
  user: string
  userAvatar?: string
  timestamp: string
  content?: string
  metadata?: {
    oldValue?: string
    newValue?: string
    fileName?: string
    rating?: number
  }
}

interface ModernActivityTimelineProps {
  events: TimelineEvent[]
  className?: string
}

export function ModernActivityTimeline({ events, className }: ModernActivityTimelineProps) {
  const [filter, setFilter] = useState<string>('all')
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  const filters = [
    { value: 'all', label: 'All Activity', count: events.length },
    { value: 'comment', label: 'Comments', count: events.filter(e => e.type === 'comment').length },
    { value: 'status_change', label: 'Status Changes', count: events.filter(e => e.type === 'status_change').length },
    { value: 'attachment', label: 'Attachments', count: events.filter(e => e.type === 'attachment').length },
  ]

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.type === filter)

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return { icon: MessageSquare, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
      case 'internal_note':
        return { icon: Lock, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
      case 'status_change':
        return { icon: GitBranch, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' }
      case 'assignment':
        return { icon: User, color: 'bg-green-500/10 text-green-600 dark:text-green-400' }
      case 'attachment':
        return { icon: Paperclip, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' }
      case 'csat_rating':
        return { icon: Star, color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' }
      case 'created':
        return { icon: FileText, color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' }
      default:
        return { icon: Clock, color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' }
    }
  }

  const getEventTitle = (event: TimelineEvent) => {
    switch (event.type) {
      case 'comment':
        return 'Added a comment'
      case 'internal_note':
        return 'Added an internal note'
      case 'status_change':
        return `Changed status from ${event.metadata?.oldValue || 'N/A'} to ${event.metadata?.newValue || 'N/A'}`
      case 'assignment':
        return `Assigned to ${event.metadata?.newValue || 'someone'}`
      case 'attachment':
        return `Attached ${event.metadata?.fileName || 'a file'}`
      case 'csat_rating':
        return 'Submitted customer satisfaction rating'
      case 'created':
        return 'Created this ticket'
      default:
        return 'Activity'
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (filteredEvents.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No activity found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity Timeline
            </CardTitle>
            <CardDescription>Complete history of all changes and updates</CardDescription>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="h-8"
            >
              {f.label}
              {f.count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {f.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline Events */}
          <div className="space-y-6">
            {filteredEvents.map((event, index) => {
              const { icon: Icon, color } = getEventIcon(event.type)
              const isExpanded = expandedEvents.has(event.id)
              const isLongContent = (event.content?.length || 0) > 200

              return (
                <div key={event.id} className="relative pl-12">
                  {/* Icon */}
                  <div
                    className={cn(
                      'absolute left-0 top-1 w-12 h-12 rounded-full flex items-center justify-center border-4 border-background z-10',
                      color
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={event.userAvatar} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(event.user)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{event.user}</span>
                        {event.type === 'internal_note' && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Internal
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {getEventTitle(event)}
                      </p>

                      {event.content && (
                        <div
                          className={cn(
                            'p-3 rounded-lg border bg-card text-sm',
                            event.type === 'internal_note' && 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          )}
                        >
                          <p className={cn(
                            'whitespace-pre-wrap',
                            !isExpanded && isLongContent && 'line-clamp-3'
                          )}>
                            {event.content}
                          </p>
                          {isLongContent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs mt-2 -ml-2"
                              onClick={() => toggleEventExpansion(event.id)}
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </Button>
                          )}
                        </div>
                      )}

                      {event.type === 'status_change' && event.metadata && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{event.metadata.oldValue}</Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <Badge variant="outline">{event.metadata.newValue}</Badge>
                        </div>
                      )}

                      {event.type === 'csat_rating' && event.metadata?.rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-4 h-4',
                                i < event.metadata!.rating!
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              )}
                            />
                          ))}
                          <span className="text-sm font-medium ml-2">
                            {event.metadata.rating}/5
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
