import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type {
  Project,
  ProjectTask,
  ProjectRisk,
  ProjectChangeRequest,
  ProjectHealth,
} from '../types'

// ============================================
// Health Score Calculation Service
// ============================================

/**
 * Health score ranges (0-100):
 * - 80-100: Green (healthy)
 * - 50-79: Amber (at risk)
 * - 0-49: Red (critical)
 */

export interface HealthMetrics {
  overall: {
    health: ProjectHealth
    score: number // 0-100
    timestamp: Date
  }
  schedule: {
    health: ProjectHealth
    score: number
    details: {
      timeElapsed: number // percentage
      progressCompleted: number // percentage
      variance: number // progress - time (positive = ahead, negative = behind)
      daysRemaining: number
      estimatedCompletionDate?: Date
    }
  }
  budget: {
    health: ProjectHealth
    score: number
    details: {
      budgetTotal: number
      budgetSpent: number
      budgetRemaining: number
      spentPercentage: number
      progressPercentage: number
      variance: number // spent - progress (positive = overrun, negative = underrun)
      burnRate: number // spending per day
      projectedSpend: number
    }
  }
  scope: {
    health: ProjectHealth
    score: number
    details: {
      totalChanges: number
      approvedChanges: number
      pendingChanges: number
      rejectedChanges: number
      scopeCreep: number // percentage of approved changes
    }
  }
  risk: {
    health: ProjectHealth
    score: number
    details: {
      totalRisks: number
      highRisks: number // score >= 15
      mediumRisks: number // score 9-14
      lowRisks: number // score < 9
      openRisks: number
      mitigatedRisks: number
    }
  }
  quality: {
    health: ProjectHealth
    score: number
    details: {
      totalTasks: number
      completedTasks: number
      overdueTasksCount: number
      overdueTasks: string[]
      averageTaskCompletionRate: number
      defectRate: number // percentage of tasks with issues
    }
  }
}

export class ProjectHealthService {
  /**
   * Calculate overall health score for a project
   * Returns cached value if calculated within last 6 hours
   */
  static async calculateHealthScore(
    projectId: string,
    orgId: string,
    forceRecalculate = false
  ): Promise<HealthMetrics> {
    const db = await getDatabase()
    const projectsCollection = db.collection<Project>(COLLECTIONS.PROJECTS)

    // Get project
    const project = await projectsCollection.findOne({
      _id: new ObjectId(projectId),
      orgId,
      isActive: true,
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Check if cached health is still valid (< 6 hours old)
    if (!forceRecalculate && project.healthMetrics?.overall?.timestamp) {
      const cacheAge = Date.now() - project.healthMetrics.overall.timestamp.getTime()
      const sixHours = 6 * 60 * 60 * 1000

      if (cacheAge < sixHours) {
        return project.healthMetrics
      }
    }

    // Calculate all health metrics
    const scheduleMetrics = await this.calculateScheduleHealth(project)
    const budgetMetrics = await this.calculateBudgetHealth(project)
    const scopeMetrics = await this.calculateScopeHealth(projectId, orgId)
    const riskMetrics = await this.calculateRiskHealth(projectId, orgId)
    const qualityMetrics = await this.calculateQualityHealth(projectId, orgId)

    // Determine overall health (worst category wins)
    const healthScores = [
      scheduleMetrics.score,
      budgetMetrics.score,
      scopeMetrics.score,
      riskMetrics.score,
      qualityMetrics.score,
    ]

    // Calculate weighted average (schedule and budget are more important)
    const overallScore = Math.round(
      scheduleMetrics.score * 0.3 +
        budgetMetrics.score * 0.3 +
        riskMetrics.score * 0.2 +
        qualityMetrics.score * 0.15 +
        scopeMetrics.score * 0.05
    )

    const overallHealth = this.scoreToHealth(overallScore)

    const metrics: HealthMetrics = {
      overall: {
        health: overallHealth,
        score: overallScore,
        timestamp: new Date(),
      },
      schedule: scheduleMetrics,
      budget: budgetMetrics,
      scope: scopeMetrics,
      risk: riskMetrics,
      quality: qualityMetrics,
    }

    // Cache the result in the project
    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId), orgId },
      {
        $set: {
          health: overallHealth,
          healthScore: overallScore,
          healthMetrics: metrics,
          updatedAt: new Date(),
        },
      }
    )

