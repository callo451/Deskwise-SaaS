import {
  TicketType,
  TicketTypeWorkflow,
  TicketStatus,
  IncidentStatus,
  ServiceRequestStatus,
  ChangeStatus,
  ProblemStatus,
} from '@/lib/types'

/**
 * Workflow Configuration for Unified Ticketing System
 * Defines type-specific rules, statuses, and workflows aligned with ITIL principles
 */

// Ticket Type Workflow Configurations
export const TICKET_WORKFLOWS: Record<TicketType, TicketTypeWorkflow> = {
  ticket: {
    type: 'ticket',
    availableStatuses: ['new', 'open', 'pending', 'resolved', 'closed'],
    requiredFields: ['title', 'description', 'priority', 'category', 'requesterId'],
    optionalFields: ['assignedTo', 'clientId', 'tags', 'linkedAssets'],
    requiresApproval: false,
    allowPublic: false,
    slaCalculationMethod: 'priority',
    allowedTransitions: {
      new: ['open', 'closed'],
      open: ['pending', 'resolved', 'closed'],
      pending: ['open', 'resolved', 'closed'],
      resolved: ['open', 'closed'],
      closed: ['open'], // Allow reopening
    },
    notificationTriggers: [
      'created',
      'assigned',
      'status_changed',
      'resolved',
      'closed',
      'comment_added',
      'sla_breach',
    ],
  },

  incident: {
    type: 'incident',
    availableStatuses: ['investigating', 'identified', 'monitoring', 'resolved'],
    requiredFields: [
      'title',
      'description',
      'severity',
      'impact',
      'urgency',
      'affectedServices',
      'isPublic',
    ],
    optionalFields: ['assignedTo', 'clientIds', 'tags', 'relatedProblemId'],
    requiresApproval: false,
    allowPublic: true, // Incidents can be made public for status pages
    slaCalculationMethod: 'impact_urgency_matrix',
    allowedTransitions: {
      investigating: ['identified', 'resolved'],
      identified: ['monitoring', 'resolved'],
      monitoring: ['investigating', 'resolved'],
      resolved: ['investigating'], // Allow reopening if issue recurs
    },
    notificationTriggers: [
      'created',
      'assigned',
      'status_changed',
      'severity_changed',
      'resolved',
      'update_posted',
      'sla_breach',
      'public_update', // Special trigger for public incidents
    ],
  },

  service_request: {
    type: 'service_request',
    availableStatuses: [
      'submitted',
      'pending_approval',
      'approved',
      'rejected',
      'in_progress',
      'completed',
      'cancelled',
    ],
    requiredFields: ['title', 'description', 'priority', 'category', 'requesterId'],
    optionalFields: ['clientId', 'serviceId', 'formData', 'assignedTo', 'tags'],
    requiresApproval: true, // Service requests may require approval based on catalog item
    allowPublic: false,
    slaCalculationMethod: 'service_catalog',
    allowedTransitions: {
      submitted: ['pending_approval', 'in_progress', 'cancelled'], // Auto-approve or require approval
      pending_approval: ['approved', 'rejected', 'cancelled'],
      approved: ['in_progress', 'cancelled'],
      rejected: ['submitted'], // Allow resubmission
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    },
    notificationTriggers: [
      'created',
      'submitted',
      'approval_requested',
      'approved',
      'rejected',
      'assigned',
      'status_changed',
      'completed',
      'cancelled',
    ],
  },

  change: {
    type: 'change',
    availableStatuses: [
      'draft',
      'pending_approval',
      'approved',
      'rejected',
      'scheduled',
      'implementing',
      'completed',
      'cancelled',
    ],
    requiredFields: [
      'title',
      'description',
      'risk',
      'impact',
      'category',
      'requestedBy',
      'plannedStartDate',
      'plannedEndDate',
      'backoutPlan',
    ],
    optionalFields: [
      'affectedAssets',
      'testPlan',
      'implementationPlan',
      'assignedTo',
      'tags',
      'cabMembers',
      'cabNotes',
    ],
    requiresApproval: true, // All changes require CAB approval
    allowPublic: false,
    slaCalculationMethod: 'change_impact',
    allowedTransitions: {
      draft: ['pending_approval', 'cancelled'],
      pending_approval: ['approved', 'rejected', 'draft', 'cancelled'],
      approved: ['scheduled', 'cancelled'],
      rejected: ['draft'], // Allow revision and resubmission
      scheduled: ['implementing', 'cancelled'],
      implementing: ['completed', 'cancelled'],
      completed: [],
      cancelled: ['draft'], // Allow recreation if cancelled by mistake
    },
    notificationTriggers: [
      'created',
      'submitted_for_approval',
      'cab_review',
      'approved',
      'rejected',
      'scheduled',
      'implementation_started',
      'completed',
      'cancelled',
      'date_approaching', // 24 hours before planned start
    ],
  },

  problem: {
    type: 'problem',
    availableStatuses: ['open', 'investigating', 'known_error', 'resolved', 'closed'],
    requiredFields: [
      'title',
      'description',
      'priority',
      'impact',
      'urgency',
      'category',
      'reportedBy',
      'isPublic',
    ],
    optionalFields: [
      'affectedServices',
      'clientIds',
      'relatedIncidents',
      'assignedTo',
      'tags',
      'rootCause',
      'workaround',
      'solution',
    ],
    requiresApproval: false,
    allowPublic: true, // Problems can be made public (e.g., for known errors)
    slaCalculationMethod: 'impact_urgency_matrix',
    allowedTransitions: {
      open: ['investigating', 'closed'],
      investigating: ['known_error', 'resolved', 'closed'],
      known_error: ['resolved', 'closed'],
      resolved: ['investigating', 'closed'], // Allow reopening
      closed: ['investigating'], // Allow reopening if problem recurs
    },
    notificationTriggers: [
      'created',
      'assigned',
      'status_changed',
      'root_cause_identified',
      'workaround_added',
      'solution_added',
      'known_error',
      'resolved',
      'closed',
    ],
  },
}

