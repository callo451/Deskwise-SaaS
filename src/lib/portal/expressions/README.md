# Safe Expression & Binding System

A secure expression evaluator for data bindings and conditional guards with **NO eval, NO Function constructor**.

## Overview

This system provides safe evaluation of JavaScript-like expressions for use in:
- **Data Bindings**: Connect data sources to UI components
- **Visibility Guards**: Control content visibility based on conditions
- **Dynamic Transformations**: Apply calculations and formatting to data

## Features

### Security
- ✅ No `eval()` or `Function()` constructor
- ✅ No access to global objects (`window`, `document`, `process`, etc.)
- ✅ No prototype pollution attacks
- ✅ Whitelisted function library only
- ✅ Expression depth limits (max 10 levels)
- ✅ Timeout protection (100ms max)
- ✅ Validated against blocked identifiers

### Functionality
- ✅ Property access (dot notation)
- ✅ Comparison operators (`===`, `!==`, `>`, `<`, `>=`, `<=`)
- ✅ Logical operators (`&&`, `||`, `!`)
- ✅ Arithmetic operators (`+`, `-`, `*`, `/`, `%`)
- ✅ Ternary expressions (`condition ? a : b`)
- ✅ Array methods (`includes`, `length`)
- ✅ Whitelisted standard library (17 functions)

## Quick Start

### Expression Evaluation

```typescript
import { evaluate } from '@/lib/portal/expressions'

const context = {
  data: { count: 10 },
  user: { role: 'admin', permissions: ['tickets.view'] },
  env: { isDev: true, orgId: 'org123' }
}

// Simple evaluation
const result = evaluate('data.count * 2', context)
// => 20

// Conditional evaluation
const message = evaluate('user.role === "admin" ? "Welcome Admin" : "Welcome User"', context)
// => "Welcome Admin"

// Using stdlib functions
const hasPermission = evaluate('includes(user.permissions, "tickets.view")', context)
// => true
```

### Data Bindings

```typescript
import { resolveBindings } from '@/lib/portal/expressions'

const bindings = [
  {
    source: 'tickets',
    field: 'openCount',
    targetProp: 'count',
    transform: 'format("{value} open tickets", data)'
  }
]

const dataContext = {
  tickets: { openCount: 5 }
}

const result = resolveBindings(bindings, dataContext, user, env)
// => { count: "5 open tickets" }
```

### Visibility Guards

```typescript
import { Guards, evaluateGuard } from '@/lib/portal/expressions'

// Pre-built guards
const adminGuard = Guards.adminOnly()
const permGuard = Guards.permission('tickets.view')
const roleGuard = Guards.anyRole(['admin', 'manager'])

// Custom guard
const customGuard = Guards.custom(
  'data.count > 10 && user.role === "admin"',
  'hide',
  'Insufficient access'
)

const result = evaluateGuard(adminGuard, context)
// => { visible: true, fallback: undefined, message: undefined }
```

## Standard Library Functions

### Comparison & Logic
- `eq(a, b)` - Equality check
- `and(...args)` - Logical AND
- `or(...args)` - Logical OR
- `not(val)` - Logical NOT

### Collections
- `len(val)` - Array/string length
- `includes(arr, val)` - Array includes check
- `isEmpty(val)` - Check if empty
- `first(arr, n)` - Get first n items
- `last(arr, n)` - Get last n items
- `join(arr, sep)` - Join array with separator

### Strings
- `format(template, data)` - String formatting with `{key}` placeholders
- `upper(val)` - Convert to uppercase
- `lower(val)` - Convert to lowercase
- `trim(val)` - Trim whitespace

### Dates
- `date(val)` - Format date to locale string
- `datetime(val)` - Format date and time to locale string

### Utilities
- `default(val, fallback)` - Get default value if null/undefined

## Components

### Parser (`parser.ts`)
Parses expressions into AST using `jsep` library and validates against security rules.

```typescript
import { parseExpression, validateExpression } from '@/lib/portal/expressions'

// Parse expression
const ast = parseExpression('user.role === "admin"')

// Validate expression
const validation = validateExpression('user.role === "admin"')
// => { valid: true }
```

### Evaluator (`evaluator.ts`)
Safely evaluates parsed expressions against a context.

```typescript
import { ExpressionEvaluator } from '@/lib/portal/expressions'

const evaluator = new ExpressionEvaluator()
const result = evaluator.evaluate('data.count + 10', context)
```

### Bindings (`bindings.ts`)
Resolves data bindings from data sources to target properties.

```typescript
import { BindingResolver } from '@/lib/portal/expressions'

const resolver = new BindingResolver()
const result = resolver.resolveBindings(bindings, dataContext, user, env)
```

### Guards (`guards.ts`)
Evaluates visibility guards and access control expressions.

```typescript
import { GuardEvaluator } from '@/lib/portal/expressions'

const evaluator = new GuardEvaluator()
const result = evaluator.evaluateGuard(guard, context)
```

