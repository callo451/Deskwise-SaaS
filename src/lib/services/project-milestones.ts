import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type {
  ProjectMilestone,
  MilestoneType,
  MilestoneStatus,
  GateType,
  ApprovalStatus,
  DeliverableStatus,
  GateArtifact,
  MilestoneDeliverable,
  Project,
  ProjectTask,
} from '../types'

export interface CreateMilestoneInput {
  name: string
  description: string
  type: MilestoneType
  plannedDate: Date
  baselineDate?: Date
  isGate: boolean
  gateType?: GateType
  gateArtifacts?: GateArtifact[]
  approvalRequired: boolean
  approvers?: string[]
  deliverables?: MilestoneDeliverable[]
  dependsOnMilestones?: string[]
  dependsOnTasks?: string[]
  progressWeight: number
  reminderDays?: number
  notifyUsers?: string[]
}

export interface UpdateMilestoneInput {
  name?: string
  description?: string
  type?: MilestoneType
  plannedDate?: Date
  baselineDate?: Date
  actualDate?: Date
  status?: MilestoneStatus
  isGate?: boolean
  gateType?: GateType
  gateArtifacts?: GateArtifact[]
  approvalRequired?: boolean
  approvers?: string[]
  approvalStatus?: ApprovalStatus
  rejectionReason?: string
  deliverables?: MilestoneDeliverable[]
  dependsOnMilestones?: string[]
  dependsOnTasks?: string[]
  progressWeight?: number
  reminderDays?: number
  notifyUsers?: string[]
}

export interface MilestoneFilters {
  status?: MilestoneStatus
  type?: MilestoneType
  isGate?: boolean
  dateFrom?: Date
  dateTo?: Date
}

export class MilestoneService {
  /**
   * Create a new milestone
   */
  static async createMilestone(
    projectId: string,
    orgId: string,
    input: CreateMilestoneInput,
    createdBy: string
  ): Promise<ProjectMilestone> {
    const db = await getDatabase()
    const milestonesCollection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)
    const projectsCollection = db.collection<Project>(COLLECTIONS.PROJECTS)

    // Verify project exists and belongs to org
    const project = await projectsCollection.findOne({
      _id: new ObjectId(projectId),
      orgId,
      isActive: true,
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Validate milestone date is within project dates
    const plannedDate = new Date(input.plannedDate)
    if (plannedDate < project.startDate || plannedDate > project.endDate) {
      throw new Error('Milestone date must be within project start and end dates')
    }

    // Validate dependencies exist
    if (input.dependsOnMilestones && input.dependsOnMilestones.length > 0) {
      const dependentMilestones = await milestonesCollection
        .find({
          _id: { $in: input.dependsOnMilestones.map((id) => new ObjectId(id)) },
          projectId,
          orgId,
        })
        .toArray()

      if (dependentMilestones.length !== input.dependsOnMilestones.length) {
        throw new Error('One or more dependent milestones not found')
      }
    }

    if (input.dependsOnTasks && input.dependsOnTasks.length > 0) {
      const tasksCollection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)
      const dependentTasks = await tasksCollection
        .find({
          _id: { $in: input.dependsOnTasks.map((id) => new ObjectId(id)) },
          projectId,
          orgId,
        })
        .toArray()

      if (dependentTasks.length !== input.dependsOnTasks.length) {
        throw new Error('One or more dependent tasks not found')
      }
    }

    // Create milestone
    const milestone: ProjectMilestone = {
      _id: new ObjectId(),
      projectId,
      orgId,
      name: input.name,
      description: input.description,
      type: input.type,
      plannedDate: new Date(input.plannedDate),
      baselineDate: input.baselineDate ? new Date(input.baselineDate) : undefined,
      status: 'planned',
      isGate: input.isGate,
      gateType: input.gateType,
      gateArtifacts: input.gateArtifacts || [],
      approvalRequired: input.approvalRequired,
      approvers: input.approvers || [],
      deliverables: input.deliverables || [],
      dependsOnMilestones: input.dependsOnMilestones || [],
      dependsOnTasks: input.dependsOnTasks || [],
      progressWeight: Math.max(0, Math.min(100, input.progressWeight)),
      reminderDays: input.reminderDays || 7,
      notifyUsers: input.notifyUsers || [],
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await milestonesCollection.insertOne(milestone)

    // Update project progress
    await this.updateProjectProgress(projectId, orgId)

    return milestone
  }

  /**
   * Get all milestones for a project
   */
  static async getMilestones(
    projectId: string,
    orgId: string,
    filters?: MilestoneFilters
  ): Promise<ProjectMilestone[]> {
    const db = await getDatabase()
    const collection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)

    const query: any = { projectId, orgId }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.type) {
      query.type = filters.type
    }

