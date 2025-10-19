/**
 * Analytics Helper Utilities
 * Provides formatting, calculation, and utility functions for analytics
 */

/**
 * Format large numbers with K, M, B suffixes
 * @example formatNumber(1234) => "1.2K"
 * @example formatNumber(1234567) => "1.2M"
 */
export function formatNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

/**
 * Format percentages with configurable decimal places
 * @example formatPercentage(0.8542, 1) => "85.4%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format duration in minutes to human-readable format
 * @example formatDuration(125) => "2h 5m"
 * @example formatDuration(45) => "45m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)

  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMinutes}m`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  if (remainingHours === 0) {
    return `${days}d`
  }
  return `${days}d ${remainingHours}h`
}

/**
 * Format currency values
 * @example formatCurrency(1234.56, 'USD') => "$1,234.56"
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Format date range for display
 * @example formatDateRange(start, end) => "Jan 1 - Jan 31, 2024"
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }

  const start = startDate.toLocaleDateString('en-US', options)
  const end = endDate.toLocaleDateString('en-US', options)

  // If same year, don't repeat it
  if (startDate.getFullYear() === endDate.getFullYear()) {
    const startWithoutYear = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return `${startWithoutYear} - ${end}`
  }

  return `${start} - ${end}`
}

/**
 * Calculate percentage change between two values
 * @example calculatePercentageChange(100, 120) => 20
 * @example calculatePercentageChange(100, 80) => -20
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Calculate trend direction based on percentage change
 * @example getTrendDirection(15) => "up"
 * @example getTrendDirection(-5) => "down"
 */
export function getTrendDirection(
  percentageChange: number
): 'up' | 'down' | 'neutral' {
  if (percentageChange > 0) return 'up'
  if (percentageChange < 0) return 'down'
  return 'neutral'
}

/**
 * Assign color based on metric value and thresholds
 * @example getMetricStatus(95, {success: 90, warning: 75}) => "success"
 */
export function getMetricStatus(
  value: number,
  thresholds: {
    success: number
    warning: number
  }
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (value >= thresholds.success) return 'success'
  if (value >= thresholds.warning) return 'warning'
  if (value < thresholds.warning) return 'danger'
  return 'neutral'
}

/**
 * Assign color based on inverted metric (lower is better)
 * @example getInvertedMetricStatus(5, {success: 10, warning: 20}) => "success"
 */
export function getInvertedMetricStatus(
  value: number,
  thresholds: {
    success: number
    warning: number
  }
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (value <= thresholds.success) return 'success'
  if (value <= thresholds.warning) return 'warning'
  if (value > thresholds.warning) return 'danger'
  return 'neutral'
}

/**
 * Generate date range for analytics queries
 * @example getDateRange('last30days') => { startDate, endDate }
 */
export function getDateRange(
  preset: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear' | 'lastYear'
): { startDate: Date; endDate: Date } {
  const now = new Date()
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  let startDate = new Date(endDate)

  switch (preset) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break

    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      endDate.setDate(endDate.getDate() - 1)
      break

    case 'last7days':
      startDate.setDate(startDate.getDate() - 6)
      startDate.setHours(0, 0, 0, 0)
      break

    case 'last30days':
      startDate.setDate(startDate.getDate() - 29)
      startDate.setHours(0, 0, 0, 0)
      break

    case 'last90days':
      startDate.setDate(startDate.getDate() - 89)
      startDate.setHours(0, 0, 0, 0)
      break

    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      break

    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
      endDate.setTime(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime())
      break

    case 'thisQuarter':
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0)
      break

    case 'lastQuarter':
      const lastQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3 - 3
      startDate = new Date(now.getFullYear(), lastQuarterStartMonth, 1, 0, 0, 0)
      endDate.setTime(
        new Date(now.getFullYear(), lastQuarterStartMonth + 3, 0, 23, 59, 59).getTime()
      )
      break

    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
      break

    case 'lastYear':
      startDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0)
      endDate.setTime(new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).getTime())
      break
  }

  return { startDate, endDate }
}

/**
 * Group data by date period (day, week, month)
 * @example groupByPeriod(data, 'day') => grouped data
 */
export function groupByPeriod<T extends { date: Date }>(
  data: T[],
  period: 'day' | 'week' | 'month'
): Map<string, T[]> {
  const grouped = new Map<string, T[]>()

  data.forEach((item) => {
    let key: string

    switch (period) {
      case 'day':
        key = item.date.toISOString().split('T')[0]
        break

      case 'week':
        const weekStart = new Date(item.date)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        key = weekStart.toISOString().split('T')[0]
        break

      case 'month':
        key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`
        break
    }

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(item)
  })

  return grouped
}

/**
 * Calculate moving average for trend smoothing
 * @example calculateMovingAverage([10, 20, 30, 40], 2) => [15, 25, 35]
 */
export function calculateMovingAverage(
  values: number[],
  windowSize: number
): number[] {
  const result: number[] = []

  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1)
    const average = window.reduce((sum, val) => sum + val, 0) / windowSize
    result.push(Math.round(average * 100) / 100)
  }

  return result
}

/**
 * Generate color palette for charts
 * @example generateColorPalette(5) => ["#3B82F6", "#10B981", ...]
 */
export function generateColorPalette(count: number): string[] {
  const baseColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
  ]

  if (count <= baseColors.length) {
    return baseColors.slice(0, count)
  }

  // Generate additional colors by varying lightness
  const colors = [...baseColors]
  while (colors.length < count) {
    const index = colors.length % baseColors.length
    colors.push(baseColors[index])
  }

  return colors
}

/**
 * Calculate statistical metrics for a dataset
 * @example calculateStats([1, 2, 3, 4, 5]) => { mean, median, min, max, stdDev }
 */
export function calculateStats(values: number[]): {
  mean: number
  median: number
  min: number
  max: number
  stdDev: number
} {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const median =
    values.length % 2 === 0
      ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
      : sorted[Math.floor(values.length / 2)]

  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev: Math.round(stdDev * 100) / 100,
  }
}

/**
 * Format time range label for charts
 * @example formatTimeRangeLabel('2024-01-15', 'day') => "Jan 15"
 */
export function formatTimeRangeLabel(dateString: string, granularity: 'day' | 'week' | 'month'): string {
  const date = new Date(dateString)

  switch (granularity) {
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    case 'week':
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    default:
      return dateString
  }
}
