import { MongoClient, ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { Project, ProjectTask, TimeEntry, UnifiedTicket } from '@/lib/types'

/**
 * Project Analytics Service
 * Provides comprehensive analytics and reporting for projects
 */
export class ProjectAnalyticsService {
  /**
   * Get project overview statistics
   */
  static async getProjectOverview(
    projectId: string,
    orgId: string
  ): Promise<{
    project: Project
    stats: {
      totalTasks: number
      completedTasks: number
      inProgressTasks: number
      overdueTasks: number
      totalMilestones: number
      achievedMilestones: number
      totalTickets: number
      openTickets: number
      totalTimeSpent: number // hours
      budgetUtilization: number // percentage
      scheduleProgress: number // percentage
      healthScore: number
    }
  }> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get project
    const project = await db.collection<Project>('projects').findOne({
      _id: new ObjectId(projectId),
      orgId,
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Get tasks
    const tasks = await db
      .collection<ProjectTask>('project_tasks')
      .find({ projectId, orgId })
      .toArray()

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === 'completed').length
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < new Date() && t.status !== 'completed'
    ).length

    // Get milestones
    const milestones = await db
      .collection('project_milestones')
      .find({ projectId, orgId })
      .toArray()

    const totalMilestones = milestones.length
    const achievedMilestones = milestones.filter((m) => m.status === 'achieved').length

    // Get tickets
    const tickets = await db
      .collection<UnifiedTicket>('unified_tickets')
      .find({ projectId, orgId })
      .toArray()

    const totalTickets = tickets.length
    const openTickets = tickets.filter((t) => t.status !== 'closed').length

    // Calculate budget utilization
    const budgetUtilization =
      project.budget && project.actualCost
        ? Math.round((project.actualCost / project.budget) * 100)
        : 0

    // Calculate schedule progress
    const now = new Date()
    const totalDuration = project.endDate.getTime() - project.startDate.getTime()
    const elapsed = now.getTime() - project.startDate.getTime()
    const scheduleProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))

    return {
      project,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        totalMilestones,
        achievedMilestones,
        totalTickets,
        openTickets,
        totalTimeSpent: project.actualHours || 0,
        budgetUtilization,
        scheduleProgress: Math.round(scheduleProgress),
        healthScore: project.healthScore || 0,
      },
    }
  }

  /**
   * Get resource utilization for a project
   */
  static async getResourceUtilization(
    projectId: string,
    orgId: string
  ): Promise<{
    totalAllocations: number
    byUser: Array<{
      userId: string
      userName: string
      role: string
      allocatedHours: number
      actualHours: number
      utilization: number
    }>
  }> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get resource allocations
    const allocations = await db
      .collection('project_resources')
      .find({ projectId, orgId })
      .toArray()

    // Get time entries by user
    const timeEntries = await db
      .collection<TimeEntry>('time_entries')
      .find({ projectId, orgId, type: 'project' })
      .toArray()

    // Aggregate by user
    const userTimeMap = new Map<string, number>()
    timeEntries.forEach((entry) => {
      const current = userTimeMap.get(entry.userId) || 0
      userTimeMap.set(entry.userId, current + entry.totalMinutes / 60)
    })

    const byUser = allocations.map((allocation: any) => {
      const actualHours = userTimeMap.get(allocation.userId) || 0
      const allocatedHours = allocation.allocatedHours || 0
      const utilization =
        allocatedHours > 0 ? Math.round((actualHours / allocatedHours) * 100) : 0

      return {
        userId: allocation.userId,
        userName: allocation.userName,
        role: allocation.role,
        allocatedHours,
        actualHours,
        utilization,
      }
    })

    return {
      totalAllocations: allocations.length,
      byUser,
    }
  }

  /**
   * Get task completion trends
   */
  static async getTaskCompletionTrends(
    projectId: string,
    orgId: string,
    days: number = 30
  ): Promise<{
    daily: Array<{
      date: string
      completed: number
      created: number
    }>
    weekly: Array<{
      week: string
      completed: number
      created: number
    }>
  }> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const tasks = await db
      .collection<ProjectTask>('project_tasks')
      .find({
        projectId,
        orgId,
        createdAt: { $gte: startDate },
      })
      .toArray()

    // Group by day
    const dailyMap = new Map<
      string,
      { date: string; completed: number; created: number }
    >()

    tasks.forEach((task) => {
      const dateKey = task.createdAt.toISOString().split('T')[0]

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, completed: 0, created: 0 })
      }

      const dayData = dailyMap.get(dateKey)!
      dayData.created++

      if (
        task.status === 'completed' &&
        task.completedAt &&
        task.completedAt.toISOString().split('T')[0] === dateKey
      ) {
        dayData.completed++
      }
    })

    const daily = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    // Group by week
    const weeklyMap = new Map<
      string,
      { week: string; completed: number; created: number }
    >()

    tasks.forEach((task) => {
      const weekStart = new Date(task.createdAt)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { week: weekKey, completed: 0, created: 0 })
      }

      const weekData = weeklyMap.get(weekKey)!
      weekData.created++

      if (task.status === 'completed' && task.completedAt) {
        const completedWeekStart = new Date(task.completedAt)
        completedWeekStart.setDate(completedWeekStart.getDate() - completedWeekStart.getDay())
        if (completedWeekStart.toISOString().split('T')[0] === weekKey) {
          weekData.completed++
        }
      }
    })

    const weekly = Array.from(weeklyMap.values()).sort((a, b) =>
      a.week.localeCompare(b.week)
    )

    return { daily, weekly }
  }

  /**
   * Get portfolio-level analytics
   */
  static async getPortfolioAnalytics(
    portfolioId: string,
    orgId: string
  ): Promise<{
    portfolio: any
    projectCount: number
    totalBudget: number
    totalActualCost: number
    avgHealthScore: number
    statusBreakdown: Record<string, number>
    onTrackProjects: number
    atRiskProjects: number
    offTrackProjects: number
  }> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get portfolio
    const portfolio = await db.collection('portfolios').findOne({
      _id: new ObjectId(portfolioId),
      orgId,
    })

    if (!portfolio) {
      throw new Error('Portfolio not found')
    }

    // Get projects in portfolio
    const projects = await db
      .collection<Project>('projects')
      .find({ portfolioId, orgId })
      .toArray()

    const projectCount = projects.length
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalActualCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0)
    const avgHealthScore =
      projectCount > 0
        ? Math.round(
            projects.reduce((sum, p) => sum + (p.healthScore || 0), 0) / projectCount
          )
        : 0

    // Status breakdown
    const statusBreakdown: Record<string, number> = {}
    projects.forEach((project) => {
      const status = project.status
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1
    })

    // Health categorization
    const onTrackProjects = projects.filter((p) => (p.health || 'green') === 'green').length
    const atRiskProjects = projects.filter((p) => p.health === 'amber').length
    const offTrackProjects = projects.filter((p) => p.health === 'red').length

    return {
      portfolio,
      projectCount,
      totalBudget,
      totalActualCost,
      avgHealthScore,
      statusBreakdown,
      onTrackProjects,
      atRiskProjects,
      offTrackProjects,
    }
  }

  /**
   * Get organization-wide project analytics
   */
  static async getOrganizationAnalytics(orgId: string): Promise<{
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalBudget: number
    totalActualCost: number
    avgCompletionRate: number
    byStatus: Record<string, number>
    byHealth: Record<string, number>
    topPerformingProjects: Array<{
      projectId: string
      projectName: string
      healthScore: number
      progress: number
    }>
  }> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const projects = await db.collection<Project>('projects').find({ orgId }).toArray()

    const totalProjects = projects.length
    const activeProjects = projects.filter((p) => p.status === 'active').length
    const completedProjects = projects.filter((p) => p.status === 'completed').length
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalActualCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0)
    const avgCompletionRate =
      projects.length > 0
        ? Math.round(
            projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length
          )
        : 0

    // By status
    const byStatus: Record<string, number> = {}
    projects.forEach((project) => {
      byStatus[project.status] = (byStatus[project.status] || 0) + 1
    })

    // By health
    const byHealth: Record<string, number> = {}
    projects.forEach((project) => {
      const health = project.health || 'green'
      byHealth[health] = (byHealth[health] || 0) + 1
    })

    // Top performing projects
    const topPerformingProjects = projects
      .filter((p) => p.healthScore !== undefined)
      .sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0))
      .slice(0, 10)
      .map((p) => ({
        projectId: p._id.toString(),
        projectName: p.name,
        healthScore: p.healthScore || 0,
        progress: p.progress || 0,
      }))

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalBudget,
      totalActualCost,
      avgCompletionRate,
      byStatus,
      byHealth,
      topPerformingProjects,
    }
  }

  /**
   * Get time tracking analytics for a project
   */
  static async getProjectTimeAnalytics(
    projectId: string,
    orgId: string
  ): Promise<{
    totalHours: number
    billableHours: number
    nonBillableHours: number
    byUser: Array<{
      userId: string
      userName: string
      totalHours: number
      billableHours: number
    }>
    byTask: Array<{
      taskId: string
      taskName: string
      totalHours: number
      estimatedHours: number
      variance: number
    }>
  }> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get time entries
    const timeEntries = await db
      .collection<TimeEntry>('time_entries')
      .find({ projectId, orgId, type: 'project' })
      .toArray()

    const totalMinutes = timeEntries.reduce((sum, e) => sum + e.totalMinutes, 0)
    const billableMinutes = timeEntries
      .filter((e) => e.isBillable)
      .reduce((sum, e) => sum + e.totalMinutes, 0)

    const totalHours = Math.round((totalMinutes / 60) * 100) / 100
    const billableHours = Math.round((billableMinutes / 60) * 100) / 100
    const nonBillableHours = totalHours - billableHours

    // By user
    const userMap = new Map<string, { userName: string; total: number; billable: number }>()
    timeEntries.forEach((entry) => {
      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, { userName: entry.userName, total: 0, billable: 0 })
      }
      const user = userMap.get(entry.userId)!
      user.total += entry.totalMinutes
      if (entry.isBillable) {
        user.billable += entry.totalMinutes
      }
    })

    const byUser = Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      totalHours: Math.round((data.total / 60) * 100) / 100,
      billableHours: Math.round((data.billable / 60) * 100) / 100,
    }))

    // By task
    const taskMap = new Map<string, number>()
    timeEntries.forEach((entry) => {
      if (entry.projectTaskId) {
        const current = taskMap.get(entry.projectTaskId) || 0
        taskMap.set(entry.projectTaskId, current + entry.totalMinutes)
      }
    })

    const taskIds = Array.from(taskMap.keys())
    const tasks = await db
      .collection<ProjectTask>('project_tasks')
      .find({
        _id: { $in: taskIds.map((id) => new ObjectId(id)) },
        orgId,
      })
      .toArray()

    const byTask = tasks.map((task) => {
      const totalMinutes = taskMap.get(task._id.toString()) || 0
      const totalHours = totalMinutes / 60
      const estimatedHours = task.estimatedHours || 0
      const variance = totalHours - estimatedHours

      return {
        taskId: task._id.toString(),
        taskName: task.title,
        totalHours: Math.round(totalHours * 100) / 100,
        estimatedHours,
        variance: Math.round(variance * 100) / 100,
      }
    })

    return {
      totalHours,
      billableHours,
      nonBillableHours,
      byUser,
      byTask,
    }
  }
}
