import { TriggerNode } from './TriggerNode'
import { ConditionNode } from './ConditionNode'
import { ActionNode } from './ActionNode'
import { ApprovalNode } from './ApprovalNode'
import { DelayNode } from './DelayNode'
import { NotificationNode } from './NotificationNode'
import { AssignmentNode } from './AssignmentNode'
import { SLANode } from './SLANode'
import { TransformNode } from './TransformNode'
import { LoopNode } from './LoopNode'
import { MergeNode } from './MergeNode'
import { EndNode } from './EndNode'

// Export all nodes individually
export {
  TriggerNode,
  ConditionNode,
  ActionNode,
  ApprovalNode,
  DelayNode,
  NotificationNode,
  AssignmentNode,
  SLANode,
  TransformNode,
  LoopNode,
  MergeNode,
  EndNode,
}

// Export nodeTypes object for React Flow
export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  approval: ApprovalNode,
  delay: DelayNode,
  notification: NotificationNode,
  assignment: AssignmentNode,
  sla: SLANode,
  transform: TransformNode,
  loop: LoopNode,
  merge: MergeNode,
  end: EndNode,
}

// Type definitions for node data
export interface BaseNodeData {
  label: string
  description?: string
}

export interface TriggerNodeData extends BaseNodeData {
  triggerType?: string
}

export interface ConditionNodeData extends BaseNodeData {
  condition?: string
}

export interface ActionNodeData extends BaseNodeData {
  action?: string
  module?: string
}

export interface ApprovalNodeData extends BaseNodeData {
  approvers?: string[]
}

export interface DelayNodeData extends BaseNodeData {
  duration?: string
}

export interface NotificationNodeData extends BaseNodeData {
  channels?: string[]
  recipients?: number
}

export interface AssignmentNodeData extends BaseNodeData {
  assignmentType?: string
  team?: string
}

export interface SLANodeData extends BaseNodeData {
  responseTime?: string
  resolutionTime?: string
  status?: 'ok' | 'warning' | 'breach'
}

export interface TransformNodeData extends BaseNodeData {
  operations?: string[]
}

export interface LoopNodeData extends BaseNodeData {
  loopType?: string
  iterations?: number | string
}

export interface MergeNodeData extends BaseNodeData {
  strategy?: string
  inputs?: number
}

export interface EndNodeData extends BaseNodeData {
  endType?: 'success' | 'failure' | 'cancel'
  output?: Record<string, any>
}
