'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { WorkflowCanvas } from '@/components/workflows/WorkflowCanvas'
import { StepDefinition, WorkflowDefinition, WorkflowValidationError } from '@/lib/types'

export default function WorkflowEditPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<WorkflowValidationError[]>([])
  const [originalWorkflow, setOriginalWorkflow] = useState<WorkflowDefinition | null>(null)
  
  const [workflow, setWorkflow] = useState({
    name: '',
    description: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as const,
    isTemplate: false,
    steps: [] as StepDefinition[],
    triggers: [],
    settings: {
      maxExecutionTime: 300, // 5 minutes
      retryPolicy: {
        enabled: false,
        maxRetries: 3,
        backoffStrategy: 'exponential' as const,
        backoffMultiplier: 2
      },
      errorHandling: {
        onStepFailure: 'stop' as const,
        notifyOnFailure: true,
        notificationEmails: []
      },
      concurrency: {
        enabled: false,
        maxConcurrentRuns: 1
      }
    }
  })

  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (user) {
      fetchWorkflow()
    }
  }, [user, params.id])

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`/api/workflows/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        const workflowData = data.workflow
        setOriginalWorkflow(workflowData)
        setWorkflow({
          name: workflowData.name,
          description: workflowData.description,
          category: workflowData.category,
          tags: workflowData.tags,
          status: workflowData.status,
          isTemplate: workflowData.isTemplate,
          steps: workflowData.steps,
          triggers: workflowData.triggers,
          settings: workflowData.settings
        })
      }
    } catch (error) {
      console.error('Failed to fetch workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (steps?: StepDefinition[]) => {
    if (!user || !originalWorkflow) return
    
    setSaving(true)
    setValidationErrors([])
    
    try {
      const workflowData = {
        ...workflow,
        steps: steps || workflow.steps
      }

      const response = await fetch(`/api/workflows/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      })

      if (response.ok) {
        router.push(`/workflows/${params.id}`)
      } else {
        const error = await response.json()
        if (error.validationErrors) {
          setValidationErrors(error.validationErrors)
        } else {
          console.error('Save failed:', error)
        }
      }
    } catch (error) {
      console.error('Failed to save workflow:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (steps: StepDefinition[]) => {
    setTesting(true)
    
    try {
      // For now, just validate the workflow
      console.log('Testing workflow with steps:', steps)
      setValidationErrors([])
      
    } catch (error) {
      console.error('Failed to test workflow:', error)
    } finally {
      setTesting(false)
    }
  }

  const updateWorkflowField = (field: string, value: any) => {
    setWorkflow(prev => ({ ...prev, [field]: value }))
  }

  const updateSettings = (category: string, field: string, value: any) => {
    setWorkflow(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [category]: {
          ...prev.settings[category],
          [field]: value
        }
      }
    }))
  }

  const addTag = () => {
    if (tagInput.trim() && !workflow.tags.includes(tagInput.trim())) {
      updateWorkflowField('tags', [...workflow.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateWorkflowField('tags', workflow.tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!originalWorkflow) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Workflow not found</h3>
              <p className="text-muted-foreground">
                The workflow you're trying to edit doesn't exist or you don't have access to it.
              </p>
              <Link href="/workflows">
                <Button className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workflows
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/workflows/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflow
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Workflow</h1>
          <p className="text-muted-foreground">
            Modify your automated workflow configuration
          </p>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">
                  • {error.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="builder" className="w-full">
        <TabsList>
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Define the basic properties of your workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workflow Name *</Label>
                  <Input
                    id="name"
                    value={workflow.name}
                    onChange={(e) => updateWorkflowField('name', e.target.value)}
                    placeholder="Auto-assign critical tickets"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={workflow.category}
                    onValueChange={(value) => updateWorkflowField('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ticketing">Ticketing</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Alerts">Alerts</SelectItem>
                      <SelectItem value="Reporting">Reporting</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={workflow.description}
                  onChange={(e) => updateWorkflowField('description', e.target.value)}
                  placeholder="Describe what this workflow does and when it should run"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {workflow.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer"
                      onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add tags (press Enter)"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={workflow.status}
                  onValueChange={(value) => updateWorkflowField('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Workflow Design</CardTitle>
              <CardDescription>
                Drag and drop steps to build your workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-theme(spacing.20))]">
              <WorkflowCanvas
                initialSteps={workflow.steps}
                onSave={handleSave}
                onTest={handleTest}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Settings</CardTitle>
              <CardDescription>
                Configure how the workflow should execute
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-execution">Max Execution Time (seconds)</Label>
                <Input
                  id="max-execution"
                  type="number"
                  min="10"
                  max="3600"
                  value={workflow.settings.maxExecutionTime}
                  onChange={(e) => updateWorkflowField('settings', {
                    ...workflow.settings,
                    maxExecutionTime: parseInt(e.target.value) || 300
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Handling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>On Step Failure</Label>
                <Select
                  value={workflow.settings.errorHandling.onStepFailure}
                  onValueChange={(value) => updateSettings('errorHandling', 'onStepFailure', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stop">Stop workflow</SelectItem>
                    <SelectItem value="continue">Continue to next step</SelectItem>
                    <SelectItem value="retry">Retry step</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Retry Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="retry-enabled"
                  checked={workflow.settings.retryPolicy.enabled}
                  onChange={(e) => updateSettings('retryPolicy', 'enabled', e.target.checked)}
                />
                <Label htmlFor="retry-enabled">Enable automatic retry</Label>
              </div>

              {workflow.settings.retryPolicy.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="max-retries">Max Retries</Label>
                    <Input
                      id="max-retries"
                      type="number"
                      min="1"
                      max="10"
                      value={workflow.settings.retryPolicy.maxRetries}
                      onChange={(e) => updateSettings('retryPolicy', 'maxRetries', parseInt(e.target.value) || 3)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Backoff Strategy</Label>
                    <Select
                      value={workflow.settings.retryPolicy.backoffStrategy}
                      onValueChange={(value) => updateSettings('retryPolicy', 'backoffStrategy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed delay</SelectItem>
                        <SelectItem value="linear">Linear backoff</SelectItem>
                        <SelectItem value="exponential">Exponential backoff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Concurrency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="concurrency-enabled"
                  checked={workflow.settings.concurrency.enabled}
                  onChange={(e) => updateSettings('concurrency', 'enabled', e.target.checked)}
                />
                <Label htmlFor="concurrency-enabled">Allow concurrent runs</Label>
              </div>

              {workflow.settings.concurrency.enabled && (
                <div className="space-y-2">
                  <Label htmlFor="max-concurrent">Max Concurrent Runs</Label>
                  <Input
                    id="max-concurrent"
                    type="number"
                    min="1"
                    max="100"
                    value={workflow.settings.concurrency.maxConcurrentRuns}
                    onChange={(e) => updateSettings('concurrency', 'maxConcurrentRuns', parseInt(e.target.value) || 1)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => handleTest(workflow.steps)}
          disabled={testing || workflow.steps.length === 0}
        >
          <Eye className="h-4 w-4 mr-2" />
          {testing ? 'Testing...' : 'Test Workflow'}
        </Button>
        <Button
          onClick={() => handleSave()}
          disabled={saving || !workflow.name.trim()}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}