import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { WorkflowExecution, WorkflowExecutionStatus, NodeExecution, ExecutionContext, Workflow } from '@/lib/types'

export interface WorkflowExecutionFilters {
  workflowId?: string
  status?: WorkflowExecutionStatus | WorkflowExecutionStatus[]
  triggeredBy?: 'user' | 'event' | 'schedule' | 'webhook'
  startDateFrom?: Date
  startDateTo?: Date
  search?: string
}

export class WorkflowExecutionService {
  /**
   * Execute a workflow (SIMPLIFIED - STUB IMPLEMENTATION)
   * This creates an execution record and logs that execution would happen.
   * Actual node execution logic is NOT implemented yet.
   */
  static async executeWorkflow(
    workflowId: string,
    context: ExecutionContext,
    triggeredBy: 'user' | 'event' | 'schedule' | 'webhook',
    triggeredByUser?: string
  ): Promise<WorkflowExecution> {
    const db = await getDatabase()
    const executionsCollection = db.collection<WorkflowExecution>(COLLECTIONS.WORKFLOW_EXECUTIONS)
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    // Get workflow details
    const workflow = await workflowsCollection.findOne({
      _id: new ObjectId(workflowId),
      orgId: context.orgId,
    })

    if (!workflow) {
      throw new Error('Workflow not found')
    }

    // Check if workflow is enabled
    if (!workflow.settings.enabled) {
      throw new Error('Workflow is not enabled')
    }

    const now = new Date()

    // Create execution record
    const execution: Omit<WorkflowExecution, '_id'> = {
      orgId: context.orgId,
      workflowId: workflowId,
      workflowName: workflow.name,
      version: workflow.version,
      triggeredBy,
      triggeredByUser,
      triggerData: context.trigger,
      status: 'pending',
      startedAt: now,
      nodeExecutions: [],
      context,
      createdBy: context.user.id,
      createdAt: now,
      updatedAt: now,
    }

    const result = await executionsCollection.insertOne(execution as WorkflowExecution)

    const executionId = result.insertedId

    // STUB: Simulate execution process
    console.log(`[WORKFLOW EXECUTION] Starting execution for workflow: ${workflow.name} (ID: ${workflowId})`)
    console.log(`[WORKFLOW EXECUTION] Execution ID: ${executionId.toString()}`)
    console.log(`[WORKFLOW EXECUTION] Triggered by: ${triggeredBy}`)
    console.log(`[WORKFLOW EXECUTION] Nodes to execute: ${workflow.nodes.length}`)
    console.log(`[WORKFLOW EXECUTION] Context:`, JSON.stringify(context, null, 2))

    // Update execution to running status
    await executionsCollection.updateOne(
      { _id: executionId },
      {
        $set: {
          status: 'running',
          updatedAt: new Date(),
        },
      }
    )

    // STUB: Simulate node execution
    const nodeExecutions: NodeExecution[] = []

    for (const node of workflow.nodes) {
      const nodeStart = new Date()

      console.log(`[WORKFLOW EXECUTION] Executing node: ${node.data.label} (Type: ${node.type})`)

      const nodeExecution: NodeExecution = {
        nodeId: node.id,
        nodeType: node.type,
        status: 'completed',
        startedAt: nodeStart,
        completedAt: new Date(),
        duration: 50, // Mock 50ms execution time
        input: { context },
        output: { success: true, message: `Node ${node.data.label} executed successfully (MOCK)` },
        retryCount: 0,
      }

      nodeExecutions.push(nodeExecution)

      console.log(`[WORKFLOW EXECUTION] Node completed: ${node.data.label}`)
    }

    // Calculate total execution time
    const completedAt = new Date()
    const duration = completedAt.getTime() - now.getTime()

    // Update execution to completed
    await executionsCollection.updateOne(
      { _id: executionId },
      {
        $set: {
          status: 'completed',
          completedAt,
          duration,
          nodeExecutions,
          output: {
            success: true,
            message: 'Workflow executed successfully (STUB)',
            nodesExecuted: workflow.nodes.length,
          },
          updatedAt: new Date(),
        },
      }
    )

    console.log(`[WORKFLOW EXECUTION] Execution completed in ${duration}ms`)

    // Update workflow metrics (import WorkflowService to avoid circular dependency)
    const { WorkflowService } = await import('./workflows')
    await WorkflowService.updateWorkflowMetrics(workflowId, context.orgId, duration, true)

    // Return the completed execution
    const completedExecution = await executionsCollection.findOne({ _id: executionId })

    return completedExecution!
  }

