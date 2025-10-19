'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, CheckCircle2, XCircle, Clock, PlayCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WorkflowExecution } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

export default function ExecutionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [execution, setExecution] = useState<WorkflowExecution | null>(null)
  const [loading, setLoading] = useState(true)

  const executionId = params?.executionId as string

  useEffect(() => {
    if (executionId) {
      fetchExecution()
    }
  }, [executionId])

  const fetchExecution = async () => {
    try {
      const response = await fetch(`/api/workflow-executions/${executionId}`)
      const data = await response.json()

      if (data.success) {
        setExecution(data.data)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load execution details',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching execution:', error)
      toast({
        title: 'Error',
        description: 'Failed to load execution details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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

  const getNodeStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      completed: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      failed: <XCircle className="w-5 h-5 text-red-600" />,
      running: <PlayCircle className="w-5 h-5 text-blue-600" />,
      pending: <Clock className="w-5 h-5 text-yellow-600" />,
      skipped: <AlertCircle className="w-5 h-5 text-gray-600" />,
    }
    return icons[status] || icons.pending
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading execution details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!execution) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Execution not found</p>
            <Link href="/workflows">
              <Button className="mt-4">Back to Workflows</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/workflows/${execution.workflowId}/executions`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Execution Details</h1>
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Link href="/workflows" className="hover:text-foreground">
                Workflows
              </Link>
              <span>/</span>
              <Link href={`/workflows/${execution.workflowId}`} className="hover:text-foreground">
                {execution.workflowName}
              </Link>
              <span>/</span>
              <Link href={`/workflows/${execution.workflowId}/executions`} className="hover:text-foreground">
                Executions
              </Link>
              <span>/</span>
              <span>{executionId.slice(-8)}</span>
            </nav>
          </div>
        </div>

        <Link href={`/workflows/${execution.workflowId}`}>
          <Button>Back to Workflow</Button>
        </Link>
      </div>

      {/* Execution Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(execution.status)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Duration</p>
            <p className="text-2xl font-bold">{formatDuration(execution.duration)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Triggered By</p>
            <p className="text-lg font-semibold capitalize">{execution.triggeredBy}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Version</p>
            <p className="text-2xl font-bold">v{execution.version}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="context">Execution Context</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Node Execution Timeline</CardTitle>
              <CardDescription>
                Step-by-step execution of workflow nodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {execution.nodeExecutions && execution.nodeExecutions.length > 0 ? (
                <div className="space-y-4">
                  {execution.nodeExecutions.map((node, index) => (
                    <div key={index} className="relative">
                      {/* Connector line */}
                      {index < execution.nodeExecutions.length - 1 && (
                        <div className="absolute left-[10px] top-[40px] bottom-[-16px] w-0.5 bg-border" />
                      )}

                      {/* Node card */}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNodeStatusIcon(node.status)}
                        </div>

                        <div className="flex-1">
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">
                                      {node.nodeType.charAt(0).toUpperCase() + node.nodeType.slice(1)} Node
                                    </h4>
                                    <Badge variant="outline" className="text-xs">
                                      {node.nodeId}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDateTime(node.startedAt)}
                                    {node.completedAt && ` - ${formatDateTime(node.completedAt)}`}
                                  </p>
                                </div>
                                <div className="text-right">
                                  {getStatusBadge(node.status)}
                                  {node.duration && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {formatDuration(node.duration)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {node.error && (
                                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 mb-3">
                                  <p className="text-sm font-medium text-destructive mb-1">Error</p>
                                  <p className="text-sm text-destructive/80">{node.error}</p>
                                </div>
                              )}

                              {node.retryCount > 0 && (
                                <div className="text-sm text-muted-foreground mb-3">
                                  Retry attempts: {node.retryCount}
                                </div>
                              )}

                              {node.input && Object.keys(node.input).length > 0 && (
                                <details className="mb-2">
                                  <summary className="text-sm font-medium cursor-pointer hover:text-foreground">
                                    Input Data
                                  </summary>
                                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                                    {JSON.stringify(node.input, null, 2)}
                                  </pre>
                                </details>
                              )}

                              {node.output && Object.keys(node.output).length > 0 && (
                                <details className="mb-2">
                                  <summary className="text-sm font-medium cursor-pointer hover:text-foreground">
                                    Output Data
                                  </summary>
                                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                                    {JSON.stringify(node.output, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No node execution data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Context Tab */}
        <TabsContent value="context">
          <Card>
            <CardHeader>
              <CardTitle>Execution Context</CardTitle>
              <CardDescription>
                Variables and data available during workflow execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Trigger Data */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Trigger Data
                  </h4>
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(execution.triggerData, null, 2)}
                  </pre>
                </div>

                <Separator />

                {/* Context Variables */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Context Variables
                  </h4>
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(execution.context, null, 2)}
                  </pre>
                </div>

                {execution.triggeredByUser && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        Triggered By User
                      </h4>
                      <p className="text-sm text-muted-foreground">{execution.triggeredByUser}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Output Tab */}
        <TabsContent value="output">
          <Card>
            <CardHeader>
              <CardTitle>Execution Output</CardTitle>
              <CardDescription>
                Final output and results from the workflow execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {execution.error ? (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <h4 className="font-semibold text-destructive mb-2">Execution Failed</h4>
                  <p className="text-sm text-destructive/80 mb-2">{execution.error.message}</p>
                  {execution.error.nodeId && (
                    <p className="text-sm text-destructive/60">Failed at node: {execution.error.nodeId}</p>
                  )}
                  {execution.error.stack && (
                    <details className="mt-4">
                      <summary className="text-sm font-medium cursor-pointer hover:text-foreground text-destructive">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 p-3 bg-destructive/5 rounded-lg text-xs overflow-x-auto text-destructive/80">
                        {execution.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ) : execution.output && Object.keys(execution.output).length > 0 ? (
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(execution.output, null, 2)}
                </pre>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No output data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Timing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Timing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Started At</p>
              <p className="font-medium">{formatDateTime(execution.startedAt)}</p>
            </div>
            {execution.completedAt && (
              <div>
                <p className="text-muted-foreground mb-1">Completed At</p>
                <p className="font-medium">{formatDateTime(execution.completedAt)}</p>
              </div>
            )}
            {execution.duration && (
              <div>
                <p className="text-muted-foreground mb-1">Total Duration</p>
                <p className="font-medium">{formatDuration(execution.duration)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
