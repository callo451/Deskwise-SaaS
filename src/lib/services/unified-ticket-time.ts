import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { UnifiedTicketTimeEntry, ActiveTimer, UnifiedTicket } from '@/lib/types'

export interface AddTimeEntryInput {
  description: string
  hours: number
  minutes: number
  isBillable: boolean
}

export interface StartTimerInput {
  description?: string
}

export interface StopTimerInput {
  description: string
  isBillable: boolean
}

export interface TimeEntryStats {
  totalHours: number
  totalMinutes: number
  billableHours: number
  billableMinutes: number
  nonBillableHours: number
  nonBillableMinutes: number
  entryCount: number
  entriesByUser: Array<{
    userId: string
    userName: string
    totalHours: number
    totalMinutes: number
    billableHours: number
    billableMinutes: number
  }>
}

export class UnifiedTicketTimeService {
  /**
   * Add a manual time entry to a unified ticket
   */
  static async addTimeEntry(
    ticketId: string,
    orgId: string,
    userId: string,
    userName: string,
    input: AddTimeEntryInput
  ): Promise<UnifiedTicketTimeEntry> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<UnifiedTicketTimeEntry>(
      COLLECTIONS.UNIFIED_TICKET_TIME_ENTRIES
    )

    const now = new Date()

    const timeEntry: Omit<UnifiedTicketTimeEntry, '_id'> = {
      ticketId,
      orgId,
      userId,
      userName,
      description: input.description,
      hours: input.hours,
      minutes: input.minutes,
      isBillable: input.isBillable,
      createdAt: now,
    }

    const result = await timeEntriesCollection.insertOne(timeEntry as UnifiedTicketTimeEntry)

    // Update ticket's total time spent
    await this.updateTicketTotalTime(ticketId, orgId)

