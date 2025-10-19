/**
 * Custom node types for React Flow workflow builder
 *
 * This file registers all custom node components with React Flow.
 * Each node type has unique styling following the design system from the plan.
 */

import { NodeTypes } from 'reactflow'
import { BaseNode } from './BaseNode'
import { ConditionNode } from './ConditionNode'

// Register all custom node types
// You can add more custom nodes here as they're created
export const nodeTypes: NodeTypes = {
  trigger: BaseNode,
  condition: ConditionNode,
  action: BaseNode,
  approval: BaseNode,
  delay: BaseNode,
  notification: BaseNode,
  assignment: BaseNode,
  sla: BaseNode,
  transform: BaseNode,
  loop: BaseNode,
  merge: BaseNode,
  end: BaseNode,
}

// Export individual components for direct use
export { BaseNode } from './BaseNode'
export { ConditionNode } from './ConditionNode'

// TODO: Create specialized components for other node types:
// - TriggerNode: Lightning bolt shape with gradient background
// - ApprovalNode: Octagon with checkmark/X icons
// - DelayNode: Circle with clock icon
// - EndNode: Stop sign shape with gradient
