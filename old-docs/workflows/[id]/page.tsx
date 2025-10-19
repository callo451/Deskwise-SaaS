'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Edit, 
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Workflow,
  Activity,
  BarChart3,
  Zap,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { WorkflowDefinition, WorkflowRun } from '@/lib/types'
import { useParams } from 'next/navigation'
import { WorkflowCanvas } from '@/components/workflows/WorkflowCanvas'

// params are obtained via useParams in client components

const statusColors = {
  'active': 'bg-green-100 text-green-800',
  'draft': 'bg-gray-100 text-gray-800',
  'paused': 'bg-yellow-100 text-yellow-800',
  'archived': 'bg-red-100 text-red-800'
}

const runStatusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'running': 'bg-blue-100 text-blue-800',
  'success': 'bg-green-100 text-green-800',
  'failed': 'bg-red-100 text-red-800',
  'cancelled': 'bg-gray-100 text-gray-800'
}

const runStatusIcons = {
  'pending': Clock,
  'running': Play,
  'success': CheckCircle,
  'failed': XCircle,
  'cancelled': Pause
}

export default function WorkflowDetailPage() {
  const { user } = useAuth()
  const params = useParams<{ id: string }>()
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null)
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)
  const [runningWorkflow, setRunningWorkflow] = useState(false)

  useEffect(() => {
    if (user) {
      fetchWorkflow()
      fetchRuns()
    }
  }, [user, params.id])

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`/api/workflows/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setWorkflow(data.workflow)
      }
    } catch (error) {
      console.error('Failed to fetch workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRuns = async () => {
    try {
      const response = await fetch(`/api/workflows/${params.id}/runs`)
      if (response.ok) {
        const data = await response.json()
        setRuns(data.runs)
      }
    } catch (error) {
      console.error('Failed to fetch workflow runs:', error)
    }
  }

  const runWorkflow = async () => {
    if (!workflow) return
    
    setRunningWorkflow(true)
    try {
      const response = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workflowId: workflow.id,
          context: {},
          triggerType: 'manual'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh runs to show the new run
        setTimeout(() => fetchRuns(), 1000)
      }
    } catch (error) {
      console.error('Failed to run workflow:', error)
    } finally {
      setRunningWorkflow(false)
    }
  }

  const toggleWorkflowStatus = async () => {
    if (!workflow) return
    
    const newStatus = workflow.status === 'active' ? 'paused' : 'active'
    
    try {
      const response = await fetch(`/api/workflows/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchWorkflow()
      }
    } catch (error) {
      console.error('Failed to update workflow status:', error)
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
    return `${(ms / 3600000).toFixed(1)}h`
  }

  const formatTimestamp = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(date))
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Enhanced Header Skeleton */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden"
        >
          <Card className="backdrop-blur-xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
                      <Workflow className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="glass-card backdrop-blur-xl animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="glass-card backdrop-blur-xl animate-pulse">
            <CardContent className="p-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="space-y-8">
        <Card className="glass-card backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 w-fit mx-auto mb-4">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
              </motion.div>
              <h3 className="mt-4 text-lg font-semibold">Workflow not found</h3>
              <p className="text-muted-foreground mb-6">
                The workflow you're looking for doesn't exist or you don't have access to it.
              </p>
              <Link href="/workflows">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Workflows
                  </Button>
                </motion.div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Glassmorphic Design */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <Card className="backdrop-blur-xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
                      <Workflow className="h-6 w-6 text-white" />
                    </div>
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl md:text-3xl font-bold font-headline text-gray-900 dark:text-gray-100">
                        {workflow.name}
                      </h1>
                      <Badge className={cn(
                        "transition-all duration-200",
                        statusColors[workflow.status]
                      )}>
                        {workflow.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {workflow.description}
                    </p>
                  </div>
                </div>
                
                {/* Quick Status Indicators */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {workflow.steps.length} Steps
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {Math.round(workflow.metadata.successRate * 100)}% Success
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                    <Activity className="h-3 w-3 mr-1" />
                    {workflow.metadata.usageCount} Runs
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/workflows">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="outline"
                      className="backdrop-blur-xl border-white/20 hover:bg-white/10"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  </motion.div>
                </Link>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="outline" 
                    onClick={() => {fetchWorkflow(); fetchRuns();}}
                    className="backdrop-blur-xl border-white/20 hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={runWorkflow}
                    disabled={workflow.status !== 'active' || runningWorkflow}
                    className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg"
                  >
                    <Play className={cn("h-4 w-4 mr-2", runningWorkflow && "animate-spin")} />
                    {runningWorkflow ? 'Starting...' : 'Run Workflow'}
                  </Button>
                </motion.div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="backdrop-blur-xl border-white/20 hover:bg-white/10"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={toggleWorkflowStatus}>
                      {workflow.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Workflow
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Activate Workflow
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/workflows/${params.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Workflow
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async()=>{
                      if (!workflow) return
                      await fetch(`/api/workflows/runs/${runs[0]?.id}/pause`, { method:'POST' })
                      fetchRuns()
                    }}>
                      Pause latest run
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async()=>{
                      if (!workflow) return
                      await fetch(`/api/workflows/runs/${runs[0]?.id}/resume`, { method:'POST' })
                      fetchRuns()
                    }}>
                      Resume latest run
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async()=>{
                      if (!workflow) return
                      await fetch(`/api/workflows/runs/${runs[0]?.id}/cancel`, { method:'POST' })
                      fetchRuns()
                    }}>
                      Cancel latest run
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="runs">Runs ({runs.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card className="glass-card backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Total Steps</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-500">
                      {workflow.steps.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.triggers.length} triggers
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Success Rate</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-500">
                      {Math.round(workflow.metadata.successRate * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.metadata.usageCount} total runs
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Avg Duration</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-500">
                      {workflow.metadata.estimatedDuration 
                        ? formatDuration(workflow.metadata.estimatedDuration * 1000)
                        : 'N/A'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      estimated
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-teal-500" />
                    <span className="text-sm font-medium">Category</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-teal-500">
                      {workflow.category}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {workflow.metadata.complexity}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="glass-card backdrop-blur-xl h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-purple-500" />
                  Workflow Design
                </CardTitle>
                <CardDescription>
                  Visual representation of the workflow steps and connections
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-theme(spacing.20))]">
                <WorkflowCanvas
                  initialSteps={workflow.steps}
                  readonly={true}
                />
              </CardContent>
            </Card>
          </motion.div>

          {workflow.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Card className="glass-card backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {workflow.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          {runs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Card className="glass-card backdrop-blur-xl">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-teal-500/10 w-fit mx-auto mb-4">
                        <Play className="h-12 w-12 text-green-500" />
                      </div>
                    </motion.div>
                    <h3 className="mt-4 text-lg font-semibold">No runs yet</h3>
                    <p className="text-muted-foreground mb-6">
                      This workflow hasn't been executed yet. Start your first run to see execution history.
                    </p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg"
                        onClick={runWorkflow}
                        disabled={workflow.status !== 'active'}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run First Execution
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {runs.map((run, index) => {
                const StatusIcon = runStatusIcons[run.status]
                return (
                  <motion.div
                    key={run.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.4 }}
                  >
                    <Card className="glass-card backdrop-blur-xl hover:shadow-lg transition-all duration-300 group">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <Badge className={cn(
                                "transition-all duration-200",
                                runStatusColors[run.status]
                              )}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {run.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Started {formatTimestamp(run.startedAt)}
                              </span>
                              {run.executionTime && (
                                <span className="text-sm text-muted-foreground">
                                  • Duration: {formatDuration(run.executionTime)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Trigger: {run.triggerType}
                              </span>
                              <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                Progress: {run.metadata.completedSteps}/{run.metadata.totalSteps} steps
                              </span>
                              {run.metadata.errorCount > 0 && (
                                <span className="text-red-600 flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  {run.metadata.errorCount} errors
                                </span>
                              )}
                            </div>
                            {run.currentStepId && run.status === 'running' && (
                              <div className="text-sm text-blue-600 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                Currently executing: {run.currentStepId}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {run.status === 'running' && (
                              <div className="flex items-center gap-2 text-sm text-blue-600">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                Running
                              </div>
                            )}
                            <Link href={`/workflows/${params.id}/runs/${run.id}`}>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="backdrop-blur-xl border-white/20 hover:bg-white/10"
                                >
                                  View Details
                                </Button>
                              </motion.div>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-6"
          >
            <Card className="glass-card backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-500" />
                  Workflow Settings
                </CardTitle>
                <CardDescription>
                  Configuration and execution settings for this workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Max Execution Time</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {workflow.settings.maxExecutionTime} seconds
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Error Handling</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {workflow.settings.errorHandling.onStepFailure}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Retry Policy</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {workflow.settings.retryPolicy.enabled 
                        ? `Max ${workflow.settings.retryPolicy.maxRetries} retries`
                        : 'Disabled'
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Concurrency</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {workflow.settings.concurrency.enabled
                        ? `Max ${workflow.settings.concurrency.maxConcurrentRuns} concurrent`
                        : 'Sequential only'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-teal-500" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm font-medium">
                      {formatTimestamp(workflow.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm font-medium">
                      {formatTimestamp(workflow.updatedAt)}
                    </span>
                  </div>
                  {workflow.lastRunAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Run</span>
                      <span className="text-sm font-medium">
                        {formatTimestamp(workflow.lastRunAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Version</span>
                    <span className="text-sm font-medium">v{workflow.version}</span>
                  </div>
                  <div className="flex justify-between col-span-full">
                    <span className="text-sm text-muted-foreground">Created By</span>
                    <span className="text-sm font-medium">{workflow.createdBy}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      </motion.div>
    </div>
  )
}