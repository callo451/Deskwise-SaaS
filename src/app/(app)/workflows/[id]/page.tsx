'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Workflow } from '@/lib/types'
import { WorkflowBuilder } from '@/components/workflows/builder/WorkflowBuilder'

export default function WorkflowBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)

  const workflowId = params?.id as string

  useEffect(() => {
    if (workflowId) {
      fetchWorkflow()
    }
  }, [workflowId])

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`)
      const data = await response.json()

      if (data.success) {
        setWorkflow(data.data)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load workflow',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to load workflow',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/test`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Test Completed',
          description: 'Workflow test executed successfully',
        })
      } else {
        toast({
          title: 'Test Failed',
          description: data.error || 'Workflow test failed',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error testing workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to test workflow',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string }> = {
      draft: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
      active: { className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      inactive: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      archived: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    }
    const cfg = config[status] || config.draft
    return (
      <Badge variant="outline" className={cfg.className}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading workflow...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Workflow not found</p>
            <Link href="/workflows">
              <Button className="mt-4">Back to Workflows</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/workflows">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{workflow.name}</h1>
                {getStatusBadge(workflow.status)}
              </div>
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Link href="/workflows" className="hover:text-foreground">
                  Workflows
                </Link>
                <span>/</span>
                <span>{workflow.name}</span>
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/workflows/${workflowId}/executions`)}
            >
              <Clock className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </div>
      </div>

      {/* Builder Content */}
      <div className="flex-1 overflow-hidden">
        <WorkflowBuilder
          workflowId={workflowId}
          initialData={
            workflow
              ? {
                  name: workflow.name,
                  nodes: workflow.nodes || [],
                  edges: workflow.edges || [],
                  viewport: workflow.viewport || { x: 0, y: 0, zoom: 1 },
                  enabled: workflow.settings?.enabled || false,
                }
              : undefined
          }
          onSave={async (data) => {
            if (!workflow) return

            const updatedWorkflow = {
              ...workflow,
              nodes: data.nodes,
              edges: data.edges,
              viewport: data.viewport,
            }

            const response = await fetch(`/api/workflows/${workflowId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedWorkflow),
            })

            const result = await response.json()
            if (!result.success) {
              throw new Error(result.error || 'Failed to save workflow')
            }
          }}
          onTest={handleTest}
          onToggleEnabled={async () => {
            if (!workflow) return
            const newStatus = workflow.settings.enabled ? 'inactive' : 'active'
            await fetch(`/api/workflows/${workflowId}/toggle`, {
              method: 'POST',
            })
            setWorkflow({
              ...workflow,
              status: newStatus,
              settings: {
                ...workflow.settings,
                enabled: !workflow.settings.enabled,
              },
            })
          }}
        />
      </div>
    </div>
  )
}
