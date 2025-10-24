'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

interface SLAData {
  responseTime: number
  resolutionTime: number
  responseDeadline: string
  resolutionDeadline: string
  breached: boolean
}

interface ModernSLACardProps {
  sla: SLAData
  createdAt: string
  className?: string
}

export function ModernSLACard({ sla, createdAt, className }: ModernSLACardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [status, setStatus] = useState<'breached' | 'at-risk' | 'on-track'>('on-track')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const deadline = new Date(sla.resolutionDeadline)
      const created = new Date(createdAt)
      const totalTime = deadline.getTime() - created.getTime()
      const elapsed = now.getTime() - created.getTime()
      const remaining = deadline.getTime() - now.getTime()

      // Calculate progress percentage
      const percent = Math.min(100, Math.max(0, (elapsed / totalTime) * 100))
      setProgressPercent(percent)

      // Determine status
      if (sla.breached || remaining < 0) {
        setStatus('breached')
        const overdue = Math.abs(remaining)
        const hours = Math.floor(overdue / (1000 * 60 * 60))
        const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60))
        setTimeRemaining(`Overdue by ${hours}h ${minutes}m`)
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60))
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

        if (hours < 2) {
          setStatus('at-risk')
        } else {
          setStatus('on-track')
        }

        setTimeRemaining(`${hours}h ${minutes}m remaining`)
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [sla, createdAt])

  const statusConfig = {
    breached: {
      icon: AlertTriangle,
      title: 'SLA Breached',
      description: 'Resolution deadline has passed',
      className: 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20',
      iconColor: 'text-red-500',
      progressColor: 'bg-red-500',
      badge: {
        className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
        label: 'Breached'
      }
    },
    'at-risk': {
      icon: Clock,
      title: 'SLA At Risk',
      description: 'Approaching resolution deadline',
      className: 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20',
      iconColor: 'text-orange-500',
      progressColor: 'bg-orange-500',
      badge: {
        className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
        label: 'At Risk'
      }
    },
    'on-track': {
      icon: CheckCircle2,
      title: 'SLA On Track',
      description: 'Within expected timeframe',
      className: 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
      iconColor: 'text-green-500',
      progressColor: 'bg-green-500',
      badge: {
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
        label: 'On Track'
      }
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Card className={cn('border-2 shadow-lg transition-colors', config.className, className)}>
      <CardHeader
        className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className={cn('p-2 rounded-lg', config.iconColor, 'bg-background/50')}>
              <Target className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {config.title}
                <Badge variant="outline" className={cn('text-xs', config.badge.className)}>
                  {config.badge.label}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {config.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', config.iconColor)} />
            <button
              className="shrink-0 p-1 hover:bg-accent rounded-md transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Time Progress</span>
            <span className="font-mono font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress
            value={progressPercent}
            className="h-2"
            indicatorClassName={config.progressColor}
          />
        </div>

        {/* Time Remaining */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
          <div className="flex items-center gap-2">
            <Clock className={cn('w-4 h-4', config.iconColor)} />
            <span className="text-sm font-medium">{timeRemaining}</span>
          </div>
          {status === 'breached' && (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          {status === 'on-track' && (
            <TrendingUp className="w-4 h-4 text-green-500" />
          )}
        </div>

        {/* SLA Details */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Response Time</span>
            <span className="font-medium">{sla.responseTime} min</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Resolution Time</span>
            <span className="font-medium">{sla.resolutionTime} min</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Deadline</span>
            <span className="font-medium">{formatRelativeTime(sla.resolutionDeadline)}</span>
          </div>
        </div>

        {/* Warning Message */}
        {status === 'at-risk' && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-xs text-orange-700 dark:text-orange-400">
              This ticket requires immediate attention to meet SLA commitments.
            </p>
          </div>
        )}

        {status === 'breached' && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">
              SLA has been breached. Escalation may be required.
            </p>
          </div>
        )}
        </CardContent>
      )}
    </Card>
  )
}
