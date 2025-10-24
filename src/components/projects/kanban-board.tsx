'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KanbanTask {
  _id: string
  title: string
  description?: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedToName?: string
  assignedTo?: string
  dueDate?: Date
  progress: number
  tags?: string[]
  kanbanColumn: string
  kanbanOrder: number
  swimlane?: string
  milestoneName?: string
  estimatedHours?: number
}

interface KanbanColumn {
  id: string
  title: string
  status: string
  color: string
  wipLimit?: number
  tasks: KanbanTask[]
}

interface KanbanBoardProps {
  projectId: string
  projectName: string
  onTaskClick?: (taskId: string) => void
  onTaskUpdate?: (taskId: string, updates: any) => void
  onTaskCreate?: (columnId: string) => void
}

type SwimlaneBy = 'none' | 'assignee' | 'priority' | 'milestone'

export function KanbanBoard({
  projectId,
  projectName,
  onTaskClick,
  onTaskUpdate,
  onTaskCreate
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [swimlaneBy, setSwimlaneBy] = useState<SwimlaneBy>('none')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null)

  useEffect(() => {
    loadKanbanData()
  }, [projectId, swimlaneBy])

  const loadKanbanData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (swimlaneBy !== 'none') params.set('swimlaneBy', swimlaneBy)

      const response = await fetch(`/api/projects/${projectId}/kanban?${params}`)
      const data = await response.json()

      if (data.success) {
        const columnsData: KanbanColumn[] = data.data.columns.map((col: any) => ({
          ...col,
          tasks: (data.data.tasks[col.id] || []).map((t: any) => ({
            ...t,
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined
          }))
        }))
        setColumns(columnsData)
      }
    } catch (error) {
      console.error('Failed to load Kanban data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter tasks
  const filterTasks = (tasks: KanbanTask[]) => {
    return tasks.filter(task => {
      const matchesSearch = !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      const matchesAssignee = filterAssignee === 'all' || task.assignedTo === filterAssignee
      return matchesSearch && matchesPriority && matchesAssignee
    })
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: KanbanTask) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDraggedOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    setDraggedOverColumn(null)

    if (!draggedTask) return

    const sourceColumn = columns.find(col => col.tasks.some(t => t._id === draggedTask._id))
    const targetColumn = columns.find(col => col.id === targetColumnId)

    if (!sourceColumn || !targetColumn) return

    // Check WIP limit
    if (targetColumn.wipLimit && targetColumn.tasks.length >= targetColumn.wipLimit) {
      alert(`Column "${targetColumn.title}" has reached its WIP limit of ${targetColumn.wipLimit}`)
      setDraggedTask(null)
      return
    }

    // Move task
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${draggedTask._id}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kanbanColumn: targetColumnId,
          status: targetColumn.status,
          kanbanOrder: targetColumn.tasks.length
        })
      })

      if (response.ok) {
        // Update local state
        const updatedColumns = columns.map(col => {
          if (col.id === sourceColumn.id) {
            return {
              ...col,
              tasks: col.tasks.filter(t => t._id !== draggedTask._id)
            }
          }
          if (col.id === targetColumn.id) {
            return {
              ...col,
              tasks: [...col.tasks, { ...draggedTask, kanbanColumn: targetColumnId, status: targetColumn.status }]
            }
          }
          return col
        })
        setColumns(updatedColumns)
        onTaskUpdate?.(draggedTask._id, { status: targetColumn.status })
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }

    setDraggedTask(null)
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertCircle className="h-3 w-3" />
      case 'medium':
        return <Circle className="h-3 w-3" />
      case 'low':
        return <Circle className="h-3 w-3" />
      default:
        return null
    }
  }

  // Check if task is overdue
  const isOverdue = (task: KanbanTask) => {
    if (!task.dueDate) return false
    return new Date(task.dueDate) < new Date() && task.status !== 'completed'
  }

  // Get unique assignees for filter
  const allTasks = columns.flatMap(col => col.tasks)
  const assignees = Array.from(new Set(allTasks.map(t => t.assignedToName).filter(Boolean)))

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading Kanban board...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Right: Filters and Swimlanes */}
          <div className="flex items-center gap-2">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={swimlaneBy} onValueChange={(val) => setSwimlaneBy(val as SwimlaneBy)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Swimlanes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Swimlanes</SelectItem>
                <SelectItem value="assignee">By Assignee</SelectItem>
                <SelectItem value="priority">By Priority</SelectItem>
                <SelectItem value="milestone">By Milestone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const filteredTasks = filterTasks(column.tasks)
          const isOverLimit = column.wipLimit && filteredTasks.length > column.wipLimit
          const isDraggedOver = draggedOverColumn === column.id

          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <Card
                className={cn(
                  'transition-all',
                  isDraggedOver && 'ring-2 ring-primary'
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <CardHeader className={cn('pb-3', `border-l-4 border-${column.color}`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{column.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {filteredTasks.length}
                      </Badge>
                      {column.wipLimit && (
                        <Badge
                          variant={isOverLimit ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          Max: {column.wipLimit}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onTaskCreate?.(column.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Column Content */}
                <CardContent className="pt-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <p>No tasks</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <Card
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        className={cn(
                          'p-3 cursor-move hover:shadow-md transition-all group',
                          draggedTask?._id === task._id && 'opacity-50',
                          isOverdue(task) && 'border-l-4 border-l-red-500'
                        )}
                        onClick={() => onTaskClick?.(task._id)}
                      >
                        {/* Task Title */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm leading-tight flex-1">
                            {task.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Task Description */}
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}

                        {/* Task Meta */}
                        <div className="space-y-2">
                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs h-5">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Priority and Assignee */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn('text-xs h-6', getPriorityColor(task.priority))}
                            >
                              {getPriorityIcon(task.priority)}
                              <span className="ml-1 capitalize">{task.priority}</span>
                            </Badge>

                            {task.assignedToName && (
                              <Badge variant="outline" className="text-xs h-6">
                                <User className="h-3 w-3 mr-1" />
                                {task.assignedToName}
                              </Badge>
                            )}

                            {task.milestoneName && (
                              <Badge variant="outline" className="text-xs h-6">
                                {task.milestoneName}
                              </Badge>
                            )}
                          </div>

                          {/* Due Date and Progress */}
                          <div className="flex items-center justify-between text-xs">
                            {task.dueDate && (
                              <div
                                className={cn(
                                  'flex items-center gap-1',
                                  isOverdue(task) ? 'text-red-600 font-medium' : 'text-muted-foreground'
                                )}
                              >
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                                {isOverdue(task) && ' (Overdue)'}
                              </div>
                            )}

                            {task.estimatedHours && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {task.estimatedHours}h
                              </div>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {task.progress > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{task.progress}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-muted-foreground">Total Tasks:</span>{' '}
              <span className="font-medium">{allTasks.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Filtered:</span>{' '}
              <span className="font-medium">
                {columns.reduce((sum, col) => sum + filterTasks(col.tasks).length, 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Overdue:</span>{' '}
              <span className="font-medium text-red-600">
                {allTasks.filter(isOverdue).length}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Drag tasks between columns to update status
          </div>
        </div>
      </Card>
    </div>
  )
}
