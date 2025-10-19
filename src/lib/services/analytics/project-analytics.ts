import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ProjectStatus } from '@/lib/types'

export interface ProjectAnalyticsMetrics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onTimeDeliveryRate: number
  avgBudgetUtilization: number
  avgCompletionRate: number
  totalBudget: number
  totalUsedBudget: number
  trendData: {
    direction: 'up' | 'down' | 'neutral'
    value: string
    period: string
  }
}

export interface ProjectStatusDistribution {
  planning: number
  active: number
  on_hold: number
  completed: number
  cancelled: number
}

export interface ProjectBudgetAnalysis {
  projectName: string
  projectNumber: string
  budget: number
  usedBudget: number
  utilizationRate: number
  status: ProjectStatus
  variance: number // Positive = under budget, Negative = over budget
}

export interface ProjectTimelinePerformance {
  projectName: string
  projectNumber: string
  plannedDuration: number // days
  actualDuration: number // days
  status: ProjectStatus
  onTime: boolean
  daysOverdue: number
}

export interface ResourceAllocation {
  userId: string
  userName: string
  activeProjects: number
  totalBudgetManaged: number
  avgProjectProgress: number
}

/**
 * Project Analytics Service
 * Provides comprehensive analytics and metrics for project management
 */
export class ProjectAnalyticsService {
  /**
   * Get overview metrics for projects
   */
  static async getOverviewMetrics(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ProjectAnalyticsMetrics> {
    const db = await getDatabase()
    const projectsCollection = db.collection(COLLECTIONS.PROJECTS)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const now = new Date()

    // Aggregate pipeline for overview metrics
    const [metricsResult] = await projectsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $facet: {
            counts: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  active: {
                    $sum: {
                      $cond: [{ $eq: ['$status', 'active'] }, 1, 0],
                    },
                  },
                  completed: {
                    $sum: {
                      $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
                    },
                  },
                },
              },
            ],
            budgetMetrics: [
              {
                $group: {
                  _id: null,
                  totalBudget: { $sum: { $ifNull: ['$budget', 0] } },
                  totalUsedBudget: { $sum: { $ifNull: ['$usedBudget', 0] } },
                  avgProgress: { $avg: '$progress' },
                },
              },
            ],
            onTimeDelivery: [
              {
                $match: {
                  status: 'completed',
                  actualEndDate: { $exists: true },
                },
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  onTime: {
                    $sum: {
                      $cond: [
                        { $lte: ['$actualEndDate', '$endDate'] },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ])
      .toArray()

    const counts = metricsResult.counts[0] || {
      total: 0,
      active: 0,
      completed: 0,
    }
    const budgetMetrics = metricsResult.budgetMetrics[0] || {
      totalBudget: 0,
      totalUsedBudget: 0,
      avgProgress: 0,
    }
    const onTimeDelivery = metricsResult.onTimeDelivery[0] || {
      total: 0,
      onTime: 0,
    }

    // Calculate on-time delivery rate
    const onTimeDeliveryRate =
      onTimeDelivery.total > 0
        ? (onTimeDelivery.onTime / onTimeDelivery.total) * 100
        : 0

    // Calculate budget utilization rate
    const avgBudgetUtilization =
      budgetMetrics.totalBudget > 0
        ? (budgetMetrics.totalUsedBudget / budgetMetrics.totalBudget) * 100
        : 0

    // Calculate trend (compare with previous period)
    const previousPeriodStart = startDate
      ? new Date(
          startDate.getTime() -
            (endDate ? endDate.getTime() - startDate.getTime() : 30 * 24 * 60 * 60 * 1000)
        )
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const previousPeriodEnd = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const previousCount = await projectsCollection.countDocuments({
      orgId,
      createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
    })

    const trendValue = counts.total - previousCount
    const trendPercentage =
      previousCount > 0
        ? Math.abs((trendValue / previousCount) * 100).toFixed(1)
        : '0.0'

    return {
      totalProjects: counts.total,
      activeProjects: counts.active,
      completedProjects: counts.completed,
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10,
      avgBudgetUtilization: Math.round(avgBudgetUtilization * 10) / 10,
      avgCompletionRate: Math.round(budgetMetrics.avgProgress * 10) / 10,
      totalBudget: Math.round(budgetMetrics.totalBudget * 100) / 100,
      totalUsedBudget: Math.round(budgetMetrics.totalUsedBudget * 100) / 100,
      trendData: {
        direction: trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral',
        value: `${trendPercentage}%`,
        period: 'vs previous period',
      },
    }
  }

  /**
   * Get project status distribution
   */
  static async getStatusDistribution(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ProjectStatusDistribution> {
    const db = await getDatabase()
    const projectsCollection = db.collection(COLLECTIONS.PROJECTS)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const statusData = await projectsCollection
      .aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .toArray()

    const distribution: ProjectStatusDistribution = {
      planning: 0,
      active: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0,
    }

    statusData.forEach((item: any) => {
      distribution[item._id as ProjectStatus] = item.count
    })

    return distribution
  }

  /**
   * Get budget analysis for projects
   */
  static async getBudgetAnalysis(
    orgId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 20
  ): Promise<ProjectBudgetAnalysis[]> {
    const db = await getDatabase()
    const projectsCollection = db.collection(COLLECTIONS.PROJECTS)

    // Build date filter
    const dateFilter: any = { orgId, budget: { $exists: true, $gt: 0 } }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const budgetData = await projectsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $project: {
            projectName: '$name',
            projectNumber: 1,
            budget: 1,
            usedBudget: { $ifNull: ['$usedBudget', 0] },
            status: 1,
            utilizationRate: {
              $multiply: [
                {
                  $divide: [
                    { $ifNull: ['$usedBudget', 0] },
                    { $ifNull: ['$budget', 1] },
                  ],
                },
                100,
              ],
            },
            variance: {
              $subtract: [
                { $ifNull: ['$budget', 0] },
                { $ifNull: ['$usedBudget', 0] },
              ],
            },
          },
        },
        { $sort: { utilizationRate: -1 } },
        { $limit: limit },
      ])
      .toArray()

    return budgetData.map((item: any) => ({
      projectName: item.projectName,
      projectNumber: item.projectNumber,
      budget: Math.round(item.budget * 100) / 100,
      usedBudget: Math.round(item.usedBudget * 100) / 100,
      utilizationRate: Math.round(item.utilizationRate * 10) / 10,
      status: item.status,
      variance: Math.round(item.variance * 100) / 100,
    }))
  }

