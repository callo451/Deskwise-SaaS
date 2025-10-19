'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

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

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchProject()
      fetchTasks()
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.projectNumber}</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap">{project.description}</p></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tasks ({tasks.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        {task.dueDate && <p className="text-xs text-muted-foreground">Due: {formatRelativeTime(task.dueDate)}</p>}
                      </div>
                      <Select value={task.status} onValueChange={(value) => updateTaskStatus(task._id, value)}>
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

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{project.progress}%</span>
                  <span className="text-sm text-muted-foreground">Complete</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full">
                  <div className="h-full bg-primary rounded-full" style={{width: `${project.progress}%`}} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Start:</span> <span className="font-medium">{formatRelativeTime(project.startDate)}</span></div>
              <div><span className="text-muted-foreground">End:</span> <span className="font-medium">{formatRelativeTime(project.endDate)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
