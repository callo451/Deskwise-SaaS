/**
 * Data Binding System
 *
 * Resolves data bindings from data sources to block properties.
 */

import { DataBinding, EvaluationContext } from './types'
import { ExpressionEvaluator } from './evaluator'

/**
 * Binding resolution error
 */
export class BindingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BindingError'
  }
}

/**
 * Binding Resolver
 */
export class BindingResolver {
  private evaluator: ExpressionEvaluator

  constructor() {
    this.evaluator = new ExpressionEvaluator()
  }

  /**
   * Resolve all bindings for a block
   */
  resolveBindings(
    bindings: DataBinding[],
    dataContext: Record<string, any>,
    user: EvaluationContext['user'],
    env?: EvaluationContext['env']
  ): Record<string, any> {
    const resolved: Record<string, any> = {}

    for (const binding of bindings) {
      try {
        const value = this.resolveBinding(binding, dataContext, user, env)
        resolved[binding.targetProp] = value
      } catch (error) {
        console.error(`Failed to resolve binding for ${binding.targetProp}:`, error)
        // Continue with other bindings
        resolved[binding.targetProp] = undefined
      }
    }

    return resolved
  }

  /**
   * Resolve a single binding
   */
  resolveBinding(
    binding: DataBinding,
    dataContext: Record<string, any>,
    user: EvaluationContext['user'],
    env?: EvaluationContext['env']
  ): any {
    // Get source data
    const sourceData = this.getSourceData(binding.source, dataContext)

    // Resolve field path
    let value = this.resolveFieldPath(sourceData, binding.field)

    // Apply transform if specified
    if (binding.transform) {
      value = this.applyTransform(value, binding.transform, dataContext, user, env)
    }

    return value
  }

  /**
   * Get source data from context
   */
  private getSourceData(source: string, dataContext: Record<string, any>): any {
    if (source === 'context') {
      return dataContext
    }

    // Source is a data source ID
    if (!dataContext[source]) {
      throw new BindingError(`Data source '${source}' not found in context`)
    }

    return dataContext[source]
  }

  /**
   * Resolve field path (supports dot notation and array indexing)
   */
  private resolveFieldPath(data: any, path: string): any {
    if (!path) {
      return data
    }

    const parts = path.split('.')
    let current = data

    for (const part of parts) {
      if (current == null) {
        return undefined
      }

      // Handle array indexing: array[0] or array.0
      const arrayMatch = part.match(/^(.+?)\[(\d+)\]$/)
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch
        current = current[arrayName]
        if (Array.isArray(current)) {
          current = current[parseInt(index, 10)]
        }
      } else {
        current = current[part]
      }
    }

    return current
  }

  /**
   * Apply transform expression to value
   */
  private applyTransform(
    value: any,
    transform: string,
    dataContext: Record<string, any>,
    user: EvaluationContext['user'],
    env?: EvaluationContext['env']
  ): any {
    // Create evaluation context with 'value' as a special variable
    const evalContext: EvaluationContext = {
      data: {
        ...dataContext,
        value, // Make the current value available as 'data.value'
      },
      user,
      env: env || {
        isDev: false,
        orgId: user.id,
      },
    }

    try {
      return this.evaluator.evaluate(transform, evalContext)
    } catch (error) {
      throw new BindingError(
        `Transform failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}

/**
 * Quick binding resolution helper
 */
export function resolveBindings(
  bindings: DataBinding[],
  dataContext: Record<string, any>,
  user: EvaluationContext['user'],
  env?: EvaluationContext['env']
): Record<string, any> {
  const resolver = new BindingResolver()
  return resolver.resolveBindings(bindings, dataContext, user, env)
}

/**
 * Extract all data source IDs from bindings
 */
export function extractDataSources(bindings: DataBinding[]): string[] {
  const sources = new Set<string>()

  for (const binding of bindings) {
    if (binding.source !== 'context') {
      sources.add(binding.source)
    }
  }

  return Array.from(sources)
}

/**
 * Validate bindings configuration
 */
export function validateBindings(bindings: DataBinding[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i]

    if (!binding.source) {
      errors.push(`Binding ${i}: source is required`)
    }

    if (!binding.field) {
      errors.push(`Binding ${i}: field is required`)
    }

    if (!binding.targetProp) {
      errors.push(`Binding ${i}: targetProp is required`)
    }

    if (binding.transform) {
      const evaluator = new ExpressionEvaluator()
      const validation = evaluator.validateExpression(binding.transform)
      if (!validation.valid) {
        errors.push(`Binding ${i} transform: ${validation.error}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create a binding configuration
 */
export function createBinding(
  source: string,
  field: string,
  targetProp: string,
  transform?: string
): DataBinding {
  return {
    source,
    field,
    targetProp,
    transform,
  }
}

/**
 * Merge multiple binding results
 */
export function mergeBindings(...results: Record<string, any>[]): Record<string, any> {
  return Object.assign({}, ...results)
}
