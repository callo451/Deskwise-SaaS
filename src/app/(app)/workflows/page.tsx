'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Search, MoreVertical, Edit, Copy, Trash2, Power, PlayCircle, Clock, CheckCircle2, XCircle, Grid3x3, List } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { Workflow, WorkflowStatus } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

type ViewMode = 'grid' | 'list'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export default function WorkflowsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkflows()
  }, [categoryFilter, statusFilter, search])

  const fetchWorkflows = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)

      const response = await fetch(`/api/workflows?${params}`)
      const data = await response.json()

      if (data.success) {
        setWorkflows(data.data)
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch workflows',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (workflowId: string, currentStatus: WorkflowStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

    try {
      const response = await fetch(`/api/workflows/${workflowId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: `Workflow ${newStatus === 'active' ? 'enabled' : 'disabled'}`,
        })
        fetchWorkflows()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update workflow',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to update workflow',
        variant: 'destructive',
      })
    }
  }

  const handleClone = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/clone`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Workflow cloned successfully',
        })
        fetchWorkflows()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to clone workflow',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error cloning workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to clone workflow',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteWorkflowId) return

    try {
      const response = await fetch(`/api/workflows/${deleteWorkflowId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Workflow deleted successfully',
        })
        fetchWorkflows()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete workflow',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive',
      })
    } finally {
      setDeleteWorkflowId(null)
    }
  }

  const getStatusBadge = (status: WorkflowStatus) => {
    const config: Record<WorkflowStatus, { variant: any; className: string; icon: any }> = {
      draft: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: null },
      active: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle2 },
      inactive: { variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
      archived: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: null },
    }
    const cfg = config[status] || config.draft
    return (
      <Badge variant={cfg.variant} className={cfg.className}>
        {cfg.icon && <cfg.icon className="w-3 h-3 mr-1" />}
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      incident: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'service-request': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      change: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      problem: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      ticket: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
      asset: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      approval: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      notification: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    }
    return (
      <Badge variant="outline" className={colors[category] || colors.custom}>
        {category.replace('-', ' ').toUpperCase()}
      </Badge>
    )
  }

  // Quick stats
  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    draft: workflows.filter(w => w.status === 'draft').length,
    executionsToday: workflows.reduce((sum, w) => sum + (w.executionCount || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Automate your ITSM processes with visual workflows
          </p>
        </div>
        <Link href="/workflows/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
        </Link>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Workflows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">Draft</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.executionsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Executions (Total)</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workflows..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="service-request">Service Request</SelectItem>
                  <SelectItem value="change">Change</SelectItem>
                  <SelectItem value="problem">Problem</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Workflows */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Loading workflows...</p>
            </CardContent>
          </Card>
        ) : workflows.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <PlayCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first workflow automation
                </p>
                <Link href="/workflows/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Workflow
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {workflows.map((workflow) => (
              <motion.div key={workflow._id.toString()} variants={item}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {workflow.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {workflow.description}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/workflows/${workflow._id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleClone(workflow._id.toString())}>
                            <Copy className="w-4 h-4 mr-2" />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(workflow._id.toString(), workflow.status)}>
                            <Power className="w-4 h-4 mr-2" />
                            {workflow.status === 'active' ? 'Disable' : 'Enable'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteWorkflowId(workflow._id.toString())}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        {getCategoryBadge(workflow.category)}
                        {getStatusBadge(workflow.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Executions</p>
                          <p className="font-semibold">{workflow.executionCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Success Rate</p>
                          <p className="font-semibold">
                            {workflow.metrics?.successRate
                              ? `${Math.round(workflow.metrics.successRate * 100)}%`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {workflow.lastExecutedAt && (
                        <div className="text-xs text-muted-foreground">
                          Last executed {formatRelativeTime(workflow.lastExecutedAt)}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/workflows/${workflow._id}`)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/workflows/${workflow._id}/executions`)}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          History
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div
                    key={workflow._id.toString()}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{workflow.name}</h3>
                        {getCategoryBadge(workflow.category)}
                        {getStatusBadge(workflow.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {workflow.description}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{workflow.executionCount || 0} executions</span>
                        {workflow.metrics?.successRate && (
                          <span>{Math.round(workflow.metrics.successRate * 100)}% success rate</span>
                        )}
                        {workflow.lastExecutedAt && (
                          <span>Last run {formatRelativeTime(workflow.lastExecutedAt)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/workflows/${workflow._id}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/workflows/${workflow._id}/executions`)}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        History
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleClone(workflow._id.toString())}>
                            <Copy className="w-4 h-4 mr-2" />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(workflow._id.toString(), workflow.status)}>
                            <Power className="w-4 h-4 mr-2" />
                            {workflow.status === 'active' ? 'Disable' : 'Enable'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteWorkflowId(workflow._id.toString())}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteWorkflowId} onOpenChange={() => setDeleteWorkflowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
              All execution history will be preserved for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
