/**
 * Expression Parser
 *
 * Uses jsep to parse JavaScript expressions safely.
 * Validates against security rules and allowed operations.
 */

import * as jsepLib from 'jsep'
import { ParsedExpression, ExpressionValidationResult, MAX_EXPRESSION_DEPTH } from './types'
import { isAllowedFunction } from './stdlib'

// Get jsep instance (handles both ESM and CJS)
const jsep = typeof jsepLib === 'function' ? jsepLib : (jsepLib as any).default || jsepLib

// Configure jsep to support additional operators
if (jsep.addBinaryOp) {
  jsep.addBinaryOp('===', 6)
  jsep.addBinaryOp('!==', 6)
  jsep.addBinaryOp('&&', 2)
  jsep.addBinaryOp('||', 1)
}

// Blocked identifiers (global objects)
const BLOCKED_IDENTIFIERS = new Set([
  'window',
  'document',
  'global',
  'process',
  'require',
  'module',
  'exports',
  'eval',
  'Function',
  'constructor',
  '__proto__',
  'prototype',
  'this',
  'self',
  'top',
  'parent',
  'frames',
  'location',
  'navigator',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'Promise',
  'async',
  'await',
  'import',
  'export',
])

// Allowed root identifiers (context properties)
const ALLOWED_ROOT_IDENTIFIERS = new Set([
  'data',
  'user',
  'env',
])

/**
 * Parse an expression string into an AST
 */
