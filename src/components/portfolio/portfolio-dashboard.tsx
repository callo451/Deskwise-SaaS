'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Users,
  Download,
  Filter,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ProjectSummary {
  projectId: string
  projectNumber: string
  projectName: string
  status: string
  health: 'green' | 'amber' | 'red'
  healthScore: number
  progress: number
  budget: number
  actualCost: number
  startDate: Date
  endDate: Date
  teamSize: number
  isOnSchedule: boolean
  daysRemaining: number
}

interface PortfolioMetrics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalBudget: number
  totalActualCost: number
  budgetVariance: number
  averageHealthScore: number
  onTrackProjects: number
  atRiskProjects: number
  offTrackProjects: number
  totalTeamMembers: number
  averageProgress: number
}

interface PortfolioDashboardProps {
  portfolioId?: string
  portfolioName?: string
}

export function PortfolioDashboard({ portfolioId, portfolioName }: PortfolioDashboardProps) {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterHealth, setFilterHealth] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('health')

  useEffect(() => {
    loadPortfolioData()
  }, [portfolioId])

  const loadPortfolioData = async () => {
    setIsLoading(true)
    try {
      const endpoint = portfolioId
        ? `/api/analytics/portfolios/${portfolioId}`
        : '/api/analytics/organization'

      const response = await fetch(endpoint)
      const data = await response.json()

      if (data.success) {
        // Transform data
        setMetrics({
          totalProjects: data.data.totalProjects || data.data.projectCount || 0,
          activeProjects: data.data.activeProjects || data.data.statusBreakdown?.active || 0,
          completedProjects: data.data.completedProjects || data.data.statusBreakdown?.completed || 0,
          totalBudget: data.data.totalBudget || 0,
          totalActualCost: data.data.totalActualCost || 0,
          budgetVariance: data.data.totalBudget > 0
            ? ((data.data.totalActualCost - data.data.totalBudget) / data.data.totalBudget) * 100
            : 0,
          averageHealthScore: data.data.avgHealthScore || 0,
          onTrackProjects: data.data.onTrackProjects || 0,
          atRiskProjects: data.data.atRiskProjects || 0,
          offTrackProjects: data.data.offTrackProjects || 0,
          totalTeamMembers: data.data.totalTeamMembers || 0,
          averageProgress: data.data.avgCompletionRate || 0
        })

        // Load individual projects
        loadProjects()
      }
    } catch (error) {
      console.error('Failed to load portfolio data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const params = new URLSearchParams()
      if (portfolioId) params.set('portfolioId', portfolioId)

      const response = await fetch(`/api/projects?${params}`)
      const data = await response.json()

      if (data.success) {
        setProjects(data.data.map((p: any) => ({
          ...p,
          projectId: p._id || p.projectId, // Map _id to projectId for consistency
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          daysRemaining: Math.ceil((new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          isOnSchedule: p.health !== 'red'
        })))
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      if (filterStatus !== 'all' && project.status !== filterStatus) return false
      if (filterHealth !== 'all' && project.health !== filterHealth) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'health':
          return a.healthScore - b.healthScore
        case 'progress':
          return b.progress - a.progress
        case 'budget':
          return (b.budget - b.actualCost) - (a.budget - a.actualCost)
        case 'schedule':
          return a.daysRemaining - b.daysRemaining
        default:
          return 0
      }
    })

  const getHealthColor = (health: 'green' | 'amber' | 'red') => {
    switch (health) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'amber':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getHealthIcon = (health: 'green' | 'amber' | 'red') => {
    switch (health) {
      case 'green':
        return <CheckCircle2 className="h-4 w-4" />
      case 'amber':
        return <AlertTriangle className="h-4 w-4" />
      case 'red':
        return <AlertTriangle className="h-4 w-4" />
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

  if (isLoading || !metrics) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading portfolio dashboard...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {portfolioName || 'Portfolio Overview'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Executive dashboard for project portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProjects}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{metrics.activeProjects} active</span>
              <span>•</span>
              <span>{metrics.completedProjects} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalBudget)}</div>
            <div className={cn(
              'flex items-center gap-1 mt-1 text-xs',
              metrics.budgetVariance > 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {metrics.budgetVariance > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3 rotate-180" />
              )}
              <span>
                {Math.abs(metrics.budgetVariance).toFixed(1)}%
                {metrics.budgetVariance > 0 ? ' over budget' : ' under budget'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Health Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageHealthScore}/100</div>
            <Progress value={metrics.averageHealthScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Health</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.onTrackProjects}
                </div>
                <p className="text-xs text-muted-foreground">On track</p>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-yellow-600">
                  {metrics.atRiskProjects}
                </div>
                <p className="text-xs text-muted-foreground">At risk</p>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-red-600">
                  {metrics.offTrackProjects}
                </div>
                <p className="text-xs text-muted-foreground">Off track</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Health Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>On Track (Green)</span>
                  </div>
                  <span className="font-medium">{metrics.onTrackProjects} projects</span>
                </div>
                <Progress
                  value={(metrics.onTrackProjects / metrics.totalProjects) * 100}
                  className="h-2 [&>div]:bg-green-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>At Risk (Amber)</span>
                  </div>
                  <span className="font-medium">{metrics.atRiskProjects} projects</span>
                </div>
                <Progress
                  value={(metrics.atRiskProjects / metrics.totalProjects) * 100}
                  className="h-2 [&>div]:bg-yellow-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Off Track (Red)</span>
                  </div>
                  <span className="font-medium">{metrics.offTrackProjects} projects</span>
                </div>
                <Progress
                  value={(metrics.offTrackProjects / metrics.totalProjects) * 100}
                  className="h-2 [&>div]:bg-red-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p>
                <span className="font-medium">{metrics.onTrackProjects}</span> projects are on
                schedule and within budget
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p>
                <span className="font-medium">{metrics.atRiskProjects}</span> projects need
                attention to avoid delays
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p>
                <span className="font-medium">{metrics.offTrackProjects}</span> projects are
                significantly delayed or over budget
              </p>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p>
                Average portfolio progress is{' '}
                <span className="font-medium">{metrics.averageProgress.toFixed(0)}%</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Projects</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">Sort by Health</SelectItem>
                  <SelectItem value="progress">Sort by Progress</SelectItem>
                  <SelectItem value="budget">Sort by Budget</SelectItem>
                  <SelectItem value="schedule">Sort by Schedule</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterHealth} onValueChange={setFilterHealth}>
                <SelectTrigger className="w-[140px] h-9">
                  <Filter className="h-3 w-3 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Health</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No projects found</p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <Card key={project.projectId} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/projects/${project.projectId}`}
                          className="font-semibold hover:text-primary truncate"
                        >
                          {project.projectNumber} - {project.projectName}
                        </Link>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getHealthColor(project.health))}
                        >
                          {getHealthIcon(project.health)}
                          <span className="ml-1 capitalize">{project.health}</span>
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {project.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={project.progress} className="h-2 flex-1" />
                            <span className="text-sm font-medium">{project.progress}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(project.actualCost)} / {formatCurrency(project.budget)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Schedule</p>
                          <p className={cn(
                            'text-sm font-medium',
                            project.daysRemaining < 0 && 'text-red-600',
                            project.daysRemaining >= 0 && project.daysRemaining <= 7 && 'text-yellow-600'
                          )}>
                            {project.daysRemaining < 0
                              ? `${Math.abs(project.daysRemaining)} days overdue`
                              : `${project.daysRemaining} days remaining`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Team</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            <span className="text-sm font-medium">{project.teamSize} members</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {project.startDate.toLocaleDateString()} -{' '}
                          {project.endDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Link href={`/projects/${project.projectId}`}>
                      <Button variant="ghost" size="sm">
                        View
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
