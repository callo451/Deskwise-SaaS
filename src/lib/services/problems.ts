import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { Problem, ProblemUpdate, ProblemStatus, ProblemPriority, ProblemImpact, ProblemUrgency } from '../types'

export interface CreateProblemInput {
  title: string
  description: string
  priority: ProblemPriority
  category: string
  impact: ProblemImpact
  urgency: ProblemUrgency
  affectedServices: string[]
  clientIds: string[]
  isPublic: boolean
  assignedTo?: string
}

export interface UpdateProblemInput {
  title?: string
  description?: string
  priority?: ProblemPriority
  category?: string
  status?: ProblemStatus
  impact?: ProblemImpact
  urgency?: ProblemUrgency
  affectedServices?: string[]
  clientIds?: string[]
  isPublic?: boolean
  assignedTo?: string
  rootCause?: string
  workaround?: string
  solution?: string
  resolvedAt?: Date
}

export interface ProblemFilters {
  status?: ProblemStatus
  priority?: ProblemPriority
  impact?: ProblemImpact
  category?: string
  assignedTo?: string
  isPublic?: boolean
  search?: string
}

export class ProblemService {
  /**
   * Create a new problem
   */
  static async createProblem(
    orgId: string,
    input: CreateProblemInput,
    createdBy: string
  ): Promise<Problem> {
    const db = await getDatabase()
    const collection = db.collection<Problem>(COLLECTIONS.PROBLEMS)

    // Generate problem number
    const count = await collection.countDocuments({ orgId })
    const problemNumber = `PRB-${String(count + 1).padStart(4, '0')}`

    const now = new Date()
    const problem: Problem = {
      _id: new ObjectId(),
      orgId,
      problemNumber,
      title: input.title,
      description: input.description,
      status: 'open',
      priority: input.priority,
      category: input.category,
      reportedBy: createdBy,
      assignedTo: input.assignedTo,
      relatedIncidents: [],
      affectedServices: input.affectedServices,
      clientIds: input.clientIds,
      impact: input.impact,
      urgency: input.urgency,
      isPublic: input.isPublic,
      startedAt: now,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    await collection.insertOne(problem)

    // Create initial update
    await this.addProblemUpdate(
      problem._id.toString(),
      orgId,
      'status',
      'open',
      `Problem created: ${input.title}`,
      createdBy
    )

    return problem
  }

  /**
   * Get all problems with optional filters
   */
  static async getProblems(
    orgId: string,
    filters?: ProblemFilters
  ): Promise<Problem[]> {
    const db = await getDatabase()
    const collection = db.collection<Problem>(COLLECTIONS.PROBLEMS)

    const query: any = { orgId }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.priority) {
      query.priority = filters.priority
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

    if (filters?.isPublic !== undefined) {
      query.isPublic = filters.isPublic
    }

    if (filters?.search) {
      query.$or = [
        { problemNumber: { $regex: filters.search, $options: 'i' } },
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ]
    }

    const problems = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return problems
  }

  /**
   * Get problem by ID
   */
  static async getProblemById(id: string, orgId: string): Promise<Problem | null> {
    const db = await getDatabase()
    const collection = db.collection<Problem>(COLLECTIONS.PROBLEMS)

    const problem = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
    })

