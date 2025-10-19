import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { Workflow, WorkflowStatus, WorkflowCategory, WorkflowNode, WorkflowEdge, TriggerConfig } from '@/lib/types'

export interface CreateWorkflowInput {
  name: string
  description: string
  category: WorkflowCategory
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
  viewport?: { x: number; y: number; zoom: number }
  trigger: {
    type: 'manual' | 'event' | 'schedule' | 'webhook'
    config: TriggerConfig
  }
  settings?: {
    enabled?: boolean
    runAsync?: boolean
    maxRetries?: number
    timeout?: number
    onError?: 'stop' | 'continue' | 'notify'
    notifyOnFailure?: boolean
    notifyEmails?: string[]
  }
}

export interface UpdateWorkflowInput {
  name?: string
  description?: string
  category?: WorkflowCategory
  status?: WorkflowStatus
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
  viewport?: { x: number; y: number; zoom: number }
  trigger?: {
    type: 'manual' | 'event' | 'schedule' | 'webhook'
    config: TriggerConfig
  }
  settings?: {
    enabled?: boolean
    runAsync?: boolean
    maxRetries?: number
    timeout?: number
    onError?: 'stop' | 'continue' | 'notify'
    notifyOnFailure?: boolean
    notifyEmails?: string[]
  }
}

export interface WorkflowFilters {
  status?: WorkflowStatus | WorkflowStatus[]
  category?: WorkflowCategory
  search?: string
  enabled?: boolean
}

export interface WorkflowValidationError {
  type: 'error' | 'warning'
  message: string
  nodeId?: string
}

