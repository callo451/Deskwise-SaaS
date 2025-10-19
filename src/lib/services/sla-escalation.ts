import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { Ticket } from '@/lib/types'

// ============================================
// Types
// ============================================

export interface SLAEscalation {
  _id: ObjectId
  orgId: string
  ticketId: string
  ticketNumber: string
  threshold: 50 | 75 | 90 // Percentage of SLA time elapsed
  escalatedAt: Date
  escalatedTo?: string // User ID to escalate to
  notificationSent: boolean
  createdAt: Date
}

export interface SLAStats {
  total: number
  onTime: number
  atRisk: number // 10-25% time remaining
  critical: number // <10% time remaining
  breached: number
  compliance: number // Percentage
}

export interface TicketWithSLA {
  _id: string
  ticketNumber: string
  title: string
  status: string
  priority: string
  sla?: {
    responseTime: number
    resolutionTime: number
    responseDeadline: Date
    resolutionDeadline: Date
    breached: boolean
  }
  timeRemaining?: number // milliseconds
  percentRemaining?: number // 0-100
  slaStatus: 'on-time' | 'at-risk' | 'critical' | 'breached' | 'no-sla'
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// SLA Escalation Service
// ============================================

export class SLAEscalationService {
  /**
   * Get SLA statistics for organization
   */
  static async getSLAStats(orgId: string): Promise<SLAStats> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    // Get all active tickets with SLA
    const activeTickets = await ticketsCollection
      .find({
        orgId,
        status: { $in: ['new', 'open', 'pending'] },
        'sla.resolutionDeadline': { $exists: true },
      })
      .toArray()

    const now = new Date()
    let onTime = 0
    let atRisk = 0
    let critical = 0
    let breached = 0

    activeTickets.forEach((ticket) => {
      if (!ticket.sla) return

      if (ticket.sla.breached) {
        breached++
        return
      }

      const deadline = new Date(ticket.sla.resolutionDeadline)
      const totalTime = deadline.getTime() - new Date(ticket.createdAt).getTime()
      const timeElapsed = now.getTime() - new Date(ticket.createdAt).getTime()
      const percentElapsed = (timeElapsed / totalTime) * 100

      if (percentElapsed >= 90) {
        critical++
      } else if (percentElapsed >= 75) {
        atRisk++
      } else {
        onTime++
      }
    })

    const total = activeTickets.length
    const compliance = total > 0 ? Math.round(((onTime + atRisk) / total) * 100) : 100

    return {
      total,
      onTime,
      atRisk,
      critical,
      breached,
      compliance,
    }
  }

  /**
   * Get tickets with SLA status enriched
   */
  static async getTicketsWithSLA(
    orgId: string,
    filters?: {
      slaStatus?: 'on-time' | 'at-risk' | 'critical' | 'breached'
      limit?: number
    }
  ): Promise<TicketWithSLA[]> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    const query: any = {
      orgId,
      status: { $in: ['new', 'open', 'pending'] },
      'sla.resolutionDeadline': { $exists: true },
    }

    const tickets = await ticketsCollection
      .find(query)
      .sort({ 'sla.resolutionDeadline': 1 }) // Closest deadline first
      .limit(filters?.limit || 100)
      .toArray()

    const now = new Date()

    const enrichedTickets: TicketWithSLA[] = tickets.map((ticket) => {
      if (!ticket.sla) {
        return {
          _id: ticket._id.toString(),
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          slaStatus: 'no-sla',
          assignedTo: ticket.assignedTo,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        }
      }

      const deadline = new Date(ticket.sla.resolutionDeadline)
      const timeRemaining = deadline.getTime() - now.getTime()
      const totalTime = deadline.getTime() - new Date(ticket.createdAt).getTime()
      const timeElapsed = now.getTime() - new Date(ticket.createdAt).getTime()
      const percentRemaining = Math.max(0, ((totalTime - timeElapsed) / totalTime) * 100)

      let slaStatus: TicketWithSLA['slaStatus'] = 'on-time'
      if (ticket.sla.breached || timeRemaining < 0) {
        slaStatus = 'breached'
      } else if (percentRemaining < 10) {
        slaStatus = 'critical'
      } else if (percentRemaining < 25) {
        slaStatus = 'at-risk'
      }

      return {
        _id: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        sla: ticket.sla,
        timeRemaining,
        percentRemaining,
        slaStatus,
        assignedTo: ticket.assignedTo,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      }
    })

    // Filter by SLA status if specified
    if (filters?.slaStatus) {
      return enrichedTickets.filter((t) => t.slaStatus === filters.slaStatus)
    }

