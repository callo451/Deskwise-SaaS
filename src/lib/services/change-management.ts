import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { ChangeRequest, ChangeStatus, ChangeRisk, ChangeImpact } from '../types'

export interface CreateChangeRequestInput {
  title: string
  description: string
  risk: ChangeRisk
  impact: ChangeImpact
  category: string
  plannedStartDate: Date
  plannedEndDate: Date
  affectedAssets: string[]
  relatedTickets: string[]
  backoutPlan?: string
  testPlan?: string
}

export interface UpdateChangeRequestInput {
  title?: string
  description?: string
  status?: ChangeStatus
  risk?: ChangeRisk
  impact?: ChangeImpact
  category?: string
  assignedTo?: string
  plannedStartDate?: Date
  plannedEndDate?: Date
  actualStartDate?: Date
  actualEndDate?: Date
  affectedAssets?: string[]
  relatedTickets?: string[]
  backoutPlan?: string
  testPlan?: string
}

export interface ChangeRequestFilters {
  status?: ChangeStatus
  risk?: ChangeRisk
  impact?: ChangeImpact
  category?: string
  assignedTo?: string
  search?: string
}

export class ChangeManagementService {
  /**
   * Create a new change request
   */
  static async createChangeRequest(
    orgId: string,
    input: CreateChangeRequestInput,
    requestedBy: string
  ): Promise<ChangeRequest> {
    const db = await getDatabase()
    const collection = db.collection<ChangeRequest>(COLLECTIONS.CHANGE_REQUESTS)

    // Generate change number
    const count = await collection.countDocuments({ orgId })
    const changeNumber = `CHG-${String(count + 1).padStart(4, '0')}`

    const changeRequest: ChangeRequest = {
      _id: new ObjectId(),
      orgId,
      changeNumber,
      title: input.title,
      description: input.description,
      status: 'draft',
      risk: input.risk,
      impact: input.impact,
      category: input.category,
      requestedBy,
      plannedStartDate: input.plannedStartDate,
      plannedEndDate: input.plannedEndDate,
      affectedAssets: input.affectedAssets,
      relatedTickets: input.relatedTickets,
      backoutPlan: input.backoutPlan,
      testPlan: input.testPlan,
      createdBy: requestedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    await collection.insertOne(changeRequest)

    return changeRequest
  }

  /**
   * Get all change requests with optional filters
   */
  static async getChangeRequests(
    orgId: string,
    filters?: ChangeRequestFilters
  ): Promise<ChangeRequest[]> {
    const db = await getDatabase()
    const collection = db.collection<ChangeRequest>(COLLECTIONS.CHANGE_REQUESTS)

    const query: any = { orgId, isActive: true }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.risk) {
      query.risk = filters.risk
    }

    if (filters?.impact) {
      query.impact = filters.impact
    }

    if (filters?.category) {
      query.category = filters.category
    }

    if (filters?.assignedTo) {
      query.assignedTo = filters.assignedTo
    }

    if (filters?.search) {
      query.$or = [
        { changeNumber: { $regex: filters.search, $options: 'i' } },
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ]
    }

    const changeRequests = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return changeRequests
  }

  /**
   * Get change request by ID
   */
  static async getChangeRequestById(
    id: string,
    orgId: string
  ): Promise<ChangeRequest | null> {
    const db = await getDatabase()
    const collection = db.collection<ChangeRequest>(COLLECTIONS.CHANGE_REQUESTS)

    const changeRequest = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
      isActive: true,
    })

    return changeRequest
  }

  /**
   * Update change request
   */
  static async updateChangeRequest(
    id: string,
    orgId: string,
    updates: UpdateChangeRequestInput
  ): Promise<ChangeRequest | null> {
    const db = await getDatabase()
    const collection = db.collection<ChangeRequest>(COLLECTIONS.CHANGE_REQUESTS)

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
   * Approve change request
   */
  static async approveChangeRequest(
    id: string,
    orgId: string,
    approvedBy: string
  ): Promise<ChangeRequest | null> {
    const db = await getDatabase()
    const collection = db.collection<ChangeRequest>(COLLECTIONS.CHANGE_REQUESTS)

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId, isActive: true },
      {
        $set: {
          status: 'approved',
          approvedBy,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Reject change request
   */
  static async rejectChangeRequest(
    id: string,
    orgId: string,
    rejectedBy: string,
    rejectionReason: string
  ): Promise<ChangeRequest | null> {
    const db = await getDatabase()
    const collection = db.collection<ChangeRequest>(COLLECTIONS.CHANGE_REQUESTS)

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId, isActive: true },
      {
        $set: {
          status: 'rejected',
          rejectionReason,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete change request (soft delete)
   */
  static async deleteChangeRequest(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<ChangeRequest>(COLLECTIONS.CHANGE_REQUESTS)

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
   * Get change request statistics
   */
  static async getChangeRequestStats(orgId: string) {
    const db = await getDatabase()
    const collection = db.collection<ChangeRequest>(COLLECTIONS.CHANGE_REQUESTS)

    const [
      totalChanges,
      pendingApproval,
      scheduled,
      completedLast30Days,
    ] = await Promise.all([
      collection.countDocuments({ orgId, isActive: true }),
      collection.countDocuments({
        orgId,
        isActive: true,
        status: 'pending_approval',
      }),
      collection.countDocuments({
        orgId,
        isActive: true,
        status: 'scheduled',
      }),
      collection.countDocuments({
        orgId,
        isActive: true,
        status: 'completed',
        updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ])

    // Get changes by risk
    const byRisk = await collection
      .aggregate([
        { $match: { orgId, isActive: true } },
        { $group: { _id: '$risk', count: { $sum: 1 } } },
      ])
      .toArray()

    const riskStats = {
      low: 0,
      medium: 0,
      high: 0,
    }

    byRisk.forEach((item) => {
      if (item._id in riskStats) {
        riskStats[item._id as keyof typeof riskStats] = item.count
      }
    })

    // Get changes by status
    const byStatus = await collection
      .aggregate([
        { $match: { orgId, isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .toArray()

    const statusStats: Record<string, number> = {}
    byStatus.forEach((item) => {
      statusStats[item._id] = item.count
    })

    return {
      total: totalChanges,
      pendingApproval,
      scheduled,
      completedLast30Days,
      byRisk: riskStats,
      byStatus: statusStats,
    }
  }

  /**
   * Get upcoming changes (scheduled in next N days)
   */
  static async getUpcomingChanges(
    orgId: string,
    daysAhead: number = 7
  ): Promise<ChangeRequest[]> {
    const db = await getDatabase()
    const collection = db.collection<ChangeRequest>(COLLECTIONS.CHANGE_REQUESTS)

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysAhead)

    const changes = await collection
      .find({
        orgId,
        isActive: true,
        status: { $in: ['approved', 'scheduled'] },
        plannedStartDate: {
          $gte: new Date(),
          $lte: endDate,
        },
      })
      .sort({ plannedStartDate: 1 })
      .toArray()

    return changes
  }
}
