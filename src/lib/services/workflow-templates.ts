import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { WorkflowTemplate, WorkflowNode, WorkflowEdge, TriggerConfig } from '@/lib/types'

export interface CreateTemplateInput {
  name: string
  description: string
  category: string
  icon: string
  tags: string[]
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  trigger: TriggerConfig
}

export interface TemplateCustomization {
  name: string
  description?: string
  category?: string
  trigger?: TriggerConfig
  nodeOverrides?: Record<string, any> // nodeId -> config overrides
}

export class WorkflowTemplateService {
  /**
   * Get all templates (system + organization-specific)
   */
  static async getTemplates(orgId: string): Promise<WorkflowTemplate[]> {
    const db = await getDatabase()
    const templatesCollection = db.collection<WorkflowTemplate>(COLLECTIONS.WORKFLOW_TEMPLATES)

    // Get both system templates and org-specific templates
    const templates = await templatesCollection
      .find({
        $or: [
          { isSystem: true },
          { orgId },
        ],
      })
      .sort({ usageCount: -1, createdAt: -1 })
      .toArray()

    return templates
  }

  /**
   * Get system templates only
   */
  static getSystemTemplates(): WorkflowTemplate[] {
    // Return pre-built system templates
    const now = new Date()

    return [
      {
        _id: new ObjectId(),
        orgId: 'system',
        name: 'Auto-Assign Critical Tickets',
        description: 'Automatically assign critical priority tickets to the on-call technician',
        category: 'ticket',
        icon: 'alert-circle',
        tags: ['tickets', 'automation', 'assignment'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Ticket Created',
              description: 'Triggers when a new ticket is created',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'tickets',
                event: 'created',
                conditions: [
                  { field: 'priority', operator: 'equals', value: 'critical' },
                ],
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 350, y: 100 },
            data: {
              label: 'Check Business Hours',
              description: 'Check if ticket created during business hours',
              icon: 'clock',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'trigger.createdAt.hour', operator: 'greater-than', value: 8 },
                  { field: 'trigger.createdAt.hour', operator: 'less-than', value: 17 },
                ],
                logicOperator: 'AND',
              },
            },
          },
          {
            id: 'assignment-1',
            type: 'assignment',
            position: { x: 600, y: 50 },
            data: {
              label: 'Assign to On-Call',
              description: 'Assign to current on-call technician',
              icon: 'user-check',
              color: '#3b82f6',
              config: {
                assignmentType: 'on-call',
                considerWorkload: false,
              },
            },
          },
          {
            id: 'assignment-2',
            type: 'assignment',
            position: { x: 600, y: 150 },
            data: {
              label: 'Assign to Manager',
              description: 'Assign to IT manager for after-hours',
              icon: 'user-check',
              color: '#3b82f6',
              config: {
                assignmentType: 'specific',
                userId: 'manager',
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 850, y: 100 },
            data: {
              label: 'Send Alert',
              description: 'Send email notification',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{item.assignedTo}}'],
                subject: 'Critical Ticket Assigned: {{item.ticketNumber}}',
                body: 'A critical priority ticket has been assigned to you.',
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Complete',
              icon: 'check-circle',
              color: '#10b981',
              config: {
                endType: 'success',
                message: 'Ticket assigned successfully',
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'assignment-1', sourceHandle: 'true', type: 'conditional', data: { label: 'True' } },
          { id: 'e3', source: 'condition-1', target: 'assignment-2', sourceHandle: 'false', type: 'conditional', data: { label: 'False' } },
          { id: 'e4', source: 'assignment-1', target: 'notification-1' },
          { id: 'e5', source: 'assignment-2', target: 'notification-1' },
          { id: 'e6', source: 'notification-1', target: 'end-1' },
        ],
        trigger: {
          module: 'tickets',
          event: 'created',
          conditions: [
            { field: 'priority', operator: 'equals', value: 'critical' },
          ],
        },
        isSystem: true,
        usageCount: 0,
        rating: 5,
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        orgId: 'system',
        name: 'Service Request Approval',
        description: 'Route service requests for manager approval based on estimated cost',
        category: 'ticket',
        icon: 'file-check',
        tags: ['tickets', 'service-requests', 'approval', 'workflow'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Service Request Created',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'tickets',
                event: 'created',
                conditions: [
                  { field: 'ticketType', operator: 'equals', value: 'service_request' },
                ],
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 350, y: 100 },
            data: {
              label: 'Check Cost',
              description: 'Check if cost exceeds approval threshold',
              icon: 'dollar-sign',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'item.metadata.estimatedCost', operator: 'greater-than', value: 1000 },
                ],
              },
            },
          },
          {
            id: 'approval-1',
            type: 'approval',
            position: { x: 600, y: 50 },
            data: {
              label: 'Manager Approval',
              description: 'Request approval from manager',
              icon: 'check-square',
              color: '#10b981',
              config: {
                approvers: ['{{item.requestedBy.manager}}'],
                approvalType: 'any',
                timeout: 86400000,
                onTimeout: 'reject',
                message: 'Please approve service request: {{item.title}}',
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 600, y: 150 },
            data: {
              label: 'Auto-Approve',
              description: 'Automatically approve low-cost requests',
              icon: 'check',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'tickets',
                itemId: '{{trigger.item._id}}',
                updates: {
                  status: 'approved',
                  'metadata.approvedBy': 'system',
                  'metadata.approvedAt': new Date(),
                },
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 850, y: 100 },
            data: {
              label: 'Update Status',
              description: 'Update service request based on approval',
              icon: 'edit',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'tickets',
                itemId: '{{trigger.item._id}}',
                updates: {
                  status: '{{approval.approved ? "approved" : "rejected"}}',
                  'metadata.approvalStatus': '{{approval.status}}',
                },
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Complete',
              icon: 'check-circle',
              color: '#10b981',
              config: {
                endType: 'success',
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'approval-1', sourceHandle: 'true', type: 'conditional', data: { label: 'High Cost' } },
          { id: 'e3', source: 'condition-1', target: 'action-1', sourceHandle: 'false', type: 'conditional', data: { label: 'Low Cost' } },
          { id: 'e4', source: 'approval-1', target: 'action-2' },
          { id: 'e5', source: 'action-1', target: 'end-1' },
          { id: 'e6', source: 'action-2', target: 'end-1' },
        ],
        trigger: {
          module: 'tickets',
          event: 'created',
          conditions: [
            { field: 'ticketType', operator: 'equals', value: 'service_request' },
          ],
        },
        isSystem: true,
        usageCount: 0,
        rating: 5,
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        orgId: 'system',
        name: 'SLA Escalation',
        description: 'Automatically escalate tickets when SLA breach is imminent',
        category: 'ticket',
        icon: 'alert-triangle',
        tags: ['tickets', 'sla', 'escalation'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'SLA Warning',
              description: 'Triggers 30 minutes before SLA breach',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'schedule',
                schedule: {
                  type: 'recurring',
                  cron: '*/15 * * * *', // Every 15 minutes
                },
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Find At-Risk Tickets',
              description: 'Query tickets close to SLA breach',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'tickets',
                query: {
                  status: { $in: ['new', 'open', 'pending'] },
                  'sla.breached': false,
                  'sla.resolutionDeadline': {
                    $lt: new Date(Date.now() + 30 * 60000), // 30 minutes
                  },
                },
              },
            },
          },
          {
            id: 'loop-1',
            type: 'loop',
            position: { x: 600, y: 100 },
            data: {
              label: 'For Each Ticket',
              description: 'Process each at-risk ticket',
              icon: 'repeat',
              color: '#f97316',
              config: {
                loopType: 'forEach',
                source: 'variables.atRiskTickets',
                itemVariable: 'currentTicket',
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 850, y: 100 },
            data: {
              label: 'Escalate to Manager',
              description: 'Update ticket and assign to manager',
              icon: 'arrow-up',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'tickets',
                itemId: '{{currentTicket._id}}',
                updates: {
                  priority: 'critical',
                  assignedTo: '{{currentTicket.assignedTo.manager}}',
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Send Escalation Alert',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{currentTicket.assignedTo.manager}}'],
                subject: 'SLA Escalation: {{currentTicket.ticketNumber}}',
                body: 'Ticket {{currentTicket.ticketNumber}} is at risk of SLA breach.',
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Complete',
              icon: 'check-circle',
              color: '#10b981',
              config: {
                endType: 'success',
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'action-1' },
          { id: 'e2', source: 'action-1', target: 'loop-1' },
          { id: 'e3', source: 'loop-1', target: 'action-2' },
          { id: 'e4', source: 'action-2', target: 'notification-1' },
          { id: 'e5', source: 'notification-1', target: 'end-1' },
        ],
        trigger: {
          schedule: {
            type: 'recurring',
            cron: '*/15 * * * *',
          },
        },
        isSystem: true,
        usageCount: 0,
        rating: 5,
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        orgId: 'system',
        name: 'New Asset Onboarding',
        description: 'Automatically create onboarding tasks when a new asset is added',
        category: 'asset',
        icon: 'package',
        tags: ['assets', 'onboarding', 'automation'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Asset Created',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'assets',
                event: 'created',
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Create Project',
              description: 'Create onboarding project',
              icon: 'folder',
              color: '#3b82f6',
              config: {
                action: 'create',
                module: 'projects',
                data: {
                  name: 'Onboard {{item.name}}',
                  description: 'Asset onboarding for {{item.assetTag}}',
                  status: 'active',
                },
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 600, y: 100 },
            data: {
              label: 'Create Setup Task',
              icon: 'check-square',
              color: '#3b82f6',
              config: {
                action: 'create',
                module: 'projects',
                subModule: 'tasks',
                data: {
                  projectId: '{{variables.project._id}}',
                  title: 'Initial Setup',
                  description: 'Configure and set up new asset',
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 850, y: 100 },
            data: {
              label: 'Notify IT Team',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['it-team@company.com'],
                subject: 'New Asset Added: {{item.name}}',
                body: 'A new asset has been added and requires onboarding.',
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Complete',
              icon: 'check-circle',
              color: '#10b981',
              config: {
                endType: 'success',
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'action-1' },
          { id: 'e2', source: 'action-1', target: 'action-2' },
          { id: 'e3', source: 'action-2', target: 'notification-1' },
          { id: 'e4', source: 'notification-1', target: 'end-1' },
        ],
        trigger: {
          module: 'assets',
          event: 'created',
        },
        isSystem: true,
        usageCount: 0,
        rating: 5,
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        orgId: 'system',
        name: 'Incident Response',
        description: 'Automated incident response workflow with notifications and escalation',
        category: 'ticket',
        icon: 'alert-octagon',
        tags: ['tickets', 'incidents', 'response', 'notifications'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Incident Created',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'tickets',
                event: 'created',
                conditions: [
                  { field: 'ticketType', operator: 'equals', value: 'incident' },
                  { field: 'metadata.severity', operator: 'equals', value: 'critical' },
                ],
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 350, y: 50 },
            data: {
              label: 'Alert Team',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['incident-team@company.com'],
                subject: 'CRITICAL INCIDENT: {{item.title}}',
                body: 'A critical incident has been created and requires immediate attention.',
              },
            },
          },
          {
            id: 'notification-2',
            type: 'notification',
            position: { x: 350, y: 150 },
            data: {
              label: 'Update Status Page',
              description: 'Update public incident status page',
              icon: 'globe',
              color: '#06b6d4',
              config: {
                channel: 'webhook',
                url: 'https://status.company.com/api/incidents',
                method: 'POST',
                body: {
                  title: '{{item.title}}',
                  description: '{{item.description}}',
                  status: 'investigating',
                },
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 600, y: 100 },
            data: {
              label: 'Create Response Team',
              icon: 'users',
              color: '#3b82f6',
              config: {
                action: 'create',
                module: 'projects',
                data: {
                  name: 'Incident Response: {{item.incidentNumber}}',
                  description: 'Response team for {{item.title}}',
                  status: 'active',
                  teamMembers: ['on-call', 'manager'],
                },
              },
            },
          },
          {
            id: 'delay-1',
            type: 'delay',
            position: { x: 850, y: 100 },
            data: {
              label: 'Wait 30 Minutes',
              icon: 'clock',
              color: '#8b5cf6',
              config: {
                delayType: 'duration',
                duration: 1800000, // 30 minutes
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Still Unresolved?',
              icon: 'help-circle',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'item.status', operator: 'not-equals', value: 'resolved' },
                ],
              },
            },
          },
          {
            id: 'notification-3',
            type: 'notification',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Escalate to Leadership',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['cto@company.com'],
                subject: 'ESCALATION: {{item.incidentNumber}}',
                body: 'Critical incident remains unresolved after 30 minutes.',
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1350, y: 200 },
            data: {
              label: 'Complete',
              icon: 'check-circle',
              color: '#10b981',
              config: {
                endType: 'success',
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'notification-1' },
          { id: 'e2', source: 'trigger-1', target: 'notification-2' },
          { id: 'e3', source: 'notification-1', target: 'action-1' },
          { id: 'e4', source: 'notification-2', target: 'action-1' },
          { id: 'e5', source: 'action-1', target: 'delay-1' },
          { id: 'e6', source: 'delay-1', target: 'condition-1' },
          { id: 'e7', source: 'condition-1', target: 'notification-3', sourceHandle: 'true', type: 'conditional' },
          { id: 'e8', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional' },
          { id: 'e9', source: 'notification-3', target: 'end-1' },
        ],
        trigger: {
          module: 'tickets',
          event: 'created',
          conditions: [
            { field: 'ticketType', operator: 'equals', value: 'incident' },
            { field: 'metadata.severity', operator: 'equals', value: 'critical' },
          ],
        },
        isSystem: true,
        usageCount: 0,
        rating: 5,
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      },
    ]
  }

  /**
   * Create custom template
   */
  static async createTemplate(
    orgId: string,
    input: CreateTemplateInput,
    createdBy: string
  ): Promise<WorkflowTemplate> {
    const db = await getDatabase()
    const templatesCollection = db.collection<WorkflowTemplate>(COLLECTIONS.WORKFLOW_TEMPLATES)

    const now = new Date()
    const template: Omit<WorkflowTemplate, '_id'> = {
      orgId,
      name: input.name,
      description: input.description,
      category: input.category,
      icon: input.icon,
      tags: input.tags,
      nodes: input.nodes,
      edges: input.edges,
      trigger: input.trigger,
      isSystem: false,
      usageCount: 0,
      rating: 0,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    const result = await templatesCollection.insertOne(template as WorkflowTemplate)

    return {
      ...template,
      _id: result.insertedId,
    } as WorkflowTemplate
  }

  /**
   * Create workflow from template
   */
  static async createFromTemplate(
    templateId: string,
    orgId: string,
    customizations: TemplateCustomization,
    createdBy: string
  ): Promise<any> {
    const db = await getDatabase()
    const templatesCollection = db.collection<WorkflowTemplate>(COLLECTIONS.WORKFLOW_TEMPLATES)

    // Get template
    let template: WorkflowTemplate | null = null

    // Check if it's a system template (by searching in system templates)
    const systemTemplates = this.getSystemTemplates()
    const systemTemplate = systemTemplates.find(t => t._id.toString() === templateId)

    if (systemTemplate) {
      template = systemTemplate
    } else {
      // Check database for custom template
      template = await templatesCollection.findOne({
        _id: new ObjectId(templateId),
        $or: [
          { isSystem: true },
          { orgId },
        ],
      })
    }

    if (!template) {
      throw new Error('Template not found')
    }

    // Apply customizations to template
    const nodes = template.nodes.map(node => {
      if (customizations.nodeOverrides && customizations.nodeOverrides[node.id]) {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              ...customizations.nodeOverrides[node.id],
            },
          },
        }
      }
      return node
    })

    // Create workflow from template using WorkflowService
    const { WorkflowService } = await import('./workflows')

    const workflow = await WorkflowService.createWorkflow(
      orgId,
      {
        name: customizations.name,
        description: customizations.description || template.description,
        category: (customizations.category as any) || (template.category as any),
        nodes,
        edges: template.edges,
        trigger: {
          type: template.trigger.module ? 'event' : 'manual',
          config: customizations.trigger || template.trigger,
        },
      },
      createdBy
    )

    // Increment template usage count
    await templatesCollection.updateOne(
      { _id: template._id },
      { $inc: { usageCount: 1 } }
    )

    return workflow
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(id: string, orgId: string): Promise<WorkflowTemplate | null> {
    const db = await getDatabase()
    const templatesCollection = db.collection<WorkflowTemplate>(COLLECTIONS.WORKFLOW_TEMPLATES)

    // Check system templates first
    const systemTemplates = this.getSystemTemplates()
    const systemTemplate = systemTemplates.find(t => t._id.toString() === id)

    if (systemTemplate) {
      return systemTemplate
    }

    // Check database
    return await templatesCollection.findOne({
      _id: new ObjectId(id),
      $or: [
        { isSystem: true },
        { orgId },
      ],
    })
  }

  /**
   * Delete custom template
   */
  static async deleteTemplate(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const templatesCollection = db.collection<WorkflowTemplate>(COLLECTIONS.WORKFLOW_TEMPLATES)

    // Only allow deleting non-system templates
    const result = await templatesCollection.deleteOne({
      _id: new ObjectId(id),
      orgId,
      isSystem: false,
    })

    return result.deletedCount > 0
  }
}
