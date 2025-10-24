'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Flag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  Target,
  Link2,
  ChevronRight,
  ChevronDown,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Milestone {
  _id: string
  projectId: string
  name: string
  description?: string
  targetDate: Date
  completedDate?: Date
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  progress: number // 0-100
  order: number
  dependencies?: string[] // milestone IDs
  deliverables?: Array<{
    id: string
    name: string
    completed: boolean
  }>
  isKeyMilestone: boolean
  assignedTo?: string
  assignedToName?: string
  createdAt: Date
  updatedAt: Date
}

interface MilestoneManagementProps {
  projectId: string
  projectName: string
  onMilestoneUpdate?: () => void
}

export function MilestoneManagement({
  projectId,
  projectName,
  onMilestoneUpdate
}: MilestoneManagementProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetDate: '',
    isKeyMilestone: false,
    assignedTo: '',
    dependencies: [] as string[]
  })

  useEffect(() => {
    loadMilestones()
  }, [projectId])

  const loadMilestones = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones`)
      const data = await response.json()
      if (data.success) {
        setMilestones(data.data)
      }
    } catch (error) {
      console.error('Failed to load milestones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.targetDate) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          order: milestones.length + 1
        })
      })

      const data = await response.json()
      if (data.success) {
        await loadMilestones()
        setShowCreateDialog(false)
        resetForm()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Failed to create milestone:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (milestoneId: string, updates: Partial<Milestone>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()
      if (data.success) {
        await loadMilestones()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Failed to update milestone:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (milestoneId: string) => {
    if (!confirm('Delete this milestone? This action cannot be undone.')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadMilestones()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Failed to delete milestone:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkComplete = async (milestone: Milestone) => {
    await handleUpdate(milestone._id, {
      status: milestone.status === 'completed' ? 'in_progress' : 'completed',
      completedDate: milestone.status === 'completed' ? undefined : new Date(),
      progress: milestone.status === 'completed' ? milestone.progress : 100
    })
  }

  const toggleExpand = (milestoneId: string) => {
    const newExpanded = new Set(expandedMilestones)
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId)
    } else {
      newExpanded.add(milestoneId)
    }
    setExpandedMilestones(newExpanded)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      targetDate: '',
      isKeyMilestone: false,
      assignedTo: '',
      dependencies: []
    })
    setEditingMilestone(null)
  }

  const openEditDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setFormData({
      name: milestone.name,
      description: milestone.description || '',
      targetDate: new Date(milestone.targetDate).toISOString().split('T')[0],
      isKeyMilestone: milestone.isKeyMilestone,
      assignedTo: milestone.assignedTo || '',
      dependencies: milestone.dependencies || []
    })
    setShowCreateDialog(true)
  }

  const handleSave = async () => {
    if (editingMilestone) {
      await handleUpdate(editingMilestone._id, formData)
      setShowCreateDialog(false)
      resetForm()
    } else {
      await handleCreate()
    }
  }

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'not_started':
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />
      case 'not_started':
        return <Circle className="h-4 w-4" />
    }
  }

  const getDaysUntil = (date: Date) => {
    const now = new Date()
    const target = new Date(date)
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const completedMilestones = milestones.filter(m => m.status === 'completed').length
  const totalMilestones = milestones.length
  const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Milestones</h3>
          <p className="text-sm text-muted-foreground">{projectName}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Summary Stats */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Overall Progress</span>
            </div>
            <Badge variant="outline">
              {completedMilestones} / {totalMilestones} completed
            </Badge>
          </div>
          <Progress value={completionRate} className="h-3" />
          <div className="grid grid-cols-4 gap-4 pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {milestones.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {milestones.filter(m => m.status === 'in_progress').length}
              </div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {milestones.filter(m => m.status === 'overdue').length}
              </div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {milestones.filter(m => m.isKeyMilestone).length}
              </div>
              <div className="text-xs text-muted-foreground">Key Milestones</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Milestones List */}
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Milestones Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first milestone to track project progress
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>
          </Card>
        ) : (
          milestones.map((milestone, index) => {
            const isExpanded = expandedMilestones.has(milestone._id)
            const daysUntil = getDaysUntil(milestone.targetDate)
            const hasDependencies = milestone.dependencies && milestone.dependencies.length > 0
            const hasDeliverables = milestone.deliverables && milestone.deliverables.length > 0

            return (
              <Card key={milestone._id} className={cn(
                'overflow-hidden transition-all',
                milestone.isKeyMilestone && 'border-2 border-blue-200'
              )}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Expand/Collapse */}
                    {(hasDependencies || hasDeliverables) && (
                      <button
                        onClick={() => toggleExpand(milestone._id)}
                        className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleMarkComplete(milestone)}
                      className="mt-1"
                      disabled={isLoading}
                    >
                      {milestone.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-blue-600 transition-colors" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={cn(
                            'font-semibold',
                            milestone.status === 'completed' && 'line-through text-muted-foreground'
                          )}>
                            {milestone.name}
                          </h4>
                          {milestone.isKeyMilestone && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <Flag className="h-3 w-3 mr-1" />
                              Key
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn('text-xs', getStatusColor(milestone.status))}
                          >
                            {getStatusIcon(milestone.status)}
                            <span className="ml-1 capitalize">{milestone.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDialog(milestone)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(milestone._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Description */}
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {milestone.description}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(milestone.targetDate).toLocaleDateString()}
                          </span>
                          {milestone.status !== 'completed' && (
                            <span className={cn(
                              'ml-1',
                              daysUntil < 0 && 'text-red-600 font-medium',
                              daysUntil >= 0 && daysUntil <= 7 && 'text-orange-600 font-medium'
                            )}>
                              ({daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`})
                            </span>
                          )}
                        </div>
                        {milestone.assignedToName && (
                          <div className="flex items-center gap-1">
                            <span>Assigned to:</span>
                            <span className="font-medium">{milestone.assignedToName}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {milestone.status !== 'completed' && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{milestone.progress}%</span>
                          </div>
                          <Progress value={milestone.progress} className="h-2" />
                        </div>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {/* Dependencies */}
                          {hasDependencies && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium">Dependencies</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {milestone.dependencies!.map(depId => {
                                  const dep = milestones.find(m => m._id === depId)
                                  return dep ? (
                                    <Badge key={depId} variant="outline" className="text-xs">
                                      {dep.name}
                                    </Badge>
                                  ) : null
                                })}
                              </div>
                            </div>
                          )}

                          {/* Deliverables */}
                          {hasDeliverables && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium">Deliverables</span>
                              </div>
                              <div className="space-y-1.5">
                                {milestone.deliverables!.map(deliverable => (
                                  <div
                                    key={deliverable.id}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    {deliverable.completed ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    ) : (
                                      <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                    <span className={cn(
                                      deliverable.completed && 'line-through text-muted-foreground'
                                    )}>
                                      {deliverable.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? 'Edit Milestone' : 'Create Milestone'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Milestone Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Beta Release"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what needs to be achieved..."
                rows={3}
              />
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date *</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </div>

            {/* Key Milestone Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-blue-600" />
                <div>
                  <Label className="text-sm font-medium">Key Milestone</Label>
                  <p className="text-xs text-muted-foreground">
                    Mark as a critical project milestone
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.isKeyMilestone}
                onCheckedChange={(checked) => setFormData({ ...formData, isKeyMilestone: checked })}
              />
            </div>

            {/* Dependencies */}
            <div className="space-y-2">
              <Label>Dependencies (Optional)</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!formData.dependencies.includes(value)) {
                    setFormData({
                      ...formData,
                      dependencies: [...formData.dependencies, value]
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add dependency..." />
                </SelectTrigger>
                <SelectContent>
                  {milestones
                    .filter(m => editingMilestone ? m._id !== editingMilestone._id : true)
                    .filter(m => !formData.dependencies.includes(m._id))
                    .map(m => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formData.dependencies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.dependencies.map(depId => {
                    const dep = milestones.find(m => m._id === depId)
                    return dep ? (
                      <Badge key={depId} variant="outline">
                        {dep.name}
                        <button
                          className="ml-2 hover:text-red-600"
                          onClick={() => setFormData({
                            ...formData,
                            dependencies: formData.dependencies.filter(id => id !== depId)
                          })}
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !formData.name || !formData.targetDate}
            >
              {editingMilestone ? 'Save Changes' : 'Create Milestone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
