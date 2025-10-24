import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { Project, ProjectTask, ProjectStatus, TaskStatus, TaskDependency } from '../types'
import { ProjectHealthService } from './project-health'

export interface CreateProjectInput {
  name: string
  description: string
  projectNumber?: string // Optional: admin can set custom number
  clientId?: string
  startDate: Date
  endDate: Date
  budget?: number
  tags: string[]
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  status?: ProjectStatus
  clientId?: string
  projectManager?: string
  teamMembers?: string[]
  startDate?: Date
  endDate?: Date
  actualStartDate?: Date
  actualEndDate?: Date
  budget?: number
  usedBudget?: number
  progress?: number
  tags?: string[]
}

export interface ProjectFilters {
  status?: ProjectStatus
  clientId?: string
  projectManager?: string
  search?: string
}

export interface CreateTaskInput {
  title: string
  description: string
  assignedTo?: string
  dueDate?: Date
  estimatedHours?: number
  dependencies?: string[] | TaskDependency[]
  parentTaskId?: string
  taskType?: 'task' | 'milestone' | 'summary'
  plannedStartDate?: Date
  plannedEndDate?: Date
  percentComplete?: number
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  assignedTo?: string
  dueDate?: Date
  completedAt?: Date
  dependencies?: string[] | TaskDependency[]
  estimatedHours?: number
  actualHours?: number
  percentComplete?: number
  plannedStartDate?: Date
  plannedEndDate?: Date
  actualStartDate?: Date
  remainingHours?: number
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export class ProjectService {
  /**
   * Validate project number format (PRJ-XXXX where X is a digit)
   */
  static validateProjectNumber(projectNumber: string): boolean {
    const regex = /^PRJ-\d{4}$/
    return regex.test(projectNumber)
  }

  /**
   * Check if project number exists
   */
  static async projectNumberExists(projectNumber: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<Project>(COLLECTIONS.PROJECTS)
    const count = await collection.countDocuments({ orgId, projectNumber, isActive: true })
    return count > 0
  }

  /**
   * Generate next available project number
   */
  static async generateNextProjectNumber(orgId: string): Promise<string> {
    const db = await getDatabase()
    const collection = db.collection<Project>(COLLECTIONS.PROJECTS)
    const count = await collection.countDocuments({ orgId })
    return `PRJ-${String(count + 1).padStart(4, '0')}`
  }

  /**
   * Get project by project number
   */
  static async getProjectByNumber(projectNumber: string, orgId: string): Promise<Project | null> {
    const db = await getDatabase()
    const collection = db.collection<Project>(COLLECTIONS.PROJECTS)

    const project = await collection.findOne({
      projectNumber,
      orgId,
      isActive: true,
    })

    return project
  }

  /**
   * Get project by ID or project number (flexible lookup)
   */
  static async getProject(idOrNumber: string, orgId: string): Promise<Project | null> {
    // Try as MongoDB ObjectId first
    if (ObjectId.isValid(idOrNumber)) {
      const project = await this.getProjectById(idOrNumber, orgId)
      if (project) return project
    }

    // Try as project number
    return await this.getProjectByNumber(idOrNumber, orgId)
  }

  /**
   * Create a new project
   */
  static async createProject(
    orgId: string,
    input: CreateProjectInput,
    createdBy: string
  ): Promise<Project> {
    const db = await getDatabase()
    const collection = db.collection<Project>(COLLECTIONS.PROJECTS)

    // Determine project number
    let projectNumber: string

    if (input.projectNumber) {
      // Validate custom project number
      if (!this.validateProjectNumber(input.projectNumber)) {
        throw new Error('Invalid project number format. Must be PRJ-XXXX (e.g., PRJ-0001)')
      }

      // Check if already exists
      const exists = await this.projectNumberExists(input.projectNumber, orgId)
      if (exists) {
        throw new Error(`Project number ${input.projectNumber} already exists`)
      }

      projectNumber = input.projectNumber
    } else {
      // Auto-generate next number
      projectNumber = await this.generateNextProjectNumber(orgId)
    }

    const project: Project = {
      _id: new ObjectId(),
      orgId,
      projectNumber,
      name: input.name,
      description: input.description,
      status: 'planning',
      clientId: input.clientId,
      projectManager: createdBy,
      teamMembers: [createdBy],
      startDate: input.startDate,
      endDate: input.endDate,
      budget: input.budget,
      usedBudget: 0,
      progress: 0,
      tags: input.tags,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    await collection.insertOne(project)

    return project
  }

  /**
   * Get all projects with optional filters
   */
  static async getProjects(
    orgId: string,
    filters?: ProjectFilters
  ): Promise<Project[]> {
    const db = await getDatabase()
    const collection = db.collection<Project>(COLLECTIONS.PROJECTS)

    const query: any = { orgId, isActive: true }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.clientId) {
      query.clientId = filters.clientId
    }

    if (filters?.projectManager) {
      query.projectManager = filters.projectManager
    }

    if (filters?.search) {
      query.$or = [
        { projectNumber: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ]
    }

    const projects = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return projects
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string, orgId: string): Promise<Project | null> {
    const db = await getDatabase()
    const collection = db.collection<Project>(COLLECTIONS.PROJECTS)

    const project = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
      isActive: true,
    })

    return project
  }

