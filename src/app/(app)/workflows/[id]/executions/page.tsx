'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, CheckCircle2, XCircle, Clock, PlayCircle, RefreshCw, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WorkflowExecution, Workflow } from '@/lib/types'
import { formatRelativeTime, formatDateTime } from '@/lib/utils'

export default function WorkflowExecutionsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [triggeredByFilter, setTriggeredByFilter] = useState('all')

  const workflowId = params?.id as string

  useEffect(() => {
    if (workflowId) {
      fetchWorkflow()
      fetchExecutions()
    }
  }, [workflowId, statusFilter, triggeredByFilter])

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`)
      const data = await response.json()

      if (data.success) {
        setWorkflow(data.data)
      }
    } catch (error) {
      console.error('Error fetching workflow:', error)
    }
  }

  const fetchExecutions = async () => {
    try {
      const params = new URLSearchParams({ workflowId })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (triggeredByFilter !== 'all') params.set('triggeredBy', triggeredByFilter)

      const response = await fetch(`/api/workflow-executions?${params}`)
      const data = await response.json()

      if (data.success) {
        setExecutions(data.data)
      }
    } catch (error) {
      console.error('Error fetching executions:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch execution history',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (executionId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Workflow execution started',
        })
        fetchExecutions()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to retry execution',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error retrying execution:', error)
      toast({
        title: 'Error',
        description: 'Failed to retry execution',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: any }> = {
      completed: { className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle2 },
      failed: { className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle },
      running: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: PlayCircle },
      pending: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
      cancelled: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: XCircle },
    }
    const cfg = config[status] || config.pending
    return (
      <Badge variant="outline" className={cfg.className}>
        {cfg.icon && <cfg.icon className="w-3 h-3 mr-1" />}
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getTriggerBadge = (triggeredBy: string) => {
    const config: Record<string, { className: string; label: string }> = {
      user: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', label: 'Manual' },
      event: { className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', label: 'Event' },
      schedule: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', label: 'Scheduled' },
      webhook: { className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400', label: 'Webhook' },
    }
    const cfg = config[triggeredBy] || config.user
    return (
      <Badge variant="outline" className={cfg.className}>
        {cfg.label}
      </Badge>
    )
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  // Stats
  const stats = {
    total: executions.length,
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length,
    running: executions.filter(e => e.status === 'running').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/workflows/${workflowId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Execution History</h1>
            {workflow && (
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Link href="/workflows" className="hover:text-foreground">
                  Workflows
                </Link>
                <span>/</span>
                <Link href={`/workflows/${workflowId}`} className="hover:text-foreground">
                  {workflow.name}
                </Link>
                <span>/</span>
                <span>Executions</span>
              </nav>
            )}
          </div>
        </div>

        <Button onClick={() => router.push(`/workflows/${workflowId}`)}>
          Back to Builder
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Executions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground mt-1">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
            <p className="text-xs text-muted-foreground mt-1">Running</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={triggeredByFilter} onValueChange={setTriggeredByFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Triggered By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Triggers</SelectItem>
                <SelectItem value="user">Manual</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="schedule">Scheduled</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchExecutions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Executions List */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Timeline</CardTitle>
          <CardDescription>
            {executions.length} {executions.length === 1 ? 'execution' : 'executions'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading executions...</p>
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No executions found</h3>
              <p className="text-muted-foreground mb-6">
                This workflow hasn't been executed yet
              </p>
              <Button onClick={() => router.push(`/workflows/${workflowId}`)}>
                Configure Workflow
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <div
                  key={execution._id.toString()}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/workflows/executions/${execution._id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(execution.status)}
                        {getTriggerBadge(execution.triggeredBy)}
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(execution.startedAt)}
                        </span>
                        {execution.duration && (
                          <span className="text-sm text-muted-foreground">
                            • {formatDuration(execution.duration)}
                          </span>
                        )}
                      </div>

                      {execution.error && (
                        <div className="text-sm text-destructive mb-2">
                          Error: {execution.error.message}
                          {execution.error.nodeId && ` (at node: ${execution.error.nodeId})`}
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        <p>
                          Started: {formatDateTime(execution.startedAt)}
                          {execution.completedAt && ` • Completed: ${formatDateTime(execution.completedAt)}`}
                        </p>
                        {execution.triggeredByUser && (
                          <p className="mt-1">
                            Triggered by user: {execution.triggeredByUser}
                          </p>
                        )}
                      </div>

                      {execution.nodeExecutions && execution.nodeExecutions.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {execution.nodeExecutions.map((node, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className={
                                node.status === 'completed'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : node.status === 'failed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              }
                            >
                              {node.nodeType}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/workflows/executions/${execution._id}`)
                        }}
                      >
                        View Details
                      </Button>
                      {execution.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRetry(execution._id.toString())
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
