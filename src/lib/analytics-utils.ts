import numeral from 'numeral'

/**
 * Format a number with appropriate suffix (K, M, B)
 */
export function formatNumber(value: number): string {
  if (value >= 1000000000) {
    return numeral(value).format('0.0a').toUpperCase()
  }
  if (value >= 1000000) {
    return numeral(value).format('0.0a').toUpperCase()
  }
  if (value >= 1000) {
    return numeral(value).format('0.0a').toUpperCase()
  }
  return numeral(value).format('0,0')
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return numeral(value).format('$0,0.00')
}

/**
 * Format duration in milliseconds to human-readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

/**
 * Get trend indicator based on change
 */
export function getTrendIndicator(change: number): 'up' | 'down' | 'neutral' {
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'neutral'
}

/**
 * Get status color based on value and thresholds
 */
export function getStatusColor(
  value: number,
  thresholds: { warning: number; danger: number },
  inverse: boolean = false
): 'success' | 'warning' | 'danger' {
  if (inverse) {
    if (value >= thresholds.danger) return 'danger'
    if (value >= thresholds.warning) return 'warning'
    return 'success'
  } else {
    if (value >= thresholds.warning) return 'success'
    if (value >= thresholds.danger) return 'warning'
    return 'danger'
  }
}

/**
 * Calculate SLA compliance percentage
 */
export function calculateSLACompliance(
  total: number,
  breaches: number
): number {
  if (total === 0) return 100
  return ((total - breaches) / total) * 100
}

/**
 * Get color for SLA compliance
 */
export function getSLAColor(compliance: number): string {
  if (compliance >= 95) return 'text-green-600'
  if (compliance >= 85) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Generate color palette for charts
 */
export function getChartColors(count: number): string[] {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#6366f1', // indigo
  ]

  if (count <= colors.length) {
    return colors.slice(0, count)
  }

  // Generate additional colors if needed
  const result = [...colors]
  while (result.length < count) {
    result.push(
      `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
    )
  }

  return result
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number
): number[] {
  const result: number[] = []

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const window = data.slice(start, i + 1)
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length
    result.push(avg)
  }

  return result
}

/**
 * Group data by time period
 */
export function groupByTimePeriod<T>(
  data: T[],
  dateGetter: (item: T) => Date,
  period: 'hour' | 'day' | 'week' | 'month'
): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  data.forEach((item) => {
    const date = dateGetter(item)
    let key: string

    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
        break
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
        break
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`
        break
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(item)
  })

  return groups
}

/**
 * Calculate percentile
 */
export function calculatePercentile(
  data: number[],
  percentile: number
): number {
  if (data.length === 0) return 0

  const sorted = [...data].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) {
    return sorted[lower]
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Generate date range labels
 */
export function generateDateLabels(
  from: Date,
  to: Date,
  period: 'hour' | 'day' | 'week' | 'month'
): string[] {
  const labels: string[] = []
  const current = new Date(from)

  while (current <= to) {
    switch (period) {
      case 'hour':
        labels.push(
          current.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
          })
        )
        current.setHours(current.getHours() + 1)
        break

      case 'day':
        labels.push(
          current.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        )
        current.setDate(current.getDate() + 1)
        break

      case 'week':
        labels.push(
          `Week of ${current.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}`
        )
        current.setDate(current.getDate() + 7)
        break

      case 'month':
        labels.push(
          current.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          })
        )
        current.setMonth(current.getMonth() + 1)
        break
    }
  }

  return labels
}

/**
 * Aggregate data by category
 */
export function aggregateByCategory<T>(
  data: T[],
  categoryGetter: (item: T) => string,
  valueGetter: (item: T) => number
): Array<{ category: string; value: number }> {
  const aggregated = new Map<string, number>()

  data.forEach((item) => {
    const category = categoryGetter(item)
    const value = valueGetter(item)

    aggregated.set(category, (aggregated.get(category) || 0) + value)
  })

  return Array.from(aggregated.entries()).map(([category, value]) => ({
    category,
    value,
  }))
}
