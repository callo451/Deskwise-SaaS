import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { Ticket, TicketStatus, TicketPriority } from '@/lib/types'

export interface CreateTicketInput {
  title: string
  description: string
  priority: TicketPriority
  category: string
  assignedTo?: string
  clientId?: string
  tags?: string[]
  sla?: {
    responseTime: number // minutes
    resolutionTime: number // minutes
  }
}

export interface UpdateTicketInput {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: string
  assignedTo?: string
  tags?: string[]
  attachments?: import('@/lib/types').TicketAttachment[]
}

export interface TicketFilters {
  status?: TicketStatus | TicketStatus[]
  priority?: TicketPriority | TicketPriority[]
  category?: string
  assignedTo?: string | null
  clientId?: string
  search?: string
  // Pagination
  page?: number
  limit?: number
}

export interface PaginatedTicketsResult {
  tickets: Ticket[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

export interface TicketComment {
  _id: ObjectId
  ticketId: string
  content: string
  createdBy: string
  createdAt: Date
  isInternal: boolean
}

export class TicketService {
  /**
   * Create a new ticket
   */
  static async createTicket(
    orgId: string,
    input: CreateTicketInput,
    createdBy: string
  ): Promise<Ticket> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    // Generate ticket number
    const count = await ticketsCollection.countDocuments({ orgId })
    const ticketNumber = `TKT-${(count + 1).toString().padStart(5, '0')}`

    const now = new Date()
    const ticket: Omit<Ticket, '_id'> = {
      orgId,
      ticketNumber,
      title: input.title,
      description: input.description,
      status: 'new',
      priority: input.priority,
      category: input.category,
      assignedTo: input.assignedTo,
      clientId: input.clientId,
      requesterId: createdBy,
      tags: input.tags || [],
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    // Calculate SLA deadlines if provided
    if (input.sla) {
      const responseDeadline = new Date(now.getTime() + input.sla.responseTime * 60000)
      const resolutionDeadline = new Date(now.getTime() + input.sla.resolutionTime * 60000)

      ticket.sla = {
        responseTime: input.sla.responseTime,
        resolutionTime: input.sla.resolutionTime,
        responseDeadline,
        resolutionDeadline,
        breached: false,
      }
    }

    const result = await ticketsCollection.insertOne(ticket as Ticket)

    return {
      ...ticket,
      _id: result.insertedId,
    } as Ticket
  }

  /**
   * Get ticket by ID
   */
  static async getTicketById(id: string, orgId: string): Promise<Ticket | null> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    return await ticketsCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Get tickets with filters and pagination
   */
  static async getTickets(
    orgId: string,
    filters?: TicketFilters
  ): Promise<PaginatedTicketsResult> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    const query: any = { orgId }

    if (filters?.status) {
      query.status = Array.isArray(filters.status)
        ? { $in: filters.status }
        : filters.status
    }

    if (filters?.priority) {
      query.priority = Array.isArray(filters.priority)
        ? { $in: filters.priority }
        : filters.priority
    }

    if (filters?.category) {
      query.category = filters.category
    }

    if (filters?.assignedTo !== undefined) {
      if (filters.assignedTo === null) {
        // Filter for unassigned tickets
        query.assignedTo = { $exists: false }
      } else {
        query.assignedTo = filters.assignedTo
      }
    }

    if (filters?.clientId) {
      query.clientId = filters.clientId
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { ticketNumber: { $regex: filters.search, $options: 'i' } },
      ]
    }

    // Pagination parameters
    const page = filters?.page && filters.page > 0 ? filters.page : 1
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 25
    const skip = (page - 1) * limit

    // Get total count and tickets in parallel
    const [total, tickets] = await Promise.all([
      ticketsCollection.countDocuments(query),
      ticketsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ])

    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore,
      },
    }
  }

  /**
   * Update ticket
   */
  static async updateTicket(
    id: string,
    orgId: string,
    updates: UpdateTicketInput
  ): Promise<Ticket | null> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    // If status is being changed to resolved/closed, set the timestamp
    if (updates.status === 'resolved' && !updates.status) {
      updateData.resolvedAt = new Date()
    }
    if (updates.status === 'closed') {
      updateData.closedAt = new Date()
    }

    const result = await ticketsCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Delete ticket
   */
  static async deleteTicket(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    const result = await ticketsCollection.deleteOne({
      _id: new ObjectId(id),
      orgId,
    })

    return result.deletedCount > 0
  }

  /**
   * Get ticket statistics
   */
  static async getTicketStats(orgId: string) {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    const [
      total,
      newTickets,
      openTickets,
      pendingTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      highTickets,
      slaBreached,
    ] = await Promise.all([
      ticketsCollection.countDocuments({ orgId }),
      ticketsCollection.countDocuments({ orgId, status: 'new' }),
      ticketsCollection.countDocuments({ orgId, status: 'open' }),
      ticketsCollection.countDocuments({ orgId, status: 'pending' }),
      ticketsCollection.countDocuments({ orgId, status: 'resolved' }),
      ticketsCollection.countDocuments({ orgId, status: 'closed' }),
      ticketsCollection.countDocuments({ orgId, priority: 'critical' }),
      ticketsCollection.countDocuments({ orgId, priority: 'high' }),
      ticketsCollection.countDocuments({ orgId, 'sla.breached': true }),
    ])

    const open = newTickets + openTickets + pendingTickets

    return {
      total,
      open,
      byStatus: {
        new: newTickets,
        open: openTickets,
        pending: pendingTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
      },
      byPriority: {
        critical: criticalTickets,
        high: highTickets,
      },
      slaBreached,
    }
  }

  /**
   * Get user's assigned tickets
   */
  static async getMyTickets(
    orgId: string,
    userId: string
  ): Promise<Ticket[]> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    return await ticketsCollection
      .find({
        orgId,
        $or: [{ assignedTo: userId }, { requesterId: userId }],
        status: { $in: ['new', 'open', 'pending'] },
      })
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Add comment to ticket
   */
  static async addComment(
    ticketId: string,
    orgId: string,
    content: string,
    createdBy: string,
    isInternal: boolean = false
  ): Promise<TicketComment> {
    const db = await getDatabase()
    const commentsCollection = db.collection<TicketComment>('ticket_comments')

    const comment: Omit<TicketComment, '_id'> = {
      ticketId,
      content,
      createdBy,
      createdAt: new Date(),
      isInternal,
    }

    const result = await commentsCollection.insertOne(comment as TicketComment)

    // Update ticket's updatedAt
    await db.collection<Ticket>(COLLECTIONS.TICKETS).updateOne(
      { _id: new ObjectId(ticketId), orgId },
      { $set: { updatedAt: new Date() } }
    )

    return {
      ...comment,
      _id: result.insertedId,
    } as TicketComment
  }

  /**
   * Get ticket comments (with role-based filtering)
   */
  static async getComments(
    ticketId: string,
    userRole?: string,
    userId?: string
  ): Promise<TicketComment[]> {
    const db = await getDatabase()
    const commentsCollection = db.collection<TicketComment>('ticket_comments')

    const query: any = { ticketId }

    // Filter out internal notes for end users
    // Only admins and technicians can see internal notes
    if (userRole === 'user') {
      query.isInternal = false
    }

    return await commentsCollection
      .find(query)
      .sort({ createdAt: 1 })
      .toArray()
  }

  /**
   * Check and update SLA breaches
   */
  static async checkSLABreaches(orgId: string): Promise<number> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    const now = new Date()

    const result = await ticketsCollection.updateMany(
      {
        orgId,
        status: { $in: ['new', 'open', 'pending'] },
        'sla.breached': false,
        $or: [
          { 'sla.responseDeadline': { $lt: now } },
          { 'sla.resolutionDeadline': { $lt: now } },
        ],
      },
      {
        $set: {
          'sla.breached': true,
          updatedAt: now,
        },
      }
    )

    return result.modifiedCount
  }

  /**
   * Assign ticket to user
   */
  static async assignTicket(
    ticketId: string,
    orgId: string,
    assignedTo: string | null,
    assignedBy: string
  ): Promise<Ticket | null> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)
    const auditLogsCollection = db.collection('audit_logs')

    // Get current ticket to track previous assignee
    const currentTicket = await ticketsCollection.findOne({
      _id: new ObjectId(ticketId),
      orgId,
    })

    if (!currentTicket) {
      return null
    }

    const previousAssignee = currentTicket.assignedTo

    // Update ticket assignment
    const result = await ticketsCollection.findOneAndUpdate(
      { _id: new ObjectId(ticketId), orgId },
      {
        $set: {
          assignedTo: assignedTo || undefined,
          updatedAt: new Date(),
        },
        $unset: assignedTo ? {} : { assignedTo: '' },
      },
      { returnDocument: 'after' }
    )

    // Create audit log entry
    let action = 'ticket.assigned'
    if (!assignedTo && previousAssignee) {
      action = 'ticket.unassigned'
    } else if (assignedTo && previousAssignee && assignedTo !== previousAssignee) {
      action = 'ticket.reassigned'
    }

    await auditLogsCollection.insertOne({
      orgId,
      entityType: 'ticket',
      entityId: ticketId,
      action,
      userId: assignedBy,
      timestamp: new Date(),
      details: {
        ticketNumber: currentTicket.ticketNumber,
        assignedTo,
        previousAssignee,
      },
    })

    return result || null
  }
}
