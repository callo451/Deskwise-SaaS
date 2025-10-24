import { MongoClient, ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { UnifiedTicket, Project, ProjectTask } from '@/lib/types'

/**
 * Project-Ticket Integration Service
 * Handles bidirectional linking between tickets and projects
 */
export class ProjectTicketIntegrationService {
  /**
   * Link a ticket to a project (and optionally a specific task)
   */
  static async linkTicketToProject(
    ticketId: string,
    projectId: string,
    orgId: string,
    taskId?: string
  ): Promise<UnifiedTicket> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Validate ticket exists
    const ticket = await db.collection<UnifiedTicket>('unified_tickets').findOne({
      _id: new ObjectId(ticketId),
      orgId,
    })

    if (!ticket) {
      throw new Error('Ticket not found')
    }

    // Validate project exists
    const project = await db.collection<Project>('projects').findOne({
      _id: new ObjectId(projectId),
      orgId,
      isActive: true,
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // If taskId provided, validate task exists and belongs to project
    let task: ProjectTask | null = null
    if (taskId) {
      task = await db.collection<ProjectTask>('project_tasks').findOne({
        _id: new ObjectId(taskId),
        projectId,
        orgId,
      })

      if (!task) {
        throw new Error('Project task not found or does not belong to this project')
      }
    }

    // Update ticket with project information
    const updateFields: any = {
      projectId,
      projectName: project.name,
      updatedAt: new Date(),
    }

    if (taskId && task) {
      updateFields.projectTaskId = taskId
      updateFields.projectTaskName = task.title
    } else {
      // Clear task if linking only to project
      updateFields.projectTaskId = null
      updateFields.projectTaskName = null
    }

    const result = await db.collection<UnifiedTicket>('unified_tickets').findOneAndUpdate(
      { _id: new ObjectId(ticketId), orgId },
      { $set: updateFields },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Failed to link ticket to project')
    }

    // Create audit log entry
    await this.createAuditLog(
      orgId,
      ticketId,
      projectId,
      taskId,
      'linked',
      ticket.createdBy
    )

    return result
  }

  /**
   * Unlink a ticket from its project
   */
  static async unlinkTicketFromProject(
    ticketId: string,
    orgId: string,
    userId: string
  ): Promise<UnifiedTicket> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get ticket to capture project info for audit log
    const ticket = await db.collection<UnifiedTicket>('unified_tickets').findOne({
      _id: new ObjectId(ticketId),
      orgId,
    })

    if (!ticket) {
      throw new Error('Ticket not found')
    }

    if (!ticket.projectId) {
      throw new Error('Ticket is not linked to any project')
    }

    const projectId = ticket.projectId
    const taskId = ticket.projectTaskId

    // Remove project fields from ticket
    const result = await db.collection<UnifiedTicket>('unified_tickets').findOneAndUpdate(
      { _id: new ObjectId(ticketId), orgId },
      {
        $set: { updatedAt: new Date() },
        $unset: {
          projectId: '',
          projectName: '',
          projectTaskId: '',
          projectTaskName: '',
        },
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Failed to unlink ticket from project')
    }

    // Create audit log entry
    await this.createAuditLog(orgId, ticketId, projectId, taskId, 'unlinked', userId)

    return result
  }

  /**
   * Get all tickets linked to a project
   */
  static async getProjectTickets(
    projectId: string,
    orgId: string,
    filters?: {
      taskId?: string
      status?: string
      assignedTo?: string
      priority?: string
    }
  ): Promise<UnifiedTicket[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = {
      orgId,
      projectId,
    }

    if (filters?.taskId) {
      query.projectTaskId = filters.taskId
    }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.assignedTo) {
      query.assignedTo = filters.assignedTo
    }

    if (filters?.priority) {
      query.priority = filters.priority
    }

    const tickets = await db
      .collection<UnifiedTicket>('unified_tickets')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return tickets
  }

  /**
   * Get all tickets linked to a specific project task
   */
  static async getTaskTickets(
    taskId: string,
    projectId: string,
    orgId: string
  ): Promise<UnifiedTicket[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const tickets = await db
      .collection<UnifiedTicket>('unified_tickets')
      .find({
        orgId,
        projectId,
        projectTaskId: taskId,
      })
      .sort({ createdAt: -1 })
      .toArray()

    return tickets
  }

  /**
   * Sync ticket time entries to project task hours
   * Updates task's actual hours based on all linked ticket time
   */
  static async syncTicketTimeToTask(
    ticketId: string,
    orgId: string
  ): Promise<{ synced: boolean; totalMinutes: number }> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get ticket
    const ticket = await db.collection<UnifiedTicket>('unified_tickets').findOne({
      _id: new ObjectId(ticketId),
      orgId,
    })

    if (!ticket || !ticket.projectTaskId) {
      return { synced: false, totalMinutes: 0 }
    }

    // Get all time entries for this ticket
    const timeEntries = await db
      .collection('unified_ticket_time_entries')
      .find({
        ticketId,
        orgId,
      })
      .toArray()

    // Calculate total time in minutes
    const totalMinutes = timeEntries.reduce((sum, entry) => {
      const hours = entry.hours || 0
      const minutes = entry.minutes || 0
      return sum + hours * 60 + minutes
    }, 0)

    // Update task actual hours
    const task = await db.collection<ProjectTask>('project_tasks').findOne({
      _id: new ObjectId(ticket.projectTaskId),
      orgId,
    })

    if (!task) {
      return { synced: false, totalMinutes }
    }

    // Get total time from all tickets linked to this task
    const allTaskTickets = await this.getTaskTickets(
      ticket.projectTaskId,
      ticket.projectId!,
      orgId
    )

    let totalTaskMinutes = 0
    for (const taskTicket of allTaskTickets) {
      const ticketTimeEntries = await db
        .collection('unified_ticket_time_entries')
        .find({
          ticketId: taskTicket._id.toString(),
          orgId,
        })
        .toArray()

      totalTaskMinutes += ticketTimeEntries.reduce((sum, entry) => {
        const hours = entry.hours || 0
        const minutes = entry.minutes || 0
        return sum + hours * 60 + minutes
      }, 0)
    }

    // Convert to hours
    const totalHours = totalTaskMinutes / 60

    // Update task
    await db.collection('project_tasks').updateOne(
      { _id: new ObjectId(ticket.projectTaskId), orgId },
      {
        $set: {
          actualHours: totalHours,
          updatedAt: new Date(),
        },
      }
    )

    // Recalculate task progress if estimated hours exist
    if (task.estimatedHours && task.estimatedHours > 0) {
      const percentComplete = Math.min(100, (totalHours / task.estimatedHours) * 100)
      await db.collection('project_tasks').updateOne(
        { _id: new ObjectId(ticket.projectTaskId), orgId },
        {
          $set: {
            percentComplete: Math.round(percentComplete),
          },
        }
      )
    }

    return { synced: true, totalMinutes: totalTaskMinutes }
  }

  /**
   * Bulk link multiple tickets to a project
   */
  static async bulkLinkTickets(
    ticketIds: string[],
    projectId: string,
    orgId: string,
    userId: string,
    taskId?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const ticketId of ticketIds) {
      try {
        await this.linkTicketToProject(ticketId, projectId, orgId, taskId)
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(
          `Failed to link ticket ${ticketId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return results
  }

  /**
   * Get project statistics including ticket counts
   */
  static async getProjectTicketStats(
    projectId: string,
    orgId: string
  ): Promise<{
    totalTickets: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    byType: Record<string, number>
    averageResolutionTime: number // minutes
  }> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const tickets = await this.getProjectTickets(projectId, orgId)

    const stats = {
      totalTickets: tickets.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      averageResolutionTime: 0,
    }

    let totalResolutionTime = 0
    let resolvedCount = 0

    for (const ticket of tickets) {
      // Count by status
      stats.byStatus[ticket.status] = (stats.byStatus[ticket.status] || 0) + 1

      // Count by priority
      const priority = String(ticket.priority)
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1

      // Count by type
      stats.byType[ticket.ticketType] = (stats.byType[ticket.ticketType] || 0) + 1

      // Calculate resolution time
      if (ticket.resolvedAt) {
        const resolutionTime =
          ticket.resolvedAt.getTime() - ticket.createdAt.getTime()
        totalResolutionTime += resolutionTime / (1000 * 60) // Convert to minutes
        resolvedCount++
      }
    }

    if (resolvedCount > 0) {
      stats.averageResolutionTime = Math.round(totalResolutionTime / resolvedCount)
    }

    return stats
  }

  /**
   * Get task statistics including ticket counts
   */
  static async getTaskTicketStats(
    taskId: string,
    projectId: string,
    orgId: string
  ): Promise<{
    totalTickets: number
    openTickets: number
    closedTickets: number
    totalTimeSpent: number // minutes
  }> {
    const tickets = await this.getTaskTickets(taskId, projectId, orgId)

    const stats = {
      totalTickets: tickets.length,
      openTickets: 0,
      closedTickets: 0,
      totalTimeSpent: 0,
    }

    for (const ticket of tickets) {
      if (ticket.status === 'closed') {
        stats.closedTickets++
      } else {
        stats.openTickets++
      }

      stats.totalTimeSpent += ticket.totalTimeSpent || 0
    }

    return stats
  }

  /**
   * Auto-link tickets based on title/description matching
   * Useful for retroactive project setup
   */
  static async autoLinkTicketsByKeywords(
    projectId: string,
    orgId: string,
    keywords: string[],
    userId: string,
    dryRun = false
  ): Promise<{
    matchedTickets: string[]
    linkedCount: number
    errors: string[]
  }> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const results = {
      matchedTickets: [] as string[],
      linkedCount: 0,
      errors: [] as string[],
    }

    // Build regex pattern for keywords
    const keywordRegex = new RegExp(keywords.join('|'), 'i')

    // Find tickets matching keywords that aren't already linked
    const matchedTickets = await db
      .collection<UnifiedTicket>('unified_tickets')
      .find({
        orgId,
        projectId: { $exists: false },
        $or: [
          { title: { $regex: keywordRegex } },
          { description: { $regex: keywordRegex } },
        ],
      })
      .toArray()

    results.matchedTickets = matchedTickets.map((t) => t._id.toString())

    if (!dryRun) {
      for (const ticket of matchedTickets) {
        try {
          await this.linkTicketToProject(
            ticket._id.toString(),
            projectId,
            orgId
          )
          results.linkedCount++
        } catch (error) {
          results.errors.push(
            `Failed to link ticket ${ticket.ticketNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    }

    return results
  }

  /**
   * Create audit log entry for project-ticket operations
   */
  private static async createAuditLog(
    orgId: string,
    ticketId: string,
    projectId: string,
    taskId: string | undefined,
    action: 'linked' | 'unlinked',
    userId: string
  ): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('project_audit_logs').insertOne({
      _id: new ObjectId(),
      orgId,
      action,
      resourceType: 'ticket',
      resourceId: ticketId,
      projectId,
      taskId: taskId || null,
      performedBy: userId,
      timestamp: new Date(),
      metadata: {
        ticketId,
        projectId,
        taskId: taskId || null,
      },
    })
  }
}
