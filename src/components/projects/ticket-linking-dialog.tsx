'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link2, X, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Ticket {
  _id: string
  ticketNumber: string
  title: string
  status: string
  priority: string
  assignedTo?: string
  projectId?: string
  projectName?: string
  projectTaskId?: string
  projectTaskName?: string
}

interface Project {
  _id: string
  name: string
  status: string
}

interface ProjectTask {
  _id: string
  title: string
  status: string
}

interface TicketLinkingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tickets?: Ticket[]
  projects?: Project[]
  mode: 'single' | 'bulk'
  onLink: (ticketIds: string[], projectId: string, taskId?: string) => Promise<void>
  isLoading?: boolean
}

export function TicketLinkingDialog({
  open,
  onOpenChange,
  tickets = [],
  projects = [],
  mode = 'single',
  onLink,
  isLoading = false
}: TicketLinkingDialogProps) {
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loadingTasks, setLoadingTasks] = useState(false)

  // Load tasks when project is selected
  useEffect(() => {
    if (selectedProject) {
      setLoadingTasks(true)
      fetch(`/api/projects/${selectedProject}/tasks`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTasks(data.data)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingTasks(false))
    } else {
      setTasks([])
      setSelectedTask('')
    }
  }, [selectedProject])

  const handleToggleTicket = (ticketId: string) => {
    const newSelected = new Set(selectedTickets)
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId)
    } else {
      newSelected.add(ticketId)
    }
    setSelectedTickets(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTickets.size === filteredTickets.length) {
      setSelectedTickets(new Set())
    } else {
      setSelectedTickets(new Set(filteredTickets.map(t => t._id)))
    }
  }

  const handleLink = async () => {
    const ticketIds = mode === 'single' ? Array.from(selectedTickets).slice(0, 1) : Array.from(selectedTickets)
    if (ticketIds.length === 0 || !selectedProject) return

    await onLink(ticketIds, selectedProject, selectedTask || undefined)

    // Reset state
    setSelectedTickets(new Set())
    setSelectedProject('')
    setSelectedTask('')
    onOpenChange(false)
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
    const notLinked = !ticket.projectId // Only show unlinked tickets
    return matchesSearch && matchesStatus && notLinked
  })

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
      case 'open':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {mode === 'bulk' ? 'Link Multiple Tickets to Project' : 'Link Ticket to Project'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Select Project *</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project._id} value={project._id}>
                    <div className="flex items-center gap-2">
                      <span>{project.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Selection (Optional) */}
          {selectedProject && (
            <div className="space-y-2">
              <Label htmlFor="task">Select Task (Optional)</Label>
              <Select
                value={selectedTask}
                onValueChange={setSelectedTask}
                disabled={loadingTasks}
              >
                <SelectTrigger id="task">
                  <SelectValue placeholder={loadingTasks ? 'Loading tasks...' : 'Choose a task (optional)...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific task</SelectItem>
                  {tasks.map(task => (
                    <SelectItem key={task._id} value={task._id}>
                      <div className="flex items-center gap-2">
                        <span>{task.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {task.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Ticket Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Tickets</Label>
              {mode === 'bulk' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedTickets.size === filteredTickets.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ticket List */}
            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No unlinked tickets found</p>
                  <p className="text-sm mt-1">All tickets are already linked to projects</p>
                </div>
              ) : (
                filteredTickets.map(ticket => (
                  <div
                    key={ticket._id}
                    className={cn(
                      'p-3 flex items-start gap-3 hover:bg-muted/50 cursor-pointer transition-colors',
                      selectedTickets.has(ticket._id) && 'bg-muted/50'
                    )}
                    onClick={() => mode === 'bulk' && handleToggleTicket(ticket._id)}
                  >
                    {mode === 'bulk' && (
                      <Checkbox
                        checked={selectedTickets.has(ticket._id)}
                        onCheckedChange={() => handleToggleTicket(ticket._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {mode === 'single' && (
                      <input
                        type="radio"
                        checked={selectedTickets.has(ticket._id)}
                        onChange={() => {
                          setSelectedTickets(new Set([ticket._id]))
                        }}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium">
                          {ticket.ticketNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getStatusColor(ticket.status))}
                        >
                          {ticket.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getPriorityColor(ticket.priority))}
                        >
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground line-clamp-1">
                        {ticket.title}
                      </p>
                      {ticket.assignedTo && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned to: {ticket.assignedTo}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selected Count */}
            {selectedTickets.size > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedTickets.size} ticket{selectedTickets.size !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={selectedTickets.size === 0 || !selectedProject || isLoading}
          >
            {isLoading ? 'Linking...' : `Link ${selectedTickets.size} Ticket${selectedTickets.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
