/**
 * Block Utilities
 *
 * Helper functions for block validation, manipulation, and tree operations
 */

import type {
  BlockInstance,
  BlockValidationResult,
  DataBinding,
  VisibilityGuard,
  BlockContext,
} from './types'
import { getBlockDefinition, validateBlockProps } from './registry'

// ============================================
// Block Validation
// ============================================

/**
 * Validate a single block instance
 */
export function validateBlock(block: BlockInstance): BlockValidationResult {
  const errors: Array<{ path: string; message: string; blockId?: string }> = []

  // Check if block type exists
  const definition = getBlockDefinition(block.type)
  if (!definition) {
    errors.push({
      path: `blocks.${block.id}`,
      message: `Unknown block type: ${block.type}`,
      blockId: block.id,
    })
    return { valid: false, errors }
  }

  // Validate props against schema
  const propsValidation = validateBlockProps(block.type, block.props)
  if (!propsValidation.success) {
    const zodError = propsValidation.error
    if (zodError?.errors) {
      zodError.errors.forEach((err: any) => {
        errors.push({
          path: `blocks.${block.id}.props.${err.path.join('.')}`,
          message: err.message,
          blockId: block.id,
        })
      })
    }
  }

  // Validate children if it's a container
  if (definition.metadata.isContainer && block.children) {
    // Check if children are allowed
    const allowedChildren = definition.metadata.allowedChildren
    if (allowedChildren) {
      block.children.forEach((child) => {
        if (!allowedChildren.includes(child.type)) {
          errors.push({
            path: `blocks.${block.id}.children.${child.id}`,
            message: `Block type "${child.type}" is not allowed as a child of "${block.type}"`,
            blockId: block.id,
          })
        }
      })
    }

    // Check max children constraint
    const maxChildren = definition.metadata.maxChildren
    if (maxChildren && block.children.length > maxChildren) {
      errors.push({
        path: `blocks.${block.id}.children`,
        message: `Block "${block.type}" allows maximum ${maxChildren} children, but has ${block.children.length}`,
        blockId: block.id,
      })
    }

    // Recursively validate children
    block.children.forEach((child) => {
      const childValidation = validateBlock(child)
      if (!childValidation.valid && childValidation.errors) {
        errors.push(...childValidation.errors)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validate an array of block instances (page tree)
 */
export function validateBlockTree(blocks: BlockInstance[]): BlockValidationResult {
  const errors: Array<{ path: string; message: string; blockId?: string }> = []

  blocks.forEach((block, index) => {
    const validation = validateBlock(block)
    if (!validation.valid && validation.errors) {
      errors.push(...validation.errors)
    }
  })

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

// ============================================
// Block Tree Operations
// ============================================

/**
 * Find a block by ID in the tree
 */
export function findBlockById(blocks: BlockInstance[], id: string): BlockInstance | undefined {
  for (const block of blocks) {
    if (block.id === id) {
      return block
    }
    if (block.children) {
      const found = findBlockById(block.children, id)
      if (found) return found
    }
  }
  return undefined
}

/**
 * Find parent block by child ID
 */
export function findParentBlock(
  blocks: BlockInstance[],
  childId: string,
  parent?: BlockInstance
): BlockInstance | undefined {
  for (const block of blocks) {
    if (block.children) {
      const hasChild = block.children.some((child) => child.id === childId)
      if (hasChild) {
        return block
      }
      const found = findParentBlock(block.children, childId, block)
      if (found) return found
    }
  }
  return undefined
}

/**
 * Get all blocks of a specific type
 */
export function getBlocksByType(blocks: BlockInstance[], type: string): BlockInstance[] {
  const result: BlockInstance[] = []
  for (const block of blocks) {
    if (block.type === type) {
      result.push(block)
    }
    if (block.children) {
      result.push(...getBlocksByType(block.children, type))
    }
  }
  return result
}

/**
 * Get all blocks in a flat array
 */
export function flattenBlocks(blocks: BlockInstance[]): BlockInstance[] {
  const result: BlockInstance[] = []
  for (const block of blocks) {
    result.push(block)
    if (block.children) {
      result.push(...flattenBlocks(block.children))
    }
  }
  return result
}

/**
 * Clone a block instance (deep copy)
 */
export function cloneBlock(block: BlockInstance): BlockInstance {
  return {
    ...block,
    id: generateBlockId(), // Generate new ID
    props: { ...block.props },
    children: block.children ? block.children.map(cloneBlock) : undefined,
    bindings: block.bindings ? [...block.bindings] : undefined,
    guards: block.guards ? [...block.guards] : undefined,
    metadata: block.metadata ? { ...block.metadata } : undefined,
  }
}

/**
 * Generate a unique block ID
 */
export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Remove a block from the tree
 */
export function removeBlock(blocks: BlockInstance[], id: string): BlockInstance[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) => ({
      ...block,
      children: block.children ? removeBlock(block.children, id) : undefined,
    }))
}

/**
 * Update a block in the tree
 */
export function updateBlock(
  blocks: BlockInstance[],
  id: string,
  updates: Partial<BlockInstance>
): BlockInstance[] {
  return blocks.map((block) => {
    if (block.id === id) {
      return { ...block, ...updates }
    }
    if (block.children) {
      return {
        ...block,
        children: updateBlock(block.children, id, updates),
      }
    }
    return block
  })
}

/**
 * Move a block to a new parent
 */
export function moveBlock(
  blocks: BlockInstance[],
  blockId: string,
  newParentId: string | null,
  index: number
): BlockInstance[] {
  // First, remove the block from its current position
  const block = findBlockById(blocks, blockId)
  if (!block) return blocks

  let newTree = removeBlock(blocks, blockId)

  // If newParentId is null, insert at root level
  if (newParentId === null) {
    newTree.splice(index, 0, block)
    return newTree
  }

  // Otherwise, insert into the new parent
  return newTree.map((b) => {
    if (b.id === newParentId) {
      const children = b.children || []
      children.splice(index, 0, block)
      return { ...b, children }
    }
    if (b.children) {
      return {
        ...b,
        children: moveBlock(b.children, blockId, newParentId, index),
      }
    }
    return b
  })
}

// ============================================
// Data Binding
// ============================================

/**
 * Resolve a data binding path from context
 */
export function resolveBinding(binding: DataBinding, context: BlockContext): any {
  try {
    const value = getNestedValue(context, binding.sourcePath)

    // Apply transform if provided
    if (binding.transform && value !== undefined) {
      // Note: In production, this should use a safe expression evaluator
      // For now, we'll just return the raw value
      return value
    }

    return value !== undefined ? value : binding.defaultValue
  } catch (error) {
    console.error(`Error resolving binding "${binding.sourcePath}":`, error)
    return binding.defaultValue
  }
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.')
  let value = obj

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined
    }
    // Handle array notation (e.g., 'items[0]')
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/)
    if (arrayMatch) {
      const [, arrayKey, indexStr] = arrayMatch
      const index = parseInt(indexStr, 10)
      value = value[arrayKey]?.[index]
    } else {
      value = value[key]
    }
  }

  return value
}

/**
 * Resolve all bindings for a block
 */
export function resolveBlockBindings(
  block: BlockInstance,
  context: BlockContext
): Record<string, any> {
  if (!block.bindings) return {}

  const resolved: Record<string, any> = {}
  for (const binding of block.bindings) {
    resolved[binding.targetProp] = resolveBinding(binding, context)
  }

  return resolved
}

// ============================================
// Visibility Guards
// ============================================

/**
 * Check if a block should be visible based on guards
 */
export function checkVisibility(block: BlockInstance, context: BlockContext): boolean {
  if (!block.guards || block.guards.length === 0) {
    return true // No guards, always visible
  }

  // Evaluate each guard
  for (const guard of block.guards) {
    const result = evaluateGuard(guard, context)

    // If any guard fails and we're in AND mode, block is not visible
    // This is a simplified implementation; a full version would handle operator properly
    if (!result) {
      return false
    }
  }

  return true
}

/**
 * Evaluate a single visibility guard
 */
function evaluateGuard(guard: VisibilityGuard, context: BlockContext): boolean {
  let result = false

  switch (guard.type) {
    case 'role':
      if (context.user?.role) {
        const allowedRoles = Array.isArray(guard.condition) ? guard.condition : [guard.condition]
        result = allowedRoles.includes(context.user.role)
      }
      break

    case 'permission':
      if (context.user?.permissions) {
        const requiredPermissions = Array.isArray(guard.condition) ? guard.condition : [guard.condition]
        result = requiredPermissions.every((perm) => context.user!.permissions.includes(perm))
      }
      break

    case 'custom':
      // Custom expression evaluation (would need safe evaluator in production)
      result = true // Placeholder
      break

    default:
      result = true
  }

  // Apply negation if specified
  return guard.negate ? !result : result
}

// ============================================
// Block Serialization
// ============================================

/**
 * Serialize block tree to JSON
 */
export function serializeBlocks(blocks: BlockInstance[]): string {
  return JSON.stringify(blocks, null, 2)
}

/**
 * Deserialize block tree from JSON
 */
export function deserializeBlocks(json: string): BlockInstance[] {
  try {
    return JSON.parse(json) as BlockInstance[]
  } catch (error) {
    console.error('Error deserializing blocks:', error)
    return []
  }
}

/**
 * Calculate block tree depth
 */
export function getBlockTreeDepth(blocks: BlockInstance[]): number {
  let maxDepth = 0

  function traverse(blocks: BlockInstance[], currentDepth: number) {
    for (const block of blocks) {
      maxDepth = Math.max(maxDepth, currentDepth)
      if (block.children) {
        traverse(block.children, currentDepth + 1)
      }
    }
  }

  traverse(blocks, 1)
  return maxDepth
}

/**
 * Count total blocks in tree
 */
export function countBlocks(blocks: BlockInstance[]): number {
  return flattenBlocks(blocks).length
}

/**
 * Get block statistics
 */
export function getBlockStatistics(blocks: BlockInstance[]): {
  total: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  depth: number
} {
  const flattened = flattenBlocks(blocks)
  const byType: Record<string, number> = {}
  const byCategory: Record<string, number> = {}

  for (const block of flattened) {
    // Count by type
    byType[block.type] = (byType[block.type] || 0) + 1

    // Count by category
    const definition = getBlockDefinition(block.type)
    if (definition) {
      const category = definition.metadata.category
      byCategory[category] = (byCategory[category] || 0) + 1
    }
  }

  return {
    total: flattened.length,
    byType,
    byCategory,
    depth: getBlockTreeDepth(blocks),
  }
}
