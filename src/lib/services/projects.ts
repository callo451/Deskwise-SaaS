import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { Project, ProjectTask, ProjectStatus, TaskStatus } from '../types'

export interface CreateProjectInput {
  name: string
  description: string
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
  dependencies?: string[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  assignedTo?: string
  dueDate?: Date
  completedAt?: Date
  dependencies?: string[]
  estimatedHours?: number
  actualHours?: number
}

export class ProjectService {
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

    // Generate project number
    const count = await collection.countDocuments({ orgId })
    const projectNumber = `PRJ-${String(count + 1).padStart(4, '0')}`

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

    const task: ProjectTask = {
      _id: new ObjectId(),
      projectId,
      orgId,
      title: input.title,
      description: input.description,
      status: 'todo',
      assignedTo: input.assignedTo,
      dueDate: input.dueDate,
      dependencies: input.dependencies || [],
      estimatedHours: input.estimatedHours,
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
   * Update project progress based on completed tasks
   */
  static async updateProjectProgress(
    projectId: string,
    orgId: string
  ): Promise<void> {
    const db = await getDatabase()
    const tasksCollection = db.collection<ProjectTask>(COLLECTIONS.PROJECT_TASKS)
    const projectsCollection = db.collection<Project>(COLLECTIONS.PROJECTS)

    const totalTasks = await tasksCollection.countDocuments({ projectId })
    const completedTasks = await tasksCollection.countDocuments({
      projectId,
      status: 'completed',
    })

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

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
}
