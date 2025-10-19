import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { ScheduleItem, AppointmentType, AppointmentStatus } from '../types'

export interface CreateScheduleItemInput {
  title: string
  description?: string
  type: AppointmentType
  assignedTo: string
  clientId?: string
  ticketId?: string
  location?: string
  startTime: Date
  endTime: Date
  isRecurring?: boolean
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: Date
    daysOfWeek?: number[]
  }
}

export interface UpdateScheduleItemInput {
  title?: string
  description?: string
  type?: AppointmentType
  status?: AppointmentStatus
  assignedTo?: string
  clientId?: string
  ticketId?: string
  location?: string
  startTime?: Date
  endTime?: Date
}

export interface ScheduleFilters {
  assignedTo?: string
  status?: AppointmentStatus
  type?: AppointmentType
  startDate?: Date
  endDate?: Date
}

export class SchedulingService {
  /**
   * Create a new schedule item
   */
  static async createScheduleItem(
    orgId: string,
    input: CreateScheduleItemInput,
    createdBy: string
  ): Promise<ScheduleItem> {
    const db = await getDatabase()
    const collection = db.collection<ScheduleItem>(COLLECTIONS.SCHEDULE_ITEMS)

    const scheduleItem: ScheduleItem = {
      _id: new ObjectId(),
      orgId,
      title: input.title,
      description: input.description,
      type: input.type,
      status: 'scheduled',
      assignedTo: input.assignedTo,
      clientId: input.clientId,
      ticketId: input.ticketId,
      location: input.location,
      startTime: input.startTime,
      endTime: input.endTime,
      isRecurring: input.isRecurring || false,
      recurrencePattern: input.recurrencePattern,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    await collection.insertOne(scheduleItem)

    return scheduleItem
  }

  /**
   * Get all schedule items with optional filters
   */
  static async getScheduleItems(
    orgId: string,
    filters?: ScheduleFilters
  ): Promise<ScheduleItem[]> {
    const db = await getDatabase()
    const collection = db.collection<ScheduleItem>(COLLECTIONS.SCHEDULE_ITEMS)

    const query: any = { orgId, isActive: true }

    if (filters?.assignedTo) {
      query.assignedTo = filters.assignedTo
    }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.type) {
      query.type = filters.type
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

    const items = await collection
      .find(query)
      .sort({ startTime: 1 })
      .toArray()

    return items
  }

  /**
   * Get schedule items by date range
   */
  static async getScheduleByDateRange(
    orgId: string,
    startDate: Date,
    endDate: Date,
    assignedTo?: string
  ): Promise<ScheduleItem[]> {
    const db = await getDatabase()
    const collection = db.collection<ScheduleItem>(COLLECTIONS.SCHEDULE_ITEMS)

    const query: any = {
      orgId,
      isActive: true,
      startTime: {
        $gte: startDate,
        $lte: endDate,
      },
    }

    if (assignedTo) {
      query.assignedTo = assignedTo
    }

    const items = await collection
      .find(query)
      .sort({ startTime: 1 })
      .toArray()

    return items
  }

  /**
   * Get schedule item by ID
   */
  static async getScheduleItemById(
    id: string,
    orgId: string
  ): Promise<ScheduleItem | null> {
    const db = await getDatabase()
    const collection = db.collection<ScheduleItem>(COLLECTIONS.SCHEDULE_ITEMS)

    const item = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
      isActive: true,
    })

    return item
  }

  /**
   * Update schedule item
   */
  static async updateScheduleItem(
    id: string,
    orgId: string,
    updates: UpdateScheduleItemInput
  ): Promise<ScheduleItem | null> {
    const db = await getDatabase()
    const collection = db.collection<ScheduleItem>(COLLECTIONS.SCHEDULE_ITEMS)

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId, isActive: true },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete schedule item (soft delete)
   */
  static async deleteScheduleItem(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<ScheduleItem>(COLLECTIONS.SCHEDULE_ITEMS)

    const result = await collection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * Check for scheduling conflicts
   */
  static async checkConflicts(
    orgId: string,
    assignedTo: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<ScheduleItem[]> {
    const db = await getDatabase()
    const collection = db.collection<ScheduleItem>(COLLECTIONS.SCHEDULE_ITEMS)

    const query: any = {
      orgId,
      isActive: true,
      assignedTo,
      status: { $ne: 'cancelled' },
      $or: [
        // New event starts during existing event
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime },
        },
        // New event ends during existing event
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime },
        },
        // New event completely contains existing event
        {
          startTime: { $gte: startTime },
          endTime: { $lte: endTime },
        },
      ],
    }

    if (excludeId) {
      query._id = { $ne: new ObjectId(excludeId) }
    }

    const conflicts = await collection.find(query).toArray()

    return conflicts
  }

  /**
   * Get technician workload for a date range
   */
  static async getTechnicianWorkload(
    orgId: string,
    startDate: Date,
    endDate: Date
  ) {
    const db = await getDatabase()
    const collection = db.collection<ScheduleItem>(COLLECTIONS.SCHEDULE_ITEMS)

    const workload = await collection
      .aggregate([
        {
          $match: {
            orgId,
            isActive: true,
            status: { $ne: 'cancelled' },
            startTime: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: '$assignedTo',
            totalAppointments: { $sum: 1 },
            types: { $push: '$type' },
          },
        },
      ])
      .toArray()

    return workload
  }

  /**
   * Get upcoming appointments for a technician
   */
  static async getUpcomingAppointments(
    orgId: string,
    assignedTo: string,
    limit: number = 5
  ): Promise<ScheduleItem[]> {
    const db = await getDatabase()
    const collection = db.collection<ScheduleItem>(COLLECTIONS.SCHEDULE_ITEMS)

    const items = await collection
      .find({
        orgId,
        isActive: true,
        assignedTo,
        status: { $in: ['scheduled', 'in_progress'] },
        startTime: { $gte: new Date() },
      })
      .sort({ startTime: 1 })
      .limit(limit)
      .toArray()

    return items
  }
}