export function parseExpression(expression: string): ParsedExpression {
  try {
    // Remove template literal syntax if present
    const cleanExpression = expression.trim().replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '')

    if (!cleanExpression) {
      throw new Error('Empty expression')
    }

    return jsep(cleanExpression) as ParsedExpression
  } catch (error) {
    throw new Error(`Failed to parse expression: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Validate expression AST against security rules
 */
export function validateExpression(expression: string): ExpressionValidationResult {
  try {
    const ast = parseExpression(expression)
    const errors: string[] = []
    const warnings: string[] = []

    // Check expression depth
    const depth = getExpressionDepth(ast)
    if (depth > MAX_EXPRESSION_DEPTH) {
      errors.push(`Expression depth (${depth}) exceeds maximum (${MAX_EXPRESSION_DEPTH})`)
    }

    // Validate AST nodes
    validateNode(ast, errors, warnings, 0)

    if (errors.length > 0) {
      return {
        valid: false,
        error: errors.join('; '),
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Calculate expression depth
 */
function getExpressionDepth(node: ParsedExpression): number {
  switch (node.type) {
    case 'Literal':
    case 'Identifier':
      return 1

    case 'MemberExpression':
      return 1 + Math.max(
        getExpressionDepth(node.object!),
        node.computed ? getExpressionDepth(node.property!) : 1
      )

    case 'BinaryExpression':
    case 'LogicalExpression':
      return 1 + Math.max(
        getExpressionDepth(node.left!),
        getExpressionDepth(node.right!)
      )

    case 'UnaryExpression':
      return 1 + getExpressionDepth(node.argument!)

    case 'CallExpression':
      return 1 + Math.max(
        getExpressionDepth(node.callee!),
        ...node.arguments!.map(getExpressionDepth)
      )

    case 'ConditionalExpression':
      return 1 + Math.max(
        getExpressionDepth(node.test!),
        getExpressionDepth(node.consequent!),
        getExpressionDepth(node.alternate!)
      )

    case 'ArrayExpression':
      return 1 + Math.max(...(node.arguments || []).map(getExpressionDepth), 0)

    default:
      return 1
  }
}

/**
 * Validate individual AST node
 */
function validateNode(
  node: ParsedExpression,
  errors: string[],
  warnings: string[],
  depth: number,
  parentPath: string = ''
): void {
  if (!node) return

  switch (node.type) {
    case 'Identifier':
      // Check for blocked identifiers
      if (BLOCKED_IDENTIFIERS.has(node.name!)) {
        errors.push(`Access to '${node.name}' is not allowed`)
      }

      // Check root identifiers (only if not part of member expression)
      if (depth === 0 && !ALLOWED_ROOT_IDENTIFIERS.has(node.name!)) {
        errors.push(
          `Unknown identifier '${node.name}'. Only 'data', 'user', and 'env' are allowed at root level`
        )
      }
      break

    case 'MemberExpression':
      validateNode(node.object!, errors, warnings, depth + 1, parentPath)
      if (node.computed && node.property) {
        validateNode(node.property, errors, warnings, depth + 1, parentPath)
      }
      break

    case 'BinaryExpression':
    case 'LogicalExpression':
      // Validate allowed operators
      const allowedOps = ['+', '-', '*', '/', '%', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||']
      if (!allowedOps.includes(node.operator!)) {
        errors.push(`Operator '${node.operator}' is not allowed`)
      }
      validateNode(node.left!, errors, warnings, depth + 1, parentPath)
      validateNode(node.right!, errors, warnings, depth + 1, parentPath)
      break

    case 'UnaryExpression':
      // Only allow ! and - operators
      if (node.operator !== '!' && node.operator !== '-' && node.operator !== '+') {
        errors.push(`Unary operator '${node.operator}' is not allowed`)
      }
      validateNode(node.argument!, errors, warnings, depth + 1, parentPath)
      break

    case 'CallExpression':
      // Only allow whitelisted functions
      if (node.callee?.type === 'Identifier') {
        const funcName = node.callee.name!
        if (!isAllowedFunction(funcName)) {
          errors.push(`Function '${funcName}' is not allowed`)
        }
      } else if (node.callee?.type === 'MemberExpression') {
        // Allow array methods: includes, length, etc.
        const property = node.callee.property
        if (property?.type === 'Identifier') {
          const methodName = property.name!
          const allowedMethods = ['includes', 'length', 'slice', 'join', 'map', 'filter', 'find', 'some', 'every']
          if (!allowedMethods.includes(methodName)) {
            warnings.push(`Method '${methodName}' may not be available`)
          }
        }
        validateNode(node.callee, errors, warnings, depth + 1, parentPath)
      } else {
        errors.push('Invalid function call')
      }

      // Validate arguments
      node.arguments?.forEach(arg => {
        validateNode(arg, errors, warnings, depth + 1, parentPath)
      })
      break

    case 'ConditionalExpression':
      validateNode(node.test!, errors, warnings, depth + 1, parentPath)
      validateNode(node.consequent!, errors, warnings, depth + 1, parentPath)
      validateNode(node.alternate!, errors, warnings, depth + 1, parentPath)
      break

    case 'ArrayExpression':
      node.arguments?.forEach(arg => {
        validateNode(arg, errors, warnings, depth + 1, parentPath)
      })
      break

    case 'Literal':
      // Literals are always safe
      break

    default:
      errors.push(`Unsupported expression type: ${node.type}`)
  }
}

/**
 * Traverse AST and collect identifiers
 */
const traverseForIdentifiers = (
  node: ParsedExpression,
  identifiers: Set<string>,
  path: string[] = []
): void => {
  if (!node) return

  switch (node.type) {
    case 'Identifier':
      if (path.length === 0) {
        identifiers.add(node.name!)
      }
      break

    case 'MemberExpression':
      if (node.object?.type === 'Identifier') {
        const fullPath = [node.object.name!]
        let current: ParsedExpression = node
        while (current.type === 'MemberExpression' && current.property?.type === 'Identifier') {
          fullPath.push(current.property.name!)
          if (current.object?.type === 'Identifier') {
            break
          }
          current = current.object!
        }
        identifiers.add(fullPath.join('.'))
      } else {
        traverseForIdentifiers(node.object!, identifiers, [...path])
      }
      if (node.computed && node.property) {
        traverseForIdentifiers(node.property, identifiers, [...path])
      }
      break

    case 'BinaryExpression':
    case 'LogicalExpression':
      traverseForIdentifiers(node.left!, identifiers, path)
      traverseForIdentifiers(node.right!, identifiers, path)
      break

    case 'UnaryExpression':
      traverseForIdentifiers(node.argument!, identifiers, path)
      break

    case 'CallExpression':
      traverseForIdentifiers(node.callee!, identifiers, path)
      node.arguments?.forEach(arg => traverseForIdentifiers(arg, identifiers, path))
      break

    case 'ConditionalExpression':
      traverseForIdentifiers(node.test!, identifiers, path)
      traverseForIdentifiers(node.consequent!, identifiers, path)
      traverseForIdentifiers(node.alternate!, identifiers, path)
      break

    case 'ArrayExpression':
      node.arguments?.forEach(arg => traverseForIdentifiers(arg, identifiers, path))
      break
  }
}

/**
 * Extract all identifiers from an expression
 */
export function extractIdentifiers(expression: string): string[] {
  try {
    const ast = parseExpression(expression)
    const identifiers = new Set<string>()
    traverseForIdentifiers(ast, identifiers)
    return Array.from(identifiers)
  } catch {
    return []
  }
}