export class WorkflowService {
  /**
   * Create a new workflow
   */
  static async createWorkflow(
    orgId: string,
    input: CreateWorkflowInput,
    createdBy: string
  ): Promise<Workflow> {
    const db = await getDatabase()
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    const now = new Date()
    const workflow: Omit<Workflow, '_id'> = {
      orgId,
      name: input.name,
      description: input.description,
      category: input.category,
      status: 'draft',
      version: 1,
      nodes: input.nodes || [],
      edges: input.edges || [],
      viewport: input.viewport || { x: 0, y: 0, zoom: 1 },
      trigger: input.trigger,
      executionCount: 0,
      settings: {
        enabled: input.settings?.enabled ?? false,
        runAsync: input.settings?.runAsync ?? true,
        maxRetries: input.settings?.maxRetries ?? 3,
        timeout: input.settings?.timeout ?? 300000, // 5 minutes
        onError: input.settings?.onError ?? 'stop',
        notifyOnFailure: input.settings?.notifyOnFailure ?? false,
        notifyEmails: input.settings?.notifyEmails ?? [],
      },
      metrics: {
        averageExecutionTime: 0,
        successRate: 0,
      },
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    const result = await workflowsCollection.insertOne(workflow as Workflow)

    return {
      ...workflow,
      _id: result.insertedId,
    } as Workflow
  }

  /**
   * Get workflows with filters
   */
  static async getWorkflows(
    orgId: string,
    filters?: WorkflowFilters
  ): Promise<Workflow[]> {
    const db = await getDatabase()
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    const query: any = { orgId }

    if (filters?.status) {
      query.status = Array.isArray(filters.status)
        ? { $in: filters.status }
        : filters.status
    }

    if (filters?.category) {
      query.category = filters.category
    }

    if (filters?.enabled !== undefined) {
      query['settings.enabled'] = filters.enabled
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ]
    }

    return await workflowsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Get workflow by ID
   */
  static async getWorkflowById(id: string, orgId: string): Promise<Workflow | null> {
    const db = await getDatabase()
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    return await workflowsCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Update workflow
   */
  static async updateWorkflow(
    id: string,
    orgId: string,
    updates: UpdateWorkflowInput
  ): Promise<Workflow | null> {
    const db = await getDatabase()
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    // If settings are being updated, merge with existing settings
    if (updates.settings) {
      const existing = await this.getWorkflowById(id, orgId)
      if (existing) {
        updateData.settings = {
          ...existing.settings,
          ...updates.settings,
        }
      }
    }

    const result = await workflowsCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Delete workflow
   */
  static async deleteWorkflow(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    const result = await workflowsCollection.deleteOne({
      _id: new ObjectId(id),
      orgId,
    })

    return result.deletedCount > 0
  }

  /**
   * Clone workflow
   */
  static async cloneWorkflow(
    id: string,
    orgId: string,
    newName: string,
    createdBy: string
  ): Promise<Workflow> {
    const db = await getDatabase()
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    // Get original workflow
    const original = await this.getWorkflowById(id, orgId)
    if (!original) {
      throw new Error('Workflow not found')
    }

    // Create cloned workflow
    const now = new Date()
    const cloned: Omit<Workflow, '_id'> = {
      orgId,
      name: newName,
      description: `Cloned from: ${original.name}`,
      category: original.category,
      status: 'draft',
      version: 1,
      nodes: original.nodes,
      edges: original.edges,
      viewport: original.viewport,
      trigger: original.trigger,
      templateId: original.templateId,
      executionCount: 0,
      settings: {
        ...original.settings,
        enabled: false, // Always start cloned workflows as disabled
      },
      metrics: {
        averageExecutionTime: 0,
        successRate: 0,
      },
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    const result = await workflowsCollection.insertOne(cloned as Workflow)

    return {
      ...cloned,
      _id: result.insertedId,
    } as Workflow
  }

  /**
   * Toggle workflow enabled/disabled
   */
  static async toggleWorkflow(
    id: string,
    orgId: string,
    enabled: boolean
  ): Promise<Workflow | null> {
    const db = await getDatabase()
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    // If enabling, validate the workflow first
    if (enabled) {
      const workflow = await this.getWorkflowById(id, orgId)
      if (workflow) {
        const validation = this.validateWorkflow(workflow)
        if (validation.errors.length > 0) {
          throw new Error(`Cannot enable workflow: ${validation.errors.map(e => e.message).join(', ')}`)
        }
      }
    }

    const result = await workflowsCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          'settings.enabled': enabled,
          status: enabled ? 'active' : 'inactive',
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Validate workflow structure
   */
  static validateWorkflow(workflow: Workflow): { valid: boolean; errors: WorkflowValidationError[]; warnings: WorkflowValidationError[] } {
    const errors: WorkflowValidationError[] = []
    const warnings: WorkflowValidationError[] = []

    // Check if workflow has nodes
    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push({
        type: 'error',
        message: 'Workflow must have at least one node',
      })
      return { valid: false, errors, warnings }
    }

    // Check for trigger node
    const triggerNodes = workflow.nodes.filter(n => n.type === 'trigger')
    if (triggerNodes.length === 0) {
      errors.push({
        type: 'error',
        message: 'Workflow must have a trigger node',
      })
    } else if (triggerNodes.length > 1) {
      errors.push({
        type: 'error',
        message: 'Workflow can only have one trigger node',
      })
    }

    // Check for end node
    const endNodes = workflow.nodes.filter(n => n.type === 'end')
    if (endNodes.length === 0) {
      warnings.push({
        type: 'warning',
        message: 'Workflow should have at least one end node',
      })
    }

    // Check for disconnected nodes
    const nodeIds = new Set(workflow.nodes.map(n => n.id))
    const connectedNodeIds = new Set<string>()

    // Add trigger nodes as starting points
    triggerNodes.forEach(n => connectedNodeIds.add(n.id))

    // Build connectivity graph
    workflow.edges.forEach(edge => {
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        connectedNodeIds.add(edge.source)
        connectedNodeIds.add(edge.target)
      }
    })

    // Check for disconnected nodes
    const disconnectedNodes = workflow.nodes.filter(n => !connectedNodeIds.has(n.id))
    if (disconnectedNodes.length > 0) {
      warnings.push({
        type: 'warning',
        message: `${disconnectedNodes.length} node(s) are not connected to the workflow`,
      })
    }

    // Check for circular dependencies (simple check)
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId)
      recursionStack.add(nodeId)

      const outgoingEdges = workflow.edges.filter(e => e.source === nodeId)
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (hasCycle(edge.target)) return true
        } else if (recursionStack.has(edge.target)) {
          return true
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const node of triggerNodes) {
      if (hasCycle(node.id)) {
        errors.push({
          type: 'error',
          message: 'Workflow contains circular dependencies',
        })
        break
      }
    }

    // Validate node configurations
    workflow.nodes.forEach(node => {
      // Check if node has required configuration
      if (!node.data || !node.data.config) {
        warnings.push({
          type: 'warning',
          message: `Node "${node.data?.label || node.id}" is not configured`,
          nodeId: node.id,
        })
      }

      // Node-specific validations
      switch (node.type) {
        case 'condition':
          if (!node.data.config.conditions || node.data.config.conditions.length === 0) {
            warnings.push({
              type: 'warning',
              message: `Condition node "${node.data.label}" has no conditions defined`,
              nodeId: node.id,
            })
          }
          break
        case 'action':
          if (!node.data.config.action || !node.data.config.module) {
            errors.push({
              type: 'error',
              message: `Action node "${node.data.label}" is missing action or module configuration`,
              nodeId: node.id,
            })
          }
          break
        case 'approval':
          if (!node.data.config.approvers || node.data.config.approvers.length === 0) {
            errors.push({
              type: 'error',
              message: `Approval node "${node.data.label}" has no approvers defined`,
              nodeId: node.id,
            })
          }
          break
        case 'delay':
          if (!node.data.config.delayType || !node.data.config.duration) {
            errors.push({
              type: 'error',
              message: `Delay node "${node.data.label}" is missing delay configuration`,
              nodeId: node.id,
            })
          }
          break
        case 'notification':
          if (!node.data.config.channel || !node.data.config.recipients) {
            errors.push({
              type: 'error',
              message: `Notification node "${node.data.label}" is missing channel or recipients`,
              nodeId: node.id,
            })
          }
          break
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Get workflow statistics
   */
  static async getWorkflowStats(orgId: string) {
    const db = await getDatabase()
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    const [
      total,
      draft,
      active,
      inactive,
      archived,
    ] = await Promise.all([
      workflowsCollection.countDocuments({ orgId }),
      workflowsCollection.countDocuments({ orgId, status: 'draft' }),
      workflowsCollection.countDocuments({ orgId, status: 'active' }),
      workflowsCollection.countDocuments({ orgId, status: 'inactive' }),
      workflowsCollection.countDocuments({ orgId, status: 'archived' }),
    ])

    // Get total executions today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const executionsCollection = db.collection(COLLECTIONS.WORKFLOW_EXECUTIONS)
    const executionsToday = await executionsCollection.countDocuments({
      orgId,
      createdAt: { $gte: today },
    })

    return {
      total,
      byStatus: {
        draft,
        active,
        inactive,
        archived,
      },
      executionsToday,
    }
  }

  /**
   * Update workflow execution metrics
   */
  static async updateWorkflowMetrics(
    id: string,
    orgId: string,
    executionTime: number,
    success: boolean
  ): Promise<void> {
    const db = await getDatabase()
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    const workflow = await this.getWorkflowById(id, orgId)
    if (!workflow) return

    const totalExecutions = workflow.executionCount + 1
    const currentAvg = workflow.metrics.averageExecutionTime
    const newAvg = ((currentAvg * workflow.executionCount) + executionTime) / totalExecutions

    const successfulExecutions = Math.round(workflow.metrics.successRate * workflow.executionCount / 100)
    const newSuccessRate = success
      ? ((successfulExecutions + 1) / totalExecutions) * 100
      : (successfulExecutions / totalExecutions) * 100

    await workflowsCollection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          executionCount: totalExecutions,
          lastExecutedAt: new Date(),
          'metrics.averageExecutionTime': newAvg,
          'metrics.successRate': newSuccessRate,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Archive workflow
   */
  static async archiveWorkflow(id: string, orgId: string): Promise<Workflow | null> {
    const db = await getDatabase()
    const workflowsCollection = db.collection<Workflow>(COLLECTIONS.WORKFLOWS)

    const result = await workflowsCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status: 'archived',
          'settings.enabled': false,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result || null
  }
}
