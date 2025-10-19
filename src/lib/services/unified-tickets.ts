import { MongoClient, ObjectId, Filter, UpdateFilter } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import {
  UnifiedTicket,
  TicketType,
  CreateUnifiedTicketInput,
  UnifiedTicketStatus,
  UnifiedTicketUpdate,
  TicketMetadata,
  IncidentMetadata,
  ServiceRequestMetadata,
  ChangeMetadata,
  ProblemMetadata,
} from '@/lib/types'
import {
  generateTicketNumber,
  calculatePriority,
  isTransitionAllowed,
  getDefaultSLATimes,
  TICKET_WORKFLOWS,
} from '@/lib/ticketing/workflow-config'

/**
 * Unified Ticket Service
 * Handles all ticket operations with type-aware business logic
 */
export class UnifiedTicketService {
  /**
   * Create a new unified ticket
   */
  static async create(
    orgId: string,
    input: CreateUnifiedTicketInput,
    createdBy: string
  ): Promise<UnifiedTicket> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    // Get next ticket number
    const count = await collection.countDocuments({ orgId, ticketType: input.type })
    const ticketNumber = generateTicketNumber(input.type, count)

    // Determine initial status based on type
    const initialStatus = this.getInitialStatus(input.type)

    // Build type-specific metadata
    const metadata = this.buildMetadata(input)

    // Calculate priority for incidents/problems
    const priority = this.calculatePriority(input)

    // Calculate SLA deadlines
    const sla = this.calculateSLA(priority, new Date())

    // Build the unified ticket
    const now = new Date()
    const ticket: UnifiedTicket = {
      _id: new ObjectId(),
      orgId,
      createdAt: now,
      updatedAt: now,
      createdBy,

      ticketNumber,
      ticketType: input.type,
      title: input.title,
      description: input.description,
      status: initialStatus,
      priority,
      category: input.category || 'Uncategorized',

      requesterId: this.getRequesterId(input),
      assignedTo: this.getAssignedTo(input),

      clientId: this.getClientId(input),

      tags: input.tags || [],
      linkedAssets: this.getLinkedAssets(input),

      sla,
      metadata,
    }