    return metrics
  }

  /**
   * Calculate schedule health
   * Compares progress vs time elapsed
   */
  static async calculateScheduleHealth(project: Project) {
    const startDate = project.actualStartDate || project.plannedStartDate || project.startDate
    const endDate = project.plannedEndDate || project.endDate
    const now = new Date()

    if (!startDate || !endDate) {
      // No schedule data - default to green
      return {
        health: 'green' as ProjectHealth,
        score: 100,
        details: {
          timeElapsed: 0,
          progressCompleted: project.progress || 0,
          variance: 0,
          daysRemaining: 0,
        },
      }
    }

    // Calculate time elapsed percentage
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = Math.max(0, now.getTime() - startDate.getTime())
    const timeElapsed = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0

    // Get progress percentage
    const progressCompleted = project.progress || 0

    // Calculate variance (positive = ahead, negative = behind)
    const variance = progressCompleted - timeElapsed

    // Calculate days remaining
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    // Estimate completion date based on current velocity
    let estimatedCompletionDate: Date | undefined
    if (progressCompleted > 0 && progressCompleted < 100) {
      const velocity = progressCompleted / (elapsed / (1000 * 60 * 60 * 24)) // progress per day
      const daysNeeded = (100 - progressCompleted) / velocity
      estimatedCompletionDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000)
    }

    // Determine health
    let health: ProjectHealth
    let score: number

    if (progressCompleted >= timeElapsed) {
      // On track or ahead
      health = 'green'
      score = Math.min(100, 80 + variance / 5) // Bonus for being ahead
    } else if (progressCompleted >= timeElapsed * 0.8) {
      // Slightly behind (80-99% of expected)
      health = 'amber'
      score = 50 + (progressCompleted / timeElapsed) * 30
    } else {
      // Significantly behind (< 80% of expected)
      health = 'red'
      score = Math.max(0, (progressCompleted / timeElapsed) * 50)
    }

    return {
      health,
      score: Math.round(score),
      details: {
        timeElapsed: Math.round(timeElapsed * 10) / 10,
        progressCompleted: Math.round(progressCompleted * 10) / 10,
        variance: Math.round(variance * 10) / 10,
        daysRemaining,
        estimatedCompletionDate,
      },
    }
  }

  /**
   * Calculate budget health
   * Compares spent vs progress
   */
  static async calculateBudgetHealth(project: Project) {
    const budgetTotal = project.budget || project.forecastBudget || 0
    const budgetSpent = project.usedBudget || 0
    const progress = project.progress || 0

    if (budgetTotal === 0) {
      // No budget data - default to green
      return {
        health: 'green' as ProjectHealth,
        score: 100,
        details: {
          budgetTotal: 0,
          budgetSpent: 0,
          budgetRemaining: 0,
          spentPercentage: 0,
          progressPercentage: 0,
          variance: 0,
          burnRate: 0,
          projectedSpend: 0,
        },
      }
    }

    const budgetRemaining = budgetTotal - budgetSpent
    const spentPercentage = (budgetSpent / budgetTotal) * 100
    const progressPercentage = progress

    // Calculate variance (positive = overrun, negative = underrun)
    const variance = spentPercentage - progressPercentage

    // Calculate burn rate
    const startDate = project.actualStartDate || project.plannedStartDate || project.startDate
    const daysElapsed = startDate
      ? Math.max(1, (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 1
    const burnRate = budgetSpent / daysElapsed

    // Project final spend
    const projectedSpend = progress > 0 ? (budgetSpent / progress) * 100 : budgetSpent

    // Determine health
    let health: ProjectHealth
    let score: number

    if (spentPercentage <= progressPercentage * 1.1) {
      // Under or slightly over budget (within 110% of progress)
      health = 'green'
      score = Math.max(80, 100 - variance)
    } else if (spentPercentage <= progressPercentage * 1.25) {
      // Moderate overrun (110-125% of progress)
      health = 'amber'
      score = 50 + (1.25 * progressPercentage - spentPercentage) * 2
    } else {
      // Significant overrun (> 125% of progress)
      health = 'red'
      score = Math.max(0, 50 - (spentPercentage - progressPercentage))
    }

    return {
      health,
      score: Math.round(score),
      details: {
        budgetTotal,
        budgetSpent,
        budgetRemaining,
        spentPercentage: Math.round(spentPercentage * 10) / 10,
        progressPercentage: Math.round(progressPercentage * 10) / 10,
        variance: Math.round(variance * 10) / 10,
        burnRate: Math.round(burnRate * 100) / 100,
        projectedSpend: Math.round(projectedSpend * 100) / 100,
      },
    }
  }

  /**
   * Calculate scope health
   * Based on change requests
   */
  static async calculateScopeHealth(projectId: string, orgId: string) {
    const db = await getDatabase()

    // Check if project_change_requests collection exists
    const collections = await db.listCollections({ name: 'project_change_requests' }).toArray()

    if (collections.length === 0) {
      // Collection doesn't exist yet - default to green
      return {
        health: 'green' as ProjectHealth,
        score: 100,
        details: {
          totalChanges: 0,
          approvedChanges: 0,
          pendingChanges: 0,
          rejectedChanges: 0,
          scopeCreep: 0,
        },
      }
    }

    const changesCollection = db.collection<ProjectChangeRequest>('project_change_requests')

    const [totalChanges, approvedChanges, pendingChanges, rejectedChanges] = await Promise.all([
      changesCollection.countDocuments({ projectId, orgId }),
      changesCollection.countDocuments({ projectId, orgId, status: 'approved' }),
      changesCollection.countDocuments({
        projectId,
        orgId,
        status: { $in: ['draft', 'submitted', 'under_review'] },
      }),
      changesCollection.countDocuments({ projectId, orgId, status: 'rejected' }),
    ])

    // Calculate scope creep (approved changes as percentage of baseline)
    const scopeCreep = totalChanges > 0 ? (approvedChanges / totalChanges) * 100 : 0

    // Determine health
    let health: ProjectHealth
    let score: number

    if (approvedChanges === 0) {
      // No scope changes - perfect
      health = 'green'
      score = 100
    } else if (approvedChanges <= 3) {
      // Minimal scope changes (1-3)
      health = 'green'
      score = 90 - approvedChanges * 5
    } else if (approvedChanges <= 6) {
      // Moderate scope changes (4-6)
      health = 'amber'
      score = 70 - (approvedChanges - 3) * 5
    } else {
      // Excessive scope changes (7+)
      health = 'red'
      score = Math.max(0, 50 - (approvedChanges - 6) * 3)
    }

    return {
      health,
      score,
      details: {
        totalChanges,
        approvedChanges,
        pendingChanges,
        rejectedChanges,
        scopeCreep: Math.round(scopeCreep * 10) / 10,
      },
    }
  }

  /**
   * Calculate risk health
   * Based on open high-risk items
   */
  static async calculateRiskHealth(projectId: string, orgId: string) {
    const db = await getDatabase()

    // Check if project_risks collection exists
    const collections = await db.listCollections({ name: 'project_risks' }).toArray()

    if (collections.length === 0) {
      // Collection doesn't exist yet - default to green
      return {
        health: 'green' as ProjectHealth,
        score: 100,
        details: {
          totalRisks: 0,
          highRisks: 0,
          mediumRisks: 0,
          lowRisks: 0,
          openRisks: 0,
          mitigatedRisks: 0,
        },
      }
    }

    const risksCollection = db.collection<ProjectRisk>('project_risks')

    const risks = await risksCollection
      .find({ projectId, orgId, isActive: true })
      .toArray()

    const totalRisks = risks.length
    const highRisks = risks.filter((r) => r.riskScore >= 15 && r.status !== 'closed').length
    const mediumRisks = risks.filter((r) => r.riskScore >= 9 && r.riskScore < 15 && r.status !== 'closed').length
    const lowRisks = risks.filter((r) => r.riskScore < 9 && r.status !== 'closed').length
    const openRisks = risks.filter((r) => r.status === 'identified' || r.status === 'assessed').length
    const mitigatedRisks = risks.filter((r) => r.status === 'mitigated').length

    // Determine health based on high-risk count
    let health: ProjectHealth
    let score: number

    if (highRisks === 0) {
      // No high risks
      health = 'green'
      score = mediumRisks === 0 ? 100 : 90 - mediumRisks * 5
    } else if (highRisks <= 2) {
      // Few high risks (1-2)
      health = 'green'
      score = 85 - highRisks * 10
    } else if (highRisks <= 5) {
      // Moderate high risks (3-5)
      health = 'amber'
      score = 70 - (highRisks - 2) * 5
    } else {
      // Many high risks (6+)
      health = 'red'
      score = Math.max(0, 50 - (highRisks - 5) * 5)
    }

    return {
      health,
      score,
      details: {
        totalRisks,
        highRisks,
        mediumRisks,
        lowRisks,
        openRisks,
        mitigatedRisks,
      },
    }
  }

  /**
   * Calculate quality health
   * Based on task completion and overdue tasks
   */
  static async calculateQualityHealth(projectId: string, orgId: string) {
    const db = await getDatabase()
    const tasksCollection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)

    const tasks = await tasksCollection.find({ projectId, orgId }).toArray()

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === 'completed').length

    // Find overdue tasks
    const now = new Date()
    const overdueTasks = tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.dueDate &&
        new Date(t.dueDate) < now
    )

    const overdueTasksCount = overdueTasks.length

    // Calculate average task completion rate
    const averageTaskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Calculate defect rate (tasks with issues - would need issue tracking)
    const defectRate = 0 // Placeholder - implement when issue tracking is available

    // Determine health
    let health: ProjectHealth
    let score: number

    if (overdueTasksCount === 0) {
      // No overdue tasks
      health = 'green'
      score = Math.min(100, 80 + averageTaskCompletionRate / 5)
    } else if (overdueTasksCount <= totalTasks * 0.1) {
      // Few overdue tasks (< 10%)
      health = 'amber'
      score = 60 + (1 - overdueTasksCount / (totalTasks * 0.1)) * 20
    } else {
      // Many overdue tasks (>= 10%)
      health = 'red'
      score = Math.max(0, 50 - (overdueTasksCount / totalTasks) * 50)
    }

    return {
      health,
      score: Math.round(score),
      details: {
        totalTasks,
        completedTasks,
        overdueTasksCount,
        overdueTasks: overdueTasks.map((t) => t._id.toString()),
        averageTaskCompletionRate: Math.round(averageTaskCompletionRate * 10) / 10,
        defectRate,
      },
    }
  }

  /**
   * Get detailed health metrics for a project
   */
  static async getDetailedHealthMetrics(
    projectId: string,
    orgId: string
  ): Promise<HealthMetrics> {
    return this.calculateHealthScore(projectId, orgId, false)
  }

  /**
   * Convert numeric score to health status
   */
  private static scoreToHealth(score: number): ProjectHealth {
    if (score >= 80) return 'green'
    if (score >= 50) return 'amber'
    return 'red'
  }

  /**
   * Recalculate health for all active projects (for cron job)
   */
  static async recalculateAllProjectHealth(orgId: string): Promise<number> {
    const db = await getDatabase()
    const projectsCollection = db.collection<Project>(COLLECTIONS.PROJECTS)

    const projects = await projectsCollection
      .find({
        orgId,
        isActive: true,
        status: { $in: ['planning', 'active', 'on_hold'] },
      })
      .toArray()

    let updated = 0

    for (const project of projects) {
      try {
        await this.calculateHealthScore(project._id.toString(), orgId, true)
        updated++
      } catch (error) {
        console.error(`Failed to update health for project ${project._id}:`, error)
      }
    }

    return updated
  }
}
