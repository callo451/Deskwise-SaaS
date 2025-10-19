import { UnifiedTicket, ChangeMetadata, ChangeRisk, ChangeImpact } from '@/lib/types'
import { CHANGE_RISK_APPROVAL } from '@/lib/ticketing/workflow-config'

/**
 * Change Handler
 * Specialized logic for change management (ITIL)
 */
export class ChangeHandler {
  /**
   * Determine if change requires CAB approval
   */
  static requiresCABApproval(risk: ChangeRisk, impact: ChangeImpact): boolean {
    // High risk always requires CAB
    if (risk === 'high') return true

    // Medium risk with medium/high impact requires CAB
    if (risk === 'medium' && (impact === 'medium' || impact === 'high')) return true

    // Low risk with high impact requires CAB
    if (risk === 'low' && impact === 'high') return true

    return false
  }

  /**
   * Get minimum implementation window (hours)
   */
  static getMinimumImplementationWindow(risk: ChangeRisk): number {
    const windows = CHANGE_RISK_APPROVAL[risk]
    return windows?.implementationWindow || 24
  }

  /**
   * Validate change data
   */
  static validateChangeData(data: {
    title: string
    description: string
    risk: ChangeRisk
    impact: ChangeImpact
    plannedStartDate: Date
    plannedEndDate: Date
    backoutPlan: string
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || data.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters')
    }

    if (!data.description || data.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters')
    }

    if (!data.backoutPlan || data.backoutPlan.trim().length < 20) {
      errors.push('Backout plan must be at least 20 characters')
    }

    // Validate dates
    const now = new Date()
    const start = new Date(data.plannedStartDate)
    const end = new Date(data.plannedEndDate)

    const minWindow = this.getMinimumImplementationWindow(data.risk)
    const timeDiff = (start.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (timeDiff < minWindow) {
      errors.push(`Change must be scheduled at least ${minWindow} hours in advance`)
    }

    if (end <= start) {
      errors.push('Planned end date must be after planned start date')
    }

    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    if (duration < 0.5) {
      errors.push('Implementation window must be at least 30 minutes')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Calculate change risk score
   */
  static calculateRiskScore(ticket: UnifiedTicket): number {
    if (ticket.ticketType !== 'change') return 0

    const metadata = ticket.metadata as ChangeMetadata

    let score = 0

    // Risk level
    if (metadata.risk === 'high') score += 50
    else if (metadata.risk === 'medium') score += 25
    else score += 10

    // Impact level
    if (metadata.impact === 'high') score += 30
    else if (metadata.impact === 'medium') score += 15
    else score += 5

    // Number of affected assets
    score += Math.min(metadata.affectedAssets.length * 2, 20)

    return score // 0-100 scale
  }

  /**
   * Determine change type based on characteristics
   */
  static determineChangeType(ticket: UnifiedTicket): 'standard' | 'normal' | 'emergency' {
    if (ticket.ticketType !== 'change') return 'normal'

    const metadata = ticket.metadata as ChangeMetadata

    // Emergency change: high urgency, high risk/impact
    if (metadata.risk === 'high' && metadata.impact === 'high') {
      return 'emergency'
    }

    // Standard change: low risk, repeatable process
    if (metadata.risk === 'low' && metadata.impact === 'low') {
      return 'standard'
    }

    return 'normal'
  }

  /**
   * Get recommended CAB members based on change characteristics
   */
  static getRecommendedCABMembers(ticket: UnifiedTicket): string[] {
    if (ticket.ticketType !== 'change') return []

    const metadata = ticket.metadata as ChangeMetadata
    const members: string[] = []

    // Always include change manager
    members.push('change_manager')

    // High risk/impact requires executive approval
    if (metadata.risk === 'high' || metadata.impact === 'high') {
      members.push('cto', 'cio')
    }

    // Service owners
    members.push('service_owner')

    // Technical SMEs
    if (metadata.affectedAssets.length > 0) {
      members.push('technical_lead')
    }

    // Security review for high-risk changes
    if (metadata.risk === 'high') {
      members.push('security_officer')
    }

    return members
  }

  /**
   * Check if change is within acceptable implementation window
   */
  static isWithinMaintenanceWindow(
    plannedStart: Date,
    plannedEnd: Date,
    maintenanceWindows?: { start: string; end: string; dayOfWeek: number }[]
  ): boolean {
    if (!maintenanceWindows || maintenanceWindows.length === 0) {
      return true // No windows defined, allow any time
    }

    const start = new Date(plannedStart)
    const dayOfWeek = start.getDay()

    // Check if change falls within any maintenance window
    return maintenanceWindows.some((window) => {
      if (window.dayOfWeek !== dayOfWeek) return false

      const [startHour, startMinute] = window.start.split(':').map(Number)
      const [endHour, endMinute] = window.end.split(':').map(Number)

      const windowStart = new Date(start)
      windowStart.setHours(startHour, startMinute, 0, 0)

      const windowEnd = new Date(start)
      windowEnd.setHours(endHour, endMinute, 0, 0)

      return start >= windowStart && new Date(plannedEnd) <= windowEnd
    })
  }

  /**
   * Generate change implementation checklist
   */
  static generateImplementationChecklist(ticket: UnifiedTicket): string[] {
    if (ticket.ticketType !== 'change') return []

    const metadata = ticket.metadata as ChangeMetadata

    const checklist: string[] = [
      '☐ Review change request documentation',
      '☐ Verify CAB approval received',
      '☐ Confirm all stakeholders notified',
      '☐ Backup current configuration/data',
      '☐ Verify backout plan is accessible',
      '☐ Confirm maintenance window',
    ]

    if (metadata.testPlan) {
      checklist.push('☐ Complete pre-implementation testing')
    }

    checklist.push(
      '☐ Execute change implementation',
      '☐ Validate change success criteria',
      '☐ Update documentation',
      '☐ Notify stakeholders of completion'
    )

    if (metadata.risk === 'high') {
      checklist.push('☐ Conduct post-implementation review')
    }

    return checklist
  }

  /**
   * Determine if change requires post-implementation review (PIR)
   */
  static requiresPIR(ticket: UnifiedTicket): boolean {
    if (ticket.ticketType !== 'change') return false

    const metadata = ticket.metadata as ChangeMetadata

    // PIR required for:
    // 1. High risk changes
    // 2. Failed changes
    // 3. Changes that required backout
    return metadata.risk === 'high' || ticket.status === 'cancelled'
  }
}
