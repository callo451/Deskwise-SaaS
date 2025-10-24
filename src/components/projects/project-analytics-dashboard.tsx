'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskAnalytics {
  total: number
  completed: number
  inProgress: number
  notStarted: number
  overdue: number
  completionRate: number
  averageCompletionTime: number // days
}

interface ResourceAnalytics {
  totalHours: number
  billableHours: number
  nonBillableHours: number
  utilizationRate: number // percentage
  topContributors: Array<{
    userId: string
    userName: string
    hours: number
    percentage: number
  }>
}

interface TimelineAnalytics {
  startDate: Date
  endDate: Date
  currentProgress: number // percentage
  timeElapsed: number // percentage
  estimatedCompletionDate: Date
  isOnSchedule: boolean
  daysRemaining: number
}

interface BudgetAnalytics {
  totalBudget: number
  spent: number
  remaining: number
  utilizationRate: number // percentage
  laborCosts: number
  otherCosts: number
  projectedTotal: number
  isOverBudget: boolean
}

interface TrendData {
  date: string
  tasksCompleted: number
  hoursLogged: number
  activeMembers: number
}

interface ProjectAnalyticsData {
  projectId: string
  projectName: string
  tasks?: TaskAnalytics
  resources?: ResourceAnalytics
  timeline?: TimelineAnalytics
  budget?: BudgetAnalytics
  trends?: TrendData[]
  lastUpdated?: Date
}

interface ProjectAnalyticsDashboardProps {
  projectId: string
  projectName: string
  onExport?: () => void
}

