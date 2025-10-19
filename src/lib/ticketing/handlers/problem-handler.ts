import { UnifiedTicket, ProblemMetadata } from '@/lib/types'
import { calculatePriority } from '@/lib/ticketing/workflow-config'

/**
 * Problem Handler
 * Specialized logic for problem management (ITIL)
 */
export class ProblemHandler {
  /**
   * Calculate priority using Impact × Urgency matrix
   */
  static calculatePriority(
    impact: 'low' | 'medium' | 'high',
    urgency: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' | 'critical' {
    return calculatePriority(impact, urgency)
  }

  /**
   * Determine if problem qualifies as a known error
   */
  static isKnownError(ticket: UnifiedTicket): boolean {
    if (ticket.ticketType !== 'problem') return false

    const metadata = ticket.metadata as ProblemMetadata

    // Known error criteria:
    // 1. Root cause identified
    // 2. Workaround documented
    return Boolean(metadata.rootCause && metadata.workaround)
  }

  /**
   * Validate problem data
   */
  static validateProblemData(data: {
    title: string
    description: string
    impact: 'low' | 'medium' | 'high'
    urgency: 'low' | 'medium' | 'high'
    category: string
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || data.title.trim().length < 10) {
      errors.push('Title must be at least 10 characters')
    }

    if (!data.description || data.description.trim().length < 50) {
      errors.push('Description must be at least 50 characters (problems require detailed analysis)')
    }

    if (!data.category) {
      errors.push('Category is required for trend analysis')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get recommended investigation steps
   */
  static getInvestigationSteps(category: string): string[] {
    const steps: string[] = [
      '☐ Gather incident data from related incidents',
      '☐ Analyze incident patterns and trends',
      '☐ Review system logs and error messages',
      '☐ Conduct root cause analysis (5 Whys, Fishbone, etc.)',
      '☐ Document findings',
    ]

    // Category-specific steps
    const categorySteps: Record<string, string[]> = {
      Network: [
        '☐ Check network topology',
        '☐ Review bandwidth utilization',
        '☐ Analyze packet captures',
      ],
      Application: [
        '☐ Review application logs',
        '☐ Check database performance',
        '☐ Analyze code changes',
      ],
      Hardware: ['☐ Check hardware diagnostics', '☐ Review maintenance history', '☐ Test hardware'],
    }

    if (categorySteps[category]) {
      steps.push(...categorySteps[category])
    }

    steps.push(
      '☐ Develop workaround if possible',
      '☐ Identify permanent solution',
      '☐ Create change request for permanent fix'
    )

    return steps
  }

  /**
   * Generate known error database entry
   */
  static generateKEDBEntry(ticket: UnifiedTicket): {
    title: string
    symptoms: string[]
    rootCause: string
    workaround?: string
    solution?: string
  } | null {
    if (!this.isKnownError(ticket)) return null

    const metadata = ticket.metadata as ProblemMetadata

    return {
      title: ticket.title,
      symptoms: [ticket.description],
      rootCause: metadata.rootCause!,
      workaround: metadata.workaround,
      solution: metadata.solution,
    }
  }

  /**
   * Assess problem severity based on related incidents
   */
  static assessSeverity(relatedIncidentsCount: number, affectedUsersCount: number): {
    severity: 'low' | 'medium' | 'high'
    reason: string
  } {
    if (relatedIncidentsCount >= 10 || affectedUsersCount >= 100) {
      return {
        severity: 'high',
        reason: 'Multiple recurring incidents affecting significant user base',
      }
    }

    if (relatedIncidentsCount >= 5 || affectedUsersCount >= 50) {
      return {
        severity: 'medium',
        reason: 'Recurring incidents affecting moderate user base',
      }
    }

    return {
      severity: 'low',
      reason: 'Limited incident recurrence or impact',
    }
  }

  /**
   * Determine if problem requires change request
   */
  static requiresChangeRequest(ticket: UnifiedTicket): boolean {
    if (ticket.ticketType !== 'problem') return false

    const metadata = ticket.metadata as ProblemMetadata

    // Requires change request if:
    // 1. Solution involves infrastructure/code changes
    // 2. High impact problem
    // 3. Multiple related incidents
    return (
      Boolean(metadata.solution) ||
      metadata.impact === 'high' ||
      metadata.relatedIncidents.length >= 5
    )
  }

  /**
   * Calculate time to resolution metrics
   */
  static calculateResolutionMetrics(ticket: UnifiedTicket): {
    timeToIdentify?: number // hours
    timeToWorkaround?: number // hours
    timeToResolve?: number // hours
  } | null {
    if (ticket.ticketType !== 'problem') return null

    const metadata = ticket.metadata as ProblemMetadata
    const createdAt = new Date(ticket.createdAt)

    const metrics: any = {}

    // Time to identify root cause
    if (metadata.rootCause && metadata.knownErrorDate) {
      const identifiedAt = new Date(metadata.knownErrorDate)
      metrics.timeToIdentify = (identifiedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    }

    // Time to workaround
    // This would need a timestamp field for when workaround was added

    // Time to resolution
    if (ticket.resolvedAt) {
      const resolvedAt = new Date(ticket.resolvedAt)
      metrics.timeToResolve = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    }

    return metrics
  }

  /**
   * Generate problem analysis report
   */
  static generateAnalysisReport(ticket: UnifiedTicket): string {
    if (ticket.ticketType !== 'problem') return ''

    const metadata = ticket.metadata as ProblemMetadata

    let report = `# Problem Analysis Report\n\n`
    report += `**Problem:** ${ticket.title}\n`
    report += `**Status:** ${ticket.status}\n`
    report += `**Priority:** ${ticket.priority}\n`
    report += `**Impact:** ${metadata.impact}\n`
    report += `**Urgency:** ${metadata.urgency}\n\n`

    report += `## Description\n${ticket.description}\n\n`

    if (metadata.relatedIncidents.length > 0) {
      report += `## Related Incidents\n`
      report += `- Total incidents: ${metadata.relatedIncidents.length}\n\n`
    }

    if (metadata.affectedServices.length > 0) {
      report += `## Affected Services\n`
      metadata.affectedServices.forEach((service) => {
        report += `- ${service}\n`
      })
      report += `\n`
    }

    if (metadata.rootCause) {
      report += `## Root Cause\n${metadata.rootCause}\n\n`
    }

    if (metadata.workaround) {
      report += `## Workaround\n${metadata.workaround}\n\n`
    }

    if (metadata.solution) {
      report += `## Solution\n${metadata.solution}\n\n`
    }

    const metrics = this.calculateResolutionMetrics(ticket)
    if (metrics && Object.keys(metrics).length > 0) {
      report += `## Metrics\n`
      if (metrics.timeToIdentify) {
        report += `- Time to identify: ${metrics.timeToIdentify.toFixed(1)} hours\n`
      }
      if (metrics.timeToResolve) {
        report += `- Time to resolve: ${metrics.timeToResolve.toFixed(1)} hours\n`
      }
      report += `\n`
    }

    return report
  }

  /**
   * Recommend next actions based on problem state
   */
  static getRecommendedActions(ticket: UnifiedTicket): string[] {
    if (ticket.ticketType !== 'problem') return []

    const metadata = ticket.metadata as ProblemMetadata
    const actions: string[] = []

    if (!metadata.rootCause) {
      actions.push('Conduct root cause analysis')
      actions.push('Review related incidents for patterns')
    }

    if (metadata.rootCause && !metadata.workaround) {
      actions.push('Develop temporary workaround')
      actions.push('Document workaround for service desk')
    }

    if (metadata.workaround && !metadata.solution) {
      actions.push('Identify permanent solution')
      actions.push('Create change request for permanent fix')
    }

    if (metadata.solution && ticket.status !== 'resolved') {
      actions.push('Implement permanent solution via change management')
      actions.push('Verify solution effectiveness')
    }

    if (this.isKnownError(ticket)) {
      actions.push('Add to Known Error Database (KEDB)')
      actions.push('Train service desk on workaround')
    }

    if (ticket.status === 'resolved' && !ticket.closedAt) {
      actions.push('Monitor for recurrence')
      actions.push('Close problem after verification period')
    }

    return actions
  }
}
