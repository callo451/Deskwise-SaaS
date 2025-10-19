/**
 * Expression System Types
 *
 * Defines types for safe expression evaluation, data bindings, and guards.
 */

export interface EvaluationContext {
  data: Record<string, any>
  user: {
    id: string
    email: string
    role: string
    permissions: string[]
    orgUnit?: string
  }
  env: {
    isDev: boolean
    orgId: string
  }
}

export interface ExpressionValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

export interface DataBinding {
  source: string // DataSource ID or 'context'
  field: string // Field path (e.g., 'tickets.openCount')
  targetProp: string // Block prop to bind to
  transform?: string // Optional transform expression
}

export interface VisibilityGuard {
  expression: string // e.g., 'user.role === "admin"'
  fallback?: 'hide' | 'show-message' | 'redirect'
  message?: string
}

export interface ParsedExpression {
  type: string
  value?: any
  name?: string
  operator?: string
  left?: ParsedExpression
  right?: ParsedExpression
  object?: ParsedExpression
  property?: ParsedExpression
  computed?: boolean
  argument?: ParsedExpression
  arguments?: ParsedExpression[]
  callee?: ParsedExpression
  test?: ParsedExpression
  consequent?: ParsedExpression
  alternate?: ParsedExpression
}

export interface StandardLibrary {
  [key: string]: (...args: any[]) => any
}

export const EVALUATION_TIMEOUT = 100 // milliseconds
export const MAX_EXPRESSION_DEPTH = 10