export function ProjectAnalyticsDashboard({
  projectId,
  projectName,
  onExport
}: ProjectAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<ProjectAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [projectId, dateRange])

  const loadAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ range: dateRange })
      const response = await fetch(`/api/analytics/projects/${projectId}?${params}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.data)
      } else {
        setError(data.error || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !analytics || !analytics.tasks || !analytics.resources || !analytics.budget || !analytics.timeline) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics Not Available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error || 'Analytics data is not available for this project yet.'}
          </p>
          <Button onClick={loadAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Analytics</h2>
          <p className="text-sm text-muted-foreground">{projectName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Task Completion */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Task Completion</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {analytics.tasks.completionRate.toFixed(0)}%
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {analytics.tasks.completed}
              </span>
              <span className="text-sm text-muted-foreground">
                / {analytics.tasks.total}
              </span>
            </div>
            <Progress value={analytics.tasks.completionRate} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{analytics.tasks.inProgress} in progress</span>
              {analytics.tasks.overdue > 0 && (
                <span className="text-red-600">{analytics.tasks.overdue} overdue</span>
              )}
            </div>
          </div>
        </Card>

        {/* Time Utilization */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Time Logged</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {analytics.resources.utilizationRate.toFixed(0)}%
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {formatHours(analytics.resources.totalHours)}
              </span>
            </div>
            <Progress value={analytics.resources.utilizationRate} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{formatHours(analytics.resources.billableHours)} billable</span>
            </div>
          </div>
        </Card>

        {/* Budget Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Budget</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                analytics.budget.isOverBudget && 'text-red-600 border-red-200'
              )}
            >
              {analytics.budget.utilizationRate.toFixed(0)}%
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {formatCurrency(analytics.budget.spent)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {formatCurrency(analytics.budget.totalBudget)}
              </span>
            </div>
            <Progress
              value={analytics.budget.utilizationRate}
              className={cn(
                'h-2',
                analytics.budget.isOverBudget && '[&>div]:bg-red-500'
              )}
            />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{formatCurrency(analytics.budget.remaining)} remaining</span>
            </div>
          </div>
        </Card>

        {/* Schedule Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Schedule</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                !analytics.timeline.isOnSchedule && 'text-orange-600 border-orange-200'
              )}
            >
              {analytics.timeline.isOnSchedule ? 'On Track' : 'At Risk'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {analytics.timeline.daysRemaining}
              </span>
              <span className="text-sm text-muted-foreground">days left</span>
            </div>
            <Progress value={analytics.timeline.currentProgress} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{analytics.timeline.timeElapsed.toFixed(0)}% time elapsed</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Task Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Task Status Breakdown</h3>
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Completed</span>
                </div>
                <span className="font-medium">{analytics.tasks.completed}</span>
              </div>
              <Progress
                value={(analytics.tasks.completed / analytics.tasks.total) * 100}
                className="h-2 [&>div]:bg-green-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>In Progress</span>
                </div>
                <span className="font-medium">{analytics.tasks.inProgress}</span>
              </div>
              <Progress
                value={(analytics.tasks.inProgress / analytics.tasks.total) * 100}
                className="h-2 [&>div]:bg-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span>Not Started</span>
                </div>
                <span className="font-medium">{analytics.tasks.notStarted}</span>
              </div>
              <Progress
                value={(analytics.tasks.notStarted / analytics.tasks.total) * 100}
                className="h-2 [&>div]:bg-gray-400"
              />
            </div>

            {analytics.tasks.overdue > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Overdue</span>
                  </div>
                  <span className="font-medium">{analytics.tasks.overdue}</span>
                </div>
                <Progress
                  value={(analytics.tasks.overdue / analytics.tasks.total) * 100}
                  className="h-2 [&>div]:bg-red-500"
                />
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg. Completion Time</span>
                <span className="font-medium">
                  {analytics.tasks.averageCompletionTime.toFixed(1)} days
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Top Contributors</h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {analytics.resources.topContributors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No time logged yet
              </div>
            ) : (
              analytics.resources.topContributors.map((contributor, idx) => (
                <div key={contributor.userId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white',
                          idx === 0 && 'bg-yellow-500',
                          idx === 1 && 'bg-gray-400',
                          idx === 2 && 'bg-orange-600',
                          idx > 2 && 'bg-blue-500'
                        )}
                      >
                        {idx + 1}
                      </div>
                      <span className="font-medium">{contributor.userName}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {formatHours(contributor.hours)}
                    </span>
                  </div>
                  <Progress
                    value={contributor.percentage}
                    className={cn(
                      'h-2',
                      idx === 0 && '[&>div]:bg-yellow-500',
                      idx === 1 && '[&>div]:bg-gray-400',
                      idx === 2 && '[&>div]:bg-orange-600',
                      idx > 2 && '[&>div]:bg-blue-500'
                    )}
                  />
                </div>
              ))
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Hours</span>
                <span className="font-medium">
                  {formatHours(analytics.resources.totalHours)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Billable vs Non-Billable</span>
                <span className="font-medium">
                  {((analytics.resources.billableHours / analytics.resources.totalHours) * 100).toFixed(0)}%
                  {' / '}
                  {((analytics.resources.nonBillableHours / analytics.resources.totalHours) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Breakdown */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Budget Analysis</h3>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Labor Costs</div>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.budget.laborCosts)}
            </div>
            <div className="text-xs text-muted-foreground">
              {((analytics.budget.laborCosts / analytics.budget.totalBudget) * 100).toFixed(1)}% of budget
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Other Costs</div>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.budget.otherCosts)}
            </div>
            <div className="text-xs text-muted-foreground">
              {((analytics.budget.otherCosts / analytics.budget.totalBudget) * 100).toFixed(1)}% of budget
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Projected Total</div>
            <div className={cn(
              'text-2xl font-bold',
              analytics.budget.projectedTotal > analytics.budget.totalBudget && 'text-red-600'
            )}>
              {formatCurrency(analytics.budget.projectedTotal)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {analytics.budget.projectedTotal > analytics.budget.totalBudget ? (
                <>
                  <TrendingUp className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    {formatCurrency(analytics.budget.projectedTotal - analytics.budget.totalBudget)} over
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    {formatCurrency(analytics.budget.totalBudget - analytics.budget.projectedTotal)} under
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Trends Chart (Simplified) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Activity Trends</h3>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        {analytics.trends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No trend data available
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {analytics.trends.slice(-7).map((trend, idx) => {
                const maxTasks = Math.max(...analytics.trends.map(t => t.tasksCompleted))
                const height = maxTasks > 0 ? (trend.tasksCompleted / maxTasks) * 100 : 0

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-end justify-center h-32">
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${trend.tasksCompleted} tasks completed`}
                      />
                    </div>
                    <div className="text-xs text-center text-muted-foreground">
                      {new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Tasks Completed</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-right">
        Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}