    return {
      ...timeEntry,
      _id: result.insertedId,
    } as UnifiedTicketTimeEntry
  }

  /**
   * Get all time entries for a unified ticket
   */
  static async getTimeEntries(
    ticketId: string,
    orgId: string
  ): Promise<UnifiedTicketTimeEntry[]> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<UnifiedTicketTimeEntry>(
      COLLECTIONS.UNIFIED_TICKET_TIME_ENTRIES
    )

    return await timeEntriesCollection
      .find({ ticketId, orgId })
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Calculate total time for a ticket
   */
  static async getTotalTime(ticketId: string, orgId: string): Promise<{
    totalHours: number
    totalMinutes: number
    billableHours: number
    billableMinutes: number
  }> {
    const entries = await this.getTimeEntries(ticketId, orgId)

    let totalMinutes = 0
    let billableMinutes = 0

    entries.forEach((entry) => {
      const entryTotalMinutes = entry.hours * 60 + entry.minutes
      totalMinutes += entryTotalMinutes
      if (entry.isBillable) {
        billableMinutes += entryTotalMinutes
      }
    })

    return {
      totalHours: Math.floor(totalMinutes / 60),
      totalMinutes: totalMinutes % 60,
      billableHours: Math.floor(billableMinutes / 60),
      billableMinutes: billableMinutes % 60,
    }
  }

  /**
   * Start a timer for a unified ticket
   */
  static async startTimer(
    ticketId: string,
    orgId: string,
    userId: string,
    input?: StartTimerInput
  ): Promise<ActiveTimer> {
    const db = await getDatabase()
    const activeTimersCollection = db.collection<ActiveTimer>(COLLECTIONS.ACTIVE_TIMERS)

    // Check if user already has a running timer for this ticket
    const existingTimer = await activeTimersCollection.findOne({
      ticketId,
      orgId,
      userId,
    })

    if (existingTimer) {
      throw new Error('Timer already running for this ticket')
    }

    const now = new Date()

    const timer: Omit<ActiveTimer, '_id'> = {
      ticketId,
      orgId,
      userId,
      startTime: now,
      description: input?.description,
    }

    const result = await activeTimersCollection.insertOne(timer as ActiveTimer)

    return {
      ...timer,
      _id: result.insertedId,
    } as ActiveTimer
  }

  /**
   * Stop a running timer and create a time entry
   */
  static async stopTimer(
    ticketId: string,
    orgId: string,
    userId: string,
    userName: string,
    input: StopTimerInput
  ): Promise<UnifiedTicketTimeEntry> {
    const db = await getDatabase()
    const activeTimersCollection = db.collection<ActiveTimer>(COLLECTIONS.ACTIVE_TIMERS)

    // Find and delete the active timer
    const timer = await activeTimersCollection.findOneAndDelete({
      ticketId,
      orgId,
      userId,
    })

    if (!timer) {
      throw new Error('No active timer found for this ticket')
    }

    // Calculate elapsed time
    const endTime = new Date()
    const elapsedMs = endTime.getTime() - timer.startTime.getTime()
    const elapsedMinutes = Math.floor(elapsedMs / 60000)

    const hours = Math.floor(elapsedMinutes / 60)
    const minutes = elapsedMinutes % 60

    // Create time entry
    const timeEntry = await this.addTimeEntry(
      ticketId,
      orgId,
      userId,
      userName,
      {
        description: input.description,
        hours,
        minutes,
        isBillable: input.isBillable,
      }
    )

    // Store start and end times in the entry
    const timeEntriesCollection = db.collection<UnifiedTicketTimeEntry>(
      COLLECTIONS.UNIFIED_TICKET_TIME_ENTRIES
    )

    await timeEntriesCollection.updateOne(
      { _id: timeEntry._id },
      {
        $set: {
          startTime: timer.startTime,
          endTime,
        },
      }
    )

    return {
      ...timeEntry,
      startTime: timer.startTime,
      endTime,
    }
  }

  /**
   * Get active timer for a user on a specific ticket
   */
  static async getActiveTimer(
    ticketId: string,
    userId: string,
    orgId: string
  ): Promise<ActiveTimer | null> {
    const db = await getDatabase()
    const activeTimersCollection = db.collection<ActiveTimer>(COLLECTIONS.ACTIVE_TIMERS)

    return await activeTimersCollection.findOne({
      ticketId,
      userId,
      orgId,
    })
  }

  /**
   * Get all active timers for a user
   */
  static async getUserActiveTimers(userId: string, orgId: string): Promise<ActiveTimer[]> {
    const db = await getDatabase()
    const activeTimersCollection = db.collection<ActiveTimer>(COLLECTIONS.ACTIVE_TIMERS)

    return await activeTimersCollection.find({ userId, orgId }).toArray()
  }

  /**
   * Delete a time entry
   */
  static async deleteTimeEntry(
    entryId: string,
    orgId: string,
    userId?: string
  ): Promise<boolean> {
    const db = await getDatabase()
    const timeEntriesCollection = db.collection<UnifiedTicketTimeEntry>(
      COLLECTIONS.UNIFIED_TICKET_TIME_ENTRIES
    )

    const entry = await timeEntriesCollection.findOne({
      _id: new ObjectId(entryId),
      orgId,
    })

    if (!entry) {
      return false
    }

    // If userId is provided, only allow deletion of own entries (unless admin check is done at API level)
    if (userId && entry.userId !== userId) {
      throw new Error('You can only delete your own time entries')
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
   * Update ticket's total time spent (in hours, decimal format)
   */
  private static async updateTicketTotalTime(
    ticketId: string,
    orgId: string
  ): Promise<void> {
    const db = await getDatabase()
    const unifiedTicketsCollection = db.collection<UnifiedTicket>(COLLECTIONS.UNIFIED_TICKETS)

    const { totalHours, totalMinutes } = await this.getTotalTime(ticketId, orgId)

    // Convert to decimal hours (e.g., 1 hour 30 minutes = 1.5 hours)
    const totalTimeSpent = totalHours + totalMinutes / 60

    await unifiedTicketsCollection.updateOne(
      { _id: new ObjectId(ticketId), orgId },
      {
        $set: {
          totalTimeSpent,
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
    const entries = await this.getTimeEntries(ticketId, orgId)

    let totalMinutes = 0
    let billableMinutes = 0

    // Map of userId to user stats
    const userMap = new Map<
      string,
      { userName: string; totalMinutes: number; billableMinutes: number }
    >()

    entries.forEach((entry) => {
      const entryTotalMinutes = entry.hours * 60 + entry.minutes
      totalMinutes += entryTotalMinutes

      if (entry.isBillable) {
        billableMinutes += entryTotalMinutes
      }

      const existing = userMap.get(entry.userId)
      if (existing) {
        existing.totalMinutes += entryTotalMinutes
        if (entry.isBillable) {
          existing.billableMinutes += entryTotalMinutes
        }
      } else {
        userMap.set(entry.userId, {
          userName: entry.userName,
          totalMinutes: entryTotalMinutes,
          billableMinutes: entry.isBillable ? entryTotalMinutes : 0,
        })
      }
    })

    const nonBillableMinutes = totalMinutes - billableMinutes

    const entriesByUser = Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      totalHours: Math.floor(data.totalMinutes / 60),
      totalMinutes: data.totalMinutes % 60,
      billableHours: Math.floor(data.billableMinutes / 60),
      billableMinutes: data.billableMinutes % 60,
    }))

    return {
      totalHours: Math.floor(totalMinutes / 60),
      totalMinutes: totalMinutes % 60,
      billableHours: Math.floor(billableMinutes / 60),
      billableMinutes: billableMinutes % 60,
      nonBillableHours: Math.floor(nonBillableMinutes / 60),
      nonBillableMinutes: nonBillableMinutes % 60,
      entryCount: entries.length,
      entriesByUser,
    }
  }
}
