/**
 * Expression Evaluator
 *
 * Safely evaluates parsed expressions against a context.
 * NO eval, NO Function constructor.
 */

import { ParsedExpression, EvaluationContext, EVALUATION_TIMEOUT } from './types'
import { parseExpression, validateExpression } from './parser'
import { stdlib } from './stdlib'

/**
 * Evaluation error
 */
export class EvaluationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EvaluationError'
  }
}

/**
 * Timeout error
 */
export class EvaluationTimeoutError extends EvaluationError {
  constructor() {
    super(`Expression evaluation timed out after ${EVALUATION_TIMEOUT}ms`)
    this.name = 'EvaluationTimeoutError'
  }
}

/**
 * Expression Evaluator
 */
export class ExpressionEvaluator {
  private startTime: number = 0

  /**
   * Evaluate an expression string
   */
  evaluate(expression: string, context: EvaluationContext): any {
    // Validate expression first
    const validation = validateExpression(expression)
    if (!validation.valid) {
      throw new EvaluationError(validation.error || 'Invalid expression')
    }

    // Parse expression
    const ast = parseExpression(expression)

    // Start timeout timer
    this.startTime = Date.now()

    try {
      return this.evaluateNode(ast, context)
    } catch (error) {
      if (error instanceof EvaluationError) {
        throw error
      }
      throw new EvaluationError(
        `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Validate an expression without evaluating it
   */
  validateExpression(expression: string): { valid: boolean; error?: string } {
    const validation = validateExpression(expression)
    return {
      valid: validation.valid,
      error: validation.error,
    }
  }

  /**
   * Check timeout
   */
  private checkTimeout(): void {
    if (Date.now() - this.startTime > EVALUATION_TIMEOUT) {
      throw new EvaluationTimeoutError()
    }
  }

  /**
   * Evaluate AST node
   */
  private evaluateNode(node: ParsedExpression, context: EvaluationContext): any {
    this.checkTimeout()

    if (!node) {
      return undefined
    }

    switch (node.type) {
      case 'Literal':
        return node.value

      case 'Identifier':
        return this.resolveIdentifier(node.name!, context)

      case 'MemberExpression':
        return this.evaluateMemberExpression(node, context)

      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node, context)

      case 'LogicalExpression':
        return this.evaluateLogicalExpression(node, context)

      case 'UnaryExpression':
        return this.evaluateUnaryExpression(node, context)

      case 'CallExpression':
        return this.evaluateCallExpression(node, context)

      case 'ConditionalExpression':
        return this.evaluateConditionalExpression(node, context)

      case 'ArrayExpression':
        return this.evaluateArrayExpression(node, context)

      default:
        throw new EvaluationError(`Unsupported node type: ${node.type}`)
    }
  }

  /**
   * Resolve identifier from context
   */
  private resolveIdentifier(name: string, context: EvaluationContext): any {
    // Only allow root-level identifiers from context
    if (name === 'data') return context.data
    if (name === 'user') return context.user
    if (name === 'env') return context.env

    throw new EvaluationError(`Unknown identifier: ${name}`)
  }

  /**
   * Evaluate member expression (property access)
   */
  private evaluateMemberExpression(node: ParsedExpression, context: EvaluationContext): any {
    const object = this.evaluateNode(node.object!, context)

    if (object == null) {
      return undefined
    }

    let property: string | number

    if (node.computed) {
      // Computed property: obj[expr]
      property = this.evaluateNode(node.property!, context)
    } else {
      // Static property: obj.prop
      if (node.property?.type !== 'Identifier') {
        throw new EvaluationError('Invalid property access')
      }
      property = node.property.name!
    }

    // Prevent access to dangerous properties
    const dangerousProps = ['__proto__', 'prototype', 'constructor']
    if (dangerousProps.includes(String(property))) {
      throw new EvaluationError(`Access to property '${property}' is not allowed`)
    }

    return object[property]
  }

  /**
   * Evaluate binary expression
   */
  private evaluateBinaryExpression(node: ParsedExpression, context: EvaluationContext): any {
    const left = this.evaluateNode(node.left!, context)
    const right = this.evaluateNode(node.right!, context)

    switch (node.operator) {
      case '+':
        return left + right
      case '-':
        return left - right
      case '*':
        return left * right
      case '/':
        return left / right
      case '%':
        return left % right
      case '==':
        return left == right
      case '===':
        return left === right
      case '!=':
        return left != right
      case '!==':
        return left !== right
      case '<':
        return left < right
      case '>':
        return left > right
      case '<=':
        return left <= right
      case '>=':
        return left >= right
      default:
        throw new EvaluationError(`Unsupported operator: ${node.operator}`)
    }
  }

  /**
   * Evaluate logical expression
   */
  private evaluateLogicalExpression(node: ParsedExpression, context: EvaluationContext): any {
    const left = this.evaluateNode(node.left!, context)

    switch (node.operator) {
      case '&&':
        // Short-circuit evaluation
        return left ? this.evaluateNode(node.right!, context) : left
      case '||':
        // Short-circuit evaluation
        return left ? left : this.evaluateNode(node.right!, context)
      default:
        throw new EvaluationError(`Unsupported logical operator: ${node.operator}`)
    }
  }

  /**
   * Evaluate unary expression
   */
  private evaluateUnaryExpression(node: ParsedExpression, context: EvaluationContext): any {
    const argument = this.evaluateNode(node.argument!, context)

    switch (node.operator) {
      case '!':
        return !argument
      case '-':
        return -argument
      case '+':
        return +argument
      default:
        throw new EvaluationError(`Unsupported unary operator: ${node.operator}`)
    }
  }

  /**
   * Evaluate call expression (function call)
   */
  private evaluateCallExpression(node: ParsedExpression, context: EvaluationContext): any {
    // Handle stdlib functions
    if (node.callee?.type === 'Identifier') {
      const funcName = node.callee.name!
      const func = stdlib[funcName]

      if (!func) {
        throw new EvaluationError(`Unknown function: ${funcName}`)
      }

      const args = node.arguments?.map(arg => this.evaluateNode(arg, context)) || []
      return func(...args)
    }

    // Handle method calls (e.g., array.includes())
    if (node.callee?.type === 'MemberExpression') {
      const object = this.evaluateNode(node.callee.object!, context)
      const property = node.callee.property

      if (!property || property.type !== 'Identifier') {
        throw new EvaluationError('Invalid method call')
      }

      const methodName = property.name!
      const method = object?.[methodName]

      if (typeof method !== 'function') {
        throw new EvaluationError(`Method '${methodName}' is not a function`)
      }

      const args = node.arguments?.map(arg => this.evaluateNode(arg, context)) || []

      // Whitelist of allowed methods
      const allowedMethods = ['includes', 'slice', 'join', 'map', 'filter', 'find', 'some', 'every', 'toString', 'valueOf']
      if (!allowedMethods.includes(methodName)) {
        throw new EvaluationError(`Method '${methodName}' is not allowed`)
      }

      return method.call(object, ...args)
    }

    throw new EvaluationError('Invalid function call')
  }

  /**
   * Evaluate conditional expression (ternary)
   */
  private evaluateConditionalExpression(node: ParsedExpression, context: EvaluationContext): any {
    const test = this.evaluateNode(node.test!, context)
    return test
      ? this.evaluateNode(node.consequent!, context)
      : this.evaluateNode(node.alternate!, context)
  }

  /**
   * Evaluate array expression
   */
  private evaluateArrayExpression(node: ParsedExpression, context: EvaluationContext): any[] {
    return node.arguments?.map(arg => this.evaluateNode(arg, context)) || []
  }
}

/**
 * Quick evaluation helper
 */
export function evaluate(expression: string, context: EvaluationContext): any {
  const evaluator = new ExpressionEvaluator()
  return evaluator.evaluate(expression, context)
}

/**
 * Quick validation helper
 */
export function validate(expression: string): { valid: boolean; error?: string } {
  const evaluator = new ExpressionEvaluator()
  return evaluator.validateExpression(expression)
}