// Priority Matrix for Incident/Problem Management (ITIL)
// Impact (rows) × Urgency (columns) = Priority
export const IMPACT_URGENCY_MATRIX = {
  high: {
    high: 'critical',
    medium: 'high',
    low: 'medium',
  },
  medium: {
    high: 'high',
    medium: 'medium',
    low: 'low',
  },
  low: {
    high: 'medium',
    medium: 'low',
    low: 'low',
  },
} as const

/**
 * Calculate priority based on impact and urgency (ITIL best practice)
 */
export function calculatePriority(
  impact: 'low' | 'medium' | 'high',
  urgency: 'low' | 'medium' | 'high'
): 'low' | 'medium' | 'high' | 'critical' {
  return IMPACT_URGENCY_MATRIX[impact][urgency]
}

/**
 * Get available statuses for a ticket type
 */
export function getAvailableStatuses(ticketType: TicketType): string[] {
  return TICKET_WORKFLOWS[ticketType].availableStatuses
}

/**
 * Check if a status transition is allowed
 */
export function isTransitionAllowed(
  ticketType: TicketType,
  currentStatus: string,
  nextStatus: string
): boolean {
  const workflow = TICKET_WORKFLOWS[ticketType]
  const allowedNext = workflow.allowedTransitions[currentStatus]
  return allowedNext ? allowedNext.includes(nextStatus) : false
}

/**
 * Get required fields for ticket creation
 */
export function getRequiredFields(ticketType: TicketType): string[] {
  return TICKET_WORKFLOWS[ticketType].requiredFields
}

/**
 * Check if ticket type requires approval
 */
export function requiresApproval(ticketType: TicketType): boolean {
  return TICKET_WORKFLOWS[ticketType].requiresApproval
}

/**
 * Check if ticket type allows public visibility
 */
export function allowsPublic(ticketType: TicketType): boolean {
  return TICKET_WORKFLOWS[ticketType].allowPublic
}

/**
 * Get SLA calculation method for ticket type
 */
export function getSLACalculationMethod(ticketType: TicketType): string {
  return TICKET_WORKFLOWS[ticketType].slaCalculationMethod
}

/**
 * Get notification triggers for ticket type
 */
export function getNotificationTriggers(ticketType: TicketType): string[] {
  return TICKET_WORKFLOWS[ticketType].notificationTriggers
}

/**
 * Ticket number prefix by type
 */
export const TICKET_NUMBER_PREFIXES: Record<TicketType, string> = {
  ticket: 'TKT',
  incident: 'INC',
  service_request: 'SR',
  change: 'CHG',
  problem: 'PRB',
}

/**
 * Get next available ticket number for a type
 */
export function generateTicketNumber(ticketType: TicketType, count: number): string {
  const prefix = TICKET_NUMBER_PREFIXES[ticketType]
  const paddedNumber = String(count + 1).padStart(6, '0')
  return `${prefix}-${paddedNumber}`
}

/**
 * Default SLA times by priority (in minutes)
 */
export const DEFAULT_SLA_TIMES = {
  critical: {
    responseTime: 15, // 15 minutes
    resolutionTime: 240, // 4 hours
  },
  high: {
    responseTime: 60, // 1 hour
    resolutionTime: 480, // 8 hours
  },
  medium: {
    responseTime: 240, // 4 hours
    resolutionTime: 1440, // 24 hours
  },
  low: {
    responseTime: 480, // 8 hours
    resolutionTime: 2880, // 48 hours
  },
} as const

/**
 * Get default SLA times for a priority level
 */
export function getDefaultSLATimes(priority: string): {
  responseTime: number
  resolutionTime: number
} {
  const priorityKey = priority.toLowerCase() as keyof typeof DEFAULT_SLA_TIMES
  return (
    DEFAULT_SLA_TIMES[priorityKey] || {
      responseTime: 480,
      resolutionTime: 2880,
    }
  )
}

/**
 * Change risk level thresholds for approval requirements
 */
export const CHANGE_RISK_APPROVAL = {
  low: {
    requiresCAB: false, // Can be approved by change manager
    implementationWindow: 24, // hours
  },
  medium: {
    requiresCAB: true,
    implementationWindow: 72, // hours
  },
  high: {
    requiresCAB: true,
    requiresEmergencyCAB: false,
    implementationWindow: 168, // 1 week
  },
} as const
