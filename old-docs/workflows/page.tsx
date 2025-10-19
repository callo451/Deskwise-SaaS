'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Play, Pause, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { WorkflowDefinition, WorkflowStats } from '@/lib/types'

const statusColors = {
  'active': 'bg-green-100 text-green-800',
  'draft': 'bg-gray-100 text-gray-800',
  'paused': 'bg-yellow-100 text-yellow-800',
  'archived': 'bg-red-100 text-red-800'
}

const complexityColors = {
  'simple': 'bg-blue-100 text-blue-800',
  'moderate': 'bg-orange-100 text-orange-800',
  'complex': 'bg-purple-100 text-purple-800'
}

export default function WorkflowsPage() {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([])
  const [stats, setStats] = useState<WorkflowStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchWorkflows()
      fetchStats()
    }
  }, [user, searchQuery, statusFilter, categoryFilter])

  const fetchWorkflows = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)

      const response = await fetch(`/api/workflows?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows)
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/workflows/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch workflow stats:', error)
    }
  }

  const toggleWorkflowStatus = async (workflowId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchWorkflows()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to update workflow status:', error)
    }
  }

  const runWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, context: {} })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Workflow started:', data.runId)
        // TODO: Show success notification
      }
    } catch (error) {
      console.error('Failed to run workflow:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Create and manage automated workflow orchestration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={async()=>{
            const res = await fetch('/api/workflows/seed-itsm', { method:'POST' })
            if (res.ok) { fetchWorkflows(); fetchStats(); }
          }}>
            Seed ITSM Templates
          </Button>
          <Link href="/workflows/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeWorkflows} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRuns}</div>
              <p className="text-xs text-muted-foreground">
                {stats.successfulRuns} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRuns > 0 
                  ? Math.round((stats.successfulRuns / stats.totalRuns) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.failedRuns} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(stats.averageExecutionTime / 1000)}
              </div>
              <p className="text-xs text-muted-foreground">
                per execution
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="Ticketing">Ticketing</SelectItem>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Alerts">Alerts</SelectItem>
                <SelectItem value="Reporting">Reporting</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No workflows found</h3>
                <p className="text-muted-foreground">
                  Get started by creating your first workflow
                </p>
                <Link href="/workflows/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Link 
                        href={`/workflows/${workflow.id}`}
                        className="hover:underline"
                      >
                        {workflow.name}
                      </Link>
                      <Badge className={statusColors[workflow.status]}>
                        {workflow.status}
                      </Badge>
                      <Badge className={complexityColors[workflow.metadata.complexity]}>
                        {workflow.metadata.complexity}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runWorkflow(workflow.id)}
                      disabled={workflow.status !== 'active'}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleWorkflowStatus(workflow.id, workflow.status)}
                    >
                      {workflow.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>{workflow.steps.length} steps</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>~{formatDuration(workflow.metadata.estimatedDuration || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{workflow.metadata.usageCount} runs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{Math.round(workflow.metadata.successRate * 100)}% success</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Category: {workflow.category}</span>
                  </div>
                </div>
                {workflow.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {workflow.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}