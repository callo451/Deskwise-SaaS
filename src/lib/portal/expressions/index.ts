/**
 * Expression System
 *
 * Safe expression evaluator for data bindings and conditional guards.
 * NO eval, NO Function constructor.
 */

// Types
export * from './types'

// Parser
export { parseExpression, validateExpression, extractIdentifiers } from './parser'

// Standard Library
export { stdlib, isAllowedFunction, getAllowedFunctions } from './stdlib'

// Evaluator
export {
  ExpressionEvaluator,
  EvaluationError,
  EvaluationTimeoutError,
  evaluate,
  validate,
} from './evaluator'

// Bindings
export {
  BindingResolver,
  BindingError,
  resolveBindings,
  extractDataSources,
  validateBindings,
  createBinding,
  mergeBindings,
} from './bindings'

// Guards
export {
  GuardEvaluator,
  GuardError,
  Guards,
  evaluateGuard,
  validateGuard,
  validateGuards,
} from './guards'
export type { GuardResult } from './guards'