  /**
   * Get executions with filters
   */
  static async getExecutions(
    orgId: string,
    filters?: WorkflowExecutionFilters
  ): Promise<WorkflowExecution[]> {
    const db = await getDatabase()
    const executionsCollection = db.collection<WorkflowExecution>(COLLECTIONS.WORKFLOW_EXECUTIONS)

    const query: any = { orgId }

    if (filters?.workflowId) {
      query.workflowId = filters.workflowId
    }

    if (filters?.status) {
      query.status = Array.isArray(filters.status)
        ? { $in: filters.status }
        : filters.status
    }

    if (filters?.triggeredBy) {
      query.triggeredBy = filters.triggeredBy
    }

    if (filters?.startDateFrom || filters?.startDateTo) {
      query.startedAt = {}
      if (filters.startDateFrom) {
        query.startedAt.$gte = filters.startDateFrom
      }
      if (filters.startDateTo) {
        query.startedAt.$lte = filters.startDateTo
      }
    }

    if (filters?.search) {
      query.$or = [
        { workflowName: { $regex: filters.search, $options: 'i' } },
      ]
    }

    return await executionsCollection
      .find(query)
      .sort({ startedAt: -1 })
      .limit(100) // Limit to most recent 100 executions
      .toArray()
  }

  /**
   * Get execution by ID
   */
  static async getExecutionById(id: string, orgId: string): Promise<WorkflowExecution | null> {
    const db = await getDatabase()
    const executionsCollection = db.collection<WorkflowExecution>(COLLECTIONS.WORKFLOW_EXECUTIONS)

    return await executionsCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Get executions for a specific workflow
   */
  static async getWorkflowExecutions(
    workflowId: string,
    orgId: string,
    limit: number = 20
  ): Promise<WorkflowExecution[]> {
    const db = await getDatabase()
    const executionsCollection = db.collection<WorkflowExecution>(COLLECTIONS.WORKFLOW_EXECUTIONS)

    return await executionsCollection
      .find({ workflowId, orgId })
      .sort({ startedAt: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Cancel execution (STUB IMPLEMENTATION)
   */
  static async cancelExecution(id: string, orgId: string): Promise<WorkflowExecution | null> {
    const db = await getDatabase()
    const executionsCollection = db.collection<WorkflowExecution>(COLLECTIONS.WORKFLOW_EXECUTIONS)

    console.log(`[WORKFLOW EXECUTION] Cancelling execution: ${id}`)

    const result = await executionsCollection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        orgId,
        status: { $in: ['pending', 'running'] },
      },
      {
        $set: {
          status: 'cancelled',
          completedAt: new Date(),
          updatedAt: new Date(),
          error: {
            message: 'Execution cancelled by user',
          },
        },
      },
      { returnDocument: 'after' }
    )

    console.log(`[WORKFLOW EXECUTION] Execution cancelled: ${id}`)

    return result || null
  }

  /**
   * Get execution statistics
   */
  static async getExecutionStats(orgId: string, workflowId?: string) {
    const db = await getDatabase()
    const executionsCollection = db.collection<WorkflowExecution>(COLLECTIONS.WORKFLOW_EXECUTIONS)

    const query: any = { orgId }
    if (workflowId) {
      query.workflowId = workflowId
    }

    const [
      total,
      pending,
      running,
      completed,
      failed,
      cancelled,
    ] = await Promise.all([
      executionsCollection.countDocuments(query),
      executionsCollection.countDocuments({ ...query, status: 'pending' }),
      executionsCollection.countDocuments({ ...query, status: 'running' }),
      executionsCollection.countDocuments({ ...query, status: 'completed' }),
      executionsCollection.countDocuments({ ...query, status: 'failed' }),
      executionsCollection.countDocuments({ ...query, status: 'cancelled' }),
    ])

    // Get executions today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const executionsToday = await executionsCollection.countDocuments({
      ...query,
      startedAt: { $gte: today },
    })

    // Calculate success rate
    const successRate = total > 0 ? (completed / total) * 100 : 0

    // Get average execution time for completed executions
    const completedExecutions = await executionsCollection
      .find({
        ...query,
        status: 'completed',
        duration: { $exists: true },
      })
      .limit(100)
      .toArray()

    const averageExecutionTime = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
      : 0

    return {
      total,
      byStatus: {
        pending,
        running,
        completed,
        failed,
        cancelled,
      },
      executionsToday,
      successRate: Math.round(successRate * 100) / 100,
      averageExecutionTime: Math.round(averageExecutionTime),
    }
  }