  /**
   * Update project
   */
  static async updateProject(
    id: string,
    orgId: string,
    updates: UpdateProjectInput
  ): Promise<Project | null> {
    const db = await getDatabase()
    const collection = db.collection<Project>(COLLECTIONS.PROJECTS)

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId, isActive: true },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    // Recalculate health if significant fields changed
    if (result) {
      const significantFields = [
        'status',
        'progress',
        'budget',
        'usedBudget',
        'startDate',
        'endDate',
        'plannedStartDate',
        'plannedEndDate',
        'actualStartDate',
        'actualEndDate',
      ]

      const hasSignificantChange = Object.keys(updates).some((key) =>
        significantFields.includes(key)
      )

      if (hasSignificantChange) {
        // Recalculate health in background (don't await to avoid blocking)
        ProjectHealthService.calculateHealthScore(id, orgId, true).catch((error) => {
          console.error('Failed to recalculate project health:', error)
        })
      }
    }

    return result
  }

  /**
   * Delete project (soft delete)
   */
  static async deleteProject(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<Project>(COLLECTIONS.PROJECTS)

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
   * Create project task
   */
  static async createTask(
    projectId: string,
    orgId: string,
    input: CreateTaskInput,
    createdBy: string
  ): Promise<ProjectTask> {
    const db = await getDatabase()
    const collection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)

    // Generate task number
    const taskNumber = await this.generateTaskNumber(projectId)

    // Generate WBS code
    const wbsCode = await this.generateWBSCode(projectId, input.parentTaskId)

    // Calculate level from parent
    let level = 0
    if (input.parentTaskId) {
      const parentTask = await collection.findOne({ _id: new ObjectId(input.parentTaskId) })
      level = (parentTask?.level ?? 0) + 1
    }

    const task: ProjectTask = {
      _id: new ObjectId(),
      projectId,
      orgId,
      title: input.title,
      description: input.description,
      status: 'todo',
      taskNumber,
      wbsCode,
      level,
      parentTaskId: input.parentTaskId,
      taskType: input.taskType || 'task',
      assignedTo: input.assignedTo,
      dueDate: input.dueDate,
      plannedStartDate: input.plannedStartDate,
      plannedEndDate: input.plannedEndDate,
      dependencies: input.dependencies || [],
      estimatedHours: input.estimatedHours,
      percentComplete: input.percentComplete || 0,
      priority: input.priority,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await collection.insertOne(task)

    // Update project updatedAt
    const projectsCollection = db.collection<Project>(COLLECTIONS.PROJECTS)
    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId), orgId },
      { $set: { updatedAt: new Date() } }
    )

    return task
  }

  /**
   * Get project tasks
   */
  static async getTasks(projectId: string): Promise<ProjectTask[]> {
    const db = await getDatabase()
    const collection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)

    const tasks = await collection
      .find({ projectId })
      .sort({ createdAt: 1 })
      .toArray()

    return tasks
  }

  /**
   * Update task
   */
  static async updateTask(
    taskId: string,
    projectId: string,
    orgId: string,
    updates: UpdateTaskInput
  ): Promise<ProjectTask | null> {
    const db = await getDatabase()
    const collection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    // If status is being set to completed, set completedAt
    if (updates.status === 'completed' && !updates.completedAt) {
      updateData.completedAt = new Date()
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(taskId), projectId, orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    // Update project progress
    if (result) {
      await this.updateProjectProgress(projectId, orgId)
    }

    return result
  }

  /**
   * Delete task
   */
  static async deleteTask(
    taskId: string,
    projectId: string,
    orgId: string
  ): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)

    const result = await collection.deleteOne({
      _id: new ObjectId(taskId),
      projectId,
      orgId,
    })

    // Update project progress
    if (result.deletedCount > 0) {
      await this.updateProjectProgress(projectId, orgId)
    }

    return result.deletedCount > 0
  }

  /**
   * Update project progress based on completed tasks or percentComplete
   */
  static async updateProjectProgress(
    projectId: string,
    orgId: string
  ): Promise<void> {
    const db = await getDatabase()
    const tasksCollection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)
    const projectsCollection = db.collection<Project>(COLLECTIONS.PROJECTS)

    const allTasks = await tasksCollection.find({ projectId }).toArray()

    if (allTasks.length === 0) {
      await projectsCollection.updateOne(
        { _id: new ObjectId(projectId), orgId },
        { $set: { progress: 0, updatedAt: new Date() } }
      )
      return
    }

    // Check if any tasks have percentComplete set
    const hasPercentComplete = allTasks.some(t => t.percentComplete !== undefined && t.percentComplete !== null)

    let progress = 0

    if (hasPercentComplete) {
      // Calculate weighted average based on percentComplete
      const totalPercent = allTasks.reduce((sum, task) => sum + (task.percentComplete || 0), 0)
      progress = Math.round(totalPercent / allTasks.length)
    } else {
      // Fallback to simple task completion count
      const completedTasks = allTasks.filter(t => t.status === 'completed').length
      progress = Math.round((completedTasks / allTasks.length) * 100)
    }

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
   * Get project statistics
   */
  static async getProjectStats(orgId: string) {
    const db = await getDatabase()
    const collection = db.collection<Project>(COLLECTIONS.PROJECTS)

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
    ] = await Promise.all([
      collection.countDocuments({ orgId, isActive: true }),
      collection.countDocuments({
        orgId,
        isActive: true,
        status: 'active',
      }),
      collection.countDocuments({
        orgId,
        isActive: true,
        status: 'completed',
      }),
      collection.countDocuments({
        orgId,
        isActive: true,
        status: 'on_hold',
      }),
    ])

    // Get projects by status
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

    // Get total budget and used budget
    const budgetStats = await collection
      .aggregate([
        { $match: { orgId, isActive: true } },
        {
          $group: {
            _id: null,
            totalBudget: { $sum: '$budget' },
            totalUsed: { $sum: '$usedBudget' },
          },
        },
      ])
      .toArray()

    return {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
      onHold: onHoldProjects,
      byStatus: statusStats,
      budget: budgetStats[0] || { totalBudget: 0, totalUsed: 0 },
    }
  }

  /**
   * Generate unique task number for a project
   */
  static async generateTaskNumber(projectId: string): Promise<string> {
    const db = await getDatabase()
    const collection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)

    const count = await collection.countDocuments({ projectId })
    return `TSK-${String(count + 1).padStart(3, '0')}`
  }

  /**
   * Generate WBS code for a task
   * Format: 1.1.2 (hierarchical based on parent)
   */
  static async generateWBSCode(projectId: string, parentTaskId?: string): Promise<string> {
    const db = await getDatabase()
    const collection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)

    if (!parentTaskId) {
      // Root level task - find next root number
      const rootTasks = await collection
        .find({ projectId, $or: [{ parentTaskId: null }, { parentTaskId: { $exists: false } }] })
        .toArray()
      return `${rootTasks.length + 1}`
    }

    // Child task - get parent WBS and append child number
    const parentTask = await collection.findOne({ _id: new ObjectId(parentTaskId) })
    if (!parentTask || !parentTask.wbsCode) {
      return '1.1'
    }

    // Count siblings (same parent)
    const siblings = await collection.countDocuments({ projectId, parentTaskId })
    return `${parentTask.wbsCode}.${siblings + 1}`
  }

  /**
   * Update task progress manually
   */
  static async updateTaskProgress(
    taskId: string,
    projectId: string,
    orgId: string,
    percentComplete: number
  ): Promise<ProjectTask | null> {
    const db = await getDatabase()
    const collection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)

    // Validate percentComplete
    const validPercent = Math.max(0, Math.min(100, percentComplete))

    // Auto-update status based on progress
    let status: TaskStatus | undefined
    if (validPercent === 0) {
      status = 'todo'
    } else if (validPercent === 100) {
      status = 'completed'
    } else if (validPercent > 0 && validPercent < 100) {
      status = 'in_progress'
    }

    const updateData: any = {
      percentComplete: validPercent,
      updatedAt: new Date(),
    }

    if (status) {
      updateData.status = status
    }

    if (validPercent === 100) {
      updateData.completedAt = new Date()
      updateData.actualEndDate = new Date()
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(taskId), projectId, orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    // Update project progress
    if (result) {
      await this.updateProjectProgress(projectId, orgId)
    }

    return result
  }

  /**
   * Calculate critical path for a project
   * Uses Critical Path Method (CPM) algorithm
   */
  static async calculateCriticalPath(projectId: string, orgId: string): Promise<void> {
    const db = await getDatabase()
    const collection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)

    const tasks = await collection.find({ projectId, orgId }).toArray()

    if (tasks.length === 0) return

    // Build task map for quick lookups
    const taskMap = new Map<string, ProjectTask>()
    tasks.forEach(task => taskMap.set(task._id.toString(), task))

    // Calculate Early Start (ES) and Early Finish (EF)
    const earlyStart = new Map<string, number>()
    const earlyFinish = new Map<string, number>()

    // Forward pass
    tasks.forEach(task => {
      const taskId = task._id.toString()
      const duration = task.estimatedHours || 0

      // Get dependencies
      const deps = this.normalizeDependencies(task.dependencies)

      if (deps.length === 0) {
        // No dependencies - can start immediately
        earlyStart.set(taskId, 0)
        earlyFinish.set(taskId, duration)
      } else {
        // Start after all dependencies finish (considering lag)
        let maxFinish = 0
        deps.forEach(dep => {
          const depTask = taskMap.get(dep.taskId)
          if (depTask) {
            const depFinish = earlyFinish.get(dep.taskId) || 0
            // For simplicity, we only handle finish-to-start with lag
            const adjustedFinish = depFinish + dep.lag
            maxFinish = Math.max(maxFinish, adjustedFinish)
          }
        })
        earlyStart.set(taskId, maxFinish)
        earlyFinish.set(taskId, maxFinish + duration)
      }
    })

    // Find project completion time (max EF)
    const projectCompletionTime = Math.max(...Array.from(earlyFinish.values()))

    // Calculate Late Start (LS) and Late Finish (LF)
    const lateStart = new Map<string, number>()
    const lateFinish = new Map<string, number>()

    // Initialize all tasks with project completion time
    tasks.forEach(task => {
      lateFinish.set(task._id.toString(), projectCompletionTime)
    })

    // Backward pass (reverse topological order)
    const reversedTasks = [...tasks].reverse()
    reversedTasks.forEach(task => {
      const taskId = task._id.toString()
      const duration = task.estimatedHours || 0

      // Find tasks that depend on this task
      const successors = tasks.filter(t => {
        const deps = this.normalizeDependencies(t.dependencies)
        return deps.some(d => d.taskId === taskId)
      })

      if (successors.length === 0) {
        // No successors - must finish by project end
        lateFinish.set(taskId, projectCompletionTime)
        lateStart.set(taskId, projectCompletionTime - duration)
      } else {
        // Must finish before earliest successor starts
        let minStart = projectCompletionTime
        successors.forEach(successor => {
          const successorLS = lateStart.get(successor._id.toString()) || projectCompletionTime
          // Find the dependency relationship
          const deps = this.normalizeDependencies(successor.dependencies)
          const dep = deps.find(d => d.taskId === taskId)
          const lag = dep?.lag || 0
          minStart = Math.min(minStart, successorLS - lag)
        })
        lateFinish.set(taskId, minStart)
        lateStart.set(taskId, minStart - duration)
      }
    })

    // Calculate slack and identify critical path
    const updates: any[] = []
    tasks.forEach(task => {
      const taskId = task._id.toString()
      const es = earlyStart.get(taskId) || 0
      const ls = lateStart.get(taskId) || 0
      const slack = ls - es

      const isCriticalPath = slack === 0

      updates.push({
        updateOne: {
          filter: { _id: task._id },
          update: {
            $set: {
              isCriticalPath,
              slack,
              updatedAt: new Date(),
            },
          },
        },
      })
    })

    // Bulk update all tasks
    if (updates.length > 0) {
      await collection.bulkWrite(updates)
    }
  }

  /**
   * Helper: Normalize dependencies to TaskDependency[] format
   */
  private static normalizeDependencies(dependencies: string[] | TaskDependency[] | undefined): TaskDependency[] {
    if (!dependencies || dependencies.length === 0) return []

    // Check if it's string[] (legacy format)
    if (typeof dependencies[0] === 'string') {
      return (dependencies as string[]).map(taskId => ({
        taskId,
        type: 'finish_to_start' as const,
        lag: 0,
      }))
    }

    return dependencies as TaskDependency[]
  }
}
