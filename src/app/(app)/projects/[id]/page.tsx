'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  Plus,
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  Clock,
  Link2,
  Settings,
  Users,
  Calendar,
  Columns
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { ProjectHealthCard } from '@/components/projects/project-health-card'
import { ProjectAnalyticsDashboard } from '@/components/projects/project-analytics-dashboard'
import { MilestoneManagement } from '@/components/projects/milestone-management'
import { TimeTrackingWidget } from '@/components/time/time-tracking-widget'
import { TicketLinkingDialog } from '@/components/projects/ticket-linking-dialog'
import { GanttChart } from '@/components/projects/gantt-chart'
import { KanbanBoard } from '@/components/projects/kanban-board'
import { cn } from '@/lib/utils'

interface Project {
  _id: string
  projectNumber: string
  name: string
  description: string
  status: string
  progress: number
  startDate: string
  endDate: string
}

interface Task {
  _id: string
  title: string
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  assignedTo?: string
  dueDate?: string
}

type TabType = 'overview' | 'tasks' | 'gantt' | 'kanban' | 'analytics' | 'time' | 'tickets'

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showLinkTicketsDialog, setShowLinkTicketsDialog] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [availableProjects, setAvailableProjects] = useState<any[]>([])
  const [healthMetrics, setHealthMetrics] = useState<any>(null)

  useEffect(() => {
    if (params.id) {
      fetchProject()
      fetchTasks()
      fetchTickets()
      fetchHealthMetrics()
    }
  }, [params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setProject(data.data)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/tasks`)
      const data = await response.json()
      if (data.success) {
        setTasks(data.data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/tickets`)
      const data = await response.json()
      if (data.success) {
        setTickets(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    }
  }

  const fetchHealthMetrics = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/health`)
      const data = await response.json()
      if (data.success) {
        setHealthMetrics(data.data)
      }
    } catch (error) {
      console.error('Error fetching health metrics:', error)
    }
  }

  const handleLinkTickets = async (ticketIds: string[], projectId: string, taskId?: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/link-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds, taskId })
      })
      const data = await response.json()
      if (data.success) {
        fetchTickets()
      }
    } catch (error) {
      console.error('Error linking tickets:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await response.json()
      if (data.success) {
        fetchTasks()
        fetchProject() // Refresh progress
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      todo: 'secondary',
      in_progress: 'default',
      review: 'warning',
      completed: 'success',
    }
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><p className="text-muted-foreground">Loading project...</p></div>
  }

  if (!project) {
    return <div className="text-center py-12"><h2 className="text-2xl font-bold mb-2">Project Not Found</h2><Link href="/projects"><Button>Back to Projects</Button></Link></div>
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'tasks' as TabType, label: 'Tasks & Milestones', icon: CheckSquare },
    { id: 'gantt' as TabType, label: 'Gantt Chart', icon: Calendar },
    { id: 'kanban' as TabType, label: 'Kanban Board', icon: Columns },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'time' as TabType, label: 'Time Tracking', icon: Clock },
    { id: 'tickets' as TabType, label: 'Linked Tickets', icon: Link2, badge: tickets.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.projectNumber}</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {project.status}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tab.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pb-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Health Card */}
              {healthMetrics && (
                <ProjectHealthCard
                  metrics={healthMetrics}
                  projectName={project.name}
                  onRefresh={fetchHealthMetrics}
                />
              )}

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{project.description}</p>
                </CardContent>
              </Card>

              {/* Quick Tasks View */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Tasks ({tasks.length})</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('tasks')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No tasks yet
                      </p>
                    ) : (
                      tasks.slice(0, 5).map((task) => (
                        <div
                          key={task._id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{task.title}</p>
                            {task.dueDate && (
                              <p className="text-xs text-muted-foreground">
                                Due: {formatRelativeTime(task.dueDate)}
                              </p>
                            )}
                          </div>
                          <Select
                            value={task.status}
                            onValueChange={(value) => updateTaskStatus(task._id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{project.progress}%</span>
                      <span className="text-sm text-muted-foreground">Complete</span>
                    </div>
                    <div className="w-full h-3 bg-secondary rounded-full">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start:</span>{' '}
                    <span className="font-medium">
                      {formatRelativeTime(project.startDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End:</span>{' '}
                    <span className="font-medium">
                      {formatRelativeTime(project.endDate)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab('tasks')}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Manage Tasks
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab('time')}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Track Time
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowLinkTicketsDialog(true)}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Link Tickets
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tasks & Milestones Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <MilestoneManagement
              projectId={params.id as string}
              projectName={project.name}
              onMilestoneUpdate={() => {
                fetchProject()
                fetchHealthMetrics()
              }}
            />

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tasks ({tasks.length})</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks yet
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Due: {formatRelativeTime(task.dueDate)}
                            </p>
                          )}
                        </div>
                        <Select
                          value={task.status}
                          onValueChange={(value) => updateTaskStatus(task._id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gantt Chart Tab */}
        {activeTab === 'gantt' && (
          <GanttChart
            projectId={params.id as string}
            projectName={project.name}
            projectStart={project.startDate ? new Date(project.startDate) : undefined}
            projectEnd={project.endDate ? new Date(project.endDate) : undefined}
            onTaskClick={(taskId) => {
              // Navigate to task or open task modal
              console.log('Task clicked:', taskId)
            }}
            onTaskUpdate={(taskId, updates) => {
              fetchTasks()
              fetchProject()
            }}
          />
        )}

        {/* Kanban Board Tab */}
        {activeTab === 'kanban' && (
          <KanbanBoard
            projectId={params.id as string}
            projectName={project.name}
            onTaskClick={(taskId) => {
              // Navigate to task or open task modal
              console.log('Task clicked:', taskId)
            }}
            onTaskUpdate={(taskId, updates) => {
              fetchTasks()
              fetchProject()
            }}
            onTaskCreate={(columnId) => {
              // Open task creation modal with pre-filled column
              console.log('Create task in column:', columnId)
            }}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <ProjectAnalyticsDashboard
            projectId={params.id as string}
            projectName={project.name}
          />
        )}

        {/* Time Tracking Tab */}
        {activeTab === 'time' && (
          <div className="max-w-2xl mx-auto">
            <TimeTrackingWidget
              type="project"
              resourceId={params.id as string}
              resourceName={project.name}
              onTimeLogged={() => {
                fetchHealthMetrics()
                fetchProject()
              }}
            />
          </div>
        )}

        {/* Linked Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Linked Tickets</h3>
                <p className="text-sm text-muted-foreground">
                  Tickets associated with this project
                </p>
              </div>
              <Button onClick={() => setShowLinkTicketsDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Link Tickets
              </Button>
            </div>

            {tickets.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Linked Tickets</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Link tickets to track work related to this project
                  </p>
                  <Button onClick={() => setShowLinkTicketsDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Link Tickets
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tickets.map((ticket) => (
                  <Card key={ticket._id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm font-medium">
                            {ticket.ticketNumber}
                          </span>
                          <Badge variant="outline">{ticket.status}</Badge>
                          <Badge variant="outline">{ticket.priority}</Badge>
                        </div>
                        <h4 className="font-semibold mb-1">{ticket.title}</h4>
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>
                        )}
                      </div>
                      <Link href={`/unified-tickets/${ticket._id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Link Tickets Dialog */}
      <TicketLinkingDialog
        open={showLinkTicketsDialog}
        onOpenChange={setShowLinkTicketsDialog}
        tickets={[]} // Would need to fetch unlinked tickets
        projects={availableProjects}
        mode="bulk"
        onLink={handleLinkTickets}
      />
    </div>
  )
}
