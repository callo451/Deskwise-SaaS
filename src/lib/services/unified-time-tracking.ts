import { MongoClient, ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { TimeEntry, ActiveTimeTracker, TimeEntryType, UnifiedTicket, Project, ProjectTask } from '@/lib/types'

/**
 * Unified Time Tracking Service
 * Handles time tracking for both tickets and projects
 */
export class UnifiedTimeTrackingService {
  /**
   * Log manual time entry
   */
  static async logTime(
    orgId: string,
    userId: string,
    userName: string,
    input: {
      type: TimeEntryType
      ticketId?: string
      projectId?: string
      projectTaskId?: string
      description: string
      hours: number
      minutes: number
      isBillable: boolean
      tags?: string[]
    }
  ): Promise<TimeEntry> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Validate input
    if (input.type === 'ticket' && !input.ticketId) {
      throw new Error('ticketId is required for ticket time entries')
    }
    if (input.type === 'project' && !input.projectId) {
      throw new Error('projectId is required for project time entries')
    }

    // Calculate total minutes
    const totalMinutes = input.hours * 60 + input.minutes

    // Build base entry
    const now = new Date()
    const timeEntry: TimeEntry = {
      _id: new ObjectId(),
      orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,

      type: input.type,
      userId,
      userName,
      description: input.description,
      hours: input.hours,
      minutes: input.minutes,
      totalMinutes,
      isBillable: input.isBillable,
      isRunning: false,
      source: 'manual',
      tags: input.tags || [],
    }

    // Handle ticket-specific fields
    if (input.type === 'ticket' && input.ticketId) {
      timeEntry.ticketId = input.ticketId

      // Fetch ticket number for denormalization
      const ticket = await db.collection<UnifiedTicket>('unified_tickets').findOne({
        _id: new ObjectId(input.ticketId),
        orgId,
      })

      if (!ticket) {
        throw new Error('Ticket not found')
      }

      timeEntry.ticketNumber = ticket.ticketNumber

      // Update ticket total time
      await this.updateTicketTotalTime(input.ticketId, orgId, db)
    }

    // Handle project-specific fields
    if (input.type === 'project' && input.projectId) {
      timeEntry.projectId = input.projectId

      // Fetch project name for denormalization
      const project = await db.collection<Project>('projects').findOne({
        _id: new ObjectId(input.projectId),
        orgId,
      })

      if (!project) {
        throw new Error('Project not found')
      }

      timeEntry.projectName = project.name

      // Handle task if specified
      if (input.projectTaskId) {
        timeEntry.projectTaskId = input.projectTaskId

        // Fetch task name
        const task = await db.collection<ProjectTask>('project_tasks').findOne({
          _id: new ObjectId(input.projectTaskId),
          projectId: input.projectId,
          orgId,
        })

        if (!task) {
          throw new Error('Project task not found or does not belong to this project')
        }

        timeEntry.projectTaskName = task.title

        // Update task actual hours
        await this.updateTaskActualHours(input.projectTaskId, orgId, db)
      }

      // Update project total time
      await this.updateProjectTotalTime(input.projectId, orgId, db)
    }

    // Insert time entry
    await db.collection<TimeEntry>('time_entries').insertOne(timeEntry)

    return timeEntry
  }

  /**
   * Start a timer
   */
  static async startTimer(
    orgId: string,
    userId: string,
    input: {
      type: TimeEntryType
      ticketId?: string
      projectId?: string
      projectTaskId?: string
      description?: string
    }
  ): Promise<ActiveTimeTracker> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Check if user already has an active timer
    const existingTimer = await db.collection<ActiveTimeTracker>('active_time_trackers').findOne({
      orgId,
      userId,
    })

    if (existingTimer) {
      throw new Error('You already have an active timer. Please stop it before starting a new one.')
    }

    // Validate entities exist
    if (input.type === 'ticket' && input.ticketId) {
      const ticket = await db.collection('unified_tickets').findOne({
        _id: new ObjectId(input.ticketId),
        orgId,
      })
      if (!ticket) {
        throw new Error('Ticket not found')
      }
    }

    if (input.type === 'project' && input.projectId) {
      const project = await db.collection('projects').findOne({
        _id: new ObjectId(input.projectId),
        orgId,
      })
      if (!project) {
        throw new Error('Project not found')
      }

      if (input.projectTaskId) {
        const task = await db.collection('project_tasks').findOne({
          _id: new ObjectId(input.projectTaskId),
          projectId: input.projectId,
          orgId,
        })
        if (!task) {
          throw new Error('Project task not found')
        }
      }
    }

    // Create active tracker
    const now = new Date()
    const tracker: ActiveTimeTracker = {
      _id: new ObjectId(),
      orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      type: input.type,
      ticketId: input.ticketId,
      projectId: input.projectId,
      projectTaskId: input.projectTaskId,
      userId,
      startTime: now,
      description: input.description,
    }

    await db.collection<ActiveTimeTracker>('active_time_trackers').insertOne(tracker)

    return tracker
  }

  /**
   * Stop a timer and create time entry
   */
  static async stopTimer(
    orgId: string,
    userId: string,
    userName: string,
    input: {
      description: string
      isBillable: boolean
      tags?: string[]
    }
  ): Promise<TimeEntry> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get active timer
    const tracker = await db.collection<ActiveTimeTracker>('active_time_trackers').findOne({
      orgId,
      userId,
    })

    if (!tracker) {
      throw new Error('No active timer found')
    }

    // Calculate duration
    const now = new Date()
    const durationMs = now.getTime() - tracker.startTime.getTime()
    const totalMinutes = Math.floor(durationMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    // Create time entry
    const timeEntry: TimeEntry = {
      _id: new ObjectId(),
      orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,

      type: tracker.type,
      ticketId: tracker.ticketId,
      projectId: tracker.projectId,
      projectTaskId: tracker.projectTaskId,
      userId,
      userName,
      description: input.description,
      startTime: tracker.startTime,
      endTime: now,
      hours,
      minutes,
      totalMinutes,
      isBillable: input.isBillable,
      isRunning: false,
      source: 'timer',
      tags: input.tags || [],
    }

    // Populate denormalized fields
    if (tracker.type === 'ticket' && tracker.ticketId) {
      const ticket = await db.collection<UnifiedTicket>('unified_tickets').findOne({
        _id: new ObjectId(tracker.ticketId),
        orgId,
      })
      if (ticket) {
        timeEntry.ticketNumber = ticket.ticketNumber
      }
      await this.updateTicketTotalTime(tracker.ticketId, orgId, db)
    }

    if (tracker.type === 'project' && tracker.projectId) {
      const project = await db.collection<Project>('projects').findOne({
        _id: new ObjectId(tracker.projectId),
        orgId,
      })
      if (project) {
        timeEntry.projectName = project.name
      }

      if (tracker.projectTaskId) {
        const task = await db.collection<ProjectTask>('project_tasks').findOne({
          _id: new ObjectId(tracker.projectTaskId),
          orgId,
        })
        if (task) {
          timeEntry.projectTaskName = task.title
        }
        await this.updateTaskActualHours(tracker.projectTaskId, orgId, db)
      }

      await this.updateProjectTotalTime(tracker.projectId, orgId, db)
    }

    // Insert time entry and delete tracker
    await db.collection<TimeEntry>('time_entries').insertOne(timeEntry)
    await db.collection('active_time_trackers').deleteOne({ _id: tracker._id })

    return timeEntry
  }

  /**
   * Get active timer for user
   */
  static async getActiveTimer(
    orgId: string,
    userId: string
  ): Promise<ActiveTimeTracker | null> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const tracker = await db.collection<ActiveTimeTracker>('active_time_trackers').findOne({
      orgId,
      userId,
    })

    return tracker
  }

  /**
   * Cancel active timer without creating entry
   */
  static async cancelTimer(orgId: string, userId: string): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const result = await db.collection('active_time_trackers').deleteOne({
      orgId,
      userId,
    })

    if (result.deletedCount === 0) {
      throw new Error('No active timer found')
    }
  }

  /**
   * Get time entries with filters
   */
  static async getTimeEntries(
    orgId: string,
    filters?: {
      type?: TimeEntryType
      ticketId?: string
      projectId?: string
      projectTaskId?: string
      userId?: string
      startDate?: Date
      endDate?: Date
      isBillable?: boolean
      limit?: number
    }
  ): Promise<TimeEntry[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { orgId }

    if (filters?.type) query.type = filters.type
    if (filters?.ticketId) query.ticketId = filters.ticketId
    if (filters?.projectId) query.projectId = filters.projectId
    if (filters?.projectTaskId) query.projectTaskId = filters.projectTaskId
    if (filters?.userId) query.userId = filters.userId
    if (filters?.isBillable !== undefined) query.isBillable = filters.isBillable

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {}
      if (filters.startDate) query.createdAt.$gte = filters.startDate
      if (filters.endDate) query.createdAt.$lte = filters.endDate
    }

    const entries = await db
      .collection<TimeEntry>('time_entries')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 100)
      .toArray()

    return entries
  }

  /**
   * Get time entry statistics
   */
  static async getTimeStats(
    orgId: string,
    filters?: {
      type?: TimeEntryType
      ticketId?: string
      projectId?: string
      projectTaskId?: string
      userId?: string
      startDate?: Date
      endDate?: Date
    }
  ): Promise<{
    totalMinutes: number
    totalHours: number
    billableMinutes: number
    billableHours: number
    nonBillableMinutes: number
    nonBillableHours: number
    entryCount: number
    byUser: Array<{
      userId: string
      userName: string
      totalMinutes: number
      billableMinutes: number
    }>
  }> {
    const entries = await this.getTimeEntries(orgId, { ...filters, limit: 10000 })

    const stats = {
      totalMinutes: 0,
      totalHours: 0,
      billableMinutes: 0,
      billableHours: 0,
      nonBillableMinutes: 0,
      nonBillableHours: 0,
      entryCount: entries.length,
      byUser: [] as Array<{
        userId: string
        userName: string
        totalMinutes: number
        billableMinutes: number
      }>,
    }

    const userMap = new Map<string, { userName: string; total: number; billable: number }>()

    for (const entry of entries) {
      stats.totalMinutes += entry.totalMinutes

      if (entry.isBillable) {
        stats.billableMinutes += entry.totalMinutes
      } else {
        stats.nonBillableMinutes += entry.totalMinutes
      }

      // Aggregate by user
      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, {
          userName: entry.userName,
          total: 0,
          billable: 0,
        })
      }

      const userData = userMap.get(entry.userId)!
      userData.total += entry.totalMinutes
      if (entry.isBillable) {
        userData.billable += entry.totalMinutes
      }
    }

    stats.totalHours = Math.round((stats.totalMinutes / 60) * 100) / 100
    stats.billableHours = Math.round((stats.billableMinutes / 60) * 100) / 100
    stats.nonBillableHours = Math.round((stats.nonBillableMinutes / 60) * 100) / 100

    stats.byUser = Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      totalMinutes: data.total,
      billableMinutes: data.billable,
    }))

    return stats
  }

  /**
   * Delete time entry
   */
  static async deleteTimeEntry(
    entryId: string,
    orgId: string,
    userId: string
  ): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get entry to check ownership and get IDs for updates
    const entry = await db.collection<TimeEntry>('time_entries').findOne({
      _id: new ObjectId(entryId),
      orgId,
    })

    if (!entry) {
      throw new Error('Time entry not found')
    }

    // Only allow deletion of own entries (or admins - checked at API level)
    if (entry.userId !== userId) {
      throw new Error('You can only delete your own time entries')
    }

    // Delete entry
    await db.collection('time_entries').deleteOne({ _id: new ObjectId(entryId) })

    // Update totals
    if (entry.ticketId) {
      await this.updateTicketTotalTime(entry.ticketId, orgId, db)
    }

    if (entry.projectTaskId) {
      await this.updateTaskActualHours(entry.projectTaskId, orgId, db)
    }

    if (entry.projectId) {
      await this.updateProjectTotalTime(entry.projectId, orgId, db)
    }
  }

  /**
   * Update time entry
   */
  static async updateTimeEntry(
    entryId: string,
    orgId: string,
    userId: string,
    updates: {
      description?: string
      hours?: number
      minutes?: number
      isBillable?: boolean
      tags?: string[]
    }
  ): Promise<TimeEntry> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const entry = await db.collection<TimeEntry>('time_entries').findOne({
      _id: new ObjectId(entryId),
      orgId,
    })

    if (!entry) {
      throw new Error('Time entry not found')
    }

    if (entry.userId !== userId) {
      throw new Error('You can only update your own time entries')
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.isBillable !== undefined) updateData.isBillable = updates.isBillable
    if (updates.tags !== undefined) updateData.tags = updates.tags

    // Recalculate totalMinutes if hours/minutes changed
    if (updates.hours !== undefined || updates.minutes !== undefined) {
      const newHours = updates.hours !== undefined ? updates.hours : entry.hours
      const newMinutes = updates.minutes !== undefined ? updates.minutes : entry.minutes
      updateData.hours = newHours
      updateData.minutes = newMinutes
      updateData.totalMinutes = newHours * 60 + newMinutes
    }

    const result = await db.collection<TimeEntry>('time_entries').findOneAndUpdate(
      { _id: new ObjectId(entryId), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Failed to update time entry')
    }

    // Update totals if time changed
    if (updates.hours !== undefined || updates.minutes !== undefined) {
      if (entry.ticketId) {
        await this.updateTicketTotalTime(entry.ticketId, orgId, db)
      }
      if (entry.projectTaskId) {
        await this.updateTaskActualHours(entry.projectTaskId, orgId, db)
      }
      if (entry.projectId) {
        await this.updateProjectTotalTime(entry.projectId, orgId, db)
      }
    }

    return result
  }

  /**
   * Update ticket total time spent
   */
  private static async updateTicketTotalTime(
    ticketId: string,
    orgId: string,
    db: any
  ): Promise<void> {
    const entries = await db
      .collection<TimeEntry>('time_entries')
      .find({ orgId, ticketId })
      .toArray()

    const totalMinutes = entries.reduce((sum, entry) => sum + entry.totalMinutes, 0)

    await db.collection('unified_tickets').updateOne(
      { _id: new ObjectId(ticketId), orgId },
      { $set: { totalTimeSpent: totalMinutes } }
    )
  }

  /**
   * Update project task actual hours
   */
  private static async updateTaskActualHours(
    taskId: string,
    orgId: string,
    db: any
  ): Promise<void> {
    const entries = await db
      .collection<TimeEntry>('time_entries')
      .find({ orgId, projectTaskId: taskId })
      .toArray()

    const totalMinutes = entries.reduce((sum, entry) => sum + entry.totalMinutes, 0)
    const totalHours = totalMinutes / 60

    // Update task
    const task = await db.collection<ProjectTask>('project_tasks').findOne({
      _id: new ObjectId(taskId),
      orgId,
    })

    if (!task) return

    const updates: any = {
      actualHours: totalHours,
      updatedAt: new Date(),
    }

    // Recalculate percent complete if estimated hours exist
    if (task.estimatedHours && task.estimatedHours > 0) {
      updates.percentComplete = Math.min(100, Math.round((totalHours / task.estimatedHours) * 100))
    }

    await db.collection('project_tasks').updateOne(
      { _id: new ObjectId(taskId), orgId },
      { $set: updates }
    )
  }

  /**
   * Update project total time
   */
  private static async updateProjectTotalTime(
    projectId: string,
    orgId: string,
    db: any
  ): Promise<void> {
    const entries = await db
      .collection<TimeEntry>('time_entries')
      .find({ orgId, projectId })
      .toArray()

    const totalMinutes = entries.reduce((sum, entry) => sum + entry.totalMinutes, 0)
    const totalHours = totalMinutes / 60

    await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId), orgId },
      {
        $set: {
          actualHours: totalHours,
          updatedAt: new Date(),
        },
      }
    )
  }
}
