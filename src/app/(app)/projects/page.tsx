'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus,
  Search,
  FolderKanban,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  Calendar,
  Target,
  Activity
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ProjectHealth {
  overall: {
    health: 'green' | 'amber' | 'red'
    score: number
  }
}

interface Project {
  _id: string
  projectNumber: string
  name: string
  description?: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  progress: number
  startDate: string
  endDate: string
  budget?: number
  actualCost?: number
  teamMembers?: string[]
  health?: ProjectHealth
  taskStats?: {
    total: number
    completed: number
    inProgress: number
  }
}

interface PortfolioStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalBudget: number
  actualSpend: number
  healthDistribution: {
    green: number
    amber: number
    red: number
  }
  averageProgress: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [healthFilter, setHealthFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null)

  useEffect(() => {
    fetchProjects()
    fetchPortfolioStats()
  }, [statusFilter])

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/projects?${params}`)
      const data = await response.json()

      if (data.success) {
        // Fetch health metrics for each project
        const projectsWithHealth = await Promise.all(
          data.data.map(async (project: Project) => {
            try {
              const healthRes = await fetch(`/api/projects/${project.projectNumber}/health`)
              const healthData = await healthRes.json()
              return {
                ...project,
                health: healthData.success ? healthData.data : null
              }
            } catch {
              return project
            }
          })
        )
        setProjects(projectsWithHealth)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPortfolioStats = async () => {
    try {
      const response = await fetch('/api/portfolio/stats')
      const data = await response.json()
      if (data.success) {
        setPortfolioStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching portfolio stats:', error)
    }
  }

  const getHealthBadge = (health?: ProjectHealth) => {
    if (!health?.overall) {
      return <Badge variant="outline" className="text-xs">No Data</Badge>
    }

    const { health: status, score } = health.overall
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    }

    const icons = {
      green: CheckCircle2,
      amber: AlertCircle,
      red: AlertCircle
    }

    const Icon = icons[status]

    return (
      <Badge variant="outline" className={cn('text-xs gap-1', colors[status])}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)} ({score})
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; color: string }> = {
      planning: { variant: 'secondary', color: 'text-slate-700' },
      active: { variant: 'default', color: 'text-blue-700' },
      on_hold: { variant: 'outline', color: 'text-amber-700 border-amber-300 bg-amber-50' },
      completed: { variant: 'outline', color: 'text-green-700 border-green-300 bg-green-50' },
      cancelled: { variant: 'destructive', color: 'text-red-700' }
    }

    const config = variants[status] || variants.planning

    return (
      <Badge variant={config.variant} className={cn('text-xs border-2', config.color)}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getPriorityBadge = (priority?: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const priorityValue = priority || 'medium'

    return (
      <Badge variant="outline" className={cn('text-xs', colors[priorityValue as keyof typeof colors] || colors.medium)}>
        {priorityValue.toUpperCase()}
      </Badge>
    )
  }

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesHealth = healthFilter === 'all' ||
      (project.health?.overall?.health === healthFilter)

    return matchesSearch && matchesHealth
  })

  // Calculate quick stats from filtered data
  const stats = {
    total: filteredProjects.length,
    avgProgress: filteredProjects.length > 0
      ? Math.round(filteredProjects.reduce((sum, p) => sum + p.progress, 0) / filteredProjects.length)
      : 0,
    greenHealth: filteredProjects.filter(p => p.health?.overall?.health === 'green').length,
    amberHealth: filteredProjects.filter(p => p.health?.overall?.health === 'amber').length,
    redHealth: filteredProjects.filter(p => p.health?.overall?.health === 'red').length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <FolderKanban className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Project Portfolio</h1>
            <p className="text-muted-foreground text-base mt-1">
              Manage and monitor all projects across your organization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/portfolio">
            <Button variant="outline" size="lg" className="gap-2">
              <Activity className="w-5 h-5" />
              Portfolio Dashboard
            </Button>
          </Link>
          <Link href="/projects/new">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioStats?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolioStats?.activeProjects || 0} active, {portfolioStats?.completedProjects || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Health</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500 text-white text-xs">{stats.greenHealth}</Badge>
              <Badge className="bg-amber-500 text-white text-xs">{stats.amberHealth}</Badge>
              <Badge className="bg-red-500 text-white text-xs">{stats.redHealth}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Green / Amber / Red distribution
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
            <div className="w-full h-2 bg-secondary rounded-full mt-2">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${stats.avgProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((portfolioStats?.totalBudget || 0) / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${((portfolioStats?.actualSpend || 0) / 1000).toFixed(0)}K spent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">All Projects</CardTitle>
              <CardDescription className="text-sm mt-1">
                {filteredProjects.length} of {projects.length} projects
              </CardDescription>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-2"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] border-2">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="w-[180px] border-2">
                <SelectValue placeholder="Health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="amber">Amber</SelectItem>
                <SelectItem value="red">Red</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-accent/30 to-accent/10 hover:bg-gradient-to-r hover:from-accent/40 hover:to-accent/20">
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Health</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Progress</TableHead>
                <TableHead className="font-semibold">Timeline</TableHead>
                <TableHead className="font-semibold">Team</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span>Loading projects...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium mb-2">
                      {projects.length === 0 ? 'No projects found' : 'No matching projects'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {projects.length === 0
                        ? 'Create your first project to get started'
                        : 'Try adjusting your filters'}
                    </p>
                    {projects.length === 0 && (
                      <Link href="/projects/new">
                        <Button variant="outline" className="border-2">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Project
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow
                    key={project._id}
                    className="cursor-pointer hover:bg-accent/30 transition-all border-b-2 border-dashed"
                  >
                    {/* Project Name & Number */}
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <Link
                          href={`/projects/${project.projectNumber}`}
                          className="font-mono text-xs text-muted-foreground hover:underline bg-primary/5 px-2 py-0.5 rounded border inline-block"
                        >
                          {project.projectNumber}
                        </Link>
                        <Link
                          href={`/projects/${project.projectNumber}`}
                          className="font-semibold hover:text-primary transition-colors block"
                        >
                          {project.name}
                        </Link>
                        {project.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Health */}
                    <TableCell>
                      {getHealthBadge(project.health)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {getStatusBadge(project.status)}
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      {getPriorityBadge(project.priority)}
                    </TableCell>

                    {/* Progress */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2.5 bg-secondary rounded-full border">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              project.progress === 100 ? 'bg-green-500' : 'bg-primary'
                            )}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium min-w-[35px]">
                          {project.progress}%
                        </span>
                      </div>
                    </TableCell>

                    {/* Timeline */}
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatRelativeTime(project.endDate)}
                        </div>
                        {project.taskStats && (
                          <div className="text-muted-foreground">
                            {project.taskStats.completed}/{project.taskStats.total} tasks
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Team */}
                    <TableCell>
                      {project.teamMembers && project.teamMembers.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{project.teamMembers.length}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Link href={`/projects/${project.projectNumber}`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
