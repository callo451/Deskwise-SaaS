'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectHealthMetrics {
  overall: {
    health: 'green' | 'amber' | 'red'
    score: number
    timestamp: Date
  }
  schedule: {
    health: 'green' | 'amber' | 'red'
    score: number
    details: {
      timeElapsedPct: number
      progressPct: number
      variance: number
    }
  }
  budget: {
    health: 'green' | 'amber' | 'red'
    score: number
    details: {
      budgetUtilization: number
      costVariance: number
    }
  }
  scope: {
    health: 'green' | 'amber' | 'red'
    score: number
    details: {
      changeRequestCount: number
      approvedChanges: number
    }
  }
  risk: {
    health: 'green' | 'amber' | 'red'
    score: number
    details: {
      totalRisks: number
      highRisks: number
      criticalRisks: number
    }
  }
  quality: {
    health: 'green' | 'amber' | 'red'
    score: number
    details: {
      defectCount: number
      criticalIssues: number
    }
  }
}

interface ProjectHealthCardProps {
  metrics: ProjectHealthMetrics
  projectName: string
  onRefresh?: () => void
  isLoading?: boolean
}

export function ProjectHealthCard({
  metrics,
  projectName,
  onRefresh,
  isLoading = false
}: ProjectHealthCardProps) {
  const getHealthColor = (health: 'green' | 'amber' | 'red') => {
    switch (health) {
      case 'green':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'amber':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'red':
        return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const getHealthIcon = (health: 'green' | 'amber' | 'red') => {
    switch (health) {
      case 'green':
        return <CheckCircle2 className="h-5 w-5" />
      case 'amber':
        return <AlertTriangle className="h-5 w-5" />
      case 'red':
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getTrendIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const dimensions = [
    {
      name: 'Schedule',
      icon: Activity,
      health: metrics.schedule?.health || 'green',
      score: metrics.schedule?.score || 100,
      weight: '30%',
      details: [
        { label: 'Time Elapsed', value: `${(metrics.schedule?.details?.timeElapsedPct || 0).toFixed(1)}%` },
        { label: 'Progress', value: `${(metrics.schedule?.details?.progressPct || 0).toFixed(1)}%` },
        { label: 'Variance', value: `${(metrics.schedule?.details?.variance || 0) > 0 ? '+' : ''}${(metrics.schedule?.details?.variance || 0).toFixed(1)}%`, icon: getTrendIcon(metrics.schedule?.details?.variance || 0) },
      ]
    },
    {
      name: 'Budget',
      icon: DollarSign,
      health: metrics.budget?.health || 'green',
      score: metrics.budget?.score || 100,
      weight: '30%',
      details: [
        { label: 'Utilization', value: `${(metrics.budget?.details?.budgetUtilization || 0).toFixed(1)}%` },
        { label: 'Variance', value: `${(metrics.budget?.details?.costVariance || 0) > 0 ? '+' : ''}${(metrics.budget?.details?.costVariance || 0).toFixed(1)}%`, icon: getTrendIcon(-(metrics.budget?.details?.costVariance || 0)) },
      ]
    },
    {
      name: 'Risk',
      icon: AlertTriangle,
      health: metrics.risk?.health || 'green',
      score: metrics.risk?.score || 100,
      weight: '20%',
      details: [
        { label: 'Total Risks', value: metrics.risk?.details?.totalRisks || 0 },
        { label: 'High/Critical', value: `${(metrics.risk?.details?.highRisks || 0) + (metrics.risk?.details?.criticalRisks || 0)}` },
      ]
    },
    {
      name: 'Quality',
      icon: CheckCircle2,
      health: metrics.quality?.health || 'green',
      score: metrics.quality?.score || 100,
      weight: '15%',
      details: [
        { label: 'Defects', value: metrics.quality?.details?.defectCount || 0 },
        { label: 'Critical Issues', value: metrics.quality?.details?.criticalIssues || 0 },
      ]
    },
    {
      name: 'Scope',
      icon: Target,
      health: metrics.scope?.health || 'green',
      score: metrics.scope?.score || 100,
      weight: '5%',
      details: [
        { label: 'Change Requests', value: metrics.scope?.details?.changeRequestCount || 0 },
        { label: 'Approved', value: metrics.scope?.details?.approvedChanges || 0 },
      ]
    },
  ]

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Project Health</h3>
            <p className="text-sm text-muted-foreground">{projectName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={cn('px-3 py-1', getHealthColor(metrics.overall?.health || 'green'))}
            >
              <span className="flex items-center gap-1.5">
                {getHealthIcon(metrics.overall?.health || 'green')}
                <span className="font-semibold">{metrics.overall?.score || 100}/100</span>
              </span>
            </Badge>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>
        </div>

        {/* Overall Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Health</span>
            <span className="text-muted-foreground">{metrics.overall?.score || 100}/100</span>
          </div>
          <Progress
            value={metrics.overall?.score || 100}
            className={cn(
              'h-3',
              (metrics.overall?.health || 'green') === 'green' && '[&>div]:bg-green-500',
              (metrics.overall?.health || 'green') === 'amber' && '[&>div]:bg-amber-500',
              (metrics.overall?.health || 'green') === 'red' && '[&>div]:bg-red-500'
            )}
          />
        </div>

        {/* Health Dimensions */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Health Dimensions</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dimensions.map((dimension) => (
              <Card key={dimension.name} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <dimension.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{dimension.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('h-6 px-2 text-xs', getHealthColor(dimension.health))}
                  >
                    {dimension.score}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  {dimension.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{detail.label}</span>
                      <span className="flex items-center gap-1 font-medium">
                        {detail.value}
                        {detail.icon}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Weight: {dimension.weight}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-right">
          Last updated: {metrics.overall?.timestamp ? new Date(metrics.overall.timestamp).toLocaleString() : 'Never'}
        </div>
      </div>
    </Card>
  )
}