  /**
   * Get timeline performance for projects
   */
  static async getTimelinePerformance(
    orgId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 20
  ): Promise<ProjectTimelinePerformance[]> {
    const db = await getDatabase()
    const projectsCollection = db.collection(COLLECTIONS.PROJECTS)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const now = new Date()

    const timelineData = await projectsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $project: {
            projectName: '$name',
            projectNumber: 1,
            status: 1,
            startDate: 1,
            endDate: 1,
            actualStartDate: 1,
            actualEndDate: 1,
            plannedDuration: {
              $divide: [
                { $subtract: ['$endDate', '$startDate'] },
                24 * 60 * 60 * 1000, // Convert to days
              ],
            },
            actualDuration: {
              $cond: {
                if: { $ne: ['$actualEndDate', null] },
                then: {
                  $divide: [
                    {
                      $subtract: [
                        '$actualEndDate',
                        { $ifNull: ['$actualStartDate', '$startDate'] },
                      ],
                    },
                    24 * 60 * 60 * 1000,
                  ],
                },
                else: {
                  $divide: [
                    {
                      $subtract: [
                        now,
                        { $ifNull: ['$actualStartDate', '$startDate'] },
                      ],
                    },
                    24 * 60 * 60 * 1000,
                  ],
                },
              },
            },
            onTime: {
              $cond: {
                if: { $ne: ['$actualEndDate', null] },
                then: { $lte: ['$actualEndDate', '$endDate'] },
                else: { $lte: [now, '$endDate'] },
              },
            },
            daysOverdue: {
              $cond: {
                if: { $ne: ['$actualEndDate', null] },
                then: {
                  $divide: [
                    {
                      $max: [
                        0,
                        { $subtract: ['$actualEndDate', '$endDate'] },
                      ],
                    },
                    24 * 60 * 60 * 1000,
                  ],
                },
                else: {
                  $divide: [
                    { $max: [0, { $subtract: [now, '$endDate'] }] },
                    24 * 60 * 60 * 1000,
                  ],
                },
              },
            },
          },
        },
        { $sort: { daysOverdue: -1 } },
        { $limit: limit },
      ])
      .toArray()

    return timelineData.map((item: any) => ({
      projectName: item.projectName,
      projectNumber: item.projectNumber,
      plannedDuration: Math.round(item.plannedDuration * 10) / 10,
      actualDuration: Math.round(item.actualDuration * 10) / 10,
      status: item.status,
      onTime: item.onTime,
      daysOverdue: Math.round(item.daysOverdue * 10) / 10,
    }))
  }

  /**
   * Get resource allocation analysis
   */
  static async getResourceAllocation(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ResourceAllocation[]> {
    const db = await getDatabase()
    const projectsCollection = db.collection(COLLECTIONS.PROJECTS)
    const usersCollection = db.collection(COLLECTIONS.USERS)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    // Get project managers
    const resourceData = await projectsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$projectManager',
            activeProjects: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['planning', 'active']] },
                  1,
                  0,
                ],
              },
            },
            totalBudgetManaged: {
              $sum: { $ifNull: ['$budget', 0] },
            },
            avgProgress: { $avg: '$progress' },
          },
        },
        { $sort: { activeProjects: -1 } },
        { $limit: 20 },
      ])
      .toArray()

    // Fetch user names
    const userIds = resourceData.map((item: any) => item._id)
    const users = await usersCollection
      .find({ _id: { $in: userIds } })
      .project({ firstName: 1, lastName: 1 })
      .toArray()

    const userMap = new Map(
      users.map((u: any) => [u._id.toString(), `${u.firstName} ${u.lastName}`])
    )

    return resourceData.map((item: any) => ({
      userId: item._id,
      userName: userMap.get(item._id) || 'Unknown',
      activeProjects: item.activeProjects,
      totalBudgetManaged: Math.round(item.totalBudgetManaged * 100) / 100,
      avgProjectProgress: Math.round(item.avgProgress * 10) / 10,
    }))
  }

  /**
   * Get project completion rate trend
   */
  static async getCompletionRateTrend(
    orgId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month' = 'month'
  ): Promise<Array<{ date: string; completionRate: number; projectsCompleted: number }>> {
    const db = await getDatabase()
    const projectsCollection = db.collection(COLLECTIONS.PROJECTS)

    const dateFormat =
      granularity === 'day'
        ? '%Y-%m-%d'
        : granularity === 'week'
        ? '%Y-W%U'
        : '%Y-%m'

    const completionData = await projectsCollection
      .aggregate([
        {
          $match: {
            orgId,
            actualEndDate: { $gte: startDate, $lte: endDate },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormat, date: '$actualEndDate' },
            },
            projectsCompleted: { $sum: 1 },
            avgProgress: { $avg: '$progress' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray()

    return completionData.map((item: any) => ({
      date: item._id,
      completionRate: Math.round(item.avgProgress * 10) / 10,
      projectsCompleted: item.projectsCompleted,
    }))
  }

  /**
   * Get milestone completion analysis
   */
  static async getMilestoneCompletionRate(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalMilestones: number
    completedMilestones: number
    completionRate: number
    avgDaysToComplete: number
  }> {
    const db = await getDatabase()
    const milestonesCollection = db.collection(COLLECTIONS.PROJECT_MILESTONES)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.dueDate = {}
      if (startDate) dateFilter.dueDate.$gte = startDate
      if (endDate) dateFilter.dueDate.$lte = endDate
    }

    const [milestoneData] = await milestonesCollection
      .aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $ne: ['$completedAt', null] }, 1, 0],
              },
            },
            avgDaysToComplete: {
              $avg: {
                $cond: [
                  { $ne: ['$completedAt', null] },
                  {
                    $divide: [
                      { $subtract: ['$completedAt', '$createdAt'] },
                      24 * 60 * 60 * 1000,
                    ],
                  },
                  null,
                ],
              },
            },
          },
        },
      ])
      .toArray()

    const data = milestoneData || {
      total: 0,
      completed: 0,
      avgDaysToComplete: 0,
    }

    return {
      totalMilestones: data.total,
      completedMilestones: data.completed,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 1000) / 10 : 0,
      avgDaysToComplete: Math.round((data.avgDaysToComplete || 0) * 10) / 10,
    }
  }
}
