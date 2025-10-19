'use client'

import { Clock, AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface SLAIndicatorProps {
  sla?: {
    responseTime: number
    resolutionTime: number
    responseDeadline: Date | string
    resolutionDeadline: Date | string
    breached: boolean
  }
  createdAt: Date | string
  variant?: 'default' | 'compact' | 'detailed'
  showProgress?: boolean
  className?: string
}

export function SLAIndicator({
  sla,
  createdAt,
  variant = 'default',
  showProgress = false,
  className,
}: SLAIndicatorProps) {
  if (!sla) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="text-xs text-muted-foreground">No SLA</span>
      </div>
    )
  }

  const now = new Date()
  const deadline = new Date(sla.resolutionDeadline)
  const created = new Date(createdAt)
  const timeRemaining = deadline.getTime() - now.getTime()
  const totalTime = deadline.getTime() - created.getTime()
  const timeElapsed = now.getTime() - created.getTime()
  const percentRemaining = Math.max(0, ((totalTime - timeElapsed) / totalTime) * 100)
  const percentElapsed = Math.min(100, 100 - percentRemaining)

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    if (ms < 0) return 'OVERDUE'
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    if (hours >= 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Determine status
  let status: 'breached' | 'critical' | 'at-risk' | 'on-time'
  let icon: any
  let colorClass: string
  let bgClass: string

  if (sla.breached || timeRemaining < 0) {
    status = 'breached'
    icon = XCircle
    colorClass = 'text-red-600 dark:text-red-400'
    bgClass = 'bg-red-100 dark:bg-red-900/20'
  } else if (percentRemaining < 10) {
    status = 'critical'
    icon = AlertCircle
    colorClass = 'text-orange-600 dark:text-orange-400'
    bgClass = 'bg-orange-100 dark:bg-orange-900/20'
  } else if (percentRemaining < 25) {
    status = 'at-risk'
    icon = AlertTriangle
    colorClass = 'text-yellow-600 dark:text-yellow-400'
    bgClass = 'bg-yellow-100 dark:bg-yellow-900/20'
  } else {
    status = 'on-time'
    icon = CheckCircle2
    colorClass = 'text-green-600 dark:text-green-400'
    bgClass = 'bg-green-100 dark:bg-green-900/20'
  }

  const Icon = icon

  // Compact variant - just the icon and time
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {status === 'breached' ? (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        ) : (
          <Icon className={cn('w-3 h-3', colorClass)} />
        )}
        <span className={cn('text-xs font-medium', colorClass)}>
          {status === 'breached' ? 'BREACHED' : formatTimeRemaining(timeRemaining)}
        </span>
      </div>
    )
  }

  // Detailed variant - with progress bar
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('w-4 h-4', colorClass)} />
            <span className={cn('text-sm font-medium', colorClass)}>
              {status === 'breached' && 'SLA BREACHED'}
              {status === 'critical' && 'Critical - Urgent Action Required'}
              {status === 'at-risk' && 'At Risk - Attention Needed'}
              {status === 'on-time' && 'On Track'}
            </span>
          </div>
          <span className={cn('text-sm font-semibold', colorClass)}>
            {formatTimeRemaining(timeRemaining)}
          </span>
        </div>
        {showProgress && (
          <div className="space-y-1">
            <Progress
              value={percentElapsed}
              className="h-2"
              indicatorClassName={cn({
                'bg-green-500': status === 'on-time',
                'bg-yellow-500': status === 'at-risk',
                'bg-orange-500': status === 'critical',
                'bg-red-500': status === 'breached',
              })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {Math.round(percentElapsed)}% elapsed
              </span>
              <span>
                {Math.round(percentRemaining)}% remaining
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default variant - icon, badge, and time
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {status === 'breached' ? (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', bgClass, colorClass)}>
            BREACHED
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Icon className={cn('w-3.5 h-3.5', colorClass)} />
          <span className={cn('text-xs font-medium', colorClass)}>
            {formatTimeRemaining(timeRemaining)}
          </span>
        </div>
      )}
    </div>
  )
}
