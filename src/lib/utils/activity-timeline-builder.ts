import { UnifiedTicket } from '@/lib/types'
import { ActivityEvent } from '@/components/unified-tickets/timeline-event-item'
import { Comment } from '@/components/unified-tickets/comment-item'

export interface TimelineAttachment {
  _id: string
  fileName: string
  fileSize: number
  uploadedBy: string
  uploadedByName?: string
  uploadedAt: Date
}

export interface TimelineTimeEntry {
  _id: string
  userId: string
  userName: string
  duration: number // in minutes
  description?: string
  createdAt: Date
}

interface BuildTimelineOptions {
  ticket: UnifiedTicket
  comments?: Comment[]
  attachments?: TimelineAttachment[]
  timeEntries?: TimelineTimeEntry[]
  includeCreation?: boolean
  includeUpdates?: boolean
}

/**
 * Builds a comprehensive activity timeline from various ticket data sources
 */
export function buildActivityTimeline({
  ticket,
  comments = [],
  attachments = [],
  timeEntries = [],
  includeCreation = true,
  includeUpdates = true,
}: BuildTimelineOptions): ActivityEvent[] {
  const events: ActivityEvent[] = []

  // Safety check: ensure ticket has required fields
  if (!ticket || !ticket._id) {
    console.warn('buildActivityTimeline: Invalid ticket object', ticket)
    return events
  }

  const ticketId = ticket._id.toString()

  // 1. Ticket creation event
  if (includeCreation) {
    events.push({
      id: `creation-${ticketId}`,
      type: 'creation',
      timestamp: new Date(ticket.createdAt),
      userId: ticket.createdBy,
      userName: ticket.requesterName || 'Unknown User',
    })
  }

  // 2. Extract events from ticket update history (if available)
  // Note: This would require a ticket history field in the database
  // For now, we'll infer some events from the current ticket state

  // 3. Assignment event (if ticket is assigned)
  if (ticket.assignedTo && ticket.updatedAt) {
    events.push({
      id: `assignment-${ticketId}`,
      type: 'assignment',
      timestamp: new Date(ticket.updatedAt),
      userId: ticket.updatedBy || ticket.createdBy,
      userName: 'System', // Would need to track who assigned
      metadata: {
        assignedToId: ticket.assignedTo,
        assignedToName: ticket.assignedToName || 'Unknown User',
      },
    })
  }

  // 4. Approval/Rejection events (for change requests and service requests)
  if (ticket.ticketType === 'change' || ticket.ticketType === 'service_request') {
    const metadata =
      ticket.metadata as any

    if (metadata.approvalStatus === 'approved' && metadata.approvedBy && metadata.approvedAt) {
      events.push({
        id: `approval-${ticketId}`,
        type: 'approval',
        timestamp: new Date(metadata.approvedAt),
        userId: metadata.approvedBy,
        userName: metadata.approvedByName || 'Unknown User',
        metadata: {
          approverName: metadata.approvedByName,
          approvalReason: metadata.cabNotes, // For change requests
        },
      })
    }

    if (metadata.approvalStatus === 'rejected' && metadata.approvedBy && metadata.approvedAt) {
      events.push({
        id: `rejection-${ticketId}`,
        type: 'rejection',
        timestamp: new Date(metadata.approvedAt),
        userId: metadata.approvedBy,
        userName: metadata.approvedByName || 'Unknown User',
        metadata: {
          approverName: metadata.approvedByName,
          rejectionReason: metadata.rejectionReason,
        },
      })
    }
  }

  // 5. Resolution event
  if (ticket.resolvedAt) {
    events.push({
      id: `resolution-${ticketId}`,
      type: 'status_change',
      timestamp: new Date(ticket.resolvedAt),
      userId: ticket.assignedTo || ticket.createdBy,
      userName: ticket.assignedToName || 'Unknown User',
      metadata: {
        newStatus: 'resolved',
      },
    })
  }

  // 6. Closure event
  if (ticket.closedAt) {
    events.push({
      id: `closure-${ticketId}`,
      type: 'status_change',
      timestamp: new Date(ticket.closedAt),
      userId: ticket.assignedTo || ticket.createdBy,
      userName: ticket.assignedToName || 'Unknown User',
      metadata: {
        newStatus: 'closed',
      },
    })
  }

  // 7. Comment events
  comments.forEach((comment) => {
    events.push({
      id: `comment-${comment._id}`,
      type: 'comment',
      timestamp: new Date(comment.createdAt),
      userId: comment.createdBy,
      userName: comment.createdByName || 'Unknown User',
      userAvatar: comment.createdByAvatar,
      metadata: {
        commentPreview: comment.content.substring(0, 150) + (comment.content.length > 150 ? '...' : ''),
        isInternal: comment.isInternal,
      },
    })
  })

  // 8. Attachment events
  attachments.forEach((attachment) => {
    events.push({
      id: `attachment-${attachment._id}`,
      type: 'attachment',
      timestamp: new Date(attachment.uploadedAt),
      userId: attachment.uploadedBy,
      userName: attachment.uploadedByName || 'Unknown User',
      metadata: {
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
      },
    })
  })

  // 9. Time entry events
  timeEntries.forEach((entry) => {
    const hours = Math.floor(entry.duration / 60)
    const minutes = entry.duration % 60

    events.push({
      id: `time-entry-${entry._id}`,
      type: 'time_entry',
      timestamp: new Date(entry.createdAt),
      userId: entry.userId,
      userName: entry.userName,
      metadata: {
        timeHours: hours,
        timeMinutes: minutes,
        timeDescription: entry.description,
      },
    })
  })

  // 10. SLA breach events (if SLA is breached)
  if (ticket.sla?.breached) {
    // Calculate breach duration (simplified - would need actual breach time)
    const now = new Date()
    const resolutionDeadline = new Date(ticket.sla.resolutionDeadline)
    const breachDuration = Math.floor((now.getTime() - resolutionDeadline.getTime()) / (1000 * 60))

    events.push({
      id: `sla-breach-${ticketId}`,
      type: 'sla_breach',
      timestamp: resolutionDeadline,
      userId: 'system',
      userName: 'System',
      metadata: {
        slaType: 'resolution',
        breachDuration: breachDuration > 0 ? breachDuration : 0,
      },
    })
  }

  // Sort all events by timestamp (newest first)
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return events
}

/**
 * Helper function to extract status change events from ticket updates
 * This would be used if you have a separate updates collection
 */
export function extractStatusChangeEvents(
  updates: Array<{
    _id: string
    status?: string
    message?: string
    createdBy: string
    createdByName?: string
    createdAt: Date
  }>
): ActivityEvent[] {
  return updates
    .filter((update) => update.status)
    .map((update) => ({
      id: `status-change-${update._id}`,
      type: 'status_change' as const,
      timestamp: new Date(update.createdAt),
      userId: update.createdBy,
      userName: update.createdByName || 'Unknown User',
      metadata: {
        newStatus: update.status,
      },
    }))
}

/**
 * Helper to build canned response variables from ticket data
 */
export function buildCannedResponseVariables(ticket: UnifiedTicket): Record<string, any> {
  return {
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    requesterName: ticket.requesterName || 'User',
    assignedTo: ticket.assignedToName || 'Unassigned',
    status: ticket.status.replace(/_/g, ' '),
    priority: ticket.priority,
    category: ticket.category,
  }
}
