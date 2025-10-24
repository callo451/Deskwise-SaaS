'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ZoomIn,
  ZoomOut,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Filter,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GanttTask {
  _id: string
  title: string
  startDate: Date
  dueDate: Date
  progress: number
  status: string
  priority: string
  assignedToName?: string
  dependencies?: string[]
  isCritical?: boolean
  milestoneId?: string
  milestoneName?: string
}

interface GanttChartProps {
  projectId: string
  projectName: string
  projectStart?: Date
  projectEnd?: Date
  onTaskClick?: (taskId: string) => void
  onTaskUpdate?: (taskId: string, updates: any) => void
}

type ZoomLevel = 'day' | 'week' | 'month'

export function GanttChart({
  projectId,
  projectName,
  projectStart,
  projectEnd,
  onTaskClick,
  onTaskUpdate
}: GanttChartProps) {
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week')

  // Default to current date if projectStart not provided
  const defaultStart = projectStart || new Date()
  // Default to 3 months from start if projectEnd not provided
  const defaultEnd = projectEnd || new Date(defaultStart.getTime() + 90 * 24 * 60 * 60 * 1000)

  const [viewStart, setViewStart] = useState<Date>(defaultStart)
  const [viewEnd, setViewEnd] = useState<Date>(defaultEnd)
  const [showCriticalPath, setShowCriticalPath] = useState(true)
  const [filterMilestone, setFilterMilestone] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/gantt`)
      const data = await response.json()
      if (data.success) {
        setTasks(data.data.tasks.map((t: any) => ({
          ...t,
          startDate: new Date(t.startDate),
          dueDate: new Date(t.dueDate)
        })))
      }
    } catch (error) {
      console.error('Failed to load Gantt data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate timeline grid
  const getTimelineColumns = () => {
    const columns: Date[] = []
    const current = new Date(viewStart)

    while (current <= viewEnd) {
      columns.push(new Date(current))

      switch (zoomLevel) {
        case 'day':
          current.setDate(current.getDate() + 1)
          break
        case 'week':
          current.setDate(current.getDate() + 7)
          break
        case 'month':
          current.setMonth(current.getMonth() + 1)
          break
      }
    }

    return columns
  }

  const timelineColumns = getTimelineColumns()
  const totalDays = Math.ceil((viewEnd.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24))

  // Calculate task position and width
  const getTaskPosition = (task: GanttTask) => {
    const taskStart = Math.max(task.startDate.getTime(), viewStart.getTime())
    const taskEnd = Math.min(task.dueDate.getTime(), viewEnd.getTime())

    const startOffset = (taskStart - viewStart.getTime()) / (1000 * 60 * 60 * 24)
    const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24)

    const leftPercent = (startOffset / totalDays) * 100
    const widthPercent = (duration / totalDays) * 100

    return { left: leftPercent, width: Math.max(widthPercent, 1) }
  }

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterMilestone !== 'all' && task.milestoneId !== filterMilestone) return false
    if (filterAssignee !== 'all' && task.assignedToName !== filterAssignee) return false
    if (!showCriticalPath && task.isCritical) return true
    return true
  })

  // Group tasks by milestone
  const tasksByMilestone = filteredTasks.reduce((acc, task) => {
    const key = task.milestoneName || 'No Milestone'
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {} as Record<string, GanttTask[]>)

  // Get unique milestones and assignees for filters
  const milestones = Array.from(new Set(tasks.map(t => t.milestoneName).filter(Boolean)))
  const assignees = Array.from(new Set(tasks.map(t => t.assignedToName).filter(Boolean)))

  // Zoom controls
  const handleZoomIn = () => {
    if (zoomLevel === 'month') setZoomLevel('week')
    else if (zoomLevel === 'week') setZoomLevel('day')
  }

  const handleZoomOut = () => {
    if (zoomLevel === 'day') setZoomLevel('week')
    else if (zoomLevel === 'week') setZoomLevel('month')
  }

  // Navigation
  const handlePrevPeriod = () => {
    const range = viewEnd.getTime() - viewStart.getTime()
    setViewStart(new Date(viewStart.getTime() - range))
    setViewEnd(new Date(viewEnd.getTime() - range))
  }

  const handleNextPeriod = () => {
    const range = viewEnd.getTime() - viewStart.getTime()
    setViewStart(new Date(viewStart.getTime() + range))
    setViewEnd(new Date(viewEnd.getTime() + range))
  }

  const handleResetView = () => {
    setViewStart(projectStart)
    setViewEnd(projectEnd)
  }

  // Format date for column headers
  const formatColumnHeader = (date: Date) => {
    switch (zoomLevel) {
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
      case 'week':
        return `Week ${Math.ceil((date.getTime() - projectStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'review':
        return 'bg-purple-500'
      case 'todo':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'border-red-500'
      case 'high':
        return 'border-orange-500'
      case 'medium':
        return 'border-blue-500'
      case 'low':
        return 'border-gray-400'
      default:
        return 'border-gray-400'
    }
  }

  const columnWidth = zoomLevel === 'day' ? 60 : zoomLevel === 'week' ? 100 : 120

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading Gantt chart...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetView}>
              <Calendar className="h-4 w-4 mr-2" />
              Reset View
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Center: Zoom */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel === 'month'}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="px-3">
              {zoomLevel === 'day' ? 'Daily' : zoomLevel === 'week' ? 'Weekly' : 'Monthly'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel === 'day'}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Filters */}
          <div className="flex items-center gap-2">
            <Button
              variant={showCriticalPath ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCriticalPath(!showCriticalPath)}
            >
              Critical Path
            </Button>
            <Select value={filterMilestone} onValueChange={setFilterMilestone}>
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Milestones</SelectItem>
                {milestones.map(m => (
                  <SelectItem key={m} value={m || 'none'}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Gantt Chart */}
      <Card className="overflow-hidden">
        <div className="flex border-b bg-muted/50">
          {/* Task list header */}
          <div className="w-80 border-r p-3 font-semibold text-sm bg-background">
            Tasks ({filteredTasks.length})
          </div>

          {/* Timeline header */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto"
            style={{ scrollbarGutter: 'stable' }}
          >
            <div
              className="flex border-l"
              style={{ minWidth: `${timelineColumns.length * columnWidth}px` }}
            >
              {timelineColumns.map((date, idx) => (
                <div
                  key={idx}
                  className="border-r p-2 text-xs font-medium text-center bg-background"
                  style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
                >
                  {formatColumnHeader(date)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt rows */}
        <div className="max-h-[600px] overflow-y-auto">
          {Object.entries(tasksByMilestone).map(([milestone, milestoneTasks]) => (
            <div key={milestone}>
              {/* Milestone header */}
              <div className="flex bg-muted/30 border-b">
                <div className="w-80 border-r p-2">
                  <Badge variant="outline" className="text-xs">
                    {milestone}
                  </Badge>
                </div>
                <div className="flex-1" />
              </div>

              {/* Tasks */}
              {milestoneTasks.map((task) => {
                const position = getTaskPosition(task)

                return (
                  <div
                    key={task._id}
                    className="flex border-b hover:bg-muted/50 transition-colors group"
                  >
                    {/* Task info */}
                    <div className="w-80 border-r p-2 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onTaskClick?.(task._id)}
                            className="text-sm font-medium hover:text-primary truncate text-left"
                          >
                            {task.title}
                          </button>
                          {task.isCritical && showCriticalPath && (
                            <Badge variant="destructive" className="text-xs h-5">
                              Critical
                            </Badge>
                          )}
                        </div>
                        {task.assignedToName && (
                          <p className="text-xs text-muted-foreground truncate">
                            {task.assignedToName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div
                      className="flex-1 relative"
                      style={{ minWidth: `${timelineColumns.length * columnWidth}px` }}
                    >
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {timelineColumns.map((_, idx) => (
                          <div
                            key={idx}
                            className="border-r border-muted"
                            style={{ width: `${columnWidth}px` }}
                          />
                        ))}
                      </div>

                      {/* Today indicator */}
                      {(() => {
                        const today = new Date()
                        if (today >= viewStart && today <= viewEnd) {
                          const todayOffset = (today.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24)
                          const todayPercent = (todayOffset / totalDays) * 100
                          return (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                              style={{ left: `${todayPercent}%` }}
                            >
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs text-red-600 font-medium">
                                Today
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}

                      {/* Task bar */}
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 h-8 rounded cursor-pointer border-2 transition-all group-hover:shadow-md',
                          task.isCritical && showCriticalPath ? 'border-red-500' : getPriorityColor(task.priority),
                          'overflow-hidden'
                        )}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`,
                          minWidth: '20px'
                        }}
                        onClick={() => onTaskClick?.(task._id)}
                      >
                        {/* Progress bar */}
                        <div
                          className={cn(
                            'h-full transition-all',
                            getStatusColor(task.status)
                          )}
                          style={{ width: `${task.progress}%` }}
                        />

                        {/* Task label */}
                        {position.width > 5 && (
                          <div className="absolute inset-0 flex items-center px-2">
                            <span className="text-xs font-medium text-white truncate drop-shadow">
                              {task.title}
                            </span>
                          </div>
                        )}

                        {/* Progress percentage */}
                        {position.width > 10 && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <span className="text-xs font-bold text-white drop-shadow">
                              {task.progress}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Dependencies (connections to predecessor tasks) */}
                      {task.dependencies?.map((depId) => {
                        const depTask = tasks.find(t => t._id === depId)
                        if (!depTask) return null

                        const depPosition = getTaskPosition(depTask)
                        const taskPosition = position

                        // Simple arrow from end of dependency to start of task
                        return (
                          <svg
                            key={depId}
                            className="absolute inset-0 pointer-events-none z-20"
                            style={{ width: '100%', height: '100%' }}
                          >
                            <defs>
                              <marker
                                id={`arrowhead-${task._id}`}
                                markerWidth="10"
                                markerHeight="10"
                                refX="9"
                                refY="3"
                                orient="auto"
                              >
                                <polygon
                                  points="0 0, 10 3, 0 6"
                                  fill={task.isCritical ? '#ef4444' : '#94a3b8'}
                                />
                              </marker>
                            </defs>
                            <line
                              x1={`${depPosition.left + depPosition.width}%`}
                              y1="50%"
                              x2={`${taskPosition.left}%`}
                              y2="50%"
                              stroke={task.isCritical ? '#ef4444' : '#94a3b8'}
                              strokeWidth="2"
                              markerEnd={`url(#arrowhead-${task._id})`}
                            />
                          </svg>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks to display</p>
            </div>
          )}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-6 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded" />
              <span className="text-xs">Todo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-xs">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded" />
              <span className="text-xs">Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-xs">Completed</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Priority:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-red-500 rounded" />
              <span className="text-xs">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-orange-500 rounded" />
              <span className="text-xs">High</span>
            </div>
          </div>
          {showCriticalPath && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-red-500" />
              <span className="text-xs">Critical Path</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
