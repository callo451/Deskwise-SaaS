import { UnifiedTicket, ServiceRequestMetadata } from '@/lib/types'

/**
 * Service Request Handler
 * Specialized logic for service request fulfillment (ITIL)
 */
export class ServiceRequestHandler {
  /**
   * Determine if service request requires approval
   */
  static requiresApproval(
    serviceId?: string,
    requestValue?: number,
    approvalThreshold?: number
  ): boolean {
    // Check if service catalog item requires approval
    // This would typically check the service catalog configuration

    // For now, simple threshold check
    if (requestValue && approvalThreshold) {
      return requestValue >= approvalThreshold
    }

    // Default: no approval required for standard requests
    return false
  }

  /**
   * Validate service request data
   */
  static validateServiceRequestData(data: {
    title: string
    description: string
    priority: string
    category: string
    formData?: Record<string, any>
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || data.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters')
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters')
    }

    if (!data.category) {
      errors.push('Category is required')
    }

    // Validate form data if present
    if (data.formData) {
      const requiredFields = this.getRequiredFormFields(data.category)
      for (const field of requiredFields) {
        if (!data.formData[field]) {
          errors.push(`Required field missing: ${field}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get required form fields for a service category
   */
  private static getRequiredFormFields(category: string): string[] {
    // This would typically come from service catalog configuration
    const fieldMappings: Record<string, string[]> = {
      'Hardware Request': ['deviceType', 'quantity', 'justification'],
      'Software Request': ['softwareName', 'licenseType', 'businessJustification'],
      'Access Request': ['systemName', 'accessLevel', 'approverEmail'],
      'Account Creation': ['username', 'department', 'managerEmail'],
    }

    return fieldMappings[category] || []
  }

  /**
   * Calculate estimated fulfillment time (minutes)
   */
  static getEstimatedFulfillmentTime(category: string, priority: string): number {
    const baseTimes: Record<string, number> = {
      'Hardware Request': 2880, // 48 hours
      'Software Request': 480, // 8 hours
      'Access Request': 240, // 4 hours
      'Account Creation': 120, // 2 hours
      'Password Reset': 30, // 30 minutes
    }

    const baseTime = baseTimes[category] || 480

    // Adjust based on priority
    const priorityMultipliers: Record<string, number> = {
      critical: 0.25,
      high: 0.5,
      medium: 1.0,
      low: 2.0,
    }

    return baseTime * (priorityMultipliers[priority] || 1.0)
  }

  /**
   * Determine approval chain based on request value or type
   */
  static getApprovalChain(
    category: string,
    requestValue?: number
  ): { role: string; threshold?: number }[] {
    const chain: { role: string; threshold?: number }[] = []

    // Line manager approval for all requests
    chain.push({ role: 'line_manager' })

    // Additional approvals based on category
    if (category === 'Hardware Request' && requestValue && requestValue > 1000) {
      chain.push({ role: 'it_manager', threshold: 1000 })
    }

    if (requestValue && requestValue > 5000) {
      chain.push({ role: 'finance_manager', threshold: 5000 })
    }

    if (requestValue && requestValue > 10000) {
      chain.push({ role: 'director', threshold: 10000 })
    }

    return chain
  }

  /**
   * Generate fulfillment checklist
   */
  static generateFulfillmentChecklist(ticket: UnifiedTicket): string[] {
    if (ticket.ticketType !== 'service_request') return []

    const metadata = ticket.metadata as ServiceRequestMetadata

    const checklist: string[] = ['☐ Review request details', '☐ Verify approval received']

    // Category-specific steps
    if (ticket.category === 'Hardware Request') {
      checklist.push(
        '☐ Check inventory availability',
        '☐ Order hardware if needed',
        '☐ Configure device',
        '☐ Schedule delivery/pickup'
      )
    } else if (ticket.category === 'Software Request') {
      checklist.push(
        '☐ Verify license availability',
        '☐ Procure license if needed',
        '☐ Install software',
        '☐ Verify functionality'
      )
    } else if (ticket.category === 'Access Request') {
      checklist.push(
        '☐ Verify user identity',
        '☐ Create/modify account',
        '☐ Assign permissions',
        '☐ Send credentials securely'
      )
    }

    checklist.push('☐ Test service delivery', '☐ Notify requester', '☐ Close request')

    return checklist
  }

  /**
   * Check if request can be auto-approved
   */
  static canAutoApprove(
    category: string,
    requestValue?: number,
    autoApprovalLimit?: number
  ): boolean {
    // Auto-approve if no approval required
    if (!this.requiresApproval(undefined, requestValue, autoApprovalLimit)) {
      return true
    }

    // Auto-approve low-value, standard requests
    const standardCategories = ['Password Reset', 'Software Request']

    return (
      standardCategories.includes(category) &&
      (!requestValue || (autoApprovalLimit && requestValue < autoApprovalLimit))
    )
  }

  /**
   * Generate request summary for notification
   */
  static generateSummary(ticket: UnifiedTicket): string {
    if (ticket.ticketType !== 'service_request') return ''

    const metadata = ticket.metadata as ServiceRequestMetadata

    let summary = `Service Request: ${ticket.title}\n`
    summary += `Category: ${ticket.category}\n`
    summary += `Priority: ${ticket.priority}\n`

    if (metadata.serviceId) {
      summary += `Service: ${metadata.serviceId}\n`
    }

    if (metadata.approvalStatus) {
      summary += `Approval Status: ${metadata.approvalStatus}\n`
    }

    return summary
  }
}
