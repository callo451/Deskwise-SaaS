/**
 * Expression System Examples
 *
 * This file demonstrates how to use the safe expression system
 * for data bindings, guards, and transformations.
 */

import { evaluate, resolveBindings, evaluateGuard, Guards } from './index'
import type { EvaluationContext, DataBinding, VisibilityGuard } from './types'

/**
 * Example 1: Simple Expression Evaluation
 */
export function exampleBasicEvaluation() {
  const context: EvaluationContext = {
    data: {
      count: 10,
      items: ['a', 'b', 'c'],
    },
    user: {
      id: 'user123',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['tickets.view', 'tickets.edit'],
    },
    env: {
      isDev: true,
      orgId: 'org123',
    },
  }

  // Simple arithmetic
  console.log('Result 1:', evaluate('data.count * 2', context)) // 20

  // Comparison
  console.log('Result 2:', evaluate('user.role === "admin"', context)) // true

  // Using stdlib functions
  console.log('Result 3:', evaluate('len(data.items)', context)) // 3
  console.log('Result 4:', evaluate('includes(data.items, "a")', context)) // true

  // Conditional expression
  console.log(
    'Result 5:',
    evaluate('data.count > 5 ? "high" : "low"', context)
  ) // "high"
}

/**
 * Example 2: Data Bindings
 */
export function exampleDataBindings() {
  const dataContext = {
    tickets: {
      openCount: 15,
      closedCount: 25,
      priority: {
        high: 5,
        medium: 7,
        low: 3,
      },
    },
    projects: {
      active: 8,
      completed: 12,
    },
  }

  const user = {
    id: 'user123',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['tickets.view'],
  }

  const env = {
    isDev: true,
    orgId: 'org123',
  }

  // Define bindings
  const bindings: DataBinding[] = [
    {
      source: 'tickets',
      field: 'openCount',
      targetProp: 'ticketCount',
      transform: 'format("{value} open tickets", data)',
    },
    {
      source: 'tickets',
      field: 'priority.high',
      targetProp: 'urgentStatus',
      transform: 'data.value > 3 ? "🔴 " + data.value + " urgent" : "✅ No urgent tickets"',
    },
    {
      source: 'projects',
      field: 'active',
      targetProp: 'activeProjects',
      transform: 'data.value + " active projects"',
    },
  ]

  // Resolve bindings
  const result = resolveBindings(bindings, dataContext, user, env)
  console.log('Bindings Result:', result)
  // {
  //   ticketCount: "15 open tickets",
  //   urgentStatus: "🔴 5 urgent",
  //   activeProjects: "8 active projects"
  // }
}

/**
 * Example 3: Visibility Guards
 */
export function exampleVisibilityGuards() {
  const context: EvaluationContext = {
    data: {
      tickets: { openCount: 15 },
    },
    user: {
      id: 'user123',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['tickets.view', 'tickets.edit'],
    },
    env: {
      isDev: true,
      orgId: 'org123',
    },
  }

  // Admin-only guard
  const adminGuard = Guards.adminOnly()
  console.log('Admin Guard:', evaluateGuard(adminGuard, context))
  // { visible: true }

  // Permission-based guard
  const permGuard = Guards.permission('tickets.view')
  console.log('Permission Guard:', evaluateGuard(permGuard, context))
  // { visible: true }

  // Multiple permissions required
  const multiPermGuard = Guards.allPermissions(['tickets.view', 'tickets.edit'])
  console.log('Multi-Permission Guard:', evaluateGuard(multiPermGuard, context))
  // { visible: true }

  // Custom guard
  const customGuard: VisibilityGuard = {
    expression: 'user.role === "admin" && data.tickets.openCount > 10',
    fallback: 'hide',
    message: 'Requires admin with active tickets',
  }
  console.log('Custom Guard:', evaluateGuard(customGuard, context))
  // { visible: true }
}

/**
 * Example 4: Dashboard Widget with Guards and Bindings
 */
export function exampleDashboardWidget() {
  const context: EvaluationContext = {
    data: {
      tickets: {
        openCount: 15,
        closedCount: 25,
        todayCount: 5,
      },
    },
    user: {
      id: 'user123',
      email: 'tech@example.com',
      role: 'technician',
      permissions: ['tickets.view'],
    },
    env: {
      isDev: false,
      orgId: 'org123',
    },
  }

  // Widget visibility guard (only show if there are open tickets)
  const visibilityGuard: VisibilityGuard = {
    expression: 'data.tickets.openCount > 0 && includes(user.permissions, "tickets.view")',
    fallback: 'hide',
  }

  const isVisible = evaluateGuard(visibilityGuard, context)

  if (isVisible.visible) {
    // Resolve widget data bindings
    const bindings: DataBinding[] = [
      {
        source: 'context',
        field: 'tickets.openCount',
        targetProp: 'title',
        transform: 'format("{value} Open Tickets", data)',
      },
      {
        source: 'context',
        field: 'tickets.todayCount',
        targetProp: 'subtitle',
        transform: 'format("+{value} today", data)',
      },
      {
        source: 'context',
        field: 'tickets',
        targetProp: 'completionRate',
        transform: '(data.value.closedCount / (data.value.openCount + data.value.closedCount) * 100)',
      },
    ]

    const widgetData = resolveBindings(bindings, context.data, context.user, context.env)
    console.log('Widget Data:', widgetData)
    // {
    //   title: "15 Open Tickets",
    //   subtitle: "+5 today",
    //   completionRate: 62.5
    // }
  }
}

/**
 * Example 5: Role-Based Content
 */