    if (filters?.isGate !== undefined) {
      query.isGate = filters.isGate
    }

    if (filters?.dateFrom || filters?.dateTo) {
      query.plannedDate = {}
      if (filters.dateFrom) {
        query.plannedDate.$gte = filters.dateFrom
      }
      if (filters.dateTo) {
        query.plannedDate.$lte = filters.dateTo
      }
    }

    const milestones = await collection
      .find(query)
      .sort({ plannedDate: 1 })
      .toArray()

    return milestones
  }

  /**
   * Get milestone by ID
   */
  static async getMilestoneById(
    id: string,
    orgId: string
  ): Promise<ProjectMilestone | null> {
    const db = await getDatabase()
    const collection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)

    const milestone = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
    })

    return milestone
  }

  /**
   * Update milestone
   */
  static async updateMilestone(
    id: string,
    orgId: string,
    updates: UpdateMilestoneInput
  ): Promise<ProjectMilestone | null> {
    const db = await getDatabase()
    const milestonesCollection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)

    // Get existing milestone
    const existingMilestone = await milestonesCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (!existingMilestone) {
      return null
    }

    // Validate date changes against project dates
    if (updates.plannedDate) {
      const projectsCollection = db.collection<Project>(COLLECTIONS.PROJECTS)
      const project = await projectsCollection.findOne({
        _id: new ObjectId(existingMilestone.projectId),
        orgId,
      })

      if (project) {
        const plannedDate = new Date(updates.plannedDate)
        if (plannedDate < project.startDate || plannedDate > project.endDate) {
          throw new Error('Milestone date must be within project start and end dates')
        }
      }
    }

    // Validate dependencies
    if (updates.dependsOnMilestones) {
      const dependentMilestones = await milestonesCollection
        .find({
          _id: { $in: updates.dependsOnMilestones.map((id) => new ObjectId(id)) },
          projectId: existingMilestone.projectId,
          orgId,
        })
        .toArray()

      if (dependentMilestones.length !== updates.dependsOnMilestones.length) {
        throw new Error('One or more dependent milestones not found')
      }
    }

    if (updates.dependsOnTasks) {
      const tasksCollection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)
      const dependentTasks = await tasksCollection
        .find({
          _id: { $in: updates.dependsOnTasks.map((id) => new ObjectId(id)) },
          projectId: existingMilestone.projectId,
          orgId,
        })
        .toArray()

      if (dependentTasks.length !== updates.dependsOnTasks.length) {
        throw new Error('One or more dependent tasks not found')
      }
    }

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    // Convert date strings to Date objects
    if (updates.plannedDate) {
      updateData.plannedDate = new Date(updates.plannedDate)
    }
    if (updates.baselineDate) {
      updateData.baselineDate = new Date(updates.baselineDate)
    }
    if (updates.actualDate) {
      updateData.actualDate = new Date(updates.actualDate)
    }

    // Clamp progressWeight to 0-100
    if (updates.progressWeight !== undefined) {
      updateData.progressWeight = Math.max(0, Math.min(100, updates.progressWeight))
    }

    const result = await milestonesCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    // Update project progress
    if (result) {
      await this.updateProjectProgress(existingMilestone.projectId, orgId)
    }

    return result
  }

  /**
   * Delete milestone
   */
  static async deleteMilestone(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)

    // Get milestone to get projectId
    const milestone = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (!milestone) {
      return false
    }

    // Check if any other milestones depend on this one
    const dependentMilestones = await collection
      .find({
        projectId: milestone.projectId,
        orgId,
        dependsOnMilestones: id,
      })
      .toArray()

    if (dependentMilestones.length > 0) {
      throw new Error(
        `Cannot delete milestone. ${dependentMilestones.length} other milestone(s) depend on it.`
      )
    }

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      orgId,
    })

    // Update project progress
    if (result.deletedCount > 0) {
      await this.updateProjectProgress(milestone.projectId, orgId)
    }

    return result.deletedCount > 0
  }

  /**
   * Mark milestone as achieved
   */
  static async achieveMilestone(
    id: string,
    orgId: string,
    achievedBy: string
  ): Promise<ProjectMilestone | null> {
    const db = await getDatabase()
    const milestonesCollection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)

    // Check dependencies
    const milestone = await milestonesCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (!milestone) {
      return null
    }

    // Verify all dependent milestones are achieved
    if (milestone.dependsOnMilestones.length > 0) {
      const dependentMilestones = await milestonesCollection
        .find({
          _id: { $in: milestone.dependsOnMilestones.map((id) => new ObjectId(id)) },
          orgId,
        })
        .toArray()

      const unachievedDeps = dependentMilestones.filter((m) => m.status !== 'achieved')
      if (unachievedDeps.length > 0) {
        throw new Error(
          `Cannot achieve milestone. ${unachievedDeps.length} dependent milestone(s) not yet achieved.`
        )
      }
    }

    // Verify all dependent tasks are completed
    if (milestone.dependsOnTasks.length > 0) {
      const tasksCollection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)
      const dependentTasks = await tasksCollection
        .find({
          _id: { $in: milestone.dependsOnTasks.map((id) => new ObjectId(id)) },
          orgId,
        })
        .toArray()

      const incompleteTasks = dependentTasks.filter((t) => t.status !== 'completed')
      if (incompleteTasks.length > 0) {
        throw new Error(
          `Cannot achieve milestone. ${incompleteTasks.length} dependent task(s) not yet completed.`
        )
      }
    }

    // Check approval if required
    if (milestone.approvalRequired && milestone.approvalStatus !== 'approved') {
      throw new Error('Milestone requires approval before it can be achieved')
    }

    const result = await milestonesCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status: 'achieved',
          actualDate: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    // Update project progress
    if (result) {
      await this.updateProjectProgress(milestone.projectId, orgId)
    }

    return result
  }

  /**
   * Update milestone status
   */
  static async updateMilestoneStatus(
    id: string,
    orgId: string,
    status: MilestoneStatus
  ): Promise<ProjectMilestone | null> {
    const db = await getDatabase()
    const collection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)

    const milestone = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (!milestone) {
      return null
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    // Set actualDate when achieved
    if (status === 'achieved' && !milestone.actualDate) {
      updateData.actualDate = new Date()
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    // Update project progress
    if (result) {
      await this.updateProjectProgress(milestone.projectId, orgId)
    }

    return result
  }

  /**
   * Update milestone approval status
   */
  static async updateApprovalStatus(
    id: string,
    orgId: string,
    approvalStatus: ApprovalStatus,
    approvedBy: string,
    rejectionReason?: string
  ): Promise<ProjectMilestone | null> {
    const db = await getDatabase()
    const collection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)

    const updateData: any = {
      approvalStatus,
      updatedAt: new Date(),
    }

    if (approvalStatus === 'approved') {
      updateData.approvedBy = approvedBy
      updateData.approvedAt = new Date()
    }

    if (approvalStatus === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Get milestone deliverables
   */
  static async getDeliverables(
    id: string,
    orgId: string
  ): Promise<MilestoneDeliverable[]> {
    const milestone = await this.getMilestoneById(id, orgId)
    return milestone?.deliverables || []
  }

  /**
   * Update project progress based on milestone weights and completion
   */
  static async updateProjectProgress(projectId: string, orgId: string): Promise<void> {
    const db = await getDatabase()
    const milestonesCollection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)
    const projectsCollection = db.collection<Project>(COLLECTIONS.PROJECTS)

    // Get all milestones for the project
    const milestones = await milestonesCollection
      .find({ projectId, orgId })
      .toArray()

    if (milestones.length === 0) {
      // No milestones, keep existing project progress calculation
      return
    }

    // Calculate weighted progress
    const totalWeight = milestones.reduce((sum, m) => sum + m.progressWeight, 0)

    if (totalWeight === 0) {
      // No weights assigned, fallback to simple percentage
      const achievedCount = milestones.filter((m) => m.status === 'achieved').length
      const progress = Math.round((achievedCount / milestones.length) * 100)

      await projectsCollection.updateOne(
        { _id: new ObjectId(projectId), orgId },
        {
          $set: {
            progress,
            updatedAt: new Date(),
          },
        }
      )
      return
    }

    // Calculate weighted progress
    const achievedWeight = milestones
      .filter((m) => m.status === 'achieved')
      .reduce((sum, m) => sum + m.progressWeight, 0)

    const progress = Math.round((achievedWeight / totalWeight) * 100)

    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId), orgId },
      {
        $set: {
          progress,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Get milestone statistics for a project
   */
  static async getMilestoneStats(projectId: string, orgId: string) {
    const db = await getDatabase()
    const collection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)

    const milestones = await collection.find({ projectId, orgId }).toArray()

    const stats = {
      total: milestones.length,
      planned: milestones.filter((m) => m.status === 'planned').length,
      atRisk: milestones.filter((m) => m.status === 'at_risk').length,
      achieved: milestones.filter((m) => m.status === 'achieved').length,
      missed: milestones.filter((m) => m.status === 'missed').length,
      cancelled: milestones.filter((m) => m.status === 'cancelled').length,
      gates: milestones.filter((m) => m.isGate).length,
      requiresApproval: milestones.filter((m) => m.approvalRequired).length,
      pendingApproval: milestones.filter(
        (m) => m.approvalRequired && m.approvalStatus === 'pending'
      ).length,
    }

    return stats
  }

  /**
   * Check if milestone is at risk
   */
  static async checkMilestoneRisk(id: string, orgId: string): Promise<boolean> {
    const milestone = await this.getMilestoneById(id, orgId)

    if (!milestone || milestone.status === 'achieved' || milestone.status === 'cancelled') {
      return false
    }

    const now = new Date()
    const daysUntilDue = Math.ceil(
      (milestone.plannedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Consider at risk if within reminder days and not in a terminal state
    return daysUntilDue <= milestone.reminderDays && milestone.status === 'planned'
  }

  /**
   * Auto-update milestone statuses based on dates
   */
  static async updateMilestoneStatuses(orgId: string): Promise<void> {
    const db = await getDatabase()
    const collection = db.collection<ProjectMilestone>(COLLECTIONS.PROJECT_MILESTONES)

    const now = new Date()

    // Mark overdue planned milestones as missed
    await collection.updateMany(
      {
        orgId,
        status: 'planned',
        plannedDate: { $lt: now },
      },
      {
        $set: {
          status: 'missed',
          updatedAt: new Date(),
        },
      }
    )

    // Mark at-risk milestones
    const milestones = await collection.find({ orgId, status: 'planned' }).toArray()

    for (const milestone of milestones) {
      const daysUntilDue = Math.ceil(
        (milestone.plannedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilDue <= milestone.reminderDays) {
        await collection.updateOne(
          { _id: milestone._id },
          {
            $set: {
              status: 'at_risk',
              updatedAt: new Date(),
            },
          }
        )
      }
    }
  }
}
