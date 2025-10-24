/**
 * Project Task Service
 *
 * Handles project task management with support for Gantt charts and Kanban boards.
 * Includes task dependencies, ordering, grouping, and timeline calculations.
 */

import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ProjectTask {
  _id?: ObjectId
  orgId: string
  projectId: string
  projectName?: string
  milestoneId?: string
  milestoneName?: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo?: string
  assignedToName?: string
  assignedToEmail?: string
  startDate?: Date
  dueDate?: Date
  completedAt?: Date
  estimatedHours?: number
  actualHours?: number
  progress: number // 0-100

  // Kanban-specific fields
  kanbanColumn: string // status or custom column
  kanbanOrder: number // position within column
  swimlane?: string // grouping (e.g., assignee, priority)

  // Gantt-specific fields
  dependencies?: string[] // task IDs that must be completed first
  dependencyType?: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'
  isCritical?: boolean // on critical path
  slack?: number // days of schedule flexibility

  // General fields
  tags?: string[]
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  subtasks?: Array<{
    id: string
    title: string
    completed: boolean
  }>

  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface KanbanColumn {
  id: string
  title: string
  status: string
  order: number
  wipLimit?: number // Work In Progress limit
  color?: string
}

export interface GanttTimeline {
  tasks: Array<ProjectTask & {
    startPosition: number // days from project start
    duration: number // days
    endPosition: number
    isCritical: boolean
    predecessors: string[]
    successors: string[]
  }>
  criticalPath: string[] // task IDs on critical path
  projectDuration: number // total project days
  projectStart: Date
  projectEnd: Date
}

// ============================================================================
// Project Task Service
// ============================================================================

export class ProjectTaskService {
  /**
   * Create a new task
   */
  static async createTask(
    orgId: string,
    task: Omit<ProjectTask, '_id' | 'orgId' | 'createdAt' | 'updatedAt'>
  ): Promise<ProjectTask> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get max kanban order for the column
    const maxOrder = await db.collection('project_tasks')
      .find({ projectId: task.projectId, kanbanColumn: task.kanbanColumn })
      .sort({ kanbanOrder: -1 })
      .limit(1)
      .toArray()

    const newTask: ProjectTask = {
      ...task,
      orgId,
      kanbanOrder: maxOrder.length > 0 ? (maxOrder[0] as any).kanbanOrder + 1 : 0,
      progress: task.progress || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('project_tasks').insertOne(newTask)
    return { ...newTask, _id: result.insertedId }
  }

  /**
   * Update a task
   */
  static async updateTask(
    taskId: string,
    orgId: string,
    updates: Partial<ProjectTask>
  ): Promise<ProjectTask | null> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // If moving to a new column, recalculate order
    if (updates.kanbanColumn) {
      const maxOrder = await db.collection('project_tasks')
        .find({ projectId: updates.projectId, kanbanColumn: updates.kanbanColumn })
        .sort({ kanbanOrder: -1 })
        .limit(1)
        .toArray()

      updates.kanbanOrder = maxOrder.length > 0 ? (maxOrder[0] as any).kanbanOrder + 1 : 0
    }

    // Auto-update completion date if status changed to completed
    if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date()
      updates.progress = 100
    }

    const result = await db.collection('project_tasks').findOneAndUpdate(
      { _id: new ObjectId(taskId), orgId },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    return result as ProjectTask | null
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string, orgId: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const result = await db.collection('project_tasks').deleteOne({
      _id: new ObjectId(taskId),
      orgId
    })

    return result.deletedCount > 0
  }

  /**
   * Get tasks for a project
   */
  static async getProjectTasks(
    projectId: string,
    orgId: string,
    filters?: {
      status?: string
      assignedTo?: string
      milestone?: string
      priority?: string
    }
  ): Promise<ProjectTask[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { projectId, orgId }

    if (filters?.status) query.status = filters.status
    if (filters?.assignedTo) query.assignedTo = filters.assignedTo
    if (filters?.milestone) query.milestoneId = filters.milestone
    if (filters?.priority) query.priority = filters.priority

    const tasks = await db.collection('project_tasks')
      .find(query)
      .sort({ kanbanOrder: 1, createdAt: 1 })
      .toArray()

    return tasks as ProjectTask[]
  }

  /**
   * Get Kanban board data
   */
  static async getKanbanBoard(
    projectId: string,
    orgId: string,
    swimlaneBy?: 'assignee' | 'priority' | 'milestone'
  ): Promise<{
    columns: KanbanColumn[]
    tasks: Record<string, ProjectTask[]> // grouped by column ID
    swimlanes?: Record<string, ProjectTask[]> // grouped by swimlane value
  }> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Default Kanban columns
    const columns: KanbanColumn[] = [
      { id: 'todo', title: 'To Do', status: 'todo', order: 1, color: '#gray' },
      { id: 'in_progress', title: 'In Progress', status: 'in_progress', order: 2, wipLimit: 5, color: '#blue' },
      { id: 'review', title: 'Review', status: 'review', order: 3, wipLimit: 3, color: '#purple' },
      { id: 'completed', title: 'Completed', status: 'completed', order: 4, color: '#green' }
    ]

    // Get all tasks
    const tasks = await this.getProjectTasks(projectId, orgId)

    // Group by column
    const tasksByColumn: Record<string, ProjectTask[]> = {}
    columns.forEach(col => {
      tasksByColumn[col.id] = tasks
        .filter(t => t.kanbanColumn === col.id || t.status === col.status)
        .sort((a, b) => a.kanbanOrder - b.kanbanOrder)
    })

    // Group by swimlane if specified
    let swimlanes: Record<string, ProjectTask[]> | undefined
    if (swimlaneBy) {
      swimlanes = {}
      tasks.forEach(task => {
        let swimlaneKey = 'Unassigned'
        if (swimlaneBy === 'assignee' && task.assignedToName) {
          swimlaneKey = task.assignedToName
        } else if (swimlaneBy === 'priority') {
          swimlaneKey = task.priority
        } else if (swimlaneBy === 'milestone' && task.milestoneName) {
          swimlaneKey = task.milestoneName
        }

        if (!swimlanes![swimlaneKey]) {
          swimlanes![swimlaneKey] = []
        }
        swimlanes![swimlaneKey].push(task)
      })
    }

    return {
      columns,
      tasks: tasksByColumn,
      swimlanes
    }
  }

  /**
   * Reorder tasks in Kanban column
   */
  static async reorderKanbanTasks(
    taskId: string,
    orgId: string,
    newColumn: string,
    newOrder: number
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Update task
    const task = await db.collection('project_tasks').findOne({
      _id: new ObjectId(taskId),
      orgId
    })

    if (!task) return false

    const oldColumn = (task as any).kanbanColumn

    // If moving to a new column
    if (oldColumn !== newColumn) {
      // Update all tasks in the new column that have order >= newOrder
      await db.collection('project_tasks').updateMany(
        {
          projectId: (task as any).projectId,
          kanbanColumn: newColumn,
          kanbanOrder: { $gte: newOrder }
        },
        { $inc: { kanbanOrder: 1 } }
      )

      // Move the task
      await db.collection('project_tasks').updateOne(
        { _id: new ObjectId(taskId) },
        {
          $set: {
            kanbanColumn: newColumn,
            kanbanOrder: newOrder,
            status: newColumn as any,
            updatedAt: new Date()
          }
        }
      )

      // Reorder old column
      await db.collection('project_tasks').updateMany(
        {
          projectId: (task as any).projectId,
          kanbanColumn: oldColumn,
          kanbanOrder: { $gt: (task as any).kanbanOrder }
        },
        { $inc: { kanbanOrder: -1 } }
      )
    } else {
      // Reordering within same column
      const currentOrder = (task as any).kanbanOrder

      if (newOrder < currentOrder) {
        // Moving up - shift others down
        await db.collection('project_tasks').updateMany(
          {
            projectId: (task as any).projectId,
            kanbanColumn: newColumn,
            kanbanOrder: { $gte: newOrder, $lt: currentOrder }
          },
          { $inc: { kanbanOrder: 1 } }
        )
      } else {
        // Moving down - shift others up
        await db.collection('project_tasks').updateMany(
          {
            projectId: (task as any).projectId,
            kanbanColumn: newColumn,
            kanbanOrder: { $gt: currentOrder, $lte: newOrder }
          },
          { $inc: { kanbanOrder: -1 } }
        )
      }

      // Update task position
      await db.collection('project_tasks').updateOne(
        { _id: new ObjectId(taskId) },
        {
          $set: {
            kanbanOrder: newOrder,
            updatedAt: new Date()
          }
        }
      )
    }

    return true
  }

  /**
   * Get Gantt chart timeline data
   */
  static async getGanttTimeline(
    projectId: string,
    orgId: string
  ): Promise<GanttTimeline> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get project
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      orgId
    })

    if (!project) {
      throw new Error('Project not found')
    }

    const projectStart = new Date((project as any).startDate)
    const projectEnd = new Date((project as any).endDate)

    // Get all tasks
    const tasks = await this.getProjectTasks(projectId, orgId)

    // Calculate timeline positions
    const timelineTasks = tasks.map(task => {
      const taskStart = task.startDate || projectStart
      const taskEnd = task.dueDate || new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000) // Default 7 days

      const startPosition = Math.floor((taskStart.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000))
      const endPosition = Math.floor((taskEnd.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000))
      const duration = endPosition - startPosition

      return {
        ...task,
        startPosition,
        duration,
        endPosition,
        isCritical: false, // Will be calculated in critical path analysis
        predecessors: task.dependencies || [],
        successors: [] as string[]
      }
    })

    // Build successor relationships
    timelineTasks.forEach(task => {
      task.predecessors.forEach(predId => {
        const pred = timelineTasks.find(t => t._id?.toString() === predId)
        if (pred) {
          pred.successors.push(task._id!.toString())
        }
      })
    })

    // Calculate critical path (simplified - uses longest path algorithm)
    const criticalPath = this.calculateCriticalPath(timelineTasks)

    // Mark critical tasks
    timelineTasks.forEach(task => {
      task.isCritical = criticalPath.includes(task._id!.toString())
    })

    const projectDuration = Math.floor((projectEnd.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000))

    return {
      tasks: timelineTasks,
      criticalPath,
      projectDuration,
      projectStart,
      projectEnd
    }
  }

  /**
   * Calculate critical path (simplified)
   */
  private static calculateCriticalPath(tasks: any[]): string[] {
    // This is a simplified critical path calculation
    // A full implementation would use CPM (Critical Path Method) algorithm

    const taskMap = new Map(tasks.map(t => [t._id.toString(), t]))
    const visited = new Set<string>()
    const longestPaths = new Map<string, { length: number, path: string[] }>()

    const dfs = (taskId: string, currentPath: string[]): { length: number, path: string[] } => {
      if (visited.has(taskId)) {
        return longestPaths.get(taskId)!
      }

      const task = taskMap.get(taskId)
      if (!task) return { length: 0, path: [] }

      const newPath = [...currentPath, taskId]

      if (task.successors.length === 0) {
        const result = { length: task.duration, path: newPath }
        longestPaths.set(taskId, result)
        visited.add(taskId)
        return result
      }

      let maxPath = { length: 0, path: [] as string[] }

      for (const successorId of task.successors) {
        const successorPath = dfs(successorId, newPath)
        if (successorPath.length > maxPath.length) {
          maxPath = successorPath
        }
      }

      const result = {
        length: task.duration + maxPath.length,
        path: newPath.concat(maxPath.path)
      }

      longestPaths.set(taskId, result)
      visited.add(taskId)
      return result
    }

    // Find tasks with no predecessors (start tasks)
    const startTasks = tasks.filter(t => !t.predecessors || t.predecessors.length === 0)

    let criticalPath: string[] = []
    let maxLength = 0

    for (const startTask of startTasks) {
      const path = dfs(startTask._id.toString(), [])
      if (path.length > maxLength) {
        maxLength = path.length
        criticalPath = path.path
      }
    }

    return Array.from(new Set(criticalPath)) // Remove duplicates
  }

  /**
   * Add task dependency
   */
  static async addTaskDependency(
    taskId: string,
    orgId: string,
    dependencyId: string,
    dependencyType: ProjectTask['dependencyType'] = 'finish-to-start'
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Check for circular dependencies
    const hasCircular = await this.checkCircularDependency(taskId, dependencyId, orgId)
    if (hasCircular) {
      throw new Error('Circular dependency detected')
    }

    const result = await db.collection('project_tasks').updateOne(
      { _id: new ObjectId(taskId), orgId },
      {
        $addToSet: { dependencies: dependencyId },
        $set: { dependencyType, updatedAt: new Date() }
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * Remove task dependency
   */
  static async removeTaskDependency(
    taskId: string,
    orgId: string,
    dependencyId: string
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const result = await db.collection('project_tasks').updateOne(
      { _id: new ObjectId(taskId), orgId },
      {
        $pull: { dependencies: dependencyId },
        $set: { updatedAt: new Date() }
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * Check for circular dependencies
   */
  private static async checkCircularDependency(
    taskId: string,
    newDependencyId: string,
    orgId: string
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const visited = new Set<string>()
    const queue = [newDependencyId]

    while (queue.length > 0) {
      const currentId = queue.shift()!

      if (currentId === taskId) {
        return true // Circular dependency found
      }

      if (visited.has(currentId)) continue
      visited.add(currentId)

      const task = await db.collection('project_tasks').findOne({
        _id: new ObjectId(currentId),
        orgId
      })

      if (task && (task as any).dependencies) {
        queue.push(...(task as any).dependencies)
      }
    }

    return false
  }
}