export function exampleRoleBasedContent() {
  const adminContext: EvaluationContext = {
    data: { stats: { totalRevenue: 50000 } },
    user: {
      id: 'admin1',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['*'],
    },
    env: { isDev: false, orgId: 'org123' },
  }

  const techContext: EvaluationContext = {
    data: { stats: { totalRevenue: 50000 } },
    user: {
      id: 'tech1',
      email: 'tech@example.com',
      role: 'technician',
      permissions: ['tickets.view'],
    },
    env: { isDev: false, orgId: 'org123' },
  }

  // Content only visible to admins
  const revenueGuard = Guards.role('admin', 'Admin access required')

  console.log('Admin sees revenue:', evaluateGuard(revenueGuard, adminContext))
  // { visible: true }

  console.log('Tech sees revenue:', evaluateGuard(revenueGuard, techContext))
  // { visible: false, fallback: 'hide', message: 'Admin access required' }
}

/**
 * Example 6: Dynamic Thresholds and Alerts
 */
export function exampleDynamicAlerts() {
  const context: EvaluationContext = {
    data: {
      system: {
        cpuUsage: 85,
        memoryUsage: 70,
        diskUsage: 95,
      },
    },
    user: {
      id: 'user123',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['system.view'],
    },
    env: { isDev: false, orgId: 'org123' },
  }

  // Dynamic alert levels
  const bindings: DataBinding[] = [
    {
      source: 'context',
      field: 'system.cpuUsage',
      targetProp: 'cpuAlert',
      transform: 'data.value > 90 ? "🔴 Critical" : data.value > 70 ? "⚠️ Warning" : "✅ Normal"',
    },
    {
      source: 'context',
      field: 'system.memoryUsage',
      targetProp: 'memoryAlert',
      transform: 'data.value > 90 ? "🔴 Critical" : data.value > 70 ? "⚠️ Warning" : "✅ Normal"',
    },
    {
      source: 'context',
      field: 'system.diskUsage',
      targetProp: 'diskAlert',
      transform: 'data.value > 90 ? "🔴 Critical" : data.value > 70 ? "⚠️ Warning" : "✅ Normal"',
    },
  ]

  const alerts = resolveBindings(bindings, context.data, context.user, context.env)
  console.log('System Alerts:', alerts)
  // {
  //   cpuAlert: "⚠️ Warning",
  //   memoryAlert: "✅ Normal",
  //   diskAlert: "🔴 Critical"
  // }
}

/**
 * Example 7: Complex Data Transformations
 */
export function exampleComplexTransformations() {
  const context: EvaluationContext = {
    data: {
      metrics: {
        tickets: { open: 15, closed: 25, total: 40 },
        response: { avgMinutes: 45, targetMinutes: 60 },
      },
    },
    user: {
      id: 'user123',
      email: 'manager@example.com',
      role: 'manager',
      permissions: ['reports.view'],
    },
    env: { isDev: false, orgId: 'org123' },
  }

  const bindings: DataBinding[] = [
    {
      source: 'context',
      field: 'metrics.tickets',
      targetProp: 'completionRate',
      transform: 'format("{value}%", {value: (data.value.closed / data.value.total * 100)})',
    },
    {
      source: 'context',
      field: 'metrics.response',
      targetProp: 'responsePerformance',
      transform:
        'data.value.avgMinutes <= data.value.targetMinutes ? "✅ On target" : "⚠️ " + (data.value.avgMinutes - data.value.targetMinutes) + " min over target"',
    },
  ]

  const result = resolveBindings(bindings, context.data, context.user, context.env)
  console.log('Metrics:', result)
  // {
  //   completionRate: "62.5%",
  //   responsePerformance: "✅ On target"
  // }
}

/**
 * Example 8: Permission-Based Feature Flags
 */
export function exampleFeatureFlags() {
  const context: EvaluationContext = {
    data: {},
    user: {
      id: 'user123',
      email: 'user@example.com',
      role: 'technician',
      permissions: ['tickets.view', 'tickets.create'],
    },
    env: { isDev: true, orgId: 'org123' },
  }

  // Feature requires specific permissions
  const editFeature = Guards.permission('tickets.edit')
  console.log('Can edit tickets:', evaluateGuard(editFeature, context))
  // { visible: false, fallback: 'hide', message: '...' }

  // Feature requires any of multiple permissions
  const viewFeature = Guards.anyPermission(['tickets.view', 'tickets.edit'])
  console.log('Can view tickets:', evaluateGuard(viewFeature, context))
  // { visible: true }

  // Development-only feature
  const devFeature = Guards.devMode('Feature in development')
  console.log('Dev feature visible:', evaluateGuard(devFeature, context))
  // { visible: true }
}

// Run all examples
if (require.main === module) {
  console.log('\n=== Example 1: Basic Evaluation ===')
  exampleBasicEvaluation()

  console.log('\n=== Example 2: Data Bindings ===')
  exampleDataBindings()

  console.log('\n=== Example 3: Visibility Guards ===')
  exampleVisibilityGuards()

  console.log('\n=== Example 4: Dashboard Widget ===')
  exampleDashboardWidget()

  console.log('\n=== Example 5: Role-Based Content ===')
  exampleRoleBasedContent()

  console.log('\n=== Example 6: Dynamic Alerts ===')
  exampleDynamicAlerts()

  console.log('\n=== Example 7: Complex Transformations ===')
  exampleComplexTransformations()

  console.log('\n=== Example 8: Feature Flags ===')
  exampleFeatureFlags()
}
