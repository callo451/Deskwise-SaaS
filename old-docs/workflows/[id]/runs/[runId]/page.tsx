'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play,
  Pause,
  Info,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { WorkflowRun, LogEntry } from '@/lib/types'
import { useParams } from 'next/navigation'
import { WorkflowCanvas } from '@/components/workflows/WorkflowCanvas'

// params are obtained via useParams in client components

const statusIcons = {
  pending: Clock,
  running: Play,
  success: CheckCircle,
  failed: XCircle,
  cancelled: Pause
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
}

const logLevelColors = {
  info: 'text-blue-600',
  warn: 'text-yellow-600',
  error: 'text-red-600',
  debug: 'text-gray-600'
}

const logLevelIcons = {
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
  debug: Info
}

export default function WorkflowRunDetailPage() {
  const { user } = useAuth()
  const params = useParams<{ id: string; runId: string }>()
  const [workflowRun, setWorkflowRun] = useState<WorkflowRun | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchWorkflowRun()
      
      // Auto-refresh for running workflows
      const interval = setInterval(() => {
        if (workflowRun?.status === 'running' || workflowRun?.status === 'pending') {
          fetchWorkflowRun()
        }
      }, 2000) // Refresh every 2 seconds

      return () => clearInterval(interval)
    }
  }, [user, params.runId])

  const fetchWorkflowRun = async () => {
    try {
      const response = await fetch(`/api/workflows/runs/${params.runId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkflowRun(data.run)
      }
    } catch (error) {
      console.error('Failed to fetch workflow run:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
    return `${(ms / 3600000).toFixed(1)}h`
  }

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(new Date(date))
  }

  const pause = async () => {
    await fetch(`/api/workflows/runs/${params.runId}/pause`, { method:'POST' })
    fetchWorkflowRun()
  }
  const resume = async () => {
    await fetch(`/api/workflows/runs/${params.runId}/resume`, { method:'POST' })
    fetchWorkflowRun()
  }
  const cancel = async () => {
    await fetch(`/api/workflows/runs/${params.runId}/cancel`, { method:'POST' })
    fetchWorkflowRun()
  }

  const getStepStatus = (stepId: string, logs: LogEntry[]) => {
    const stepLogs = logs.filter(log => log.stepId === stepId)
    if (stepLogs.length === 0) return 'pending'
    
    const latestLog = stepLogs[stepLogs.length - 1]
    return latestLog.status === 'completed' ? 'success' :
           latestLog.status === 'failed' ? 'failed' :
           latestLog.status === 'started' ? 'running' : 'pending'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!workflowRun) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Workflow run not found</h3>
              <p className="text-muted-foreground">
                The workflow run you're looking for doesn't exist or you don't have access to it.
              </p>
              <Link href={`/workflows/${params.id}`}>
                <Button className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workflow
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatusIcon = statusIcons[workflowRun.status]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/workflows/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflow
          </Button>
        </Link>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={pause}>Pause</Button>
          <Button variant="outline" size="sm" onClick={resume}>Resume</Button>
          <Button variant="destructive" size="sm" onClick={cancel}>Cancel</Button>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {workflowRun.workflowName}
            <Badge className={statusColors[workflowRun.status]}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {workflowRun.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Run #{workflowRun.id.slice(-8)} • Started {formatTimestamp(workflowRun.startedAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Overview</CardTitle>
              <CardDescription>
                Visual representation of workflow execution
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              {/* TODO: Implement visual workflow execution viewer */}
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto mb-2" />
                  <p>Visual execution view coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution Log */}
          <Card>
            <CardHeader>
              <CardTitle>Execution Log</CardTitle>
              <CardDescription>
                Detailed log of each step execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {workflowRun.logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="h-8 w-8 mx-auto mb-2" />
                      <p>No logs available yet</p>
                    </div>
                  ) : (
                    workflowRun.logs.map((log) => {
                      const LevelIcon = logLevelIcons[log.level]
                      return (
                        <div key={log.id} className="flex gap-3 p-3 rounded-lg border">
                          <div className="flex-shrink-0">
                            <LevelIcon className={`h-4 w-4 ${logLevelColors[log.level]}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {log.stepName}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatTimestamp(log.timestamp)}
                                {log.executionTime && (
                                  <>
                                    <Clock className="h-3 w-3 ml-2" />
                                    {formatDuration(log.executionTime)}
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {log.message}
                            </p>
                            {log.output && (
                              <div className="mt-2">
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                    View output
                                  </summary>
                                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(log.output, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                            {log.error && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-sm font-medium text-red-800">Error:</p>
                                <p className="text-sm text-red-700">{log.error.message}</p>
                                {log.error.stack && (
                                  <details className="mt-1">
                                    <summary className="text-xs text-red-600 cursor-pointer">
                                      View stack trace
                                    </summary>
                                    <pre className="mt-1 text-xs text-red-600 overflow-x-auto">
                                      {log.error.stack}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Execution Details */}
          <Card>
            <CardHeader>
              <CardTitle>Execution Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={statusColors[workflowRun.status]}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {workflowRun.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Trigger Type</span>
                  <span className="text-sm font-medium">
                    {workflowRun.triggerType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Started At</span>
                  <span className="text-sm font-medium">
                    {formatTimestamp(workflowRun.startedAt)}
                  </span>
                </div>
                {workflowRun.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completed At</span>
                    <span className="text-sm font-medium">
                      {formatTimestamp(workflowRun.completedAt)}
                    </span>
                  </div>
                )}
                {workflowRun.executionTime && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="text-sm font-medium">
                      {formatDuration(workflowRun.executionTime)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Step</span>
                  <span className="text-sm font-medium">
                    {workflowRun.currentStepId || 'N/A'}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Progress</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {workflowRun.metadata.completedSteps}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {workflowRun.metadata.failedSteps}
                    </div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(workflowRun.metadata.completedSteps / workflowRun.metadata.totalSteps) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  {workflowRun.metadata.completedSteps} of {workflowRun.metadata.totalSteps} steps completed
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Context Data */}
          <Card>
            <CardHeader>
              <CardTitle>Input Context</CardTitle>
              <CardDescription>
                Data provided when workflow was triggered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(workflowRun.context).length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>No input context</p>
                </div>
              ) : (
                <ScrollArea className="h-32">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(workflowRun.context, null, 2)}
                  </pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Results Data */}
          {Object.keys(workflowRun.results).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Output data from workflow execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(workflowRun.results, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Error Details */}
          {workflowRun.error && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Step:</span> {workflowRun.error.stepId}
                  </div>
                  <div>
                    <span className="font-medium">Code:</span> {workflowRun.error.code}
                  </div>
                  <div>
                    <span className="font-medium">Message:</span>
                    <p className="mt-1 text-red-700">{workflowRun.error.message}</p>
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {formatTimestamp(workflowRun.error.timestamp)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}