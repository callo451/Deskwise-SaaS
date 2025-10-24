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
      {
        _id: new ObjectId(),
        orgId: 'system',
        name: 'VIP User Prioritization',
        description: 'Automatically prioritize and expedite tickets from VIP users',
        category: 'ticket',
        icon: 'star',
        tags: ['tickets', 'vip', 'priority', 'automation'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Ticket Created',
              description: 'Triggers when any ticket is created',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'tickets',
                event: 'created',
                conditions: [],
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 350, y: 100 },
            data: {
              label: 'Check if VIP',
              description: 'Check if requester is VIP user',
              icon: 'users',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'trigger.item.requestedBy.isVIP', operator: 'equals', value: true },
                ],
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 600, y: 100 },
            data: {
              label: 'Upgrade Priority',
              description: 'Set priority to high and add VIP tag',
              icon: 'arrow-up',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'tickets',
                itemId: '{{trigger.item._id}}',
                updates: {
                  priority: 'high',
                  tags: ['VIP'],
                  'metadata.isVIP': true,
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 850, y: 100 },
            data: {
              label: 'Notify Senior Tech',
              description: 'Alert senior technician about VIP ticket',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['senior-tech@example.com'],
                subject: 'VIP Ticket Created: {{item.ticketNumber}}',
                body: 'A VIP user has submitted a ticket requiring priority attention.',
              },
            },
          },
          {
            id: 'assignment-1',
            type: 'assignment',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Assign to Senior',
              description: 'Assign to senior technician',
              icon: 'user-check',
              color: '#3b82f6',
              config: {
                assignmentType: 'skill-based',
                requiredSkills: ['vip-support'],
                considerWorkload: true,
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
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'action-1', sourceHandle: 'true', type: 'conditional', data: { label: 'Is VIP' } },
          { id: 'e3', source: 'action-1', target: 'notification-1' },
          { id: 'e4', source: 'notification-1', target: 'assignment-1' },
          { id: 'e5', source: 'assignment-1', target: 'end-1' },
        ],
        trigger: {
          module: 'tickets',
          event: 'created',
          conditions: [],
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
        name: 'After-Hours Escalation',
        description: 'Escalate urgent tickets created outside business hours',
        category: 'ticket',
        icon: 'moon',
        tags: ['tickets', 'after-hours', 'escalation', 'automation'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Urgent Ticket Created',
              description: 'Triggers on urgent/critical tickets',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'tickets',
                event: 'created',
                conditions: [
                  { field: 'priority', operator: 'in', value: ['urgent', 'critical'] },
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
              description: 'Determine if outside business hours',
              icon: 'clock',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'trigger.createdAt.hour', operator: 'less-than', value: 8 },
                  { field: 'trigger.createdAt.hour', operator: 'greater-than', value: 18 },
                ],
                logicOperator: 'OR',
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 600, y: 100 },
            data: {
              label: 'Alert On-Call',
              description: 'Send SMS to on-call technician',
              icon: 'smartphone',
              color: '#06b6d4',
              config: {
                channel: 'sms',
                recipients: ['{{on-call-technician}}'],
                subject: 'URGENT: After-Hours Ticket',
                body: 'Priority {{item.priority}} ticket created after hours: {{item.title}}',
              },
            },
          },
          {
            id: 'assignment-1',
            type: 'assignment',
            position: { x: 850, y: 100 },
            data: {
              label: 'Assign to On-Call',
              description: 'Assign to on-call technician',
              icon: 'user-check',
              color: '#3b82f6',
              config: {
                assignmentType: 'on-call',
                considerWorkload: false,
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Update Metadata',
              description: 'Tag as after-hours ticket',
              icon: 'tag',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'tickets',
                itemId: '{{trigger.item._id}}',
                updates: {
                  tags: ['after-hours'],
                  'metadata.afterHours': true,
                  'metadata.escalated': true,
                },
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
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'notification-1', sourceHandle: 'true', type: 'conditional', data: { label: 'After Hours' } },
          { id: 'e3', source: 'notification-1', target: 'assignment-1' },
          { id: 'e4', source: 'assignment-1', target: 'action-1' },
          { id: 'e5', source: 'action-1', target: 'end-1' },
        ],
        trigger: {
          module: 'tickets',
          event: 'created',
          conditions: [
            { field: 'priority', operator: 'in', value: ['urgent', 'critical'] },
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
        name: 'Auto-Categorization',
        description: 'Automatically categorize and tag tickets based on content analysis',
        category: 'ticket',
        icon: 'tags',
        tags: ['tickets', 'ai', 'categorization', 'automation'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Ticket Created',
              description: 'Triggers on new ticket creation',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'tickets',
                event: 'created',
                conditions: [],
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Analyze Content',
              description: 'Use AI to analyze ticket title and description',
              icon: 'brain',
              color: '#3b82f6',
              config: {
                action: 'ai-analyze',
                input: '{{trigger.item.title}} {{trigger.item.description}}',
                outputVariable: 'analysis',
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 600, y: 100 },
            data: {
              label: 'Apply Category',
              description: 'Update ticket with suggested category and tags',
              icon: 'folder',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'tickets',
                itemId: '{{trigger.item._id}}',
                updates: {
                  category: '{{variables.analysis.category}}',
                  tags: '{{variables.analysis.tags}}',
                  'metadata.autoCategor ized': true,
                },
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 850, y: 100 },
            data: {
              label: 'Check Confidence',
              description: 'Check if categorization confidence is high',
              icon: 'percent',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'variables.analysis.confidence', operator: 'greater-than', value: 0.8 },
                ],
              },
            },
          },
          {
            id: 'assignment-1',
            type: 'assignment',
            position: { x: 1100, y: 50 },
            data: {
              label: 'Auto-Assign',
              description: 'Assign based on category',
              icon: 'user-check',
              color: '#3b82f6',
              config: {
                assignmentType: 'category-based',
                category: '{{variables.analysis.category}}',
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
          { id: 'e2', source: 'action-1', target: 'action-2' },
          { id: 'e3', source: 'action-2', target: 'condition-1' },
          { id: 'e4', source: 'condition-1', target: 'assignment-1', sourceHandle: 'true', type: 'conditional', data: { label: 'High Confidence' } },
          { id: 'e5', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'Low Confidence' } },
          { id: 'e6', source: 'assignment-1', target: 'end-1' },
        ],
        trigger: {
          module: 'tickets',
          event: 'created',
          conditions: [],
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
        name: 'Knowledge Article Suggestions',
        description: 'Suggest relevant KB articles to technicians based on ticket content',
        category: 'knowledge',
        icon: 'book-open',
        tags: ['knowledge', 'ai', 'recommendations', 'automation'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Ticket Created or Updated',
              description: 'Triggers on ticket create/update',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'tickets',
                event: 'created',
                conditions: [],
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Search KB',
              description: 'Search knowledge base for relevant articles',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'knowledge',
                query: '{{trigger.item.title}} {{trigger.item.description}}',
                limit: 5,
                outputVariable: 'suggestedArticles',
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 600, y: 100 },
            data: {
              label: 'Articles Found?',
              description: 'Check if any articles match',
              icon: 'help-circle',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'variables.suggestedArticles.length', operator: 'greater-than', value: 0 },
                ],
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 850, y: 100 },
            data: {
              label: 'Add Comment',
              description: 'Add suggested articles as internal comment',
              icon: 'message-square',
              color: '#3b82f6',
              config: {
                action: 'create',
                module: 'comments',
                data: {
                  ticketId: '{{trigger.item._id}}',
                  content: 'Suggested KB Articles:\\n{{variables.suggestedArticles}}',
                  isInternal: true,
                  type: 'system',
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Notify Assignee',
              description: 'Alert assigned technician',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'in-app',
                recipients: ['{{item.assignedTo}}'],
                subject: 'KB Articles Available',
                body: '{{variables.suggestedArticles.length}} relevant articles found for ticket {{item.ticketNumber}}',
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
          { id: 'e2', source: 'action-1', target: 'condition-1' },
          { id: 'e3', source: 'condition-1', target: 'action-2', sourceHandle: 'true', type: 'conditional', data: { label: 'Found' } },
          { id: 'e4', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'None' } },
          { id: 'e5', source: 'action-2', target: 'notification-1' },
          { id: 'e6', source: 'notification-1', target: 'end-1' },
        ],
        trigger: {
          module: 'tickets',
          event: 'created',
          conditions: [],
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
        name: 'Customer Satisfaction Survey',
        description: 'Send CSAT survey when ticket is resolved',
        category: 'ticket',
        icon: 'star',
        tags: ['tickets', 'csat', 'feedback', 'automation'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Ticket Resolved',
              description: 'Triggers when ticket status changes to resolved',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'tickets',
                event: 'updated',
                conditions: [
                  { field: 'status', operator: 'equals', value: 'resolved' },
                ],
              },
            },
          },
          {
            id: 'delay-1',
            type: 'delay',
            position: { x: 350, y: 100 },
            data: {
              label: 'Wait 1 Hour',
              description: 'Give user time to verify resolution',
              icon: 'clock',
              color: '#f59e0b',
              config: {
                delayType: 'duration',
                duration: 3600000, // 1 hour in ms
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 600, y: 100 },
            data: {
              label: 'Still Resolved?',
              description: 'Check if ticket still resolved (not reopened)',
              icon: 'check',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'item.status', operator: 'equals', value: 'resolved' },
                ],
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 850, y: 100 },
            data: {
              label: 'Send CSAT Survey',
              description: 'Email satisfaction survey to requester',
              icon: 'mail',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{item.requestedBy.email}}'],
                subject: 'How was your support experience? [Ticket {{item.ticketNumber}}]',
                body: 'Please take a moment to rate your support experience.',
                template: 'csat-survey',
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Update Metadata',
              description: 'Mark survey as sent',
              icon: 'edit',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'tickets',
                itemId: '{{trigger.item._id}}',
                updates: {
                  'metadata.csatSurveySent': true,
                  'metadata.csatSentAt': new Date(),
                },
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
          { id: 'e1', source: 'trigger-1', target: 'delay-1' },
          { id: 'e2', source: 'delay-1', target: 'condition-1' },
          { id: 'e3', source: 'condition-1', target: 'notification-1', sourceHandle: 'true', type: 'conditional', data: { label: 'Yes' } },
          { id: 'e4', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'Reopened' } },
          { id: 'e5', source: 'notification-1', target: 'action-1' },
          { id: 'e6', source: 'action-1', target: 'end-1' },
        ],
        trigger: {
          module: 'tickets',
          event: 'updated',
          conditions: [
            { field: 'status', operator: 'equals', value: 'resolved' },
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
        name: 'Change Request Approval Flow',
        description: 'Multi-level approval workflow for change requests based on risk level',
        category: 'change',
        icon: 'git-pull-request',
        tags: ['change', 'approval', 'itil', 'workflow'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Change Request Created',
              description: 'Triggers when new change request submitted',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'changes',
                event: 'created',
                conditions: [],
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 350, y: 100 },
            data: {
              label: 'Check Risk Level',
              description: 'Route based on change risk',
              icon: 'alert-triangle',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'trigger.item.risk', operator: 'equals', value: 'high' },
                ],
              },
            },
          },
          {
            id: 'approval-1',
            type: 'approval',
            position: { x: 600, y: 50 },
            data: {
              label: 'CAB Approval',
              description: 'Require Change Advisory Board approval',
              icon: 'users',
              color: '#10b981',
              config: {
                approvers: ['{{change-advisory-board}}'],
                approvalType: 'majority',
                timeout: 172800000, // 48 hours
                onTimeout: 'reject',
                message: 'High-risk change requires CAB approval: {{item.title}}',
              },
            },
          },
          {
            id: 'approval-2',
            type: 'approval',
            position: { x: 600, y: 150 },
            data: {
              label: 'Manager Approval',
              description: 'Standard manager approval for low/medium risk',
              icon: 'user-check',
              color: '#10b981',
              config: {
                approvers: ['{{item.requestedBy.manager}}'],
                approvalType: 'any',
                timeout: 86400000, // 24 hours
                onTimeout: 'reject',
                message: 'Change request requires approval: {{item.title}}',
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 850, y: 100 },
            data: {
              label: 'Update Status',
              description: 'Update change request status based on approval',
              icon: 'edit',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'changes',
                itemId: '{{trigger.item._id}}',
                updates: {
                  status: '{{approval.approved ? "approved" : "rejected"}}',
                  'metadata.approvalDecision': '{{approval.decision}}',
                  'metadata.approvedBy': '{{approval.approver}}',
                  'metadata.approvedAt': new Date(),
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Notify Requester',
              description: 'Send decision notification',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{item.requestedBy.email}}'],
                subject: 'Change Request {{approval.approved ? "Approved" : "Rejected"}}: {{item.changeNumber}}',
                body: 'Your change request has been {{approval.approved ? "approved" : "rejected"}}.',
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
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'approval-1', sourceHandle: 'true', type: 'conditional', data: { label: 'High Risk' } },
          { id: 'e3', source: 'condition-1', target: 'approval-2', sourceHandle: 'false', type: 'conditional', data: { label: 'Low/Medium Risk' } },
          { id: 'e4', source: 'approval-1', target: 'action-1' },
          { id: 'e5', source: 'approval-2', target: 'action-1' },
          { id: 'e6', source: 'action-1', target: 'notification-1' },
          { id: 'e7', source: 'notification-1', target: 'end-1' },
        ],
        trigger: {
          module: 'changes',
          event: 'created',
          conditions: [],
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
        name: 'Change Implementation Reminder',
        description: 'Send reminders before scheduled change implementation',
        category: 'change',
        icon: 'calendar-clock',
        tags: ['change', 'reminders', 'scheduling', 'communication'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Scheduled Check',
              description: 'Runs every hour to check upcoming changes',
              icon: 'clock',
              color: '#667eea',
              config: {
                type: 'schedule',
                schedule: {
                  type: 'recurring',
                  cron: '0 * * * *', // Every hour
                },
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Find Upcoming Changes',
              description: 'Query approved changes within 24 hours',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'changes',
                query: {
                  status: 'approved',
                  'scheduledImplementation': {
                    $gte: new Date(),
                    $lt: new Date(Date.now() + 86400000), // 24 hours
                  },
                  'metadata.reminderSent': { $ne: true },
                },
                outputVariable: 'upcomingChanges',
              },
            },
          },
          {
            id: 'loop-1',
            type: 'loop',
            position: { x: 600, y: 100 },
            data: {
              label: 'For Each Change',
              description: 'Process each upcoming change',
              icon: 'repeat',
              color: '#f97316',
              config: {
                loopType: 'forEach',
                source: 'variables.upcomingChanges',
                itemVariable: 'change',
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 850, y: 100 },
            data: {
              label: 'Send Reminder',
              description: 'Notify implementation team',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{change.assignedTo}}', '{{change.implementationTeam}}'],
                subject: 'Change Implementation Reminder: {{change.changeNumber}}',
                body: 'Change scheduled for implementation at {{change.scheduledImplementation}}',
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Mark Reminder Sent',
              description: 'Update change record',
              icon: 'check',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'changes',
                itemId: '{{change._id}}',
                updates: {
                  'metadata.reminderSent': true,
                  'metadata.reminderSentAt': new Date(),
                },
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
          { id: 'e3', source: 'loop-1', target: 'notification-1' },
          { id: 'e4', source: 'notification-1', target: 'action-2' },
          { id: 'e5', source: 'action-2', target: 'end-1' },
        ],
        trigger: {
          module: 'system',
          event: 'schedule',
          conditions: [],
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
        name: 'Problem Investigation Workflow',
        description: 'Structured workflow for problem investigation and root cause analysis',
        category: 'problem',
        icon: 'search',
        tags: ['problem', 'investigation', 'rca', 'itil'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Problem Created',
              description: 'Triggers when new problem record created',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'problems',
                event: 'created',
                conditions: [],
              },
            },
          },
          {
            id: 'assignment-1',
            type: 'assignment',
            position: { x: 350, y: 100 },
            data: {
              label: 'Assign Problem Manager',
              description: 'Assign to problem management team',
              icon: 'user-check',
              color: '#3b82f6',
              config: {
                assignmentType: 'role-based',
                role: 'problem-manager',
                considerWorkload: true,
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 600, y: 100 },
            data: {
              label: 'Find Related Incidents',
              description: 'Search for related incidents',
              icon: 'link',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'tickets',
                query: {
                  ticketType: 'incident',
                  'metadata.symptoms': '{{trigger.item.symptoms}}',
                },
                limit: 10,
                outputVariable: 'relatedIncidents',
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 850, y: 100 },
            data: {
              label: 'Link Incidents',
              description: 'Associate related incidents with problem',
              icon: 'paperclip',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'problems',
                itemId: '{{trigger.item._id}}',
                updates: {
                  'relatedIncidents': '{{variables.relatedIncidents}}',
                  status: 'investigating',
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Notify Team',
              description: 'Alert problem manager and team',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{item.assignedTo}}', 'problem-team@example.com'],
                subject: 'Problem Investigation Started: {{item.problemNumber}}',
                body: 'New problem record requires investigation. {{variables.relatedIncidents.length}} related incidents found.',
              },
            },
          },
          {
            id: 'delay-1',
            type: 'delay',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Wait for RCA',
              description: 'Wait 7 days for root cause analysis',
              icon: 'clock',
              color: '#f59e0b',
              config: {
                delayType: 'duration',
                duration: 604800000, // 7 days
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 1600, y: 100 },
            data: {
              label: 'RCA Complete?',
              description: 'Check if root cause identified',
              icon: 'help-circle',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'item.rootCause', operator: 'is-not-empty', value: null },
                ],
              },
            },
          },
          {
            id: 'notification-2',
            type: 'notification',
            position: { x: 1850, y: 50 },
            data: {
              label: 'RCA Reminder',
              description: 'Remind to complete root cause analysis',
              icon: 'alert-circle',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{item.assignedTo}}'],
                subject: 'Reminder: Complete RCA for {{item.problemNumber}}',
                body: 'Root cause analysis pending for problem record.',
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1850, y: 150 },
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
          { id: 'e1', source: 'trigger-1', target: 'assignment-1' },
          { id: 'e2', source: 'assignment-1', target: 'action-1' },
          { id: 'e3', source: 'action-1', target: 'action-2' },
          { id: 'e4', source: 'action-2', target: 'notification-1' },
          { id: 'e5', source: 'notification-1', target: 'delay-1' },
          { id: 'e6', source: 'delay-1', target: 'condition-1' },
          { id: 'e7', source: 'condition-1', target: 'end-1', sourceHandle: 'true', type: 'conditional', data: { label: 'Complete' } },
          { id: 'e8', source: 'condition-1', target: 'notification-2', sourceHandle: 'false', type: 'conditional', data: { label: 'Pending' } },
          { id: 'e9', source: 'notification-2', target: 'end-1' },
        ],
        trigger: {
          module: 'problems',
          event: 'created',
          conditions: [],
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
        name: 'Duplicate Incident Detection',
        description: 'Detect and link potential duplicate incidents automatically',
        category: 'incident',
        icon: 'copy',
        tags: ['incident', 'duplicate', 'ai', 'automation'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Incident Created',
              description: 'Triggers on new incident creation',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'tickets',
                event: 'created',
                conditions: [
                  { field: 'ticketType', operator: 'equals', value: 'incident' },
                ],
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Search Similar',
              description: 'Find incidents with similar symptoms',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'tickets',
                query: {
                  ticketType: 'incident',
                  status: { $in: ['new', 'open', 'investigating'] },
                  createdAt: { $gte: new Date(Date.now() - 86400000) }, // Last 24 hours
                },
                similarity: {
                  field: 'title',
                  threshold: 0.8,
                  source: '{{trigger.item.title}}',
                },
                limit: 5,
                outputVariable: 'similarIncidents',
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 600, y: 100 },
            data: {
              label: 'Duplicates Found?',
              description: 'Check if similar incidents exist',
              icon: 'help-circle',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'variables.similarIncidents.length', operator: 'greater-than', value: 0 },
                ],
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 850, y: 100 },
            data: {
              label: 'Add Duplicate Tag',
              description: 'Tag as potential duplicate',
              icon: 'tag',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'tickets',
                itemId: '{{trigger.item._id}}',
                updates: {
                  tags: ['potential-duplicate'],
                  'metadata.similarIncidents': '{{variables.similarIncidents}}',
                  'metadata.duplicateCheckPerformed': true,
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Notify Assignee',
              description: 'Alert about potential duplicates',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'in-app',
                recipients: ['{{item.assignedTo}}'],
                subject: 'Potential Duplicate Incident',
                body: '{{variables.similarIncidents.length}} similar incidents found. Review for potential duplicates.',
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
          { id: 'e2', source: 'action-1', target: 'condition-1' },
          { id: 'e3', source: 'condition-1', target: 'action-2', sourceHandle: 'true', type: 'conditional', data: { label: 'Found' } },
          { id: 'e4', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'None' } },
          { id: 'e5', source: 'action-2', target: 'notification-1' },
          { id: 'e6', source: 'notification-1', target: 'end-1' },
        ],
        trigger: {
          module: 'tickets',
          event: 'created',
          conditions: [
            { field: 'ticketType', operator: 'equals', value: 'incident' },
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
        name: 'Asset Warranty Expiration Alert',
        description: 'Send alerts when asset warranties are about to expire',
        category: 'asset',
        icon: 'shield-alert',
        tags: ['asset', 'warranty', 'alerts', 'preventive'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Daily Check',
              description: 'Runs daily to check warranty expirations',
              icon: 'clock',
              color: '#667eea',
              config: {
                type: 'schedule',
                schedule: {
                  type: 'recurring',
                  cron: '0 9 * * *', // Daily at 9 AM
                },
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Find Expiring Warranties',
              description: 'Query assets with warranties expiring in 30 days',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'assets',
                query: {
                  'warranty.expirationDate': {
                    $gte: new Date(),
                    $lt: new Date(Date.now() + 30 * 86400000), // 30 days
                  },
                  'metadata.warrantyAlertSent': { $ne: true },
                },
                outputVariable: 'expiringAssets',
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 600, y: 100 },
            data: {
              label: 'Assets Found?',
              description: 'Check if any assets found',
              icon: 'help-circle',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'variables.expiringAssets.length', operator: 'greater-than', value: 0 },
                ],
              },
            },
          },
          {
            id: 'loop-1',
            type: 'loop',
            position: { x: 850, y: 100 },
            data: {
              label: 'For Each Asset',
              description: 'Process each expiring asset',
              icon: 'repeat',
              color: '#f97316',
              config: {
                loopType: 'forEach',
                source: 'variables.expiringAssets',
                itemVariable: 'asset',
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Send Alert',
              description: 'Notify asset manager',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['asset-manager@example.com', '{{asset.assignedTo.email}}'],
                subject: 'Warranty Expiring Soon: {{asset.name}}',
                body: 'Asset warranty expires on {{asset.warranty.expirationDate}}. Consider renewal.',
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Mark Alert Sent',
              description: 'Update asset record',
              icon: 'check',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'assets',
                itemId: '{{asset._id}}',
                updates: {
                  'metadata.warrantyAlertSent': true,
                  'metadata.warrantyAlertSentAt': new Date(),
                },
              },
            },
          },
          {
            id: 'action-3',
            type: 'action',
            position: { x: 1600, y: 100 },
            data: {
              label: 'Create Reminder Task',
              description: 'Create task for warranty renewal',
              icon: 'plus',
              color: '#3b82f6',
              config: {
                action: 'create',
                module: 'tasks',
                data: {
                  title: 'Review warranty renewal for {{asset.name}}',
                  description: 'Warranty expires {{asset.warranty.expirationDate}}',
                  assignedTo: 'asset-manager',
                  dueDate: '{{asset.warranty.expirationDate}}',
                  priority: 'medium',
                },
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1850, y: 100 },
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
          { id: 'e2', source: 'action-1', target: 'condition-1' },
          { id: 'e3', source: 'condition-1', target: 'loop-1', sourceHandle: 'true', type: 'conditional', data: { label: 'Found' } },
          { id: 'e4', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'None' } },
          { id: 'e5', source: 'loop-1', target: 'notification-1' },
          { id: 'e6', source: 'notification-1', target: 'action-2' },
          { id: 'e7', source: 'action-2', target: 'action-3' },
          { id: 'e8', source: 'action-3', target: 'end-1' },
        ],
        trigger: {
          module: 'system',
          event: 'schedule',
          conditions: [],
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
        name: 'Project Milestone Tracking',
        description: 'Automatically notify stakeholders when project milestones are achieved',
        category: 'project',
        icon: 'flag',
        tags: ['project', 'milestones', 'notifications', 'tracking'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Task Completed',
              description: 'Triggers when project task marked complete',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'tasks',
                event: 'updated',
                conditions: [
                  { field: 'status', operator: 'equals', value: 'completed' },
                  { field: 'isMilestone', operator: 'equals', value: true },
                ],
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Update Project Progress',
              description: 'Recalculate project completion percentage',
              icon: 'percent',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'projects',
                itemId: '{{trigger.item.projectId}}',
                updates: {
                  'metadata.lastMilestoneCompleted': '{{trigger.item.title}}',
                  'metadata.lastMilestoneDate': new Date(),
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 600, y: 100 },
            data: {
              label: 'Notify Stakeholders',
              description: 'Send milestone achievement notification',
              icon: 'users',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{project.stakeholders}}', '{{project.projectManager}}'],
                subject: 'Milestone Achieved: {{item.title}}',
                body: 'Project milestone "{{item.title}}" has been completed on {{item.completedAt}}',
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 850, y: 100 },
            data: {
              label: 'All Milestones Done?',
              description: 'Check if all project milestones complete',
              icon: 'check-circle',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'project.allMilestonesComplete', operator: 'equals', value: true },
                ],
              },
            },
          },
          {
            id: 'notification-2',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Project Complete Alert',
              description: 'Send project completion notification',
              icon: 'check-square',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{project.stakeholders}}', '{{project.projectManager}}'],
                subject: 'Project Complete: {{project.name}}',
                body: 'All project milestones have been achieved. Ready for final review.',
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
          { id: 'e2', source: 'action-1', target: 'notification-1' },
          { id: 'e3', source: 'notification-1', target: 'condition-1' },
          { id: 'e4', source: 'condition-1', target: 'notification-2', sourceHandle: 'true', type: 'conditional', data: { label: 'Yes' } },
          { id: 'e5', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'No' } },
          { id: 'e6', source: 'notification-2', target: 'end-1' },
        ],
        trigger: {
          module: 'tasks',
          event: 'updated',
          conditions: [
            { field: 'status', operator: 'equals', value: 'completed' },
            { field: 'isMilestone', operator: 'equals', value: true },
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
        name: 'Overdue Invoice Reminder',
        description: 'Send automatic reminders for overdue invoices',
        category: 'billing',
        icon: 'credit-card',
        tags: ['billing', 'invoices', 'reminders', 'collections'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Daily Check',
              description: 'Runs daily to check overdue invoices',
              icon: 'clock',
              color: '#667eea',
              config: {
                type: 'schedule',
                schedule: {
                  type: 'recurring',
                  cron: '0 10 * * *', // Daily at 10 AM
                },
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Find Overdue Invoices',
              description: 'Query invoices past due date',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'invoices',
                query: {
                  status: 'sent',
                  dueDate: { $lt: new Date() },
                },
                outputVariable: 'overdueInvoices',
              },
            },
          },
          {
            id: 'loop-1',
            type: 'loop',
            position: { x: 600, y: 100 },
            data: {
              label: 'For Each Invoice',
              description: 'Process each overdue invoice',
              icon: 'repeat',
              color: '#f97316',
              config: {
                loopType: 'forEach',
                source: 'variables.overdueInvoices',
                itemVariable: 'invoice',
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 850, y: 100 },
            data: {
              label: 'Days Overdue',
              description: 'Check how many days past due',
              icon: 'calendar',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'invoice.daysOverdue', operator: 'in', value: [7, 14, 30] },
                ],
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Send Reminder',
              description: 'Email payment reminder to client',
              icon: 'mail',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{invoice.client.billingEmail}}'],
                subject: 'Payment Reminder: Invoice {{invoice.invoiceNumber}}',
                body: 'Your invoice is {{invoice.daysOverdue}} days overdue. Please remit payment.',
                template: 'payment-reminder',
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Log Reminder',
              description: 'Record reminder in invoice history',
              icon: 'file-text',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'invoices',
                itemId: '{{invoice._id}}',
                updates: {
                  'metadata.lastReminderSent': new Date(),
                  $push: {
                    'history': {
                      action: 'reminder_sent',
                      daysOverdue: '{{invoice.daysOverdue}}',
                      timestamp: new Date(),
                    },
                  },
                },
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1600, y: 100 },
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
          { id: 'e3', source: 'loop-1', target: 'condition-1' },
          { id: 'e4', source: 'condition-1', target: 'notification-1', sourceHandle: 'true', type: 'conditional', data: { label: 'Send Reminder' } },
          { id: 'e5', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'Skip' } },
          { id: 'e6', source: 'notification-1', target: 'action-2' },
          { id: 'e7', source: 'action-2', target: 'end-1' },
        ],
        trigger: {
          module: 'system',
          event: 'schedule',
          conditions: [],
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
        name: 'Scheduled Maintenance Notification',
        description: 'Notify users about upcoming scheduled maintenance windows',
        category: 'communication',
        icon: 'megaphone',
        tags: ['maintenance', 'communication', 'notifications', 'scheduling'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Maintenance Created',
              description: 'Triggers when maintenance window scheduled',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'maintenance',
                event: 'created',
                conditions: [],
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 350, y: 100 },
            data: {
              label: 'Announce Maintenance',
              description: 'Send immediate announcement',
              icon: 'megaphone',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{all-users}}'],
                subject: 'Scheduled Maintenance: {{item.title}}',
                body: 'System maintenance scheduled for {{item.startTime}} to {{item.endTime}}',
                template: 'maintenance-announcement',
              },
            },
          },
          {
            id: 'delay-1',
            type: 'delay',
            position: { x: 600, y: 100 },
            data: {
              label: 'Wait Until 24h Before',
              description: 'Delay until 24 hours before maintenance',
              icon: 'clock',
              color: '#f59e0b',
              config: {
                delayType: 'until',
                timestamp: '{{item.startTime - 86400000}}', // 24 hours before
              },
            },
          },
          {
            id: 'notification-2',
            type: 'notification',
            position: { x: 850, y: 100 },
            data: {
              label: '24h Reminder',
              description: 'Send 24-hour advance notice',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{all-users}}'],
                subject: 'Reminder: Maintenance in 24 Hours',
                body: 'System maintenance begins in 24 hours. Please save your work.',
              },
            },
          },
          {
            id: 'delay-2',
            type: 'delay',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Wait Until 1h Before',
              description: 'Delay until 1 hour before maintenance',
              icon: 'clock',
              color: '#f59e0b',
              config: {
                delayType: 'duration',
                duration: 82800000, // 23 hours (from 24h mark to 1h mark)
              },
            },
          },
          {
            id: 'notification-3',
            type: 'notification',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Final Warning',
              description: 'Send final 1-hour warning',
              icon: 'alert-triangle',
              color: '#06b6d4',
              config: {
                channel: 'in-app',
                recipients: ['{{all-users}}'],
                subject: 'Maintenance Starting in 1 Hour',
                body: 'System will be unavailable for maintenance in 1 hour.',
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1600, y: 100 },
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
          { id: 'e2', source: 'notification-1', target: 'delay-1' },
          { id: 'e3', source: 'delay-1', target: 'notification-2' },
          { id: 'e4', source: 'notification-2', target: 'delay-2' },
          { id: 'e5', source: 'delay-2', target: 'notification-3' },
          { id: 'e6', source: 'notification-3', target: 'end-1' },
        ],
        trigger: {
          module: 'maintenance',
          event: 'created',
          conditions: [],
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
        name: 'KB Article Review Workflow',
        description: 'Periodic review and update workflow for knowledge base articles',
        category: 'knowledge',
        icon: 'file-search',
        tags: ['knowledge', 'review', 'quality', 'maintenance'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Monthly Check',
              description: 'Check for articles needing review',
              icon: 'clock',
              color: '#667eea',
              config: {
                type: 'schedule',
                schedule: {
                  type: 'recurring',
                  cron: '0 0 1 * *', // First day of each month
                },
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Find Stale Articles',
              description: 'Query articles not reviewed in 6 months',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'kb_articles',
                query: {
                  lastReviewed: { $lt: new Date(Date.now() - 180 * 86400000) }, // 6 months
                  status: 'published',
                },
                outputVariable: 'staleArticles',
              },
            },
          },
          {
            id: 'loop-1',
            type: 'loop',
            position: { x: 600, y: 100 },
            data: {
              label: 'For Each Article',
              description: 'Process each article requiring review',
              icon: 'repeat',
              color: '#f97316',
              config: {
                loopType: 'forEach',
                source: 'variables.staleArticles',
                itemVariable: 'article',
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 850, y: 100 },
            data: {
              label: 'Create Review Task',
              description: 'Assign review task to author',
              icon: 'clipboard-check',
              color: '#3b82f6',
              config: {
                action: 'create',
                module: 'tasks',
                data: {
                  title: 'Review KB Article: {{article.title}}',
                  description: 'Article last reviewed {{article.lastReviewed}}. Please verify accuracy and update if needed.',
                  assignedTo: '{{article.author}}',
                  dueDate: new Date(Date.now() + 14 * 86400000), // 2 weeks
                  priority: 'medium',
                  category: 'kb-review',
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Notify Author',
              description: 'Alert article author',
              icon: 'mail',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{article.author.email}}'],
                subject: 'KB Article Review Required: {{article.title}}',
                body: 'Your knowledge base article requires periodic review. Please update or verify content within 2 weeks.',
              },
            },
          },
          {
            id: 'action-3',
            type: 'action',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Update Article Status',
              description: 'Mark as pending review',
              icon: 'tag',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'kb_articles',
                itemId: '{{article._id}}',
                updates: {
                  'metadata.reviewStatus': 'pending',
                  'metadata.reviewDueDate': new Date(Date.now() + 14 * 86400000),
                },
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1600, y: 100 },
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
          { id: 'e5', source: 'notification-1', target: 'action-3' },
          { id: 'e6', source: 'action-3', target: 'end-1' },
        ],
        trigger: {
          module: 'system',
          event: 'schedule',
          conditions: [],
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
        name: 'Appointment Reminder',
        description: 'Send reminders for upcoming scheduled appointments',
        category: 'scheduling',
        icon: 'calendar',
        tags: ['scheduling', 'appointments', 'reminders', 'communication'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Hourly Check',
              description: 'Check for upcoming appointments',
              icon: 'clock',
              color: '#667eea',
              config: {
                type: 'schedule',
                schedule: {
                  type: 'recurring',
                  cron: '0 * * * *', // Every hour
                },
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Find Upcoming Appointments',
              description: 'Query appointments in next 24 hours',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'appointments',
                query: {
                  startTime: {
                    $gte: new Date(),
                    $lt: new Date(Date.now() + 86400000), // 24 hours
                  },
                  status: 'confirmed',
                  'metadata.reminderSent': { $ne: true },
                },
                outputVariable: 'upcomingAppointments',
              },
            },
          },
          {
            id: 'loop-1',
            type: 'loop',
            position: { x: 600, y: 100 },
            data: {
              label: 'For Each Appointment',
              description: 'Process each appointment',
              icon: 'repeat',
              color: '#f97316',
              config: {
                loopType: 'forEach',
                source: 'variables.upcomingAppointments',
                itemVariable: 'appointment',
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 850, y: 100 },
            data: {
              label: 'Check Time Window',
              description: 'Only remind if within 24 hours',
              icon: 'clock',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'appointment.hoursUntil', operator: 'less-than-or-equal', value: 24 },
                ],
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 50 },
            data: {
              label: 'Notify Client',
              description: 'Send reminder to client',
              icon: 'mail',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{appointment.client.email}}'],
                subject: 'Appointment Reminder: {{appointment.title}}',
                body: 'Your appointment is scheduled for {{appointment.startTime}}',
                template: 'appointment-reminder',
              },
            },
          },
          {
            id: 'notification-2',
            type: 'notification',
            position: { x: 1100, y: 150 },
            data: {
              label: 'Notify Technician',
              description: 'Send reminder to assigned technician',
              icon: 'bell',
              color: '#06b6d4',
              config: {
                channel: 'in-app',
                recipients: ['{{appointment.assignedTo}}'],
                subject: 'Upcoming Appointment',
                body: 'Appointment with {{appointment.client.name}} at {{appointment.startTime}}',
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Mark Reminder Sent',
              description: 'Update appointment record',
              icon: 'check',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'appointments',
                itemId: '{{appointment._id}}',
                updates: {
                  'metadata.reminderSent': true,
                  'metadata.reminderSentAt': new Date(),
                },
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1600, y: 100 },
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
          { id: 'e3', source: 'loop-1', target: 'condition-1' },
          { id: 'e4', source: 'condition-1', target: 'notification-1', sourceHandle: 'true', type: 'conditional', data: { label: 'Send' } },
          { id: 'e5', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'Skip' } },
          { id: 'e6', source: 'notification-1', target: 'notification-2' },
          { id: 'e7', source: 'notification-2', target: 'action-2' },
          { id: 'e8', source: 'action-2', target: 'end-1' },
        ],
        trigger: {
          module: 'system',
          event: 'schedule',
          conditions: [],
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
        name: 'Auto-Close Stale Tickets',
        description: 'Automatically close tickets that have been resolved for extended period',
        category: 'ticket',
        icon: 'archive',
        tags: ['tickets', 'cleanup', 'automation', 'housekeeping'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Daily Check',
              description: 'Runs daily to find stale tickets',
              icon: 'clock',
              color: '#667eea',
              config: {
                type: 'schedule',
                schedule: {
                  type: 'recurring',
                  cron: '0 2 * * *', // Daily at 2 AM
                },
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Find Stale Tickets',
              description: 'Query tickets resolved for 7+ days',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'tickets',
                query: {
                  status: 'resolved',
                  resolvedAt: { $lt: new Date(Date.now() - 7 * 86400000) }, // 7 days
                },
                outputVariable: 'staleTickets',
              },
            },
          },
          {
            id: 'loop-1',
            type: 'loop',
            position: { x: 600, y: 100 },
            data: {
              label: 'For Each Ticket',
              description: 'Process each stale ticket',
              icon: 'repeat',
              color: '#f97316',
              config: {
                loopType: 'forEach',
                source: 'variables.staleTickets',
                itemVariable: 'ticket',
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 850, y: 100 },
            data: {
              label: 'Close Ticket',
              description: 'Update status to closed',
              icon: 'x-circle',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'tickets',
                itemId: '{{ticket._id}}',
                updates: {
                  status: 'closed',
                  closedAt: new Date(),
                  'metadata.autoClosedReason': 'No activity for 7 days after resolution',
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Notify Requester',
              description: 'Inform requester of closure',
              icon: 'mail',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{ticket.requestedBy.email}}'],
                subject: 'Ticket Closed: {{ticket.ticketNumber}}',
                body: 'Your ticket has been automatically closed due to inactivity. Reply to reopen if needed.',
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
          module: 'system',
          event: 'schedule',
          conditions: [],
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
        name: 'Unassigned Ticket Alert',
        description: 'Alert managers when tickets remain unassigned for too long',
        category: 'ticket',
        icon: 'user-x',
        tags: ['tickets', 'assignment', 'alerts', 'management'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Hourly Check',
              description: 'Check for unassigned tickets every hour',
              icon: 'clock',
              color: '#667eea',
              config: {
                type: 'schedule',
                schedule: {
                  type: 'recurring',
                  cron: '0 * * * *', // Every hour
                },
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Find Unassigned',
              description: 'Query tickets unassigned for 2+ hours',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'tickets',
                query: {
                  assignedTo: null,
                  status: { $in: ['new', 'open'] },
                  createdAt: { $lt: new Date(Date.now() - 2 * 3600000) }, // 2 hours
                  'metadata.unassignedAlertSent': { $ne: true },
                },
                outputVariable: 'unassignedTickets',
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 600, y: 100 },
            data: {
              label: 'Tickets Found?',
              description: 'Check if any unassigned tickets',
              icon: 'help-circle',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'variables.unassignedTickets.length', operator: 'greater-than', value: 0 },
                ],
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 850, y: 100 },
            data: {
              label: 'Alert Manager',
              description: 'Send alert to IT manager',
              icon: 'alert-triangle',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['it-manager@example.com'],
                subject: 'Unassigned Tickets Requiring Attention',
                body: '{{variables.unassignedTickets.length}} tickets have been unassigned for more than 2 hours.',
              },
            },
          },
          {
            id: 'loop-1',
            type: 'loop',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Mark Alerts Sent',
              description: 'Update each ticket',
              icon: 'repeat',
              color: '#f97316',
              config: {
                loopType: 'forEach',
                source: 'variables.unassignedTickets',
                itemVariable: 'ticket',
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Update Ticket',
              description: 'Mark alert sent',
              icon: 'check',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'tickets',
                itemId: '{{ticket._id}}',
                updates: {
                  'metadata.unassignedAlertSent': true,
                  'metadata.unassignedAlertSentAt': new Date(),
                },
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1600, y: 100 },
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
          { id: 'e2', source: 'action-1', target: 'condition-1' },
          { id: 'e3', source: 'condition-1', target: 'notification-1', sourceHandle: 'true', type: 'conditional', data: { label: 'Found' } },
          { id: 'e4', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'None' } },
          { id: 'e5', source: 'notification-1', target: 'loop-1' },
          { id: 'e6', source: 'loop-1', target: 'action-2' },
          { id: 'e7', source: 'action-2', target: 'end-1' },
        ],
        trigger: {
          module: 'system',
          event: 'schedule',
          conditions: [],
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
        name: 'Quote Follow-Up Workflow',
        description: 'Automated follow-up sequence for sent quotes',
        category: 'sales',
        icon: 'file-text',
        tags: ['quotes', 'sales', 'follow-up', 'automation'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Quote Sent',
              description: 'Triggers when quote is sent to client',
              icon: 'lightning',
              color: '#667eea',
              config: {
                type: 'event',
                module: 'quotes',
                event: 'updated',
                conditions: [
                  { field: 'status', operator: 'equals', value: 'sent' },
                ],
              },
            },
          },
          {
            id: 'delay-1',
            type: 'delay',
            position: { x: 350, y: 100 },
            data: {
              label: 'Wait 3 Days',
              description: 'Wait 3 days before first follow-up',
              icon: 'clock',
              color: '#f59e0b',
              config: {
                delayType: 'duration',
                duration: 3 * 86400000, // 3 days
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 600, y: 100 },
            data: {
              label: 'Still Pending?',
              description: 'Check if quote still awaiting response',
              icon: 'help-circle',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'item.status', operator: 'equals', value: 'sent' },
                ],
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 850, y: 100 },
            data: {
              label: 'First Follow-Up',
              description: 'Send gentle reminder email',
              icon: 'mail',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{item.client.email}}'],
                subject: 'Following Up: Quote {{item.quoteNumber}}',
                body: 'Just checking in regarding the quote we sent. Do you have any questions?',
                template: 'quote-follow-up-1',
              },
            },
          },
          {
            id: 'delay-2',
            type: 'delay',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Wait 4 More Days',
              description: 'Wait another 4 days',
              icon: 'clock',
              color: '#f59e0b',
              config: {
                delayType: 'duration',
                duration: 4 * 86400000, // 4 days
              },
            },
          },
          {
            id: 'condition-2',
            type: 'condition',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Still Pending?',
              description: 'Check status again',
              icon: 'help-circle',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'item.status', operator: 'equals', value: 'sent' },
                ],
              },
            },
          },
          {
            id: 'notification-2',
            type: 'notification',
            position: { x: 1600, y: 100 },
            data: {
              label: 'Final Follow-Up',
              description: 'Send final reminder',
              icon: 'mail',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['{{item.client.email}}'],
                subject: 'Final Reminder: Quote {{item.quoteNumber}}',
                body: 'This is our final reminder about the quote. Please let us know if you need any revisions.',
                template: 'quote-follow-up-2',
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 1850, y: 100 },
            data: {
              label: 'Mark as Lost',
              description: 'Mark quote as lost after no response',
              icon: 'x',
              color: '#3b82f6',
              config: {
                action: 'update',
                module: 'quotes',
                itemId: '{{trigger.item._id}}',
                updates: {
                  status: 'lost',
                  'metadata.lostReason': 'No response after follow-ups',
                },
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 2100, y: 100 },
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
          { id: 'e1', source: 'trigger-1', target: 'delay-1' },
          { id: 'e2', source: 'delay-1', target: 'condition-1' },
          { id: 'e3', source: 'condition-1', target: 'notification-1', sourceHandle: 'true', type: 'conditional', data: { label: 'Yes' } },
          { id: 'e4', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'Accepted/Declined' } },
          { id: 'e5', source: 'notification-1', target: 'delay-2' },
          { id: 'e6', source: 'delay-2', target: 'condition-2' },
          { id: 'e7', source: 'condition-2', target: 'notification-2', sourceHandle: 'true', type: 'conditional', data: { label: 'Yes' } },
          { id: 'e8', source: 'condition-2', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'Accepted/Declined' } },
          { id: 'e9', source: 'notification-2', target: 'action-1' },
          { id: 'e10', source: 'action-1', target: 'end-1' },
        ],
        trigger: {
          module: 'quotes',
          event: 'updated',
          conditions: [
            { field: 'status', operator: 'equals', value: 'sent' },
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
        name: 'First Response SLA Tracking',
        description: 'Monitor and escalate tickets approaching first response SLA breach',
        category: 'sla',
        icon: 'timer',
        tags: ['sla', 'monitoring', 'escalation', 'performance'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Every 15 Minutes',
              description: 'Check SLA status frequently',
              icon: 'clock',
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
              description: 'Query tickets close to first response SLA breach',
              icon: 'search',
              color: '#3b82f6',
              config: {
                action: 'search',
                module: 'tickets',
                query: {
                  status: { $in: ['new', 'open'] },
                  'sla.firstResponse.breached': false,
                  'sla.firstResponse.deadline': {
                    $lt: new Date(Date.now() + 30 * 60000), // 30 minutes
                  },
                },
                outputVariable: 'atRiskTickets',
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
                itemVariable: 'ticket',
              },
            },
          },
          {
            id: 'sla-1',
            type: 'sla',
            position: { x: 850, y: 100 },
            data: {
              label: 'Calculate Time Left',
              description: 'Calculate remaining time',
              icon: 'clock',
              color: '#f59e0b',
              config: {
                slaType: 'first-response',
                action: 'calculate-remaining',
                outputVariable: 'timeLeft',
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Urgent Alert',
              description: 'Alert assigned technician',
              icon: 'alert-triangle',
              color: '#06b6d4',
              config: {
                channel: 'in-app',
                recipients: ['{{ticket.assignedTo}}'],
                subject: 'URGENT: First Response SLA Breach Imminent',
                body: 'Ticket {{ticket.ticketNumber}} requires first response within {{variables.timeLeft}} minutes',
                priority: 'high',
              },
            },
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 1350, y: 100 },
            data: {
              label: 'Unassigned?',
              description: 'Check if ticket has assignee',
              icon: 'user-x',
              color: '#f59e0b',
              config: {
                conditions: [
                  { field: 'ticket.assignedTo', operator: 'is-empty', value: null },
                ],
              },
            },
          },
          {
            id: 'assignment-1',
            type: 'assignment',
            position: { x: 1600, y: 100 },
            data: {
              label: 'Emergency Assignment',
              description: 'Assign to any available technician',
              icon: 'user-plus',
              color: '#3b82f6',
              config: {
                assignmentType: 'load-balanced',
                considerWorkload: true,
                considerSkills: false,
              },
            },
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 1850, y: 100 },
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
          { id: 'e3', source: 'loop-1', target: 'sla-1' },
          { id: 'e4', source: 'sla-1', target: 'notification-1' },
          { id: 'e5', source: 'notification-1', target: 'condition-1' },
          { id: 'e6', source: 'condition-1', target: 'assignment-1', sourceHandle: 'true', type: 'conditional', data: { label: 'Unassigned' } },
          { id: 'e7', source: 'condition-1', target: 'end-1', sourceHandle: 'false', type: 'conditional', data: { label: 'Assigned' } },
          { id: 'e8', source: 'assignment-1', target: 'end-1' },
        ],
        trigger: {
          module: 'system',
          event: 'schedule',
          conditions: [],
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
        name: 'Recurring Task Automation',
        description: 'Automatically create recurring maintenance tasks on schedule',
        category: 'automation',
        icon: 'refresh-cw',
        tags: ['tasks', 'automation', 'recurring', 'maintenance'],
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 100 },
            data: {
              label: 'Weekly Check',
              description: 'Runs every Monday morning',
              icon: 'calendar',
              color: '#667eea',
              config: {
                type: 'schedule',
                schedule: {
                  type: 'recurring',
                  cron: '0 8 * * 1', // Mondays at 8 AM
                },
              },
            },
          },
          {
            id: 'action-1',
            type: 'action',
            position: { x: 350, y: 100 },
            data: {
              label: 'Create Backup Task',
              description: 'Weekly backup verification task',
              icon: 'database',
              color: '#3b82f6',
              config: {
                action: 'create',
                module: 'tasks',
                data: {
                  title: 'Verify Weekly Backups',
                  description: 'Check all client backups completed successfully',
                  assignedTo: 'backup-team',
                  dueDate: new Date(Date.now() + 86400000), // Tomorrow
                  priority: 'high',
                  category: 'maintenance',
                  recurring: true,
                },
              },
            },
          },
          {
            id: 'action-2',
            type: 'action',
            position: { x: 600, y: 100 },
            data: {
              label: 'Create Patch Task',
              description: 'Monthly patch management task',
              icon: 'shield',
              color: '#3b82f6',
              config: {
                action: 'create',
                module: 'tasks',
                data: {
                  title: 'Review Security Patches',
                  description: 'Review and schedule critical security patches',
                  assignedTo: 'security-team',
                  dueDate: new Date(Date.now() + 2 * 86400000), // In 2 days
                  priority: 'high',
                  category: 'security',
                  recurring: true,
                },
              },
            },
          },
          {
            id: 'action-3',
            type: 'action',
            position: { x: 850, y: 100 },
            data: {
              label: 'Create Review Task',
              description: 'Monthly access review task',
              icon: 'key',
              color: '#3b82f6',
              config: {
                action: 'create',
                module: 'tasks',
                data: {
                  title: 'User Access Review',
                  description: 'Review and validate user access permissions',
                  assignedTo: 'it-manager',
                  dueDate: new Date(Date.now() + 7 * 86400000), // In 1 week
                  priority: 'medium',
                  category: 'compliance',
                  recurring: true,
                },
              },
            },
          },
          {
            id: 'notification-1',
            type: 'notification',
            position: { x: 1100, y: 100 },
            data: {
              label: 'Notify Teams',
              description: 'Send summary of created tasks',
              icon: 'mail',
              color: '#06b6d4',
              config: {
                channel: 'email',
                recipients: ['backup-team@example.com', 'security-team@example.com', 'it-manager@example.com'],
                subject: 'Weekly Recurring Tasks Created',
                body: 'Your weekly recurring maintenance tasks have been created and assigned.',
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
          { id: 'e2', source: 'action-1', target: 'action-2' },
          { id: 'e3', source: 'action-2', target: 'action-3' },
          { id: 'e4', source: 'action-3', target: 'notification-1' },
          { id: 'e5', source: 'notification-1', target: 'end-1' },
        ],
        trigger: {
          module: 'system',
          event: 'schedule',
          conditions: [],
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
