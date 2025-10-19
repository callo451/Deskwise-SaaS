import { UnifiedTicket, IncidentMetadata } from '@/lib/types'
import { calculatePriority } from '@/lib/ticketing/workflow-config'

/**
 * Incident Handler
 * Specialized logic for incident management (ITIL)
 */
export class IncidentHandler {
  /**
   * Calculate priority using Impact × Urgency matrix (ITIL)
   */
  static calculatePriority(
    impact: 'low' | 'medium' | 'high',
    urgency: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' | 'critical' {
    return calculatePriority(impact, urgency)
  }

  /**
   * Determine if incident requires major incident management
   */
  static isMajorIncident(ticket: UnifiedTicket): boolean {
    if (ticket.ticketType !== 'incident') return false

    const metadata = ticket.metadata as IncidentMetadata

    // Major incident criteria:
    // 1. Critical priority
    // 2. High impact + High urgency
    // 3. Affects multiple services
    return (
      ticket.priority === 'critical' ||
      (metadata.impact === 'high' && metadata.urgency === 'high') ||
      metadata.affectedServices.length >= 3
    )
  }

  /**
   * Get recommended escalation time based on severity
   */
  static getEscalationTime(severity: 'minor' | 'major' | 'critical'): number {
    const escalationTimes = {
      critical: 30, // 30 minutes
      major: 60, // 1 hour
      minor: 240, // 4 hours
    }
    return escalationTimes[severity]
  }

  /**
   * Validate incident data
   */
  static validateIncidentData(data: {
    title: string
    description: string
    impact: 'low' | 'medium' | 'high'
    urgency: 'low' | 'medium' | 'high'
    affectedServices: string[]
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || data.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters')
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters')
    }

    if (!data.affectedServices || data.affectedServices.length === 0) {
      errors.push('At least one affected service must be specified')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Generate incident summary for public status page
   */
  static generatePublicSummary(ticket: UnifiedTicket): string {
    if (ticket.ticketType !== 'incident') return ''

    const metadata = ticket.metadata as IncidentMetadata

    return `We are currently investigating an incident affecting ${
      metadata.affectedServices.length > 1
        ? `${metadata.affectedServices.length} services`
        : metadata.affectedServices[0]
    }. Our team is working to resolve this issue as quickly as possible.`
  }

  /**
   * Determine if incident should be automatically linked to a problem
   */
  static shouldLinkToProblem(ticket: UnifiedTicket): boolean {
    if (ticket.ticketType !== 'incident') return false

    // Link to problem if:
    // 1. Incident has recurred (check for similar incidents)
    // 2. Incident is a major incident
    // 3. Incident has been open for extended period
    const metadata = ticket.metadata as IncidentMetadata

    const openDuration = ticket.createdAt
      ? (new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60)
      : 0

    return this.isMajorIncident(ticket) || openDuration > 72 // > 72 hours
  }
}