  /**
   * Delete old executions (cleanup utility)
   */
  static async deleteOldExecutions(
    orgId: string,
    olderThanDays: number = 90
  ): Promise<number> {
    const db = await getDatabase()
    const executionsCollection = db.collection<WorkflowExecution>(COLLECTIONS.WORKFLOW_EXECUTIONS)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await executionsCollection.deleteMany({
      orgId,
      createdAt: { $lt: cutoffDate },
      status: { $in: ['completed', 'failed', 'cancelled'] },
    })

    console.log(`[WORKFLOW EXECUTION] Deleted ${result.deletedCount} old executions older than ${olderThanDays} days`)

    return result.deletedCount
  }

  /**
   * Retry failed execution (STUB IMPLEMENTATION)
   */
  static async retryExecution(
    id: string,
    orgId: string,
    userId: string
  ): Promise<WorkflowExecution> {
    const db = await getDatabase()
    const executionsCollection = db.collection<WorkflowExecution>(COLLECTIONS.WORKFLOW_EXECUTIONS)

    // Get original execution
    const originalExecution = await this.getExecutionById(id, orgId)
    if (!originalExecution) {
      throw new Error('Execution not found')
    }

    if (originalExecution.status !== 'failed') {
      throw new Error('Can only retry failed executions')
    }

    console.log(`[WORKFLOW EXECUTION] Retrying failed execution: ${id}`)

    // Create new execution with same context
    const newExecution = await this.executeWorkflow(
      originalExecution.workflowId,
      originalExecution.context,
      'user',
      userId
    )

    console.log(`[WORKFLOW EXECUTION] Retry created new execution: ${newExecution._id.toString()}`)

    return newExecution
  }

  /**
   * Get execution logs (detailed step-by-step logs)
   */
  static async getExecutionLogs(
    executionId: string,
    orgId: string
  ): Promise<any[]> {
    const db = await getDatabase()
    const logsCollection = db.collection(COLLECTIONS.WORKFLOW_LOGS)

    const logs = await logsCollection
      .find({ executionId, orgId })
      .sort({ timestamp: 1 })
      .toArray()

    return logs
  }

  /**
   * Log execution event (for detailed debugging)
   */
  static async logExecutionEvent(
    executionId: string,
    orgId: string,
    level: 'info' | 'warning' | 'error',
    message: string,
    data?: any
  ): Promise<void> {
    const db = await getDatabase()
    const logsCollection = db.collection(COLLECTIONS.WORKFLOW_LOGS)

    await logsCollection.insertOne({
      executionId,
      orgId,
      level,
      message,
      data,
      timestamp: new Date(),
    })
  }
}