    return enrichedTickets
  }

  /**
   * Check SLA thresholds and create escalations
   * Should be run periodically (e.g., every 5 minutes)
   */
  static async checkAndEscalate(
    orgId: string,
    escalationUserId?: string
  ): Promise<{ created: number; notified: number }> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)
    const escalationsCollection = db.collection<SLAEscalation>('sla_escalations')

    const tickets = await this.getTicketsWithSLA(orgId)
    const now = new Date()

    let created = 0
    let notified = 0

    for (const ticket of tickets) {
      if (!ticket.sla || !ticket.percentRemaining) continue

      // Determine escalation thresholds
      const thresholds: Array<50 | 75 | 90> = []
      if (ticket.percentRemaining <= 50 && ticket.percentRemaining > 25) {
        thresholds.push(50)
      }
      if (ticket.percentRemaining <= 25 && ticket.percentRemaining > 10) {
        thresholds.push(75)
      }
      if (ticket.percentRemaining <= 10) {
        thresholds.push(90)
      }

      for (const threshold of thresholds) {
        // Check if escalation already exists for this threshold
        const existingEscalation = await escalationsCollection.findOne({
          orgId,
          ticketId: ticket._id,
          threshold,
        })

        if (!existingEscalation) {
          // Create escalation record
          const escalation: Omit<SLAEscalation, '_id'> = {
            orgId,
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            threshold,
            escalatedAt: now,
            escalatedTo: escalationUserId,
            notificationSent: false,
            createdAt: now,
          }

          await escalationsCollection.insertOne(escalation as SLAEscalation)
          created++

          // Send notification (placeholder - would integrate with email/notification service)
          console.log(
            `[SLA Escalation] Ticket ${ticket.ticketNumber} escalated at ${threshold}% threshold`
          )
          console.log(
            `  - Time remaining: ${this.formatTimeRemaining(ticket.timeRemaining || 0)}`
          )
          console.log(`  - Status: ${ticket.slaStatus}`)
          if (escalationUserId) {
            console.log(`  - Escalated to user: ${escalationUserId}`)
          }

          notified++

          // Mark notification as sent
          await escalationsCollection.updateOne(
            { orgId, ticketId: ticket._id, threshold },
            { $set: { notificationSent: true } }
          )
        }
      }
    }

    return { created, notified }
  }

  /**
   * Manually escalate a ticket
   */
  static async manualEscalation(
    ticketId: string,
    orgId: string,
    escalatedBy: string,
    escalatedTo?: string,
    reason?: string
  ): Promise<SLAEscalation> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)
    const escalationsCollection = db.collection<SLAEscalation>('sla_escalations')
    const auditCollection = db.collection('audit_sla_escalations')

    // Get ticket
    const ticket = await ticketsCollection.findOne({
      _id: new ObjectId(ticketId),
      orgId,
    })

    if (!ticket) {
      throw new Error('Ticket not found')
    }

    const now = new Date()

    // Create escalation record
    const escalation: Omit<SLAEscalation, '_id'> = {
      orgId,
      ticketId: ticket._id.toString(),
      ticketNumber: ticket.ticketNumber,
      threshold: 90, // Manual escalations are treated as critical
      escalatedAt: now,
      escalatedTo,
      notificationSent: true,
      createdAt: now,
    }

    const result = await escalationsCollection.insertOne(escalation as SLAEscalation)

    // Create audit trail
    await auditCollection.insertOne({
      orgId,
      ticketId,
      ticketNumber: ticket.ticketNumber,
      action: 'manual_escalation',
      escalatedBy,
      escalatedTo,
      reason,
      timestamp: now,
    })

    // Update ticket if escalating to someone
    if (escalatedTo && escalatedTo !== ticket.assignedTo) {
      await ticketsCollection.updateOne(
        { _id: new ObjectId(ticketId), orgId },
        {
          $set: {
            assignedTo: escalatedTo,
            updatedAt: now,
          },
        }
      )
    }

    console.log(`[Manual Escalation] Ticket ${ticket.ticketNumber} manually escalated by ${escalatedBy}`)
    if (escalatedTo) {
      console.log(`  - Assigned to: ${escalatedTo}`)
    }
    if (reason) {
      console.log(`  - Reason: ${reason}`)
    }

    return {
      ...escalation,
      _id: result.insertedId,
    } as SLAEscalation
  }

  /**
   * Get escalation history for a ticket
   */
  static async getEscalationHistory(
    ticketId: string,
    orgId: string
  ): Promise<SLAEscalation[]> {
    const db = await getDatabase()
    const escalationsCollection = db.collection<SLAEscalation>('sla_escalations')

    return await escalationsCollection
      .find({ orgId, ticketId })
      .sort({ escalatedAt: -1 })
      .toArray()
  }

  /**
   * Format time remaining for display
   */
  static formatTimeRemaining(milliseconds: number): string {
    if (milliseconds < 0) return 'OVERDUE'

    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

    if (hours >= 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  /**
   * Calculate SLA status color for UI
   */
  static getSLAColor(
    slaStatus: TicketWithSLA['slaStatus']
  ): {
    text: string
    bg: string
    border: string
  } {
    switch (slaStatus) {
      case 'on-time':
        return {
          text: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/20',
          border: 'border-green-500',
        }
      case 'at-risk':
        return {
          text: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-100 dark:bg-yellow-900/20',
          border: 'border-yellow-500',
        }
      case 'critical':
        return {
          text: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-100 dark:bg-orange-900/20',
          border: 'border-orange-500',
        }
      case 'breached':
        return {
          text: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/20',
          border: 'border-red-500',
        }
      default:
        return {
          text: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-900/20',
          border: 'border-gray-500',
        }
    }
  }
}