    await collection.insertOne(ticket)
    return ticket
  }

  /**
   * Get all tickets for an organization with optional filters
   */
  static async getAll(
    orgId: string,
    filters?: {
      type?: TicketType
      status?: UnifiedTicketStatus
      assignedTo?: string
      requesterId?: string
      clientId?: string
      priority?: string
      search?: string
      dateFrom?: Date
      dateTo?: Date
    }
  ): Promise<UnifiedTicket[]> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    const query: Filter<UnifiedTicket> = { orgId }

    if (filters?.type) {
      query.ticketType = filters.type
    }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.assignedTo) {
      query.assignedTo = filters.assignedTo
    }

    if (filters?.requesterId) {
      query.requesterId = filters.requesterId
    }

    if (filters?.clientId) {
      query.clientId = filters.clientId
    }

    if (filters?.priority) {
      query.priority = filters.priority
    }

    if (filters?.search) {
      query.$or = [
        { ticketNumber: { $regex: filters.search, $options: 'i' } },
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ]
    }

    if (filters?.dateFrom || filters?.dateTo) {
      query.createdAt = {}
      if (filters.dateFrom) {
        query.createdAt.$gte = filters.dateFrom
      }
      if (filters.dateTo) {
        query.createdAt.$lte = filters.dateTo
      }
    }

    const tickets = await collection.find(query).sort({ createdAt: -1 }).toArray()

    return tickets.map((t) => ({ ...t, _id: t._id }))
  }

  /**
   * Get a single ticket by ID
   */
  static async getById(id: string, orgId: string): Promise<UnifiedTicket | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    const ticket = await collection.findOne({ _id: new ObjectId(id), orgId })
    return ticket ? { ...ticket, _id: ticket._id } : null
  }

  /**
   * Get a ticket by ticket number
   */
  static async getByTicketNumber(
    ticketNumber: string,
    orgId: string
  ): Promise<UnifiedTicket | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    const ticket = await collection.findOne({ ticketNumber, orgId })
    return ticket ? { ...ticket, _id: ticket._id } : null
  }

  /**
   * Update ticket status with workflow validation
   */
  static async updateStatus(
    id: string,
    orgId: string,
    newStatus: UnifiedTicketStatus,
    updatedBy: string
  ): Promise<UnifiedTicket | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    const ticket = await this.getById(id, orgId)
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    // Validate status transition
    if (!isTransitionAllowed(ticket.ticketType, ticket.status, newStatus)) {
      throw new Error(`Invalid status transition from ${ticket.status} to ${newStatus}`)
    }

    const update: UpdateFilter<UnifiedTicket> = {
      $set: {
        status: newStatus,
        updatedAt: new Date(),
      },
    }

    // Set resolved/closed timestamps
    if (newStatus === 'resolved' && !ticket.resolvedAt) {
      update.$set.resolvedAt = new Date()
    }

    if (newStatus === 'closed' && !ticket.closedAt) {
      update.$set.closedAt = new Date()
    }

    await collection.updateOne({ _id: new ObjectId(id), orgId }, update)

    return this.getById(id, orgId)
  }

  /**
   * Update ticket assignment
   */
  static async assign(
    id: string,
    orgId: string,
    assignedTo: string,
    assignedToName?: string
  ): Promise<UnifiedTicket | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    await collection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          assignedTo,
          assignedToName,
          updatedAt: new Date(),
        },
      }
    )

    return this.getById(id, orgId)
  }

  /**
   * Update ticket (general purpose)
   */
  static async update(
    id: string,
    orgId: string,
    updates: Partial<UnifiedTicket>
  ): Promise<UnifiedTicket | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    // Remove fields that shouldn't be directly updated
    const { _id, orgId: _, createdAt, createdBy, ticketNumber, ...safeUpdates } = updates as any

    await collection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          ...safeUpdates,
          updatedAt: new Date(),
        },
      }
    )

    return this.getById(id, orgId)
  }

  /**
   * Handle approval (for changes and service requests)
   */
  static async approve(
    id: string,
    orgId: string,
    approvedBy: string,
    approvedByName?: string,
    notes?: string
  ): Promise<UnifiedTicket | null> {
    const ticket = await this.getById(id, orgId)
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    if (!['change', 'service_request'].includes(ticket.ticketType)) {
      throw new Error('Only changes and service requests can be approved')
    }

    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    const update: any = {
      $set: {
        'metadata.approvalStatus': 'approved',
        'metadata.approvedBy': approvedBy,
        'metadata.approvedByName': approvedByName,
        'metadata.approvedAt': new Date(),
        updatedAt: new Date(),
      },
    }

    // Update status based on type
    if (ticket.ticketType === 'change') {
      update.$set.status = 'approved'
      if (notes) {
        update.$set['metadata.cabNotes'] = notes
      }
    } else if (ticket.ticketType === 'service_request') {
      update.$set.status = 'approved'
    }

    await collection.updateOne({ _id: new ObjectId(id), orgId }, update)

    return this.getById(id, orgId)
  }

  /**
   * Handle rejection (for changes and service requests)
   */
  static async reject(
    id: string,
    orgId: string,
    reason: string,
    rejectedBy: string
  ): Promise<UnifiedTicket | null> {
    const ticket = await this.getById(id, orgId)
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    if (!['change', 'service_request'].includes(ticket.ticketType)) {
      throw new Error('Only changes and service requests can be rejected')
    }

    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    await collection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status: 'rejected',
          'metadata.approvalStatus': 'rejected',
          'metadata.rejectionReason': reason,
          updatedAt: new Date(),
        },
      }
    )

    return this.getById(id, orgId)
  }

  /**
   * Add an update (for incidents and problems)
   */
  static async addUpdate(
    ticketId: string,
    orgId: string,
    updateData: {
      message: string
      updateType?: string
      status?: UnifiedTicketStatus
      isPublic?: boolean
    },
    createdBy: string,
    createdByName?: string
  ): Promise<UnifiedTicketUpdate> {
    const ticket = await this.getById(ticketId, orgId)
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    if (!['incident', 'problem'].includes(ticket.ticketType)) {
      throw new Error('Only incidents and problems support updates')
    }

    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketUpdate>('unified_ticket_updates')

    const update: UnifiedTicketUpdate = {
      _id: new ObjectId(),
      ticketId,
      ticketType: ticket.ticketType,
      orgId,
      updateType: updateData.updateType || 'general',
      status: updateData.status,
      message: updateData.message,
      createdBy,
      createdByName,
      createdAt: new Date(),
      isPublic: updateData.isPublic,
    }

    await collection.insertOne(update)

    // Update ticket status if provided
    if (updateData.status) {
      await this.updateStatus(ticketId, orgId, updateData.status, createdBy)
    }

    return update
  }

  /**
   * Get updates for a ticket
   */
  static async getUpdates(ticketId: string, orgId: string): Promise<UnifiedTicketUpdate[]> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketUpdate>('unified_ticket_updates')

    const updates = await collection.find({ ticketId, orgId }).sort({ createdAt: -1 }).toArray()

    return updates.map((u) => ({ ...u, _id: u._id }))
  }

  /**
   * Delete a ticket (soft delete)
   */
  static async delete(id: string, orgId: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    const result = await collection.deleteOne({ _id: new ObjectId(id), orgId })
    return result.deletedCount > 0
  }

  /**
   * Get ticket statistics
   */
  static async getStats(orgId: string, filters?: { type?: TicketType }) {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicket>('unified_tickets')

    const query: Filter<UnifiedTicket> = { orgId }
    if (filters?.type) {
      query.ticketType = filters.type
    }

    const [total, open, resolved, breached] = await Promise.all([
      collection.countDocuments(query),
      collection.countDocuments({ ...query, status: { $in: ['new', 'open', 'investigating'] } }),
      collection.countDocuments({ ...query, status: { $in: ['resolved', 'completed'] } }),
      collection.countDocuments({ ...query, 'sla.breached': true }),
    ])

    return { total, open, resolved, breached }
  }

  // Helper methods

  private static getInitialStatus(type: TicketType): UnifiedTicketStatus {
    switch (type) {
      case 'ticket':
        return 'new'
      case 'incident':
        return 'investigating'
      case 'service_request':
        return 'submitted'
      case 'change':
        return 'draft'
      case 'problem':
        return 'open'
      default:
        return 'new'
    }
  }

  private static buildMetadata(input: CreateUnifiedTicketInput): any {
    switch (input.type) {
      case 'ticket':
        return { type: 'ticket', linkedTickets: [] }

      case 'incident':
        return {
          type: 'incident',
          severity: input.severity,
          impact: input.impact,
          urgency: input.urgency,
          affectedServices: input.affectedServices || [],
          clientIds: input.clientIds || [],
          isPublic: input.isPublic,
          startedAt: new Date(),
        }

      case 'service_request':
        return {
          type: 'service_request',
          serviceId: input.serviceId,
          formData: input.formData,
        }

      case 'change':
        return {
          type: 'change',
          risk: input.risk,
          impact: input.impact,
          plannedStartDate: input.plannedStartDate,
          plannedEndDate: input.plannedEndDate,
          affectedAssets: input.affectedAssets || [],
          relatedTickets: [],
          backoutPlan: input.backoutPlan,
          testPlan: input.testPlan,
          implementationPlan: input.implementationPlan,
        }

      case 'problem':
        return {
          type: 'problem',
          impact: input.impact,
          urgency: input.urgency,
          relatedIncidents: input.relatedIncidents || [],
          affectedServices: input.affectedServices || [],
          clientIds: input.clientIds || [],
          isPublic: input.isPublic,
          startedAt: new Date(),
        }

      default:
        return { type: 'ticket' }
    }
  }

  private static calculatePriority(input: CreateUnifiedTicketInput): string {
    if (input.type === 'incident' || input.type === 'problem') {
      return calculatePriority(input.impact, input.urgency)
    }
    return input.priority || 'medium'
  }

  private static calculateSLA(priority: string, startTime: Date) {
    const times = getDefaultSLATimes(priority)

    return {
      responseTime: times.responseTime,
      resolutionTime: times.resolutionTime,
      responseDeadline: new Date(startTime.getTime() + times.responseTime * 60000),
      resolutionDeadline: new Date(startTime.getTime() + times.resolutionTime * 60000),
      breached: false,
    }
  }

  private static getRequesterId(input: CreateUnifiedTicketInput): string {
    if (input.type === 'ticket' || input.type === 'service_request') {
      return input.requesterId
    }
    if (input.type === 'change') {
      return input.requestedBy
    }
    if (input.type === 'problem') {
      return input.reportedBy
    }
    return ''
  }

  private static getAssignedTo(input: CreateUnifiedTicketInput): string | undefined {
    return 'assignedTo' in input ? input.assignedTo : undefined
  }

  private static getClientId(input: CreateUnifiedTicketInput): string | undefined {
    if ('clientId' in input) {
      return input.clientId
    }
    if (input.type === 'incident' && input.clientIds?.length === 1) {
      return input.clientIds[0]
    }
    if (input.type === 'problem' && input.clientIds?.length === 1) {
      return input.clientIds[0]
    }
    return undefined
  }

  private static getLinkedAssets(input: CreateUnifiedTicketInput): string[] {
    if (input.type === 'ticket' && input.linkedAssets) {
      return input.linkedAssets
    }
    if (input.type === 'change' && input.affectedAssets) {
      return input.affectedAssets
    }
    return []
  }
}