## Context Structure

All evaluations require an `EvaluationContext`:

```typescript
interface EvaluationContext {
  data: Record<string, any>      // Data sources
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
```

## Security Rules

### Blocked Identifiers
The following identifiers are blocked from all expressions:
- `window`, `document`, `global`, `process`
- `require`, `module`, `exports`
- `eval`, `Function`, `constructor`
- `__proto__`, `prototype`
- `this`, `self`, `top`, `parent`
- `location`, `navigator`, `fetch`
- `XMLHttpRequest`, `WebSocket`
- `localStorage`, `sessionStorage`, `indexedDB`
- `setTimeout`, `setInterval`, `Promise`
- `async`, `await`, `import`, `export`

### Allowed Root Identifiers
Only these identifiers can be used at the root level:
- `data` - Access to data sources
- `user` - Access to user context
- `env` - Access to environment context

### Expression Limits
- **Maximum depth**: 10 levels of nesting
- **Timeout**: 100ms per evaluation
- **No mutation**: All operations are read-only

## Examples

### Dashboard Widget Visibility

```typescript
// Show widget only to admins with open tickets
const guard: VisibilityGuard = {
  expression: 'user.role === "admin" && data.tickets.openCount > 0',
  fallback: 'hide',
  message: 'No open tickets or insufficient permissions'
}
```

### Dynamic Metric Display

```typescript
const bindings: DataBinding[] = [
  {
    source: 'tickets',
    field: 'priority.high',
    targetProp: 'urgentStatus',
    transform: `
      data.value === 0
        ? "✅ No urgent tickets"
        : data.value < 5
          ? "⚠️ " + data.value + " urgent"
          : "🚨 " + data.value + " CRITICAL"
    `
  }
]
```

### Permission-Based Feature Flags

```typescript
const guards: VisibilityGuard[] = [
  Guards.authenticated('Please log in'),
  Guards.anyRole(['admin', 'manager']),
  Guards.allPermissions(['tickets.view', 'tickets.edit']),
  Guards.custom('data.tickets.openCount < 100', 'show-message', 'System overloaded')
]
```

### Complex Data Transformations

```typescript
// Calculate completion rate
const binding: DataBinding = {
  source: 'tickets',
  field: 'stats',
  targetProp: 'completionRate',
  transform: '(data.value.closedCount / (data.value.openCount + data.value.closedCount)) * 100'
}
```

## Testing

Comprehensive test suite included:

```bash
# Run all tests
npm test src/lib/portal/expressions

# Run specific test files
npm test stdlib.test.ts
npm test parser.test.ts
npm test evaluator.test.ts
npm test bindings.test.ts
npm test guards.test.ts
npm test integration.test.ts
```

## Type Safety

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  EvaluationContext,
  DataBinding,
  VisibilityGuard,
  GuardResult,
  ParsedExpression,
  ExpressionValidationResult
} from '@/lib/portal/expressions'
```

## Error Handling

The system includes specific error types:

```typescript
import { EvaluationError, EvaluationTimeoutError, BindingError, GuardError } from '@/lib/portal/expressions'

try {
  evaluate('invalid.expression', context)
} catch (error) {
  if (error instanceof EvaluationError) {
    console.error('Evaluation failed:', error.message)
  } else if (error instanceof EvaluationTimeoutError) {
    console.error('Expression timed out')
  }
}
```

## Best Practices

### 1. Validate Before Evaluation
```typescript
const validation = validateExpression(expr)
if (!validation.valid) {
  console.error('Invalid expression:', validation.error)
  return
}
const result = evaluate(expr, context)
```

### 2. Handle Null/Undefined
```typescript
// Use isEmpty() and default()
const value = evaluate('default(data.maybeNull, "fallback")', context)
```

### 3. Keep Expressions Simple
```typescript
// Good: Simple and readable
'user.role === "admin" && data.count > 0'

// Bad: Too complex
'user.role === "admin" && data.tickets.items.map(t => t.priority === "high").filter(x => x).length > 0'
```

### 4. Use Guards for Access Control
```typescript
// Combine multiple guards for layered security
const guards = [
  Guards.authenticated(),
  Guards.anyRole(['admin', 'manager']),
  Guards.permission('feature.access')
]
```

### 5. Transform Data in Bindings
```typescript
// Apply formatting and calculations in transforms
{
  source: 'metrics',
  field: 'value',
  targetProp: 'display',
  transform: 'format("{value}%", data)'
}
```

## Performance

- **Parsing**: ~1-5ms per expression
- **Evaluation**: ~0.1-1ms per expression
- **Binding resolution**: ~1-10ms for complex bindings
- **Guard evaluation**: ~0.1-1ms per guard
- **Memory**: Minimal overhead, no function compilation

## License

Part of Deskwise ITSM platform.
