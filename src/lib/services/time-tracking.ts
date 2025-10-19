import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { TimeEntry, Ticket } from '@/lib/types'

export interface CreateTimeEntryInput {
  ticketId: string
  userId: string
  userName: string
  description: string
  isBillable: boolean
}

export interface ManualTimeEntryInput {
  ticketId: string
  userId: string
  userName: string
  description: string
  duration: number // minutes
  isBillable: boolean
  startTime?: Date // Optional for backdated entries
}

export interface TimeEntryStats {
  totalTime: number // minutes
  billableTime: number
  nonBillableTime: number
  entryCount: number
  entriesByUser: Array<{
    userId: string
    userName: string
    totalTime: number
    billableTime: number
  }>
}

export class TimeTrackingService {
  /**
   * Start a timer for a ticket
   */
  static async startTimer(
    orgId: string,
    input: CreateTimeEntryInput
  ): Promise<TimeEntry> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)

    // Check if user already has a running timer for this ticket
    const existingTimer = await timeEntriesCollection.findOne({
      orgId,
      ticketId: input.ticketId,
      userId: input.userId,
      isRunning: true,
    })

    if (existingTimer) {
      throw new Error('Timer already running for this ticket')
    }

    const now = new Date()
    const timeEntry: Omit<TimeEntry, '_id'> = {
      orgId,
      ticketId: input.ticketId,
      userId: input.userId,
      userName: input.userName,
      description: input.description,
      startTime: now,
      isBillable: input.isBillable,
      isRunning: true,
      createdAt: now,
      updatedAt: now,
    }

    const result = await timeEntriesCollection.insertOne(timeEntry as TimeEntry)

    return {
      ...timeEntry,
      _id: result.insertedId,
    } as TimeEntry
  }

  /**
   * Stop a running timer
   */
  static async stopTimer(
    entryId: string,
    orgId: string
  ): Promise<TimeEntry | null> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)

    const entry = await timeEntriesCollection.findOne({
      _id: new ObjectId(entryId),
      orgId,
      isRunning: true,
    })

    if (!entry) {
      return null
    }

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 60000) // minutes

    const result = await timeEntriesCollection.findOneAndUpdate(
      { _id: new ObjectId(entryId), orgId },
      {
        $set: {
          endTime,
          duration,
          isRunning: false,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    // Update ticket's total time spent
    if (result) {
      await this.updateTicketTotalTime(result.ticketId, orgId)
    }

    return result || null
  }

  /**
   * Log time manually (without timer)
   */
  static async logTime(
    orgId: string,
    input: ManualTimeEntryInput
  ): Promise<TimeEntry> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)

    const now = new Date()
    const startTime = input.startTime || new Date(now.getTime() - input.duration * 60000)
    const endTime = new Date(startTime.getTime() + input.duration * 60000)

    const timeEntry: Omit<TimeEntry, '_id'> = {
      orgId,
      ticketId: input.ticketId,
      userId: input.userId,
      userName: input.userName,
      description: input.description,
      startTime,
      endTime,
      duration: input.duration,
      isBillable: input.isBillable,
      isRunning: false,
      createdAt: now,
      updatedAt: now,
    }

    const result = await timeEntriesCollection.insertOne(timeEntry as TimeEntry)

    // Update ticket's total time spent
    await this.updateTicketTotalTime(input.ticketId, orgId)

    return {
      ...timeEntry,
      _id: result.insertedId,
    } as TimeEntry
  }

  /**
   * Get time entries for a ticket
   */
  static async getTimeEntries(
    ticketId: string,
    orgId: string
  ): Promise<TimeEntry[]> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)

    return await timeEntriesCollection
      .find({ ticketId, orgId })
      .sort({ startTime: -1 })
      .toArray()
  }

  /**
   * Get active timers for a user
   */
  static async getActiveTimers(
    userId: string,
    orgId: string
  ): Promise<TimeEntry[]> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)

    return await timeEntriesCollection
      .find({ userId, orgId, isRunning: true })
      .sort({ startTime: -1 })
      .toArray()
  }

  /**
   * Get all active timers for organization
   */
  static async getAllActiveTimers(orgId: string): Promise<TimeEntry[]> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)

    return await timeEntriesCollection
      .find({ orgId, isRunning: true })
      .sort({ startTime: -1 })
      .toArray()
  }

  /**
   * Update a time entry
   */
  static async updateTimeEntry(
    entryId: string,
    orgId: string,
    updates: {
      description?: string
      duration?: number
      isBillable?: boolean
    }
  ): Promise<TimeEntry | null> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)

    const entry = await timeEntriesCollection.findOne({
      _id: new ObjectId(entryId),
      orgId,
    })

    if (!entry) {
      return null
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description
    }
    if (updates.isBillable !== undefined) {
      updateData.isBillable = updates.isBillable
    }
    if (updates.duration !== undefined && !entry.isRunning) {
      updateData.duration = updates.duration
      updateData.endTime = new Date(
        entry.startTime.getTime() + updates.duration * 60000
      )
    }

    const result = await timeEntriesCollection.findOneAndUpdate(
      { _id: new ObjectId(entryId), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    // Update ticket's total time spent if duration changed
    if (result && updates.duration !== undefined) {
      await this.updateTicketTotalTime(result.ticketId, orgId)
    }

    return result || null
  }

  /**
   * Delete a time entry
   */
  static async deleteTimeEntry(
    entryId: string,
    orgId: string
  ): Promise<boolean> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)

    const entry = await timeEntriesCollection.findOne({
      _id: new ObjectId(entryId),
      orgId,
    })

    if (!entry) {
      return false
    }

    const result = await timeEntriesCollection.deleteOne({
      _id: new ObjectId(entryId),
      orgId,
    })

    // Update ticket's total time spent
    if (result.deletedCount > 0) {
      await this.updateTicketTotalTime(entry.ticketId, orgId)
    }

    return result.deletedCount > 0
  }

  /**
   * Update ticket's total time spent
   */
  static async updateTicketTotalTime(
    ticketId: string,
    orgId: string
  ): Promise<void> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    // Calculate total time from completed time entries
    const entries = await timeEntriesCollection
      .find({ ticketId, orgId, duration: { $exists: true } })
      .toArray()

    const totalTime = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

    await ticketsCollection.updateOne(
      { _id: new ObjectId(ticketId), orgId },
      {
        $set: {
          totalTimeSpent: totalTime,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Get time entry statistics for a ticket
   */
  static async getTicketTimeStats(
    ticketId: string,
    orgId: string
  ): Promise<TimeEntryStats> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)

    const entries = await timeEntriesCollection
      .find({ ticketId, orgId, duration: { $exists: true } })
      .toArray()

    const totalTime = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const billableTime = entries
      .filter((e) => e.isBillable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const nonBillableTime = totalTime - billableTime

    // Group by user
    const userMap = new Map<string, { userName: string; totalTime: number; billableTime: number }>()

    entries.forEach((entry) => {
      const existing = userMap.get(entry.userId)
      if (existing) {
        existing.totalTime += entry.duration || 0
        if (entry.isBillable) {
          existing.billableTime += entry.duration || 0
        }
      } else {
        userMap.set(entry.userId, {
          userName: entry.userName,
          totalTime: entry.duration || 0,
          billableTime: entry.isBillable ? entry.duration || 0 : 0,
        })
      }
    })

    const entriesByUser = Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      totalTime: data.totalTime,
      billableTime: data.billableTime,
    }))

    return {
      totalTime,
      billableTime,
      nonBillableTime,
      entryCount: entries.length,
      entriesByUser,
    }
  }

  /**
   * Get time entries with filters (for reports)
   */
  static async getTimeEntriesWithFilters(
    orgId: string,
    filters?: {
      userId?: string
      ticketId?: string
      startDate?: Date
      endDate?: Date
      isBillable?: boolean
    }
  ): Promise<TimeEntry[]> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)

    const query: any = { orgId, duration: { $exists: true } }

    if (filters?.userId) {
      query.userId = filters.userId
    }
    if (filters?.ticketId) {
      query.ticketId = filters.ticketId
    }
    if (filters?.isBillable !== undefined) {
      query.isBillable = filters.isBillable
    }
    if (filters?.startDate || filters?.endDate) {
      query.startTime = {}
      if (filters.startDate) {
        query.startTime.$gte = filters.startDate
      }
      if (filters.endDate) {
        query.startTime.$lte = filters.endDate
      }
    }

    return await timeEntriesCollection
      .find(query)
      .sort({ startTime: -1 })
      .toArray()
  }

  /**
   * Get time tracking statistics for reports
   */
  static async getTimeTrackingStats(
    orgId: string,
    filters?: {
      userId?: string
      startDate?: Date
      endDate?: Date
    }
  ): Promise<{
    totalTime: number
    billableTime: number
    nonBillableTime: number
    averagePerTicket: number
    ticketCount: number
    byUser: Array<{
      userId: string
      userName: string
      totalTime: number
      billableTime: number
      ticketCount: number
    }>
    byCategory: Array<{
      category: string
      totalTime: number
      ticketCount: number
    }>
  }> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<TimeEntry>(COLLECTIONS.TIME_ENTRIES)
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    // Build query
    const query: any = { orgId, duration: { $exists: true } }
    if (filters?.userId) {
      query.userId = filters.userId
    }
    if (filters?.startDate || filters?.endDate) {
      query.startTime = {}
      if (filters.startDate) {
        query.startTime.$gte = filters.startDate
      }
      if (filters.endDate) {
        query.startTime.$lte = filters.endDate
      }
    }

    const entries = await timeEntriesCollection.find(query).toArray()

    const totalTime = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const billableTime = entries
      .filter((e) => e.isBillable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const nonBillableTime = totalTime - billableTime

    // Get unique ticket IDs
    const ticketIds = [...new Set(entries.map((e) => e.ticketId))]
    const averagePerTicket = ticketIds.length > 0 ? totalTime / ticketIds.length : 0

    // Group by user
    const userMap = new Map<
      string,
      { userName: string; totalTime: number; billableTime: number; tickets: Set<string> }
    >()

    entries.forEach((entry) => {
      const existing = userMap.get(entry.userId)
      if (existing) {
        existing.totalTime += entry.duration || 0
        if (entry.isBillable) {
          existing.billableTime += entry.duration || 0
        }
        existing.tickets.add(entry.ticketId)
      } else {
        userMap.set(entry.userId, {
          userName: entry.userName,
          totalTime: entry.duration || 0,
          billableTime: entry.isBillable ? entry.duration || 0 : 0,
          tickets: new Set([entry.ticketId]),
        })
      }
    })

    const byUser = Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      totalTime: data.totalTime,
      billableTime: data.billableTime,
      ticketCount: data.tickets.size,
    }))

    // Group by ticket category
    const tickets = await ticketsCollection
      .find({
        _id: { $in: ticketIds.map((id) => new ObjectId(id)) },
        orgId,
      })
      .toArray()

    const categoryMap = new Map<string, { totalTime: number; tickets: Set<string> }>()

    entries.forEach((entry) => {
      const ticket = tickets.find((t) => t._id.toString() === entry.ticketId)
      if (ticket) {
        const existing = categoryMap.get(ticket.category)
        if (existing) {
          existing.totalTime += entry.duration || 0
          existing.tickets.add(entry.ticketId)
        } else {
          categoryMap.set(ticket.category, {
            totalTime: entry.duration || 0,
            tickets: new Set([entry.ticketId]),
          })
        }
      }
    })

    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalTime: data.totalTime,
      ticketCount: data.tickets.size,
    }))

    return {
      totalTime,
      billableTime,
      nonBillableTime,
      averagePerTicket,
      ticketCount: ticketIds.length,
      byUser,
      byCategory,
    }
  }
}
