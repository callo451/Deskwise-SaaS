'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  CheckCircle2,
  FolderKanban,
  Calendar,
  Users,
  DollarSign,
  Target,
  Tag,
  Building2,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  _id: string
  name: string
  email: string
}

interface Client {
  _id: string
  name: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<string>('')
  const [createdProjectNumber, setCreatedProjectNumber] = useState<string>('')
  const [nextProjectNumber, setNextProjectNumber] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectNumber: '',
    status: 'planning',
    priority: 'medium',
    startDate: '',
    endDate: '',
    budget: '',
    clientId: '',
    teamMembers: [] as string[],
    tags: '',
  })

  useEffect(() => {
    fetchUsers()
    fetchClients()
    fetchNextProjectNumber()
  }, [])

  const fetchNextProjectNumber = async () => {
    try {
      const response = await fetch('/api/projects/next-number')
      const data = await response.json()
      if (data.success) {
        setNextProjectNumber(data.projectNumber)
        setFormData(prev => ({ ...prev, projectNumber: data.projectNumber }))
      }
    } catch (error) {
      console.error('Error fetching next project number:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      if (data.success) {
        setClients(data.data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleTeamMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(userId)
        ? prev.teamMembers.filter(id => id !== userId)
        : [...prev.teamMembers, userId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          projectNumber: formData.projectNumber || undefined,
          status: formData.status,
          priority: formData.priority,
          startDate: formData.startDate,
          endDate: formData.endDate,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          clientId: formData.clientId || undefined,
          teamMembers: formData.teamMembers,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCreatedProjectId(data.data._id)
        setCreatedProjectNumber(data.data.projectNumber)
        setShowSuccessDialog(true)
      } else {
        alert(data.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const handleViewProject = () => {
    router.push(`/projects/${createdProjectNumber}`)
  }

  const handleAddTasks = () => {
    router.push(`/projects/${createdProjectNumber}?tab=tasks`)
  }

  const handleCreateAnother = () => {
    setShowSuccessDialog(false)
    setCreatedProjectId('')
    setCreatedProjectNumber('')
    fetchNextProjectNumber() // Get next available number
    setFormData({
      name: '',
      description: '',
      projectNumber: nextProjectNumber,
      status: 'planning',
      priority: 'medium',
      startDate: '',
      endDate: '',
      budget: '',
      clientId: '',
      teamMembers: [],
      tags: '',
    })
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      planning: { label: 'Planning', color: 'bg-slate-100 text-slate-700 border-slate-300' },
      active: { label: 'Active', color: 'bg-blue-100 text-blue-700 border-blue-300' },
      on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-700 border-amber-300' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-300' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-300' }
    }
    return configs[status] || configs.planning
  }

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      low: { label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-300' },
      high: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300' },
      critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-300' }
    }
    return configs[priority] || configs.medium
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <FolderKanban className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
            <p className="text-muted-foreground">
              Set up a new project with team members, milestones, and budget tracking
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Essential details about your project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Website Redesign Q1 2025"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="border-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the project objectives, deliverables, and success criteria..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                rows={6}
                className="border-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectNumber">
                Project Number
              </Label>
              <Input
                id="projectNumber"
                placeholder="PRJ-0001"
                value={formData.projectNumber}
                onChange={(e) => handleChange('projectNumber', e.target.value.toUpperCase())}
                pattern="PRJ-\d{4}"
                title="Must be in format PRJ-XXXX (e.g., PRJ-0001)"
                className="border-2"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-generate. Format: PRJ-XXXX (e.g., PRJ-0001)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusConfig('planning').color}>
                          Planning
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusConfig('active').color}>
                          Active
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="on_hold">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusConfig('on_hold').color}>
                          On Hold
                        </Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <Badge variant="outline" className={getPriorityConfig('low').color}>
                        Low
                      </Badge>
                    </SelectItem>
                    <SelectItem value="medium">
                      <Badge variant="outline" className={getPriorityConfig('medium').color}>
                        Medium
                      </Badge>
                    </SelectItem>
                    <SelectItem value="high">
                      <Badge variant="outline" className={getPriorityConfig('high').color}>
                        High
                      </Badge>
                    </SelectItem>
                    <SelectItem value="critical">
                      <Badge variant="outline" className={getPriorityConfig('critical').color}>
                        Critical
                      </Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">
                Tags <span className="text-muted-foreground text-xs">(comma-separated)</span>
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tags"
                  placeholder="internal, client-facing, urgent"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  className="pl-9 border-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Budget */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Timeline & Budget
            </CardTitle>
            <CardDescription>
              Set project timeline and budget constraints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  required
                  className="border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  Target End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  required
                  className="border-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">
                Budget <span className="text-muted-foreground text-xs">(USD)</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget"
                  type="number"
                  placeholder="0.00"
                  value={formData.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                  step="0.01"
                  min="0"
                  className="pl-9 border-2"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Set the total budget for this project. Leave blank if not applicable.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team & Client */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team & Client Assignment
            </CardTitle>
            <CardDescription>
              Assign team members and associate with a client (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select value={formData.clientId || 'none'} onValueChange={(value) => handleChange('clientId', value === 'none' ? '' : value)}>
                  <SelectTrigger className="border-2 pl-9">
                    <SelectValue placeholder="Select a client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Team Members</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-4 border-2 rounded-lg bg-accent/5">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-2">No users available</p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => toggleTeamMember(user._id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                        formData.teamMembers.includes(user._id)
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background hover:bg-accent border-border'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                          formData.teamMembers.includes(user._id)
                            ? 'bg-primary border-primary'
                            : 'bg-background border-muted-foreground'
                        )}
                      >
                        {formData.teamMembers.includes(user._id) && (
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.teamMembers.length} team member{formData.teamMembers.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 sticky bottom-0 bg-background py-4 border-t-2">
          <Button type="submit" size="lg" disabled={loading} className="gap-2">
            {loading ? (
              <>Creating Project...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
          <Link href="/projects">
            <Button type="button" variant="outline" size="lg" disabled={loading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Project Created Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Your project has been created. What would you like to do next?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleViewProject} className="w-full">
              View Project Overview
            </Button>
            <Button onClick={handleAddTasks} variant="outline" className="w-full">
              Add Tasks & Milestones
            </Button>
            <Button onClick={handleCreateAnother} variant="ghost" className="w-full">
              Create Another Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