    return problem
  }

  /**
   * Update problem
   */
  static async updateProblem(
    id: string,
    orgId: string,
    updates: UpdateProblemInput,
    updatedBy: string
  ): Promise<Problem | null> {
    const db = await getDatabase()
    const collection = db.collection<Problem>(COLLECTIONS.PROBLEMS)

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    // Set resolvedAt if status is being changed to resolved/closed
    if (updates.status === 'resolved' || updates.status === 'closed') {
      if (!updates.resolvedAt) {
        updateData.resolvedAt = new Date()
      }
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (result) {
      // Add update entry for status changes
      if (updates.status) {
        await this.addProblemUpdate(
          id,
          orgId,
          'status',
          updates.status,
          `Status changed to ${updates.status}`,
          updatedBy
        )
      }

      // Add update entry for root cause
      if (updates.rootCause) {
        await this.addProblemUpdate(
          id,
          orgId,
          'root_cause',
          undefined,
          `Root cause identified: ${updates.rootCause}`,
          updatedBy
        )
      }

      // Add update entry for workaround
      if (updates.workaround) {
        await this.addProblemUpdate(
          id,
          orgId,
          'workaround',
          undefined,
          `Workaround documented: ${updates.workaround}`,
          updatedBy
        )
      }

      // Add update entry for solution
      if (updates.solution) {
        await this.addProblemUpdate(
          id,
          orgId,
          'solution',
          undefined,
          `Solution documented: ${updates.solution}`,
          updatedBy
        )
      }
    }

    return result
  }

  /**
   * Delete problem (soft delete)
   */
  static async deleteProblem(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<Problem>(COLLECTIONS.PROBLEMS)

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      orgId,
    })

    return result.deletedCount > 0
  }

  /**
   * Link incidents to problem
   */
  static async linkIncidents(
    id: string,
    orgId: string,
    incidentIds: string[],
    updatedBy: string
  ): Promise<Problem | null> {
    const db = await getDatabase()
    const collection = db.collection<Problem>(COLLECTIONS.PROBLEMS)

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $addToSet: { relatedIncidents: { $each: incidentIds } },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    )

    if (result) {
      await this.addProblemUpdate(
        id,
        orgId,
        'general',
        undefined,
        `Linked ${incidentIds.length} incident(s) to this problem`,
        updatedBy
      )
    }

    return result
  }

  /**
   * Update root cause
   */
  static async updateRootCause(
    id: string,
    orgId: string,
    rootCause: string,
    updatedBy: string
  ): Promise<Problem | null> {
    const db = await getDatabase()
    const collection = db.collection<Problem>(COLLECTIONS.PROBLEMS)

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          rootCause,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (result) {
      await this.addProblemUpdate(
        id,
        orgId,
        'root_cause',
        undefined,
        `Root cause identified: ${rootCause}`,
        updatedBy
      )
    }

    return result
  }

  /**
   * Update solution
   */
  static async updateSolution(
    id: string,
    orgId: string,
    solution: string,
    status: ProblemStatus,
    updatedBy: string
  ): Promise<Problem | null> {
    const db = await getDatabase()
    const collection = db.collection<Problem>(COLLECTIONS.PROBLEMS)

    const updateData: any = {
      solution,
      status,
      updatedAt: new Date(),
    }

    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date()
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (result) {
      await this.addProblemUpdate(
        id,
        orgId,
        'solution',
        status,
        `Solution documented: ${solution}`,
        updatedBy
      )
    }

    return result
  }

  /**
   * Add problem update
   */
  static async addProblemUpdate(
    problemId: string,
    orgId: string,
    updateType: 'status' | 'root_cause' | 'workaround' | 'solution' | 'general',
    status: ProblemStatus | undefined,
    message: string,
    createdBy: string
  ): Promise<ProblemUpdate> {
    const db = await getDatabase()
    const collection = db.collection<ProblemUpdate>(COLLECTIONS.PROBLEM_UPDATES)

    const update: ProblemUpdate = {
      _id: new ObjectId(),
      problemId,
      orgId,
      updateType,
      status,
      message,
      createdBy,
      createdAt: new Date(),
    }

    await collection.insertOne(update)

    // Update the problem's updatedAt
    const problemsCollection = db.collection<Problem>(COLLECTIONS.PROBLEMS)
    await problemsCollection.updateOne(
      { _id: new ObjectId(problemId), orgId },
      { $set: { updatedAt: new Date() } }
    )

    return update
  }

  /**
   * Get problem updates
   */
  static async getProblemUpdates(problemId: string): Promise<ProblemUpdate[]> {
    const db = await getDatabase()
    const collection = db.collection<ProblemUpdate>(COLLECTIONS.PROBLEM_UPDATES)

    const updates = await collection
      .find({ problemId })
      .sort({ createdAt: 1 })
      .toArray()

    return updates
  }

  /**
   * Get problem statistics
   */
  static async getProblemStats(orgId: string) {
    const db = await getDatabase()
    const collection = db.collection<Problem>(COLLECTIONS.PROBLEMS)

    const [
      totalProblems,
      activeProblems,
      knownErrors,
      resolvedLast30Days,
    ] = await Promise.all([
      collection.countDocuments({ orgId }),
      collection.countDocuments({
        orgId,
        status: { $in: ['open', 'investigating'] },
      }),
      collection.countDocuments({
        orgId,
        status: 'known_error',
      }),
      collection.countDocuments({
        orgId,
        status: { $in: ['resolved', 'closed'] },
        resolvedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ])

    // Get problems by priority
    const byPriority = await collection
      .aggregate([
        { $match: { orgId, status: { $nin: ['resolved', 'closed'] } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ])
      .toArray()

    const priorityStats = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }

    byPriority.forEach((item) => {
      if (item._id in priorityStats) {
        priorityStats[item._id as keyof typeof priorityStats] = item.count
      }
    })

    // Get problems by impact
    const byImpact = await collection
      .aggregate([
        { $match: { orgId, status: { $nin: ['resolved', 'closed'] } } },
        { $group: { _id: '$impact', count: { $sum: 1 } } },
      ])
      .toArray()

    const impactStats = {
      low: 0,
      medium: 0,
      high: 0,
    }

    byImpact.forEach((item) => {
      if (item._id in impactStats) {
        impactStats[item._id as keyof typeof impactStats] = item.count
      }
    })

    return {
      total: totalProblems,
      active: activeProblems,
      knownErrors,
      resolvedLast30Days,
      byPriority: priorityStats,
      byImpact: impactStats,
    }
  }
}
