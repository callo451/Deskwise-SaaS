'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimelineEventItem, ActivityEvent } from './timeline-event-item'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ActivityTimelineProps {
  events: ActivityEvent[]
  className?: string
  currentUserId?: string
  currentUserRole?: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  creation: 'Ticket Creation',
  status_change: 'Status Change',
  assignment: 'Assignment',
  comment: 'Comment',
  attachment: 'Attachment',
  time_entry: 'Time Entry',
  approval: 'Approval',
  rejection: 'Rejection',
  priority_change: 'Priority Change',
  category_change: 'Category Change',
  edit: 'Edit',
  sla_breach: 'SLA Breach',
}

export function ActivityTimeline({
  events,
  className,
  currentUserId,
  currentUserRole,
}: ActivityTimelineProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())

  // Filter events based on user role and selected types
  const filteredEvents = events.filter((event) => {
    // Hide internal comments from end users
    if (
      currentUserRole === 'user' &&
      event.type === 'comment' &&
      event.metadata?.isInternal
    ) {
      return false
    }

    // Apply type filter if any types are selected
    if (selectedTypes.size > 0 && !selectedTypes.has(event.type)) {
      return false
    }

    return true
  })

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  const clearFilters = () => {
    setSelectedTypes(new Set())
  }

  // Get unique event types from events
  const availableTypes = Array.from(
    new Set(events.map((e) => e.type))
  ).sort()

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Filter className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-lg font-medium">No activity yet</p>
        <p className="text-sm mt-1">Activity will appear here as actions are taken on this ticket</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Controls */}
      {availableTypes.length > 1 && (
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter Events
                  {selectedTypes.size > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      {selectedTypes.size}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Event Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedTypes.has(type)}
                    onCheckedChange={() => toggleTypeFilter(type)}
                  >
                    {EVENT_TYPE_LABELS[type] || type}
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedTypes.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredEvents.length} of {events.length} events
          </div>
        </div>
      )}

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No events match the selected filters</p>
          <Button
            variant="link"
            size="sm"
            onClick={clearFilters}
            className="mt-2"
          >
            Clear filters to see all events
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

          {/* Events */}
          <div className="space-y-6">
            {filteredEvents.map((event, index) => (
              <TimelineEventItem
                key={event.id}
                event={event}
                isFirst={index === 0}
                isLast={index === filteredEvents.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
