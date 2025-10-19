import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - d.getTime()
  const diffInMinutes = Math.floor(diffInMs / 60000)

  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays}d ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths}mo ago`

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}y ago`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Calculate incident priority based on Impact × Urgency matrix
 * @param impact - How many users/services are affected
 * @param urgency - How quickly resolution is needed
 * @returns priority - Calculated priority level
 */
export function calculateIncidentPriority(
  impact: 'low' | 'medium' | 'high',
  urgency: 'low' | 'medium' | 'high'
): 'low' | 'medium' | 'high' | 'critical' {
  // Priority Matrix (Impact × Urgency)
  const matrix: Record<string, Record<string, 'low' | 'medium' | 'high' | 'critical'>> = {
    high: {
      high: 'critical',
      medium: 'high',
      low: 'medium',
    },
    medium: {
      high: 'high',
      medium: 'medium',
      low: 'low',
    },
    low: {
      high: 'medium',
      medium: 'low',
      low: 'low',
    },
  }

  return matrix[impact][urgency]
}
