'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Timer,
  Pause,
} from 'lucide-react'
import { formatDistanceToNow, formatDistanceStrict, isPast } from 'date-fns'
import { cn } from '@/lib/utils'

interface SLATrackingCardProps {
  sla: {
    responseTime: number
    resolutionTime: number
    responseDeadline: Date
    resolutionDeadline: Date
    breached: boolean
    pausedAt?: Date
    pausedDuration?: number
  }
  status: string
  createdAt: Date
  className?: string
}

type SLAStatus = 'on-track' | 'at-risk' | 'breached'

export function SLATrackingCard({ sla, status, createdAt, className }: SLATrackingCardProps) {
  const now = new Date()

  // Calculate SLA metrics
  const metrics = useMemo(() => {
    const responseDeadline = new Date(sla.responseDeadline)
    const resolutionDeadline = new Date(sla.resolutionDeadline)
    const created = new Date(createdAt)

    // Response SLA
    const totalResponseTime = sla.responseTime * 60 * 1000 // minutes to ms
    const elapsedResponseTime = now.getTime() - created.getTime()
    const responseProgress = Math.min((elapsedResponseTime / totalResponseTime) * 100, 100)
    const responseRemaining = responseDeadline.getTime() - now.getTime()
    const responseOverdue = isPast(responseDeadline)

    // Resolution SLA
    const totalResolutionTime = sla.resolutionTime * 60 * 1000 // minutes to ms
    const elapsedResolutionTime = now.getTime() - created.getTime()
    const resolutionProgress = Math.min((elapsedResolutionTime / totalResolutionTime) * 100, 100)
    const resolutionRemaining = resolutionDeadline.getTime() - now.getTime()
    const resolutionOverdue = isPast(resolutionDeadline)

    // Determine status for each SLA
    const getStatus = (remainingMs: number, overdue: boolean): SLAStatus => {
      if (overdue) return 'breached'
      const hoursLeft = remainingMs / (1000 * 60 * 60)
      if (hoursLeft < 2) return 'at-risk'
      return 'on-track'
    }

    return {
      response: {
        progress: responseProgress,
        remaining: responseRemaining,
        overdue: responseOverdue,
        status: getStatus(responseRemaining, responseOverdue),
        deadline: responseDeadline,
        totalMinutes: sla.responseTime,
      },
      resolution: {
        progress: resolutionProgress,
        remaining: resolutionRemaining,
        overdue: resolutionOverdue,
        status: getStatus(resolutionRemaining, resolutionOverdue),
        deadline: resolutionDeadline,
        totalMinutes: sla.resolutionTime,
      },
    }
  }, [sla, createdAt, now])

  const getStatusConfig = (status: SLAStatus) => {
    switch (status) {
      case 'on-track':
        return {
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/10',
          border: 'border-green-200 dark:border-green-800',
          progressColor: 'bg-green-500',
          icon: CheckCircle2,
        }
      case 'at-risk':
        return {
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-900/10',
          border: 'border-orange-200 dark:border-orange-800',
          progressColor: 'bg-orange-500',
          icon: AlertTriangle,
        }
      case 'breached':
        return {
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/10',
          border: 'border-red-200 dark:border-red-800',
          progressColor: 'bg-red-500',
          icon: AlertCircle,
        }
    }
  }

  const formatTimeRemaining = (ms: number, overdue: boolean) => {
    if (overdue) {
      return `Overdue by ${formatDistanceStrict(0, Math.abs(ms))}`
    }
    return `${formatDistanceStrict(0, ms)} remaining`
  }

  const responseConfig = getStatusConfig(metrics.response.status)
  const resolutionConfig = getStatusConfig(metrics.resolution.status)
  const ResponseIcon = responseConfig.icon
  const ResolutionIcon = resolutionConfig.icon

  return (
    <Card className={cn('border-l-4', sla.breached ? 'border-l-red-500' : 'border-l-green-500', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg', sla.breached ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20')}>
              <Timer className={cn('h-5 w-5', sla.breached ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 mb-1">
                SLA Tracking
                {sla.pausedAt && (
                  <Badge variant="secondary" className="text-xs">
                    <Pause className="h-3 w-3 mr-1" />
                    Paused
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {sla.breached ? (
                  <span className="text-red-600 dark:text-red-400 font-medium">SLA Breached</span>
                ) : (
                  'Service level agreement monitoring'
                )}
              </CardDescription>
            </div>
          </div>

          {sla.breached && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Breached
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Status Alert */}
        {sla.breached && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This ticket has breached its SLA commitments. Immediate action required.
            </AlertDescription>
          </Alert>
        )}

        {/* Response Time SLA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ResponseIcon className={cn('h-4 w-4', responseConfig.color)} />
              <span className="font-medium text-sm">Response Time</span>
            </div>
            <Badge variant="outline" className={cn(responseConfig.color, 'text-xs')}>
              {metrics.response.status === 'breached' ? 'Breached' : metrics.response.status === 'at-risk' ? 'At Risk' : 'On Track'}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: {metrics.response.totalMinutes} minutes</span>
              <span className={metrics.response.overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                {formatTimeRemaining(metrics.response.remaining, metrics.response.overdue)}
              </span>
            </div>

            <div className="relative">
              <Progress
                value={metrics.response.progress}
                className="h-3"
                indicatorClassName={responseConfig.progressColor}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white drop-shadow-md">
                  {Math.round(metrics.response.progress)}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                Due {formatDistanceToNow(metrics.response.deadline, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Resolution Time SLA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ResolutionIcon className={cn('h-4 w-4', resolutionConfig.color)} />
              <span className="font-medium text-sm">Resolution Time</span>
            </div>
            <Badge variant="outline" className={cn(resolutionConfig.color, 'text-xs')}>
              {metrics.resolution.status === 'breached' ? 'Breached' : metrics.resolution.status === 'at-risk' ? 'At Risk' : 'On Track'}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: {metrics.resolution.totalMinutes} minutes</span>
              <span className={metrics.resolution.overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                {formatTimeRemaining(metrics.resolution.remaining, metrics.resolution.overdue)}
              </span>
            </div>

            <div className="relative">
              <Progress
                value={metrics.resolution.progress}
                className="h-3"
                indicatorClassName={resolutionConfig.progressColor}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white drop-shadow-md">
                  {Math.round(metrics.resolution.progress)}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                Due {formatDistanceToNow(metrics.resolution.deadline, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Paused Info */}
        {sla.pausedAt && sla.pausedDuration && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-start gap-2 text-sm">
              <Pause className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium mb-1">SLA Timer Paused</div>
                <div className="text-xs text-muted-foreground">
                  Total paused time: {Math.round(sla.pausedDuration)} minutes
                </div>
                <div className="text-xs text-muted-foreground">
                  Paused since {formatDistanceToNow(new Date(sla.pausedAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
